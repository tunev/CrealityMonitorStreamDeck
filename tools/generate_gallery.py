"""Builds the Elgato Marketplace thumbnail + gallery images (1920x960 PNG).

Every key shown here is rendered with the *same* code that produces the plugin's real key
images (generate_icons.py) and carries the exact title text the plugin sets at runtime,
so the media is a faithful depiction of the product. No Elgato hardware/logo is drawn.
The camera slide uses a real screenshot of the Property Inspector (Media/camera-pi.png,
falling back to Media/Screenshot2.png).
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_icons as gi  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "marketing" / "gallery"
W, H = 1920, 960

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_SEMI = "C:/Windows/Fonts/seguisb.ttf"

TEXT = (240, 244, 250, 255)
MUTED = (150, 162, 178, 255)
ACCENT = gi.ACCENT


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def background() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    px = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        px.line([(0, y), (W, y)], fill=(int(8 + 8 * t), int(11 + 12 * t), int(17 + 18 * t), 255))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W * 0.45, -H * 0.6, W * 1.2, H * 0.5], fill=(*ACCENT[:3], 30))
    from PIL import ImageFilter

    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img.alpha_composite(glow)
    return img


def draw_title_on_key(img: Image.Image, lines: list[str]) -> None:
    """Mimics Stream Deck's bottom-aligned key title (white bold text with a dark outline)."""
    size = img.width
    k = size / 72
    f = font(FONT_BOLD, round(11.5 * k))
    d = ImageDraw.Draw(img)
    line_h = f.size * 1.16
    y = size - size * 0.045 - line_h * len(lines)
    for line in lines:
        w = d.textlength(line, font=f)
        d.text(
            ((size - w) / 2, y),
            line,
            font=f,
            fill=(255, 255, 255, 255),
            stroke_width=max(2, round(0.9 * k)),
            stroke_fill=(0, 0, 0, 255),
        )
        y += line_h


def key(kind: str, size: int, lines: list[str], **kw) -> Image.Image:
    if kind == "status":
        img = gi.status_key_image(size, kw["accent"])
    elif kind == "nozzle":
        img = gi.thermo_key_image(size, gi.NOZZLE_COLOR)
    elif kind == "bed":
        img = gi.thermo_key_image(size, gi.BED_COLOR)
    elif kind == "fan":
        img = gi.fan_key_image(size, kw["state"], gi.OK)
    else:
        img = gi.camera_key_image(size)
    draw_title_on_key(img, lines)
    return img


def row(canvas: Image.Image, keys: list[Image.Image], y: int, gap: int, captions: list[str] | None = None) -> None:
    total = sum(k.width for k in keys) + gap * (len(keys) - 1)
    x = (W - total) // 2
    d = ImageDraw.Draw(canvas)
    cap_font = font(FONT_SEMI, 30)
    for i, k in enumerate(keys):
        canvas.alpha_composite(k, (x, y))
        if captions:
            w = d.textlength(captions[i], font=cap_font)
            d.text((x + (k.width - w) / 2, y + k.height + 22), captions[i], font=cap_font, fill=MUTED)
        x += k.width + gap


def heading(canvas: Image.Image, title: str, subtitle: str, y: int = 70, center: bool = True) -> None:
    d = ImageDraw.Draw(canvas)
    ft, fs = font(FONT_BOLD, 84), font(FONT_REG, 38)
    for text, f, color, dy in ((title, ft, TEXT, 0), (subtitle, fs, MUTED, 112)):
        w = d.textlength(text, font=f)
        d.text(((W - w) / 2 if center else 100, y + dy), text, font=f, fill=color)


