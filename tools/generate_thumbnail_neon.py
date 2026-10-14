"""Generate professional 1920x960 Marketplace thumbnail with neon-style UI.

Based on the custom design from Media/Untitled.jpg, but adapted to 1920x960 aspect ratio
and Elgato Marketplace requirements.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
MARKETING = ROOT / "marketing"
MARKETING.mkdir(exist_ok=True)

# Neon color palette from the design
BG_DARK = (10, 15, 25, 255)
NEON_BLUE = (70, 200, 255, 255)
NEON_GREEN = (0, 255, 100, 255)
NEON_RED = (255, 50, 50, 255)
NEON_ORANGE = (255, 150, 50, 255)
TEXT_WHITE = (255, 255, 255, 255)
TEXT_GRAY = (180, 180, 200, 255)


def draw_neon_box(draw, x, y, w, h, color, thickness=3, radius=15):
    """Draw a neon-style rounded rectangle with glow effect."""
    # Outer glow
    for i in range(thickness, 0, -1):
        alpha = int(color[3] * (1 - i / thickness) * 0.3)
        draw.rounded_rectangle(
            [x - i, y - i, x + w + i, y + h + i],
            radius=radius,
            outline=(*color[:3], alpha),
            width=1,
        )
    # Main border
    draw.rounded_rectangle(
        [x, y, x + w, y + h],
        radius=radius,
        outline=color,
        width=thickness,
    )


def create_thumbnail() -> None:
    """Create a 1920x960 Marketplace thumbnail with neon-style design."""
    width, height = 1920, 960
    img = Image.new("RGBA", (width, height), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(height):
        alpha = int(10 + (20 - 10) * (y / height))
        color = (alpha, alpha + 5, alpha + 15, 255)
        draw.line([(0, y), (width, y)], fill=color)

    # Title area
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 100)
        font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 48)
        font_action = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 36)
        font_label = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 28)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_action = ImageFont.load_default()
        font_label = ImageFont.load_default()

    # Header
    draw.text((100, 50), "Creality Monitor", fill=NEON_BLUE, font=font_title)
    draw.text(
        (100, 170),
        "Live Status • Temps • Fan Control • Camera Preview",
        fill=TEXT_GRAY,
        font=font_subtitle,
    )

    # 3x3 grid of action boxes (simplified version of the Untitled design)
    box_size = 280
    box_spacing = 60
    grid_start_x = 120
    grid_start_y = 350

    actions = [
        ("Status", "100%\nCOMPLETE", NEON_GREEN),
        ("Nozzle", "33°", NEON_ORANGE),
        ("Bed", "31°", NEON_RED),
        ("Model Fan", "OFF", NEON_BLUE),
        ("Back Fan", "OFF", NEON_BLUE),
        ("Side Fan", "OFF", NEON_BLUE),
        ("Camera", "LIVE", NEON_BLUE),
        ("Stream Deck", "XL/Pro", TEXT_GRAY),
        ("Creality K-series", "Connected", NEON_GREEN),
    ]

    for i, (label, value, color) in enumerate(actions):
        row = i // 3
        col = i % 3
        x = grid_start_x + col * (box_size + box_spacing)
        y = grid_start_y + row * (box_size + box_spacing)

        # Draw neon box
        draw_neon_box(draw, x, y, box_size, box_size, color, thickness=3, radius=12)

        # Draw label
        draw.text(
            (x + 20, y + 30), label, fill=TEXT_WHITE, font=font_label
        )

        # Draw value
        draw.text(
            (x + 20, y + 100), value, fill=color, font=font_action
        )

    # Footer
    footer = "Compatible with K1 • K1C • K1 Max"
    draw.text(
        (width - 500, height - 60), footer, fill=TEXT_GRAY, font=font_subtitle
    )

    # Save
    output_path = MARKETING / "thumbnail-marketplace.png"
    img.save(output_path, "PNG")
    print(f"Marketplace thumbnail generated: {output_path}")


if __name__ == "__main__":
    create_thumbnail()
