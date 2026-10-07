# Creality Monitor Stream Deck Plugin v1.1 - Release Notes

## New Features
- **Separate Nozzle & Bed Temperature Actions** - Split from combined view for clearer display. Each shows current temperature and target, with automatic updates every second.
- **Improved Text Layout** - All action keys now display information across 3 readable lines (Status, Nozzle/Bed temps) with optimized font sizing for Stream Deck XL/Pro.
- **Fixed Side Fan Control** - Side fan (auxiliary) now correctly responds to on/off commands (previously always showed OFF due to field name mismatch).

## Improvements
- **Typography Optimization** - Font sizes reduced from 13pt to 11pt for Status action, allowing 3-line display (Progress %, Layer #, Remaining Time) to fit without overlap.
- **WebSocket Stability** - Resolved race condition that could crash plugin when stream deck keys are rapidly added/removed. Added defensive try-catch handlers in connection lifecycle.
- **UI Consistency** - Nozzle/Bed temp actions now align titles to bottom (matching Fan Control style) instead of middle, for better visual coherence across the 6-action grid.

## Bug Fixes
- Side Fan (`fanAuxiliary`) command parameter was misspelled in Property Inspector and code (was `fanAuxilary` with single L). Now uses correct protocol name.
- Status action font size overflow on 3-line display mode.
- WebSocket connection teardown crash during key removal scenarios.

## Supported Devices
- **Stream Deck XL** (tested & confirmed live)
- **Stream Deck Pro** (compatible)
- **Creality Printers**: K1, K1C, K1 Max (tested on K1C)

## Full Action List (v1.1)
1. **Print Status** - Live print progress %, current layer / total layers, remaining print time
2. **Nozzle Temp** - Nozzle current temperature / target temperature (°C)
3. **Bed Temp** - Bed plate current temperature / target temperature (°C)
4. **Fan Control** - Toggle Model/Back/Side fan on/off; displays live fan speed %
5. **Camera** - Live WebRTC video preview of printer (shown in Property Inspector panel)
6. **(Bonus)** Status & Temps auto-show during printer idle/printing/paused/complete/error states

## Technical Notes
- Telemetry fields updated to use `auxiliaryFanPct` for Side Fan (not `fanAuxilary` boolean).
- Status action now prioritizes: % (line 1), Layer info (line 2), Time or status text (line 3).
- Camera module ported from iCUE widget WebRTC logic; uses mDNS hostname resolution and auto-retry on connection failure.
- Requires local network access to printer WebSocket port 9999 (no internet required, fully local/private).

## Changelog
**v1.1.0** (2024-10-07)
- Separated Nozzle/Bed temps into 2 dedicated actions
- Optimized Status layout to 3-line display
- Fixed Side Fan command spelling & control
- Improved WebSocket error handling
- Enhanced text rendering for XL/Pro displays

**v1.0.0** (2024-09)
- Initial release: Status, Temps (combined), Fan Control (Model/Back only), Camera preview
