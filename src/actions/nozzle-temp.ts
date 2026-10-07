import { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

import { getPrinterClient, num, PrinterState, releasePrinterClient } from "../printer-client";

/** Per-action settings, configured via the property inspector (ui/nozzle-temp.html). */
type NozzleTempSettings = {
	host?: string;
	port?: string;
};

const DEFAULT_HOST = "192.168.0.232";
const DEFAULT_PORT = "9999";

function resolveSettings(settings: NozzleTempSettings): { host: string; port: string } {
	return {
		host: settings.host?.trim() || DEFAULT_HOST,
		port: settings.port?.trim() || DEFAULT_PORT
	};
}

/** Shows live nozzle temperature (current / target) of a Creality K-series printer. */
@action({ UUID: "com.tunev.crealitymonitor.nozzle" })
export class NozzleTemp extends SingletonAction<NozzleTempSettings> {
	private readonly unsubscribers = new Map<string, () => void>();
	private readonly connections = new Map<string, { host: string; port: string }>();

	override async onWillAppear(ev: WillAppearEvent<NozzleTempSettings>): Promise<void> {
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<NozzleTempSettings>): Promise<void> {
		this.disconnect(ev.action.id);
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onWillDisappear(ev: WillDisappearEvent<NozzleTempSettings>): Promise<void> {
		this.disconnect(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<NozzleTempSettings>): Promise<void> {
		await ev.action.showOk();
	}

	private connect(actionId: string, settings: NozzleTempSettings, action: WillAppearEvent<NozzleTempSettings>["action"]): void {
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

	private async render(action: WillAppearEvent<NozzleTempSettings>["action"], data: PrinterState, online: boolean): Promise<void> {
		if (!action.isKey()) return;

		if (!online) {
			await action.setTitle("Nozzle\nOFFLINE");
			return;
		}

		const nozzleCur = Math.round(num(data, "nozzleTemp"));
		const nozzleTgt = Math.round(num(data, "targetNozzleTemp"));

		const lines = ["Nozzle", `${nozzleCur}\u00B0`];
		if (nozzleTgt > 0) {
			lines.push(`→${nozzleTgt}\u00B0`);
		}

		await action.setTitle(lines.join("\n"));
	}
}
