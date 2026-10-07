import { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

import { describeState, getPrinterClient, num, PrinterState, releasePrinterClient } from "../printer-client";

/** Per-action settings, configured via the property inspector (ui/status.html). */
type StatusSettings = {
	host?: string;
	port?: string;
};

const DEFAULT_HOST = "192.168.0.232";
const DEFAULT_PORT = "9999";

/** Matches the order of the `States` array in manifest.json for this action. */
const STATE_INDEX: Record<ReturnType<typeof describeState>["code"] | "offline", number> = {
	idle: 0,
	printing: 1,
	paused: 2,
	complete: 3,
	error: 4,
	offline: 5
};

function fmtTime(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "--:--";
	const sec = Math.round(totalSeconds);
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	const pad = (v: number) => (v < 10 ? "0" : "") + v;
	return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function resolveSettings(settings: StatusSettings): { host: string; port: string } {
	return {
		host: settings.host?.trim() || DEFAULT_HOST,
		port: settings.port?.trim() || DEFAULT_PORT
	};
}

/**
 * Shows the live state (idle/printing/paused/complete/error/offline), progress percentage,
 * current layer and remaining time of a Creality K-series printer. Read-only: it never
 * sends print control commands.
 */
@action({ UUID: "com.tunev.crealitymonitor.status" })
export class PrintStatus extends SingletonAction<StatusSettings> {
	private readonly unsubscribers = new Map<string, () => void>();
	private readonly connections = new Map<string, { host: string; port: string }>();

	override async onWillAppear(ev: WillAppearEvent<StatusSettings>): Promise<void> {
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<StatusSettings>): Promise<void> {
		this.disconnect(ev.action.id);
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onWillDisappear(ev: WillDisappearEvent<StatusSettings>): Promise<void> {
		this.disconnect(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<StatusSettings>): Promise<void> {
		// There is nothing to toggle (read-only monitoring); a press just confirms the key is alive.
		await ev.action.showOk();
	}

	private connect(actionId: string, settings: StatusSettings, action: WillAppearEvent<StatusSettings>["action"]): void {
		const { host, port } = resolveSettings(settings);
		this.connections.set(actionId, { host, port });

		const client = getPrinterClient(host, port);
		const unsubscribe = client.subscribe((data, online) => {
			void this.render(action, data, online);
		});
		this.unsubscribers.set(actionId, unsubscribe);
	}

	private disconnect(actionId: string): void {
		this.unsubscribers.get(actionId)?.();
		this.unsubscribers.delete(actionId);

		const conn = this.connections.get(actionId);
		if (conn) {
			releasePrinterClient(conn.host, conn.port);
			this.connections.delete(actionId);
		}
	}

	private async render(action: WillAppearEvent<StatusSettings>["action"], data: PrinterState, online: boolean): Promise<void> {
		if (!action.isKey()) return;

		if (!online) {
			await action.setTitle("OFFLINE");
			await action.setState(STATE_INDEX.offline);
			return;
		}

		const status = describeState(data);
		const pct = Math.max(0, Math.min(100, num(data, "printProgress")));
		const layer = num(data, "layer");
		const totalLayer = num(data, "TotalLayer");
		const isPrinting = num(data, "state", -1) === 1;
		const left = num(data, "printLeftTime", -1);

		// 3-line layout: %, Layer, Time
		const lines = [String(Math.round(pct)) + "%"];
		lines.push(totalLayer > 0 ? `L${layer}/${totalLayer}` : "-");
		lines.push(isPrinting && left > 0 ? fmtTime(left) : status.text);

		await action.setTitle(lines.join("\n"));
		await action.setState(STATE_INDEX[status.code]);
	}
}
