"""
Compose Google Play Store listing assets for Royal Poker Match.
Run: python docs/play-store/build_assets.py
"""
from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FRAMES = ROOT / "docs" / "promo" / "frames"
BRAND = ROOT / "frontend" / "public" / "assets" / "brand"
HERO = ROOT / "frontend" / "public" / "assets" / "hero"
OUT = ROOT / "docs" / "play-store"
PROMO_OUT = ROOT / "docs" / "promo" / "out"

BG_TOP = (6, 28, 24)
BG_BOT = (12, 48, 40)
GOLD = (255, 214, 120)
GOLD_SOFT = (255, 233, 160)
WHITE = (255, 255, 255)
INK = (8, 22, 18)

SLIDES = [
    {
        "file": "01-home.png",
        "title": "Choose your mode",
        "subtitle": "Solo · Head to Head · Tournaments",
        "out": "01-modes",
    },
    {
        "file": "02-levels.png",
        "title": "1000 Solo levels",
        "subtitle": "Stars, worlds & milestone chests",
        "out": "02-campaign",
    },
    {
        "file": "03-game-start.png",
        "title": "Real poker hands",
        "subtitle": "Swipe adjacent cards to score",
        "out": "03-swipe",
    },
    {
        "file": "04-play-2.png",
        "title": "Not normal match-3",
        "subtitle": "Pairs to royal flushes",
        "out": "04-gameplay",
    },
    {
        "file": "04-play-4.png",
        "title": "Powers & obstacles",
        "subtitle": "Bombs, vaults, pillars & more",
        "out": "05-powers",
    },
    {
        "file": "05-end.png",
        "title": "Compete & climb",
        "subtitle": "Quick Play, friends & cups",
        "out": "06-compete",
    },
]


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def gradient(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, BG_BOT)
    px = img.load()
    assert px is not None
    for y in range(h):
        t = y / max(1, h - 1)
        # subtle vignette-ish vertical blend
        r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
        for x in range(w):
            edge = min(x, w - 1 - x) / (w * 0.5)
            dark = 0.88 + 0.12 * max(0.0, min(1.0, edge))
            px[x, y] = (int(r * dark), int(g * dark), int(b * dark))
    return img


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def fit_cover(img: Image.Image, box: tuple[int, int]) -> Image.Image:
    tw, th = box
    src = img.convert("RGB")
    sw, sh = src.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def fit_contain(img: Image.Image, box: tuple[int, int], fill=(0, 0, 0)) -> Image.Image:
    tw, th = box
    src = img.convert("RGB")
    sw, sh = src.size
    scale = min(tw / sw, th / sh)
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", box, fill)
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def draw_centered(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    fnt: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    width: int,
) -> int:
    tw, th = text_size(draw, text, fnt)
    x = (width - tw) // 2
    # soft shadow
    draw.text((x + 2, y + 3), text, font=fnt, fill=(0, 0, 0))
    draw.text((x, y), text, font=fnt, fill=fill)
    return th


def phone_frame(shot: Image.Image, frame_w: int, frame_h: int) -> Image.Image:
    """Bezel around a portrait screenshot."""
    bezel = 18
    radius = 48
    inner_w = frame_w - bezel * 2
    inner_h = frame_h - bezel * 2
    body = Image.new("RGB", (frame_w, frame_h), (18, 22, 28))
    mask = rounded_mask((frame_w, frame_h), radius)
    screen = fit_cover(shot, (inner_w, inner_h))
    screen_mask = rounded_mask((inner_w, inner_h), radius - 10)
    body.paste(screen, (bezel, bezel), screen_mask)
    # outer rounded result on transparent then flatten later via paste with mask
    out = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    out.paste(body, (0, 0), mask)
    # thin gold rim
    rim = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    rd.rounded_rectangle(
        (1, 1, frame_w - 2, frame_h - 2),
        radius=radius,
        outline=(*GOLD, 180),
        width=3,
    )
    out = Image.alpha_composite(out, rim)
    return out


