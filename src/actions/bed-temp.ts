import { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

import { getPrinterClient, num, PrinterState, releasePrinterClient } from "../printer-client";

/** Per-action settings, configured via the property inspector (ui/bed-temp.html). */
type BedTempSettings = {
	host?: string;
	port?: string;
};

const DEFAULT_HOST = "192.168.0.232";
const DEFAULT_PORT = "9999";

function resolveSettings(settings: BedTempSettings): { host: string; port: string } {
	return {
		host: settings.host?.trim() || DEFAULT_HOST,
		port: settings.port?.trim() || DEFAULT_PORT
	};
}

/** Shows live bed temperature (current / target) of a Creality K-series printer. */
@action({ UUID: "com.tunev.crealitymonitor.bed" })
export class BedTemp extends SingletonAction<BedTempSettings> {
	private readonly unsubscribers = new Map<string, () => void>();
	private readonly connections = new Map<string, { host: string; port: string }>();

	override async onWillAppear(ev: WillAppearEvent<BedTempSettings>): Promise<void> {
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<BedTempSettings>): Promise<void> {
		this.disconnect(ev.action.id);
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onWillDisappear(ev: WillDisappearEvent<BedTempSettings>): Promise<void> {
		this.disconnect(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<BedTempSettings>): Promise<void> {
		await ev.action.showOk();
	}

	private connect(actionId: string, settings: BedTempSettings, action: WillAppearEvent<BedTempSettings>["action"]): void {
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

	private async render(action: WillAppearEvent<BedTempSettings>["action"], data: PrinterState, online: boolean): Promise<void> {
		if (!action.isKey()) return;

		if (!online) {
			await action.setTitle("Bed\nOFFLINE");
			return;
		}

		const bedCur = Math.round(num(data, "bedTemp0"));
		const bedTgt = Math.round(num(data, "targetBedTemp0"));

		const lines = ["Bed", `${bedCur}\u00B0`];
		if (bedTgt > 0) {
			lines.push(`→${bedTgt}\u00B0`);
		}

		await action.setTitle(lines.join("\n"));
	}
}
