# Google Play listing assets — Royal Poker Match

Ready-to-upload store graphics and promo video.

## Folder map

| Folder / file | Play Console field | Spec |
|---|---|---|
| [`feature-graphic.png`](feature-graphic.png) | Feature graphic | 1024×500 |
| [`phone/`](phone/) | Phone screenshots | 1080×1920 (upload all 6, order 01→06) |
| [`tablet-7/`](tablet-7/) | 7-inch tablet screenshots | 1200×1920 |
| [`tablet-10/`](tablet-10/) | 10-inch tablet screenshots | 1920×1200 |
| [`video/play-promo-landscape.mp4`](video/play-promo-landscape.mp4) | Promo video source (upload to YouTube first) | 1920×1080 |
| [`video/play-promo-portrait.mp4`](video/play-promo-portrait.mp4) | Optional Shorts / Reels cut | 1080×1920 |

## Upload order (phone)

1. `01-modes.png` — Choose your mode  
2. `02-campaign.png` — 1000 Solo levels  
3. `03-swipe.png` — Real poker hands  
4. `04-gameplay.png` — Not normal match-3  
5. `05-powers.png` — Powers & obstacles  
6. `06-compete.png` — Compete & climb  

Use the same order for tablet-7 and tablet-10.

## Promo video (required flow)

Play Console does **not** accept a direct video file. It needs a **YouTube URL**.

1. Upload `video/play-promo-landscape.mp4` to YouTube (unlisted is fine).  
2. Copy the video URL.  
3. Play Console → Store listing → **Promo video** → paste URL.

Suggested YouTube title: `Royal Poker Match — Swipe Real Poker Hands`

## Suggested listing text

**Short description**

```
Swipe cards into poker hands. Clear 1000 Solo levels, race friends & win cups.
```

**Full description** — see earlier Play Store copy, or regenerate from product brief.

## Rebuild assets

```powershell
cd "C:\Users\g00gl\OneDrive\Desktop\Games\Card Pairs Game"
python docs/play-store/build_assets.py
```

To recapture fresh gameplay frames first:

```powershell
# run backend + frontend, then:
cd frontend
node scripts/record-promo.mjs
powershell -File ..\docs\promo\build-promo.ps1
python ..\docs\play-store\build_assets.py
```