def compose_portrait(
    shot_path: Path,
    title: str,
    subtitle: str,
    size: tuple[int, int],
    device_scale: float = 0.78,
) -> Image.Image:
    w, h = size
    canvas = gradient(size).convert("RGBA")

    # decorative soft glow
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse(
        (int(w * 0.15), int(h * 0.55), int(w * 0.85), int(h * 1.15)),
        fill=(255, 200, 80, 28),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    canvas = Image.alpha_composite(canvas, glow)

    draw = ImageDraw.Draw(canvas)
    title_font = font(max(42, int(w * 0.065)))
    sub_font = font(max(24, int(w * 0.034)), bold=False)

    y = int(h * 0.055)
    y += draw_centered(draw, y, title, title_font, GOLD, w) + int(h * 0.012)
    y += draw_centered(draw, y, subtitle, sub_font, WHITE, w) + int(h * 0.02)

    shot = Image.open(shot_path)
    frame_h = int(h * device_scale)
    frame_w = int(frame_h * (shot.width / shot.height))
    # keep within margins
    max_w = int(w * 0.86)
    if frame_w > max_w:
        frame_w = max_w
        frame_h = int(frame_w * (shot.height / shot.width))

    framed = phone_frame(shot, frame_w, frame_h)
    fx = (w - frame_w) // 2
    fy = min(int(h * 0.18), y + 10)
    # drop shadow
    shadow = Image.new("RGBA", (frame_w + 40, frame_h + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((10, 16, frame_w + 30, frame_h + 30), radius=56, fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.paste(shadow, (fx - 20, fy - 10), shadow)
    canvas.paste(framed, (fx, fy), framed)

    # brand footer
    logo_path = BRAND / "logo-horizontal.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        lw = int(w * 0.42)
        lh = int(logo.height * (lw / logo.width))
        logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        lx = (w - lw) // 2
        ly = h - lh - int(h * 0.035)
        canvas.paste(logo, (lx, ly), logo)

    return canvas.convert("RGB")


def compose_landscape_tablet(
    shot_path: Path,
    title: str,
    subtitle: str,
    size: tuple[int, int] = (1920, 1200),
) -> Image.Image:
    w, h = size
    canvas = gradient(size).convert("RGBA")
    draw = ImageDraw.Draw(canvas)
    title_font = font(64)
    sub_font = font(34, bold=False)

    # left copy panel
    y = int(h * 0.28)
    # wrap-ish by drawing left-aligned in left third
    left = int(w * 0.06)
    draw.text((left + 2, y + 3), title, font=title_font, fill=(0, 0, 0))
    draw.text((left, y), title, font=title_font, fill=GOLD)
    y += 80
    draw.text((left + 2, y + 2), subtitle, font=sub_font, fill=(0, 0, 0))
    draw.text((left, y), subtitle, font=sub_font, fill=WHITE)

    logo_path = BRAND / "logo-horizontal.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        lw = 420
        lh = int(logo.height * (lw / logo.width))
        logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        canvas.paste(logo, (left, int(h * 0.08)), logo)

    shot = Image.open(shot_path)
    frame_h = int(h * 0.82)
    frame_w = int(frame_h * (shot.width / shot.height))
    framed = phone_frame(shot, frame_w, frame_h)
    fx = w - frame_w - int(w * 0.05)
    fy = (h - frame_h) // 2
    shadow = Image.new("RGBA", (frame_w + 40, frame_h + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((10, 16, frame_w + 30, frame_h + 30), radius=56, fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.paste(shadow, (fx - 20, fy - 10), shadow)
    canvas.paste(framed, (fx, fy), framed)
    return canvas.convert("RGB")


def build_feature_graphic() -> Image.Image:
    w, h = 1024, 500
    canvas = gradient((w, h)).convert("RGBA")

    # hero collage background
    hero = HERO / "cards_royal_flush.png"
    if hero.exists():
        art = Image.open(hero).convert("RGBA")
        art = fit_contain(art, (560, 420), fill=(0, 0, 0)).convert("RGBA")
        # darken edges
        canvas.paste(art, (w - 560 - 20, (h - 420) // 2), art)

    draw = ImageDraw.Draw(canvas)
    logo_path = BRAND / "logo-horizontal.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        lw = 460
        lh = int(logo.height * (lw / logo.width))
        logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        canvas.paste(logo, (48, 70), logo)

    line1 = font(36)
    line2 = font(28, bold=False)
    draw.text((50, 250), "Swipe real poker hands", font=line1, fill=GOLD)
    draw.text((50, 305), "1000 Solo levels · Online cups", font=line2, fill=WHITE)
    draw.text((50, 350), "Puzzle strategy — not gambling", font=line2, fill=GOLD_SOFT)
    return canvas.convert("RGB")


def save_rgb(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # Play requires no alpha
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} {img.size}")


def main() -> None:
    phone_dir = OUT / "phone"
    t7_dir = OUT / "tablet-7"
    t10_dir = OUT / "tablet-10"
    video_dir = OUT / "video"
    for d in (phone_dir, t7_dir, t10_dir, video_dir):
        d.mkdir(parents=True, exist_ok=True)

    for slide in SLIDES:
        src = FRAMES / slide["file"]
        if not src.exists():
            print(f"skip missing {src.name}")
            continue
        phone = compose_portrait(src, slide["title"], slide["subtitle"], (1080, 1920), 0.72)
        save_rgb(phone, phone_dir / f"{slide['out']}.png")

        t7 = compose_portrait(src, slide["title"], slide["subtitle"], (1200, 1920), 0.70)
        save_rgb(t7, t7_dir / f"{slide['out']}.png")

        t10 = compose_landscape_tablet(src, slide["title"], slide["subtitle"], (1920, 1200))
        save_rgb(t10, t10_dir / f"{slide['out']}.png")

    feature = build_feature_graphic()
    save_rgb(feature, OUT / "feature-graphic.png")

    # Promo videos (Play needs a YouTube URL; ship local files ready to upload)
    for name, dest in [
        ("RoyalPokerMatch-YouTube-Landscape.mp4", "play-promo-landscape.mp4"),
        ("RoyalPokerMatch-YouTube-Short.mp4", "play-promo-portrait.mp4"),
    ]:
        src = PROMO_OUT / name
        if src.exists():
            target = video_dir / dest
            shutil.copy2(src, target)
            print(f"copied video -> {target.relative_to(ROOT)}")
        else:
            print(f"missing video {src}")

    print("DONE")


if __name__ == "__main__":
    main()
