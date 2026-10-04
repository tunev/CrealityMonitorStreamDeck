import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

import { getPrinterClient, releasePrinterClient } from "../printer-client";

/** Per-action settings, configured via the property inspector (ui/camera.html). */
type CameraSettings = {
	host?: string;
	port?: string;
	pcAddress?: string;
};

const DEFAULT_HOST = "192.168.0.232";
const DEFAULT_PORT = "9999";

function resolveSettings(settings: CameraSettings): { host: string; port: string } {
	return {
		host: settings.host?.trim() || DEFAULT_HOST,
		port: settings.port?.trim() || DEFAULT_PORT
	};
}

/**
 * The physical Stream Deck key can only show a static icon (no video codec on the
 * device), so this action just displays an ONLINE/OFFLINE badge for the printer's
 * WebSocket connection. The actual live WebRTC camera feed is shown in this action's
 * Property Inspector (ui/camera.html), which runs in a Chromium webview inside the
 * Stream Deck app and can therefore use RTCPeerConnection directly, exactly like the
 * Creality Monitor iCUE widget does.
 */
@action({ UUID: "com.tunev.crealitymonitor.camera" })
export class CameraView extends SingletonAction<CameraSettings> {
	private readonly unsubscribers = new Map<string, () => void>();
	private readonly connections = new Map<string, { host: string; port: string }>();

	override async onWillAppear(ev: WillAppearEvent<CameraSettings>): Promise<void> {
		this.connect(ev.action.id, ev.payload.settings, ev.action);
	}

	override async onWillDisappear(ev: WillDisappearEvent<CameraSettings>): Promise<void> {
		this.disconnect(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<CameraSettings>): Promise<void> {
		// Open the Property Inspector (click the key's gear icon) to see the live feed.
		await ev.action.showOk();
	}

	private connect(actionId: string, settings: CameraSettings, action: WillAppearEvent<CameraSettings>["action"]): void {
		const { host, port } = resolveSettings(settings);
		this.connections.set(actionId, { host, port });

		const client = getPrinterClient(host, port);
		const unsubscribe = client.subscribe((_data, online) => {
			if (!action.isKey()) return;
			void action.setTitle(online ? "Camera" : "Camera\nOFFLINE");
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
}
