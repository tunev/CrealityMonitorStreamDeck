# Maker Console listing — Creality Monitor (Stream Deck)

Draft copy/paste text for the Maker Console submission wizard
(https://maker.elgato.com). Edit freely before submitting — this is a starting
point, not final copy.

## Product name

Creality Monitor

(≤30 chars, no author name, no "Lite"/price words needed — this is fine as-is.)

## Description (for Maker Console, English, 250–1500 chars)

Monitor and control your Creality K1, K1C, or K1 Max 3D printer directly from your Stream Deck. Live print status shows whether your printer is idle, printing, paused, completed or offline. See real-time nozzle and bed temperatures, current layer and remaining time. Turn the Model, Back (Case) or Side (Auxiliary) cooling fan on or off with a single key press, and watch the live fan speed percentage update (0–100%). Open the Camera action's property inspector for a live WebRTC video stream of your printer's built-in camera, so you can monitor your print in real time.

Every action can point to a different printer IP address, supporting multiple Creality K-series machines. Requires local network (LAN) access to port 9999 — no cloud account, app switching, or extra hardware needed. Simple, fast, reliable monitoring and control at a glance.

## Tags / supported devices

Creality, K1, K1C, K1 Max, 3D printing, 3D printer, print monitor, fan control,
camera

## Release notes — v1.1.0.0

- NEW: Fan Control action — turn the Model, Back, or Side fan on/off; the key
  shows the live fan speed percentage.
- NEW: Camera action — live WebRTC video preview of the printer's camera in
  the action's property inspector.
- FIX: Side Fan state is now read from the correct telemetry field, so it no
  longer always shows OFF.

## Additional links (optional, Maker Console "Additional Links" step)

- Source code / GitHub: https://github.com/tunev/CrealityMonitorStreamDeck
- Support / bug reports: https://github.com/tunev/CrealityMonitorStreamDeck/issues

## Pricing

Free.

## Media checklist (still TODO before submitting)

Maker Console requires real, product-accurate images — mockups/renders are
discouraged ("avoid low-quality screenshots", "accurately depict your
product"). Best source: screenshots of your actual Stream Deck software with
these keys configured, and/or your printer's camera feed.

1. **App icon** — 288×288 PNG.
   Already generated: `marketing/app-icon-288.png` (reuses the plugin's own
   branded icon design — fine to use as-is, or swap for something punchier).

2. **Thumbnail** — 1920×960 PNG. Shown everywhere on Marketplace, so it's the
   most important image. Suggested: a clean shot of the Stream Deck XL with
   the four Creality Monitor keys visible (Status / Temps / Fan / Camera)
   mid-print, maybe with the printer blurred in the background.

3. **Gallery** — minimum 3 images, 1920×960 PNG (or 1920×1080 MP4 video).
   Suggested set:
   - Stream Deck XL close-up showing the Print Status + Nozzle/Bed Temp keys
     live during a print.
   - Stream Deck XL close-up showing the three Fan Control keys (Model / Back
     / Side) with one or more "ON" and a percentage visible.
   - Screenshot of the Camera action's property inspector open, showing the
     live video preview.

Once you have the raw photos/screenshots, send them over (e.g. drop them in
the project's `Temp/` folder like before) and I can help crop/resize them to
exactly 1920×960 without distortion.
