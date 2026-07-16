# YouTube promo package — Royal Poker Match

## Files ready to upload

| File | Use |
|------|-----|
| [`out/RoyalPokerMatch-YouTube-Short.mp4`](out/RoyalPokerMatch-YouTube-Short.mp4) | **YouTube Shorts / Reels / TikTok** (vertical) |
| [`out/RoyalPokerMatch-YouTube-Landscape.mp4`](out/RoyalPokerMatch-YouTube-Landscape.mp4) | Main YouTube upload (16:9) |
| [`out/youtube-thumbnail.png`](out/youtube-thumbnail.png) | Custom thumbnail |
| [`out/raw-gameplay.webm`](out/raw-gameplay.webm) | Unedited capture (re-edit in CapCut if you want) |
| [`frames/`](frames/) | Still frames from the shoot |

## Suggested titles
1. Royal Poker Match — Swipe Real Poker Hands (Not Normal Match-3)
2. This Match Game Scores Poker Hands
3. Swipe. Score. Win. — Royal Poker Match Gameplay

## Description (copy/paste)

```
Royal Poker Match — swipe adjacent cards to make real poker hands, clear goals, and climb Solo, Quick Play, and Cups.

🎮 Play free: [PASTE YOUR WEB / STORE LINK]
🔒 Privacy: [PASTE /privacy.html URL]

What you’ll see:
• Solo campaign with hundreds of levels
• Online Quick Play & friend challenges
• Tournament cups with gem prizes
• Goal clears that can hit a random ×2–×10 bonus online

0:00 Hook
0:03 Gameplay
0:45 Call to action

#RoyalPokerMatch #PuzzleGame #Poker #MobileGame #MatchGame #CasualGame
```

## Tags
`royal poker match, poker match 3, swipe poker, puzzle game, casual game, card game, mobile game, quick play, tournament, match puzzle`

## Voiceover script (~40s)

> This isn’t normal match-3 — every clear is a real poker hand.
> Swipe five adjacent cards. Hit pairs, straights, flushes.
> Chase goals across hundreds of Solo levels…
> Then go online — highest score wins, and finishing a goal can hit anywhere from 2× to 10×.
> Royal Poker Match. Play free — link below.

## How this was recorded

1. Local web app at `http://127.0.0.1:5173`
2. `frontend/scripts/record-promo.mjs` (Playwright) captures Solo tutorial gameplay
3. `docs/promo/build-promo.ps1` builds title + captions + Short + landscape MP4s

### Re-record / rebuild

```bash
# Terminal A — API (sqlite)
cd backend
.\.venv\Scripts\pip install flask flask-cors flask-jwt-extended flask-sqlalchemy python-dotenv werkzeug bcrypt
$env:DATABASE_URL="sqlite:///poker_pairs.db"
.\.venv\Scripts\python run.py

# Terminal B — frontend
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173

# Terminal C — capture + edit
cd frontend
node scripts/record-promo.mjs
powershell -File ..\docs\promo\build-promo.ps1
```

## Upload checklist
- [ ] Paste live play URL into description
- [ ] Upload Short first (vertical file)
- [ ] Upload landscape as main video + set thumbnail
- [ ] Pin comment: “Play free → [link]”
- [ ] Add cards: end screen → website / store
