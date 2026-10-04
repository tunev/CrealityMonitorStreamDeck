# Creality Monitor — Stream Deck plugin

Live print status and temperatures from a **Creality K-series printer** (K1 / K1C / K1 Max),
straight on your Stream Deck. Read-only monitoring — it only *watches* the printer's local
WebSocket API, it never sends print control commands.

Sibling project to [`CrealityCorsairWidget`](../CrealityCorsairWidget) (the Corsair iCUE
widget version of the same monitor) — both talk to the printer's local API on port `9999`
using the same connection/merge logic, so behavior should feel consistent across both.

## Actions

| Action | What it shows |
| --- | --- |
| **Print Status** | State (IDLE / PRINTING / PAUSED / COMPLETE / FAILED / OFFLINE), progress %, current layer and remaining time. The key background color/icon changes with the state. |
| **Nozzle / Bed Temp** | Live nozzle and bed temperature, current → target. |

Both actions have a **Printer IP / host** and **Port** field in their property inspector
(defaults to `192.168.0.232:9999`) so you can point each key at a different printer if you
own more than one. Keys pointed at the same host share a single WebSocket connection.

## Requirements

- Stream Deck software 6.5+ (tested on a **Stream Deck XL**)
- Node.js 20+ (only needed to build the plugin, not to run it)

## Setup

```powershell
npm install
npm run build
npx @elgato/cli link com.tunev.crealitymonitor.sdPlugin   # one-time: tells Stream Deck about the plugin
```

Then open the Stream Deck app, find **Creality Monitor** in the actions list, and drag
**Print Status** / **Nozzle / Bed Temp** onto a key. The plugin process only starts once a
key is placed — that's normal Stream Deck SDK behavior, not a bug.

## Development

```powershell
npm run watch   # rebuilds on save and restarts the plugin automatically
```

Logs are written to `com.tunev.crealitymonitor.sdPlugin/logs/`.

## Protocol notes

The printer pushes a full state snapshot on connect, then only the fields that changed —
so the plugin merges incoming messages into a running state object instead of replacing
it. There is no server-side heartbeat, so the plugin sends
`{"ModeCode":"heart_beat","msg":"<unix seconds>"}` every 5 seconds to keep the socket alive
and detect silently-dead connections. See [`src/printer-client.ts`](src/printer-client.ts)
for the full implementation.

## Roadmap

- **v1 (this release):** read-only monitoring only.
- **v2 (planned):** pause / resume / stop, validated live against a real K1C before
  shipping — some control commands referenced in community docs use an unconfirmed
  message format and must not be trusted blindly.
