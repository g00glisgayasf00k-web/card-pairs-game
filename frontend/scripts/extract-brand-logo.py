"""Crop Royal Poker Match logo variants from the brand sheet and emit app icons."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SHEET = Path(
    r"C:\Users\g00gl\.cursor\projects\c-Users-g00gl-OneDrive-Desktop-Games-Card-Pairs-Game"
    r"\assets\c__Users_g00gl_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_"
    r"8f5763de-26fd-4bba-91b2-f07e57b988d3-64458894-62ac-4cce-a36c-a451735f1603.png"
)
OUT = ROOT / "public" / "assets" / "brand"
HEADER = ROOT / "public" / "assets" / "header"
PUBLIC = ROOT / "public"
RESOURCES = ROOT / "resources"

BG = (13, 43, 34)  # #0D2B22


def is_felt_green(r: int, g: int, b: int) -> bool:
    if r > 90 or b > 90:
        return False
    if g < 18:
        return False
    # Dark forest greens (and near-black greens)
    return g >= r + 4 and g >= b + 4 and g < 95


def knock_out_green(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            if is_felt_green(r, g, b):
                px[x, y] = (r, g, b, 0)
    return rgba


def trim(im: Image.Image, pad: int = 2) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def fit_square(im: Image.Image, size: int, bg=BG) -> Image.Image:
    canvas = Image.new("RGB", (size, size), bg)
    src = im.convert("RGBA")
    # Prefer cover for app-icon tiles that already have a border
    src_fit = src.copy()
    src_fit.thumbnail((size, size), Image.Resampling.LANCZOS)
    x = (size - src_fit.width) // 2
    y = (size - src_fit.height) // 2
    canvas.paste(src_fit, (x, y), src_fit if src_fit.mode == "RGBA" else None)
    return canvas


def rounded_mask(size: int, radius: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return m


def main() -> None:
    im = Image.open(SHEET).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    HEADER.mkdir(parents=True, exist_ok=True)
    RESOURCES.mkdir(parents=True, exist_ok=True)

    # Verified crops from sheet grid
    full = im.crop((36, 36, 424, 424))  # primary full logo + gold frame
    stacked = im.crop((455, 35, 715, 330))  # transparent-style stack
    app_tile = im.crop((722, 38, 958, 278))  # rounded app icon
    horizontal = im.crop((455, 358, 820, 458))
    crown = im.crop((845, 378, 960, 478))

    full.save(OUT / "logo-full-on-green.png")
    app_tile.save(OUT / "logo-appicon.png")

    # Header / home: horizontal lockup on transparent
    horiz_t = trim(knock_out_green(horizontal))
    horiz_t.save(HEADER / "logo-royal-poker-match.png")
    horiz_t.save(OUT / "logo-horizontal.png")
    print("horizontal", horiz_t.size)

    # Stacked transparent for splash / marketing
    stack_t = trim(knock_out_green(stacked))
    stack_t.save(OUT / "logo-stacked.png")
    print("stacked", stack_t.size)

    # Crown mark
    crown_t = trim(knock_out_green(crown))
    crown_t.save(OUT / "logo-crown.png")
    crown_t.save(HEADER / "logo_crown.png")
    print("crown", crown_t.size)

    # PWA / web icons — use the framed full logo (highest fidelity)
    for size, path in [
        (1024, RESOURCES / "icon-1024.png"),
        (512, PUBLIC / "icon-512.png"),
        (192, PUBLIC / "icon-192.png"),
    ]:
        fit_square(full, size).save(path, optimize=True)
        print("icon", path.name, size)

    # Favicon PNG companion (SVG kept but PNG preferred by some browsers)
    fit_square(full, 64).save(PUBLIC / "favicon-64.png", optimize=True)

    # Capacitor / Android source: 1024 with slight padding for adaptive icon safe zone
    icon_1024 = fit_square(full, 1024)
    icon_1024.save(RESOURCES / "icon.png")
    # Foreground: logo without forcing full bleed — pad ~18% for adaptive
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    inner = full.convert("RGBA")
    inner.thumbnail((720, 720), Image.Resampling.LANCZOS)
    fg.paste(inner, ((1024 - inner.width) // 2, (1024 - inner.height) // 2), inner)
    fg.save(RESOURCES / "icon-foreground.png")
    print("resources icon.png / icon-foreground.png")

    # Also keep a rounded preview
    preview = fit_square(full, 512).convert("RGBA")
    preview.putalpha(rounded_mask(512, 96))
    preview.save(OUT / "logo-appicon-rounded.png")

    print("done")


if __name__ == "__main__":
    main()
