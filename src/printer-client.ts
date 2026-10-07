/**
 * Creality K-series (K1 / K1C / K1 Max) local WebSocket client.
 *
 * Mirrors the protocol already validated in the Creality Monitor iCUE widget
 * (see CrealityCorsairWidget/CrealityMonitor_Template/scripts/main.js):
 *   - plain WebSocket at ws://<host>:<port>/ (default port 9999)
 *   - the printer sends a full snapshot on connect, then only changed fields,
 *     so state must be merged incrementally rather than replaced
 *   - the printer has no server-side heartbeat, so the client must send
 *     {"ModeCode":"heart_beat","msg":"<unix seconds>"} periodically to keep
 *     the connection alive and detect silently-dead sockets
 *
 * One PrinterClient is shared by every action instance pointed at the same
 * host:port (see the getPrinterClient/releasePrinterClient registry below),
 * so adding a Status key and a Temp key for the same printer only opens a
 * single socket.
 */

import streamDeck from "@elgato/streamdeck";
import WebSocket from "ws";

export type PrinterState = Record<string, unknown>;

export type PrinterListener = (data: PrinterState, online: boolean) => void;

/**
 * Fan command keys, per the reverse-engineered K-series WebSocket protocol
 * (https://github.com/qtqgyt/Creality-K1-Websocket-Docs). Note: "auxiliary"
 * is spelled with double-L in the actual protocol (`fanAuxiliary`).
 */
export type FanKey = "fan" | "fanCase" | "fanAuxiliary";

export const FAN_LABELS: Record<FanKey, string> = {
	fan: "Model Fan",
	fanCase: "Back Fan",
	fanAuxiliary: "Side Fan"
};

/**
 * Telemetry fields that report each fan's *current* speed (0-100), as used by the
 * community ha_creality_ws Home Assistant integration. These differ from the
 * `FanKey` command params above: on this firmware, only `fan`/`fanCase` reliably
 * mirror their on/off state under their own command-param name, while the side/aux
 * fan does not - so all three must be read back from their dedicated `*Pct` field
 * instead of the boolean command key.
 */
export const FAN_READ_FIELD: Record<FanKey, string> = {
	fan: "modelFanPct",
	fanCase: "caseFanPct",
	fanAuxiliary: "auxiliaryFanPct"
};

const HEARTBEAT_INTERVAL_MS = 5000;
const STALE_AFTER_MS = 30000;
const RECONNECT_DELAY_MS = 4000;

/** Human-readable state derived from the printer's numeric `state` field and `err` object. */
export interface PrinterStatus {
	text: string;
	/** Normalized state used to pick which key image/state index to show. */
	code: "idle" | "printing" | "paused" | "complete" | "error";
}

const STATE_TEXT: Record<number, PrinterStatus> = {
	0: { text: "IDLE", code: "idle" },
	1: { text: "PRINTING", code: "printing" },
	2: { text: "COMPLETE", code: "complete" },
	3: { text: "FAILED", code: "error" },
	4: { text: "PAUSED", code: "paused" },
	5: { text: "STOPPED", code: "paused" }
};

/** Safely reads a numeric field from the loosely-typed printer state object. */
export function num(data: PrinterState, key: string, fallback = 0): number {
	const v = data[key];
	const parsed = typeof v === "string" ? parseFloat(v) : (v as number);
	return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
}

export function describeState(data: PrinterState): PrinterStatus {
	const err = data.err as { errcode?: unknown; value?: unknown } | undefined;
	if (err && num(err as PrinterState, "errcode") !== 0) {
		return { text: `ERROR ${err.errcode}`, code: "error" };
	}
	return STATE_TEXT[num(data, "state", -1)] ?? { text: "STANDBY", code: "idle" };
}

class PrinterClient {
	private ws: WebSocket | null = null;
	private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private lastMessageAt = 0;
	private data: PrinterState = {};
	private online = false;
	private closed = false;
	private readonly listeners = new Set<PrinterListener>();

	constructor(
		private readonly host: string,
		private readonly port: string
	) {
		this.connect();
	}

	get subscriberCount(): number {
		return this.listeners.size;
	}

