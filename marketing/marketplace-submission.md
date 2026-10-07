# Marketplace Submission Checklist & Copy

## Description (for Maker Console)

**Title:** Creality Monitor

**Short Description (80 chars):**
Live printer status, temps, fan control & camera preview for Creality K-series.

**Full Description (1,500 chars max - currently ~1,100):**

Creality Monitor brings your K-series 3D printer directly to your Stream Deck. Monitor print progress, temperatures, and control cooling fans in real-time—all with a single glance at your XL or Pro deck.

**6 Actions Included:**
• **Print Status** – Live progress %, current layer, remaining print time
• **Nozzle Temp** – Current & target nozzle temperature (°C)
• **Bed Temp** – Current & target bed plate temperature (°C)  
• **Fan Control** – Toggle Model, Back, or Side cooling fan; see live speed %
• **Camera Preview** – WebRTC live video stream in Property Inspector panel
• **Dynamic State Indicators** – Status key auto-updates: Idle, Printing, Paused, Complete, Error, Offline

**Supported Printers:** Creality K1 / K1C / K1 Max (local network)

**Requirements:**
- Stream Deck XL or Pro
- Creality K-series printer on same local network
- Printer must have WebSocket API enabled (default on K1/K1C/K1 Max)
- Network access to printer port 9999 (no internet required—fully local & private)

**Quick Setup:**
1. Install plugin from Elgato Marketplace
2. Open Property Inspector for any action
3. Enter printer IP address (e.g., 192.168.0.232) and port (default 9999)
4. Press any key to confirm connection
5. Watch live data stream in real-time

**Perfect For:**
- Makers monitoring print jobs from across the room
- Remote office setups (printer in workshop, desk across the room)
- Quick fan adjustments without touching the printer
- Time-critical print monitoring (ETA, layer count, temperature stability)

**Privacy & Security:** All communication is local-network only. No cloud, no telemetry, no external connections.

---

## Release Notes (for Maker Console)

### v1.1.0 – Layout & Stability Improvements
- **New:** Separated Nozzle & Bed temperatures into 2 dedicated actions for clearer display
- **Improved:** Status action layout optimized to 3-line display (%, layer, time) for Stream Deck XL/Pro
- **Fixed:** Side Fan control now responds correctly (was blocked by field name mismatch)
- **Fixed:** WebSocket stability—resolved race condition crash during key removal
- **Enhanced:** Text rendering across all actions for better readability on larger displays

### v1.0.0 – Initial Release
- Print status, temps, fan control, live camera preview

---

## Tags (for Marketplace discovery)
- 3d printer
- creality
- monitoring
- automation
- camera
- temperature
- fan control
- hardware monitor

---

## Gallery Media (3+ images required)

**Image 1:** `status-live-during-print.png` (1920×960)
- Stream Deck XL showing all 6 action keys live during an active print
- Status key: 45% progress, Layer 12/340, Time 02:15
- Nozzle/Bed temps showing accurate values
- Camera PI opened showing WebRTC video stream

**Image 2:** `fan-control-demo.png` (1920×960)
- Close-up of Fan Control key (Model/Back/Side) showing live fan % and on/off state
- Property Inspector with dropdown menu visible

**Image 3:** `camera-preview-full.png` (1920×960)
- Stream Deck key with Camera icon
- Property Inspector panel showing live WebRTC video from printer

**Image 4 (optional):** `marketplace-banner.png` (1920×960)
- Professional banner showing plugin features & Creality K-series compatibility

---

## Demo Video

**Filename:** `CrealityMonitor-v1.1-demo.mp4`
**Duration:** 30-60 seconds
**Resolution:** 1920×1080
**File Size:** <100 MB
**Format:** H.264 MP4

**Content:**
1. [0-5s] Overview: Stream Deck XL with 6 action keys visible
2. [5-15s] Status key: live % and time update as printer is printing
3. [15-25s] Nozzle/Bed temps: show current/target values
4. [25-35s] Fan Control: press key, show toggle + % readout
5. [35-50s] Camera: click icon, show Property Inspector with WebRTC video stream
6. [50-60s] Closing shot: full grid of actions during active print

---

## Submission Checklist

- [x] Plugin code final & tested on real hardware (K1C, Stream Deck XL)
- [x] Version bumped to 1.1.0.0 in manifest
- [x] All action icons generated (marketplace-compliant white monochrome)
- [x] Description expanded & keyword-rich (~1,100 chars)
- [x] Release notes written (major changes highlighted)
- [x] Gallery images prepared (3+ × 1920×960 PNG)
- [x] Demo video recorded & exported (30-60s, <100MB MP4)
- [x] Thumbnail banner created (1920×960 PNG for store listing)
- [ ] Package (.streamDeckPlugin) rebuilt & validated
- [ ] Logged into Maker Console
- [ ] Product entry updated with all copy/images/video
- [ ] Resubmitted for review

---

## Marketplace Page Links (Post-Approval)

- Store: https://www.elgato.com/en/gaming/stream-deck/marketplace
- Support: https://github.com/tunev/CrealityMonitorStreamDeck/issues
- GitHub: https://github.com/tunev/CrealityMonitorStreamDeck
