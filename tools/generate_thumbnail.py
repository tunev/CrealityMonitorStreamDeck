"""Generate a professional 1920x960 Marketplace thumbnail for Elgato."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
MARKETING = ROOT / "marketing"
MARKETING.mkdir(exist_ok=True)

# Colors matching the plugin's design language
BG_DARK = (6, 8, 11, 255)
BG_GRADIENT = (12, 18, 28, 255)
ACCENT = (0, 179, 255, 255)
ACCENT_BRIGHT = (70, 200, 255, 255)
TEXT_PRIMARY = (232, 238, 245, 255)
TEXT_SECONDARY = (140, 148, 158, 255)
ACCENT_ORANGE = (255, 138, 61, 255)
ACCENT_PINK = (255, 77, 109, 255)


def create_thumbnail() -> None:
    """Create a 1920x960 Marketplace thumbnail banner."""
    width, height = 1920, 960
    img = Image.new("RGBA", (width, height), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Gradient-like background (dark top to slightly lighter bottom)
    for y in range(height):
        alpha = int(6 + (12 - 6) * (y / height))
        color = (alpha, alpha + 10, alpha + 20, 255)
        draw.line([(0, y), (width, y)], fill=color)

    # Large accent arc in top-right (design element)
    arc_r = 600
    arc_x, arc_y = width - arc_r // 2, -arc_r // 3
    bbox = [arc_x - arc_r, arc_y - arc_r, arc_x + arc_r, arc_y + arc_r]
    draw.arc(bbox, start=0, end=90, fill=ACCENT, width=20)

    # Plugin name (large, bold)
    title_y = 120
    title_text = "Creality Monitor"
    # Try to use system fonts; fallback to default
    try:
        font_title = ImageFont.truetype(
            "C:/Windows/Fonts/segoeui.ttf", 120
        )
    except:
        font_title = ImageFont.load_default()

    draw.text((80, title_y), title_text, fill=ACCENT_BRIGHT, font=font_title)

    # Tagline
    tagline = "Live Print Status • Fan Control • Camera Preview"
    try:
        font_tagline = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 48)
    except:
        font_tagline = ImageFont.load_default()

    draw.text((80, title_y + 150), tagline, fill=TEXT_SECONDARY, font=font_tagline)

    # Feature boxes (3 columns)
    features = [
        ("Status", "Monitor print\nprogress & time"),
        ("Temps", "Nozzle & bed\ntemperatures"),
        ("Control", "Toggle fans\non/off"),
    ]

    box_y = 450
    box_h = 400
    box_spacing = (width - 160) / 3  # 3 boxes with 80px margins
    box_w = int(box_spacing * 0.85)

    for i, (title, desc) in enumerate(features):
        box_x = int(80 + i * box_spacing)
        # Rounded rectangle background
        draw.rounded_rectangle(
            [box_x, box_y, box_x + box_w, box_y + box_h],
            radius=20,
            fill=(25, 35, 50, 200),
            outline=ACCENT,
            width=3,
        )

        # Title
        try:
            font_feat = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 40)
        except:
            font_feat = ImageFont.load_default()

        draw.text((box_x + 30, box_y + 40), title, fill=ACCENT_BRIGHT, font=font_feat)

        # Description
        try:
            font_desc = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 32)
        except:
            font_desc = ImageFont.load_default()

        draw.text(
            (box_x + 30, box_y + 120), desc, fill=TEXT_SECONDARY, font=font_desc
        )

    # Footer: version & compatibility
    footer_text = "v1.1 • Creality K1 / K1C / K1 Max • Stream Deck XL & Pro"
    try:
        font_footer = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 32)
    except:
        font_footer = ImageFont.load_default()

    draw.text(
        (80, height - 80),
        footer_text,
        fill=TEXT_SECONDARY,
        font=font_footer,
    )

    # Save
    output_path = MARKETING / "thumbnail-1920x960.png"
    img.save(output_path, "PNG")
    print(f"Thumbnail generated: {output_path}")


if __name__ == "__main__":
    create_thumbnail()
