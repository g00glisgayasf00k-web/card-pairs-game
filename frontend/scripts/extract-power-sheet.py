"""Crop power icons using fixed showcase layout (5 equal columns)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

SRC = Path(__file__).resolve().parents[1] / "public" / "images" / "power-ups-sheet.png"
OUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "pixellab"
DEBUG = Path(__file__).resolve().parents[1] / "scripts" / "_power_crop_debug"

NAMES = [
    "power-arrow-h.png",
    "power-arrow-v.png",
    "power-bomb.png",
    "power-rainbow.png",
    "power-joker.png",
]

# Empirically tuned on the 1024x682 sheet: just the rounded icon tiles
# (no titles / descriptions). Format: (left, top, right, bottom)
BOXES = [
    (58, 98, 198, 238),    # arrow H
    (248, 98, 388, 238),   # arrow V
    (442, 98, 582, 238),   # bomb
    (632, 98, 772, 238),   # suit spin
    (822, 98, 962, 238),   # joker
]


def knock_sheet_bg(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r < 22 and g < 28 and b < 35:
                px[x, y] = (0, 0, 0, 0)
            elif r < 35 and g < 42 and b < 55 and abs(r - g) < 12 and b >= g:
                lum = (r + g + b) / 3
                if lum < 40:
                    px[x, y] = (r, g, b, max(0, int(a * (lum / 40) * 0.35)))
    return rgba


def fit_square(img: Image.Image, size: int = 256) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min((size - 4) / img.width, (size - 4) / img.height)
    nw = max(1, int(img.width * scale))
    nh = max(1, int(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas


def main() -> None:
    im = Image.open(SRC)
    DEBUG.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    from PIL import ImageDraw

    preview = im.convert("RGBA")
    draw = ImageDraw.Draw(preview)
    for box in BOXES:
        draw.rectangle(box, outline=(0, 255, 80, 255), width=2)
    preview.save(DEBUG / "boxes_manual.png")

    for i, (box, name) in enumerate(zip(BOXES, NAMES)):
        tile = im.crop(box)
        tile.save(DEBUG / f"icon_{i}_crop.png")
        cleaned = knock_sheet_bg(tile)
        out = fit_square(cleaned, 256)
        out = out.filter(ImageFilter.UnsharpMask(radius=1.0, percent=105, threshold=2))
        dest = OUT / name
        out.save(dest, optimize=True)
        print(f"wrote {dest}")


if __name__ == "__main__":
    main()