	/** Subscribes to state updates; immediately replays the last known state. Returns an unsubscribe function. */
	subscribe(listener: PrinterListener): () => void {
		this.listeners.add(listener);
		listener(this.data, this.online);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Sends a raw `{"method":"set","params":{...}}` control command (e.g. fan toggling).
	 * Returns false without throwing if the socket isn't currently open.
	 */
	send(payload: Record<string, unknown>): boolean {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
		try {
			this.ws.send(JSON.stringify(payload));
			return true;
		} catch (err) {
			streamDeck.logger.warn(`[PrinterClient ${this.host}:${this.port}] send failed: ${(err as Error).message}`);
			return false;
		}
	}

	/** Stops the socket and all timers for good; the client must not be reused afterwards. */
	dispose(): void {
		this.closed = true;
		this.stopTimers();
		if (this.ws) {
			try {
				this.ws.removeAllListeners();
				this.ws.close();
			} catch (err) {
				streamDeck.logger.debug(`[PrinterClient ${this.host}:${this.port}] close error during dispose: ${(err as Error).message}`);
			}
			this.ws = null;
		}
	}

	private stopTimers(): void {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}

	private emit(): void {
		for (const listener of this.listeners) listener(this.data, this.online);
	}

	private scheduleReconnect(reason: string): void {
		this.online = false;
		this.emit();
		if (this.closed) return; // Don't try to reconnect if we're disposing
		streamDeck.logger.debug(`[PrinterClient ${this.host}:${this.port}] ${reason}`);
		if (this.reconnectTimer) return;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, RECONNECT_DELAY_MS);
	}

	private connect(): void {
		if (this.closed) return;
		this.stopTimers();
		if (this.ws) {
			try {
				this.ws.removeAllListeners();
				this.ws.close();
			} catch {
				/* ignore */
			}
			this.ws = null;
		}

		const url = `ws://${this.host}:${this.port}/`;
		let socket: WebSocket;
		try {
			socket = new WebSocket(url);
		} catch (err) {
			this.scheduleReconnect(`cannot open socket: ${(err as Error).message}`);
			return;
		}
		this.ws = socket;

		socket.on("open", () => {
			this.online = true;
			this.emit();
			this.heartbeatTimer = setInterval(() => {
				if (socket.readyState !== WebSocket.OPEN) return;
				socket.send(JSON.stringify({ ModeCode: "heart_beat", msg: String(Math.floor(Date.now() / 1000)) }));
				if (this.lastMessageAt && Date.now() - this.lastMessageAt > STALE_AFTER_MS) {
					try {
						socket.close();
					} catch {
						/* ignore */
					}
				}
			}, HEARTBEAT_INTERVAL_MS);
		});

		socket.on("message", (raw) => {
			const text = raw.toString();
			if (text.charAt(0) !== "{") return; // e.g. plain "ok" acks
			let msg: PrinterState;
			try {
				msg = JSON.parse(text) as PrinterState;
			} catch {
				return;
			}
			if (!msg || typeof msg !== "object") return;

			this.lastMessageAt = Date.now();
			Object.assign(this.data, msg);
			this.online = true;
			this.emit();
		});

		socket.on("error", (err) => {
			try {
				this.scheduleReconnect(`connection error: ${err.message}`);
			} catch (e) {
				streamDeck.logger.error(`[PrinterClient ${this.host}:${this.port}] error handler crashed: ${(e as Error).message}`);
			}
		});
		socket.on("close", () => {
			try {
				this.scheduleReconnect("disconnected");
			} catch (e) {
				streamDeck.logger.error(`[PrinterClient ${this.host}:${this.port}] close handler crashed: ${(e as Error).message}`);
			}
		});
	}
}

const clients = new Map<string, PrinterClient>();

function keyFor(host: string, port: string): string {
	return `${host}:${port}`;
}

/** Returns the shared PrinterClient for a host:port, creating it on first use. */
export function getPrinterClient(host: string, port: string): PrinterClient {
	const key = keyFor(host, port);
	let client = clients.get(key);
	if (!client) {
		client = new PrinterClient(host, port);
		clients.set(key, client);
	}
	return client;
}

/** Call after unsubscribing; disposes the shared client once nobody is listening to it anymore. */
export function releasePrinterClient(host: string, port: string): void {
	const key = keyFor(host, port);
	const client = clients.get(key);
	if (client && client.subscriberCount === 0) {
		client.dispose();
		clients.delete(key);
	}
}
