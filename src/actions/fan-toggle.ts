import { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

import { FAN_LABELS, FAN_READ_FIELD, FanKey, getPrinterClient, num, PrinterState, releasePrinterClient } from "../printer-client";

/** Per-action settings, configured via the property inspector (ui/fan.html). */
type FanSettings = {
	host?: string;
	port?: string;
	fan?: FanKey;
};

const DEFAULT_HOST = "192.168.0.232";
const DEFAULT_PORT = "9999";
const DEFAULT_FAN: FanKey = "fan";

const STATE_INDEX = { off: 0, on: 1 };

function resolveSettings(settings: FanSettings): { host: string; port: string; fan: FanKey } {
	return {
		host: settings.host?.trim() || DEFAULT_HOST,
		port: settings.port?.trim() || DEFAULT_PORT,
		fan: settings.fan && settings.fan in FAN_LABELS ? settings.fan : DEFAULT_FAN
	};
}

/**
 * Toggles one of the K-series printer's three fans (Model / Back / Side) on or off.
 * Uses the documented `{"method":"set","params":{"<fan>":0|1}}` WebSocket command
 * (see https://github.com/qtqgyt/Creality-K1-Websocket-Docs).
 */
@action({ UUID: "com.tunev.crealitymonitor.fan" })
export class FanToggle extends SingletonAction<FanSettings> {
	private readonly unsubscribers = new Map<string, () => void>();
	private readonly connections = new Map<string, { host: string; port: string; fan: FanKey }>();
	private readonly latestData = new Map<string, { data: PrinterState; online: boolean }>();

	override async onWillAppear(ev: WillAppearEvent<FanSettings>): Promise<void> {
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<FanSettings>): Promise<void> {
		this.disconnect(ev.action.id);
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onWillDisappear(ev: WillDisappearEvent<FanSettings>): Promise<void> {
		this.disconnect(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<FanSettings>): Promise<void> {
		const conn = this.connections.get(ev.action.id);
		if (!conn) {
			await ev.action.showAlert();
			return;
		}

		const snapshot = this.latestData.get(ev.action.id);
		if (!snapshot || !snapshot.online) {
			await ev.action.showAlert();
			return;
		}

		const client = getPrinterClient(conn.host, conn.port);
		const isOn = num(snapshot.data, FAN_READ_FIELD[conn.fan]) > 0;
		const sent = client.send({ method: "set", params: { [conn.fan]: isOn ? 0 : 1 } });

		if (sent) await ev.action.showOk();
		else await ev.action.showAlert();
	}

	private connect(actionId: string, settings: FanSettings, action: WillAppearEvent<FanSettings>["action"]): void {
		const { host, port, fan } = resolveSettings(settings);
		this.connections.set(actionId, { host, port, fan });

		const client = getPrinterClient(host, port);
		const unsubscribe = client.subscribe((data, online) => {
			this.latestData.set(actionId, { data, online });
			void this.render(action, fan, data, online);
		});
		this.unsubscribers.set(actionId, unsubscribe);
	}

	private disconnect(actionId: string): void {
		this.unsubscribers.get(actionId)?.();
		this.unsubscribers.delete(actionId);
		this.latestData.delete(actionId);

		const conn = this.connections.get(actionId);
		if (conn) {
			releasePrinterClient(conn.host, conn.port);
			this.connections.delete(actionId);
		}
	}

	private async render(
		action: WillAppearEvent<FanSettings>["action"],
		fan: FanKey,
		data: PrinterState,
		online: boolean
	): Promise<void> {
		if (!action.isKey()) return; // this action only declares a Keypad controller

		const label = FAN_LABELS[fan];
		if (!online) {
			await action.setTitle(`${label}\nOFFLINE`);
			await action.setState(STATE_INDEX.off);
			return;
		}

		const pct = Math.round(num(data, FAN_READ_FIELD[fan]));
		const isOn = pct > 0;
		await action.setTitle(`${label}\n${isOn ? pct + "%" : "OFF"}`);
		await action.setState(isOn ? STATE_INDEX.on : STATE_INDEX.off);
	}
}