def save(img: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    img.convert("RGB").save(path, "PNG", optimize=True)
    print("wrote", path, img.size)


def thumbnail() -> None:
    c = background()
    heading(c, "Creality Monitor", "Live print status, temperatures, fans and camera on your Stream Deck")
    keys = [
        key("status", 220, ["45%", "L123/340", "1:12:34"], accent=gi.ACCENT),
        key("nozzle", 220, ["Nozzle", "220\u00B0\u2192220\u00B0"]),
        key("bed", 220, ["Bed", "60\u00B0\u219260\u00B0"]),
        key("fan", 220, ["Model Fan", "100%"], state="on"),
        key("fan", 220, ["Back Fan", "70%"], state="on"),
        key("fan", 220, ["Side Fan", "48%"], state="on"),
        key("camera", 220, ["Camera"]),
    ]
    row(c, keys, 380, 30)
    d = ImageDraw.Draw(c)
    foot = "Creality K1  \u2022  K1C  \u2022  K1 Max"
    f = font(FONT_SEMI, 36)
    w = d.textlength(foot, font=f)
    d.text(((W - w) / 2, 720), foot, font=f, fill=ACCENT)
    save(c, "thumbnail.png")


def status_states() -> None:
    c = background()
    heading(c, "Know your print at a glance", "Progress, layer and time left \u2014 plus a clear state for every situation")
    keys = [
        key("status", 250, ["IDLE", "0%"], accent=gi.OFFLINE),
        key("status", 250, ["45%", "L123/340", "1:12:34"], accent=gi.ACCENT),
        key("status", 250, ["PAUSED", "45%"], accent=gi.WARN),
        key("status", 250, ["DONE", "100%"], accent=gi.OK),
        key("status", 250, ["FAILED", "67%"], accent=gi.ERROR),
        key("status", 250, ["OFFLINE"], accent=gi.OFFLINE),
    ]
    row(c, keys, 440, 44, ["Idle", "Printing", "Paused", "Complete", "Failed", "Offline"])
    save(c, "gallery-1-status.png")


def temps_and_fans() -> None:
    c = background()
    heading(c, "Temperatures and cooling", "Current \u2192 target for nozzle and bed, live speed for every fan")
    keys = [
        key("nozzle", 250, ["Nozzle", "186\u00B0\u2192220\u00B0"]),
        key("bed", 250, ["Bed", "58\u00B0\u219260\u00B0"]),
        key("fan", 250, ["Model Fan", "100%"], state="on"),
        key("fan", 250, ["Back Fan", "70%"], state="on"),
        key("fan", 250, ["Side Fan", "48%"], state="on"),
    ]
    row(c, keys, 440, 56, ["Nozzle", "Bed", "Model fan", "Back fan", "Side fan"])
    save(c, "gallery-2-temps-fans.png")


def fan_control() -> None:
    c = background()
    heading(c, "One press to switch a fan", "Model, Back or Side fan \u2014 on and off right from the key")
    ks, gap = 220, 36
    off = [
        key("fan", ks, ["Model Fan", "OFF"], state="off"),
        key("fan", ks, ["Back Fan", "OFF"], state="off"),
        key("fan", ks, ["Side Fan", "OFF"], state="off"),
    ]
    on = [
        key("fan", ks, ["Model Fan", "100%"], state="on"),
        key("fan", ks, ["Back Fan", "70%"], state="on"),
        key("fan", ks, ["Side Fan", "48%"], state="on"),
    ]
    d = ImageDraw.Draw(c)
    cap = font(FONT_SEMI, 32)
    group_w = 3 * ks + 2 * gap
    mid_gap = 200
    x0 = (W - (2 * group_w + mid_gap)) // 2
    y = 430
    for x, keys, label, color in ((x0, off, "Off", MUTED), (x0 + group_w + mid_gap, on, "On", gi.OK)):
        for i, k in enumerate(keys):
            c.alpha_composite(k, (x + i * (ks + gap), y))
        w = d.textlength(label, font=cap)
        d.text((x + (group_w - w) / 2, y + ks + 26), label, font=cap, fill=color)
    arrow = font(FONT_BOLD, 80)
    ax = x0 + group_w + (mid_gap - d.textlength("\u2192", font=arrow)) / 2
    d.text((ax, y + ks / 2 - 56), "\u2192", font=arrow, fill=ACCENT)
    save(c, "gallery-3-fan-control.png")


def camera() -> None:
    c = background()
    heading(c, "See your print live", "Open the key's settings to watch the printer camera", y=50)
    media = ROOT / "Media"
    src_path = media / "camera-pi.png"
    if src_path.exists():
        shot = Image.open(src_path).convert("RGBA")
    else:
        shot = Image.open(media / "Screenshot2.png").convert("RGBA")
        shot = shot.crop((20, 458, 545, shot.height))
    target_h = 640
    scale = target_h / shot.height
    shot = shot.resize((round(shot.width * scale), target_h), Image.LANCZOS)
    pad = 6
    frame = Image.new("RGBA", (shot.width + 2 * pad, shot.height + 2 * pad), (*ACCENT[:3], 255))
    frame.alpha_composite(shot, (pad, pad))
    cam_key = key("camera", 250, ["Camera"])
    total = cam_key.width + 110 + frame.width
    x = (W - total) // 2
    c.alpha_composite(cam_key, (x, 250 + (target_h - cam_key.height) // 2))
    c.alpha_composite(frame, (x + cam_key.width + 110, 250))
    save(c, "gallery-4-camera.png")


if __name__ == "__main__":
    thumbnail()
    status_states()
    temps_and_fans()
    fan_control()
    camera()
