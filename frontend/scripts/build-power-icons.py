"""Compose poker-themed power icons from existing PixelLab + power-ups assets."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "public"
OUT = ROOT / "assets" / "pixellab"
SHEET = ROOT / "images" / "power-ups.png"


def remove_felt(img: Image.Image) -> Image.Image:
    px = img.load()
    ww, hh = img.size
    for y in range(hh):
        for x in range(ww):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if g > r + 8 and g > b + 5 and g < 130 and r < 100 and b < 100:
                px[x, y] = (0, 0, 0, 0)
            elif r < 45 and g < 60 and b < 45 and g >= r:
                px[x, y] = (0, 0, 0, 0)
    return img


def trim_alpha(img: Image.Image, pad: int = 4) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    return img.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(img.width, x1 + pad),
            min(img.height, y1 + pad),
        )
    )


def fit_square(img: Image.Image, size: int = 128) -> Image.Image:
    img = trim_alpha(img)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min((size - 8) / img.width, (size - 8) / img.height)
    nw = max(1, int(img.width * scale))
    nh = max(1, int(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas


def add_cyan_halo(img: Image.Image, strength: float = 0.9) -> Image.Image:
    alpha = img.split()[-1]
    mask = alpha.point(lambda v: 255 if v > 20 else 0)
    dilated = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.1))
    cyan = Image.new("RGBA", img.size, (34, 211, 238, 0))
    cyan_a = dilated.point(lambda v: int(v * strength) if v else 0)
    inv = alpha.point(lambda v: 0 if v > 40 else 255)
    cyan.putalpha(ImageChops.multiply(cyan_a, inv))
    return Image.alpha_composite(cyan, img)


def make_rainbow_card(size: int = 128) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    x0, y0 = 28, 12
    x1, y1 = size - 28, size - 12

    for expand, alpha in ((6, 70), (4, 120), (2, 180)):
        draw.rounded_rectangle(
            [x0 - expand, y0 - expand, x1 + expand, y1 + expand],
            radius=10 + expand // 2,
            outline=(34, 211, 238, alpha),
            width=2,
        )

    draw.rounded_rectangle([x0, y0, x1, y1], radius=10, fill=(248, 246, 240, 255))
    draw.rounded_rectangle([x0, y0, x1, y1], radius=10, outline=(212, 175, 55, 255), width=4)
    draw.rounded_rectangle(
        [x0 + 3, y0 + 3, x1 - 3, y1 - 3],
        radius=8,
        outline=(255, 236, 150, 255),
        width=2,
    )

    try:
        font = ImageFont.truetype("C:/Windows/Fonts/seguisym.ttf", 34)
    except OSError:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 34)
        except OSError:
            font = ImageFont.load_default()

    suits = [
        ("♥", (196, 30, 58, 255), 0, 0),
        ("♦", (196, 30, 58, 255), 1, 0),
        ("♣", (26, 26, 26, 255), 0, 1),
        ("♠", (26, 26, 26, 255), 1, 1),
    ]
    cell_w = (x1 - x0 - 16) / 2
    cell_h = (y1 - y0 - 16) / 2
    for glyph, color, cx, cy in suits:
        cx_pix = x0 + 8 + cx * cell_w + cell_w / 2
        cy_pix = y0 + 8 + cy * cell_h + cell_h / 2
        bbox = draw.textbbox((0, 0), glyph, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text(
            (cx_pix - tw / 2 - bbox[0], cy_pix - th / 2 - bbox[1]),
            glyph,
            fill=color,
            font=font,
        )
    return canvas


def knock_black(img: Image.Image, thresh: int = 28) -> Image.Image:
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a and r <= thresh and g <= thresh and b <= thresh:
                px[x, y] = (0, 0, 0, 0)
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SHEET).convert("RGBA")
    col = sheet.width // 3

    bomb = fit_square(remove_felt(sheet.crop((0, 0, col, sheet.height))), 128)
    joker = fit_square(remove_felt(sheet.crop((col, 0, col * 2, sheet.height))), 128)
    add_cyan_halo(bomb).save(OUT / "power-bomb.png")
    add_cyan_halo(joker).save(OUT / "power-joker.png")
    make_rainbow_card(128).save(OUT / "power-rainbow.png")

    fit_square(knock_black(Image.open(OUT / "arrow-h.png").convert("RGBA")), 128).save(
        OUT / "power-arrow-h.png"
    )
    fit_square(knock_black(Image.open(OUT / "arrow-v.png").convert("RGBA")), 128).save(
        OUT / "power-arrow-v.png"
    )
    for name in (
        "power-bomb.png",
        "power-joker.png",
        "power-rainbow.png",
        "power-arrow-h.png",
        "power-arrow-v.png",
    ):
        knock_black(Image.open(OUT / name).convert("RGBA")).save(OUT / name)
    print("wrote", sorted(p.name for p in OUT.glob("power-*.png")))


if __name__ == "__main__":
    main()
