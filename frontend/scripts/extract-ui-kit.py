"""Crop UI kit sheet into production assets with verified boxes."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "public" / "assets" / "uikit" / "ui-kit-sheet.png"
PUBLIC = ROOT / "public" / "assets"


def flood_clear_bg(im: Image.Image, also_center: bool = False) -> Image.Image:
    """Clear near-black sheet background via flood fill from edges."""
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    def is_bg(r: int, g: int, b: int) -> bool:
        if r < 35 and g < 35 and b < 40:
            return True
        if r < 55 and g < 55 and b < 60 and max(r, g, b) - min(r, g, b) < 10:
            return True
        return False

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_add(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not visited[y][x]:
            r, g, b, _a = px[x, y]
            if is_bg(r, g, b):
                visited[y][x] = True
                q.append((x, y))

    for x in range(w):
        try_add(x, 0)
        try_add(x, h - 1)
    for y in range(h):
        try_add(0, y)
        try_add(w - 1, y)

    # Hollow frames (glows / rings): also clear enclosed dark centers
    if also_center:
        try_add(w // 2, h // 2)

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        try_add(x - 1, y)
        try_add(x + 1, y)
        try_add(x, y - 1)
        try_add(x, y + 1)

    return rgba


def trim(im: Image.Image, pad: int = 2) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop(
        (
            max(0, l - pad),
            max(0, t - pad),
            min(im.width, r + pad),
            min(im.height, b + pad),
        )
    )


def save_opaque(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(path, optimize=True)
    print("ok", path.relative_to(PUBLIC), im.size)


def save_cutout(im: Image.Image, path: Path, hollow: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = trim(flood_clear_bg(im, also_center=hollow))
    out.save(path, optimize=True)
    print("ok", path.relative_to(PUBLIC), out.size)


def main() -> None:
    sheet = Image.open(SHEET).convert("RGB")

    # Card bases (square textured panels) — keep opaque
    save_opaque(sheet.crop((12, 34, 161, 165)), PUBLIC / "cards/purple/card_base.png")
    save_opaque(sheet.crop((171, 35, 312, 164)), PUBLIC / "cards/blue/card_base.png")
    save_opaque(sheet.crop((322, 36, 462, 163)), PUBLIC / "cards/green/card_base.png")

    # Glow frames (empty neon borders — hollow centers)
    save_cutout(sheet.crop((486, 35, 643, 155)), PUBLIC / "cards/purple/card_glow.png", hollow=True)
    save_cutout(sheet.crop((654, 35, 818, 155)), PUBLIC / "cards/blue/card_glow.png", hollow=True)
    save_cutout(sheet.crop((830, 36, 1006, 153)), PUBLIC / "cards/green/card_glow.png", hollow=True)

    # Mode labels (pill only — avoid section titles / filenames)
    save_cutout(sheet.crop((12, 212, 84, 248)), PUBLIC / "home/label_solo.png")
    save_cutout(sheet.crop((94, 212, 172, 248)), PUBLIC / "home/label_async.png")
    save_cutout(sheet.crop((178, 212, 258, 248)), PUBLIC / "home/label_ranked.png")

    # Progress bar
    save_cutout(sheet.crop((14, 292, 256, 312)), PUBLIC / "ui/progress_bg.png")
    save_cutout(sheet.crop((12, 318, 242, 338)), PUBLIC / "ui/progress_fill.png")

    # Icon circle + chevron
    save_cutout(sheet.crop((292, 205, 395, 315)), PUBLIC / "ui/icon_circle_bg.png", hollow=True)
    save_cutout(sheet.crop((455, 220, 510, 290)), PUBLIC / "ui/icon_chevron_right.png")

    # Card mode icons (tight Y to avoid section title text)
    save_cutout(sheet.crop((560, 214, 690, 318)), PUBLIC / "cards/purple/icon_trophy.png")
    save_cutout(sheet.crop((710, 210, 850, 318)), PUBLIC / "cards/blue/icon_vs.png")
    save_cutout(sheet.crop((860, 205, 1005, 318)), PUBLIC / "cards/green/icon_crown.png")

    # Header icons
    save_cutout(sheet.crop((22, 380, 78, 430)), PUBLIC / "header/icon_menu.png")
    save_cutout(sheet.crop((100, 375, 180, 440)), PUBLIC / "header/logo_crown.png")
    save_cutout(sheet.crop((190, 378, 262, 440)), PUBLIC / "header/icon_gems.png")
    save_cutout(sheet.crop((268, 375, 340, 445)), PUBLIC / "header/icon_profile.png")

    # Level section
    save_cutout(sheet.crop((365, 375, 450, 455)), PUBLIC / "home/icon_level_badge.png")
    save_cutout(sheet.crop((455, 370, 550, 455)), PUBLIC / "home/icon_chest.png")

    # Bottom nav
    save_cutout(sheet.crop((575, 375, 645, 445)), PUBLIC / "nav/nav_play.png")
    save_cutout(sheet.crop((660, 375, 740, 445)), PUBLIC / "nav/nav_scores.png")
    save_cutout(sheet.crop((745, 375, 830, 445)), PUBLIC / "nav/nav_rules.png")
    save_cutout(sheet.crop((830, 370, 910, 445)), PUBLIC / "nav/nav_shop.png")
    save_cutout(sheet.crop((920, 370, 1000, 445)), PUBLIC / "nav/nav_settings.png")

    # Hero banner layers
    save_opaque(sheet.crop((16, 505, 410, 620)), PUBLIC / "hero/panel_hero_bg.png")
    save_cutout(sheet.crop((430, 495, 665, 630)), PUBLIC / "hero/cards_royal_flush.png")
    save_cutout(sheet.crop((660, 495, 850, 630)), PUBLIC / "hero/chips_stack.png")
    save_cutout(sheet.crop((850, 510, 1010, 655)), PUBLIC / "hero/particles_gold.png")

    print("done")


if __name__ == "__main__":
    main()
