import { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

import { getPrinterClient, num, PrinterState, releasePrinterClient } from "../printer-client";

/** Per-action settings, configured via the property inspector (ui/temps.html). */
type TempsSettings = {
	host?: string;
	port?: string;
};

const DEFAULT_HOST = "192.168.0.232";
const DEFAULT_PORT = "9999";

function resolveSettings(settings: TempsSettings): { host: string; port: string } {
	return {
		host: settings.host?.trim() || DEFAULT_HOST,
		port: settings.port?.trim() || DEFAULT_PORT
	};
}

/** Shows live nozzle and bed temperatures (current / target) of a Creality K-series printer. */
@action({ UUID: "com.tunev.crealitymonitor.temps" })
export class PrintTemps extends SingletonAction<TempsSettings> {
	private readonly unsubscribers = new Map<string, () => void>();
	private readonly connections = new Map<string, { host: string; port: string }>();

	override async onWillAppear(ev: WillAppearEvent<TempsSettings>): Promise<void> {
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<TempsSettings>): Promise<void> {
		this.disconnect(ev.action.id);
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onWillDisappear(ev: WillDisappearEvent<TempsSettings>): Promise<void> {
		this.disconnect(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<TempsSettings>): Promise<void> {
		await ev.action.showOk();
	}

	private connect(actionId: string, settings: TempsSettings, action: WillAppearEvent<TempsSettings>["action"]): void {
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

	private async render(action: WillAppearEvent<TempsSettings>["action"], data: PrinterState, online: boolean): Promise<void> {
		if (!action.isKey()) return; // this action only declares a Keypad controller

		if (!online) {
			await action.setTitle("OFFLINE");
			return;
		}

		const nozzleCur = Math.round(num(data, "nozzleTemp"));
		const nozzleTgt = Math.round(num(data, "targetNozzleTemp"));
		const bedCur = Math.round(num(data, "bedTemp0"));
		const bedTgt = Math.round(num(data, "targetBedTemp0"));

		const nozzleLine = nozzleTgt > 0 ? `N ${nozzleCur}\u00B0>${nozzleTgt}\u00B0` : `N ${nozzleCur}\u00B0`;
		const bedLine = bedTgt > 0 ? `B ${bedCur}\u00B0>${bedTgt}\u00B0` : `B ${bedCur}\u00B0`;

		await action.setTitle(`${nozzleLine}\n${bedLine}`);
	}
}
