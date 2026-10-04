"""Generates all plugin/action icons for the Creality Monitor Stream Deck plugin.

Uses the same dark/flat visual language as the Creality Monitor iCUE widget
(see ../../CrealityCorsairWidget/CrealityMonitor_Template/styles/main.css for
the source color palette) so both products feel like one family.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SD_PLUGIN = ROOT / "com.tunev.crealitymonitor.sdPlugin"

BG_0 = (6, 8, 11, 255)
LINE = (255, 255, 255, 20)

ACCENT = (0, 179, 255, 255)     # --accent (idle / printing default)
OK = (46, 227, 107, 255)        # complete
WARN = (255, 176, 32, 255)      # paused
ERROR = (255, 59, 59, 255)      # error / failed
OFFLINE = (90, 100, 112, 255)   # muted gray


def rounded_bg(size: int, radius_ratio: float = 0.22) -> Image.Image:
    """Dark rounded-square background with a subtle top-left accent glow, matching the widget's card style."""
    radius = int(size * radius_ratio)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)

    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(base).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG_0)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [-size * 0.3, -size * 0.4, size * 0.9, size * 0.7], fill=(*ACCENT[:3], 36)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.18))
    base.alpha_composite(Image.composite(glow, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask))

    ImageDraw.Draw(base).rounded_rectangle(
        [0.5, 0.5, size - 1.5, size - 1.5], radius=radius, outline=LINE, width=max(1, size // 64)
    )
    return base


def draw_printer_glyph(img: Image.Image, cx: float, cy: float, scale: float, color) -> None:
    """Draws a small flat 3D-printer glyph (gantry + nozzle + bed) centered at (cx, cy)."""
    draw = ImageDraw.Draw(img)
    w = 34 * scale
    h = 30 * scale
    bar_w = 3.2 * scale
    left_x = cx - w / 2
    right_x = cx + w / 2
    top_y = cy - h / 2
    bot_y = cy + h / 2
    # frame: two uprights + top rail
    draw.rectangle([left_x, top_y, left_x + bar_w, bot_y], fill=color)
    draw.rectangle([right_x - bar_w, top_y, right_x, bot_y], fill=color)
    draw.rectangle([left_x, top_y, right_x, top_y + bar_w], fill=color)
    # bed
    bed_y = bot_y - 6 * scale
    draw.rectangle([left_x + bar_w, bed_y, right_x - bar_w, bed_y + 3 * scale], fill=color)
    # nozzle tip hanging from the top rail
    noz_x = cx
    noz_top = top_y + bar_w
    draw.polygon(
        [
            (noz_x - 3.4 * scale, noz_top),
            (noz_x + 3.4 * scale, noz_top),
            (noz_x, noz_top + 7 * scale),
        ],
        fill=color,
    )


def branded_card_icon(size: int) -> Image.Image:
    """The full-color branded 'card' icon design (dark rounded square, printer glyph,
    accent arc) shared by the manifest preferences icon and the Marketplace app icon —
    they just differ in output pixel size."""
    img = rounded_bg(size, radius_ratio=0.22)
    draw_printer_glyph(img, size * 0.5, size * 0.46, size / 72, (232, 238, 245, 255))
    draw = ImageDraw.Draw(img)
    r = size * 0.33
    bbox = [size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r]
    draw.arc(bbox, start=200, end=340, fill=ACCENT, width=max(2, int(size * 0.02)))
    return img


def plugin_icons() -> None:
    plugin_dir = SD_PLUGIN / "imgs" / "plugin"

    # Manifest "Icon" (Stream Deck preferences pane) — must be 256x256 / 512x512.
    for size, suffix in ((256, ""), (512, "@2x")):
        branded_card_icon(size).save(plugin_dir / f"marketplace{suffix}.png")

    # Marketplace "App Icon" (Maker Console product listing) — must be exactly 288x288,
    # single size, not bundled inside the plugin itself.
    marketing_dir = ROOT / "marketing"
    marketing_dir.mkdir(exist_ok=True)
    branded_card_icon(288).save(marketing_dir / "app-icon-288.png")

    # Category icon must be monochrome white on a transparent background (Marketplace
    # guideline), unlike the full-color branded app icon above.
    for size, suffix in ((28, ""), (56, "@2x")):
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_printer_glyph(img, size * 0.5, size * 0.52, size / 72, (255, 255, 255, 255))
        img.save(plugin_dir / f"category-icon{suffix}.png")


def draw_thermometer_glyph(img: Image.Image, cx: float, cy: float, scale: float, color) -> None:
    """Draws a single flat thermometer glyph (stem + bulb) centered at (cx, cy), for the
    action-list icon — distinct silhouette from the two-color key icon."""
    draw = ImageDraw.Draw(img)
    stem_w = 6 * scale
    bulb_r = 8 * scale
    top = cy - 15 * scale
    bot = cy + 6 * scale
    draw.rounded_rectangle([cx - stem_w / 2, top, cx + stem_w / 2, bot], radius=stem_w / 2, fill=color)
    draw.ellipse([cx - bulb_r, bot - bulb_r * 0.5, cx + bulb_r, bot + bulb_r * 1.5], fill=color)


def draw_fan_glyph(img: Image.Image, cx: float, cy: float, scale: float, color) -> None:
    """Draws a simple 3-blade fan glyph centered at (cx, cy)."""
    draw = ImageDraw.Draw(img)
    r = 15 * scale
    blade_w = r * 0.62
    hub_r = r * 0.22
    for i in range(3):
        angle = math.radians(i * 120 - 90)
        bx = cx + math.cos(angle) * r * 0.5
        by = cy + math.sin(angle) * r * 0.5
        draw.ellipse([bx - blade_w / 2, by - blade_w / 2, bx + blade_w / 2, by + blade_w / 2], fill=color)
    draw.ellipse([cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r], fill=color)


def draw_camera_glyph(img: Image.Image, cx: float, cy: float, scale: float, color) -> None:
    """Draws a simple flat camera-body glyph (body + viewfinder bump + lens) centered at (cx, cy)."""
    draw = ImageDraw.Draw(img)
    w = 30 * scale
    h = 20 * scale
    left = cx - w / 2
    top = cy - h / 2
    draw.rounded_rectangle([left, top, left + w, top + h], radius=3 * scale, fill=color)
    draw.rectangle([cx - 5 * scale, top - 5 * scale, cx + 5 * scale, top], fill=color)
    lens_r = h * 0.32
    draw.ellipse([cx - lens_r, cy - lens_r, cx + lens_r, cy + lens_r], fill=BG_0)
    draw.ellipse(
        [cx - lens_r * 0.6, cy - lens_r * 0.6, cx + lens_r * 0.6, cy + lens_r * 0.6], fill=color
    )


def action_list_icon(folder: str, glyph=draw_printer_glyph) -> None:
    """Action-list icon: monochrome white glyph on a transparent background, per
    Marketplace guidelines (no color, no solid background)."""
    out_dir = SD_PLUGIN / "imgs" / "actions" / folder
    for size, suffix in ((20, ""), (40, "@2x")):
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        glyph(img, size * 0.5, size * 0.5, size / 40, (255, 255, 255, 255))
        img.save(out_dir / f"icon{suffix}.png")


def status_key(state_code: str, accent) -> None:
    out_dir = SD_PLUGIN / "imgs" / "actions" / "status"
    for size, suffix in ((72, ""), (144, "@2x")):
        img = rounded_bg(size, radius_ratio=0.18)
        draw_printer_glyph(img, size * 0.5, size * 0.38, size / 100, (232, 238, 245, 255))
        draw = ImageDraw.Draw(img)
        bar_h = size * 0.07
        draw.rounded_rectangle(
            [size * 0.12, size - bar_h - size * 0.1, size * 0.88, size - size * 0.1],
            radius=bar_h / 2,
            fill=accent,
        )
        img.save(out_dir / f"key-{state_code}{suffix}.png")


def temps_key() -> None:
    out_dir = SD_PLUGIN / "imgs" / "actions" / "temps"
    for size, suffix in ((72, ""), (144, "@2x")):
        img = rounded_bg(size, radius_ratio=0.18)
        draw = ImageDraw.Draw(img)
        bulb_r = size * 0.09
        stem_w = size * 0.07
        for i, color in enumerate(((255, 138, 61, 255), (255, 77, 109, 255))):
            cx = size * (0.36 if i == 0 else 0.64)
            top = size * 0.18
            bot = size * 0.55
            draw.rounded_rectangle([cx - stem_w / 2, top, cx + stem_w / 2, bot], radius=stem_w / 2, fill=color)
            draw.ellipse([cx - bulb_r, bot - bulb_r * 0.6, cx + bulb_r, bot + bulb_r * 1.4], fill=color)
        img.save(out_dir / f"key{suffix}.png")


def fan_key(state: str, accent) -> None:
    out_dir = SD_PLUGIN / "imgs" / "actions" / "fan"
    glyph_color = (232, 238, 245, 255) if state == "on" else (140, 148, 158, 255)
    bar_color = accent if state == "on" else OFFLINE
    for size, suffix in ((72, ""), (144, "@2x")):
        img = rounded_bg(size, radius_ratio=0.18)
        draw_fan_glyph(img, size * 0.5, size * 0.38, size / 100, glyph_color)
        draw = ImageDraw.Draw(img)
        bar_h = size * 0.07
        draw.rounded_rectangle(
            [size * 0.12, size - bar_h - size * 0.1, size * 0.88, size - size * 0.1],
            radius=bar_h / 2,
            fill=bar_color,
        )
        img.save(out_dir / f"key-{state}{suffix}.png")


def camera_key() -> None:
    out_dir = SD_PLUGIN / "imgs" / "actions" / "camera"
    accent = (170, 120, 255, 255)
    for size, suffix in ((72, ""), (144, "@2x")):
        img = rounded_bg(size, radius_ratio=0.18)
        draw_camera_glyph(img, size * 0.5, size * 0.4, size / 100, (232, 238, 245, 255))
        draw = ImageDraw.Draw(img)
        bar_h = size * 0.07
        draw.rounded_rectangle(
            [size * 0.12, size - bar_h - size * 0.1, size * 0.88, size - size * 0.1],
            radius=bar_h / 2,
            fill=accent,
        )
        img.save(out_dir / f"key{suffix}.png")


def main() -> None:
    plugin_icons()
    action_list_icon("status")
    action_list_icon("temps", draw_thermometer_glyph)
    action_list_icon("fan", draw_fan_glyph)
    action_list_icon("camera", draw_camera_glyph)

    status_key("idle", OFFLINE)
    status_key("printing", ACCENT)
    status_key("paused", WARN)
    status_key("complete", OK)
    status_key("error", ERROR)
    status_key("offline", OFFLINE)

    temps_key()

    fan_key("off", OK)
    fan_key("on", OK)

    camera_key()

    print("Icons generated.")


if __name__ == "__main__":
    main()
