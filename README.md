# Royal Match Poker

A mobile-friendly web matching game: swipe **adjacent** playing cards to form poker hands. Cleared cards are replaced with new random cards. Score runs from **pair** (lowest) to **royal flush** (highest).

## Game rules

- Cards must be **orthogonally adjacent** (not diagonal).
- **Pair**: swipe exactly two cards of the same rank (e.g. two Aces next to each other).
- **Straight** (and straight flush / royal): five cards in rank order (e.g. 10-J-Q-K-A). The swipe must **start and end on the low/high ends** — for 10-J-Q-K-A, start on the **10** or **Ace**.
- Valid hands pop off the board and new cards appear.
- 40 moves per run; highest total score wins.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite, touch swipe, PWA |
| Backend | Flask **blueprints** (`auth`, `game`, `scores`) |
| DB | SQLite (optional; no Postgres required for deploy) |
| Deploy | Docker + `render.yaml` blueprint |

## Local development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python run.py
```

API: `http://127.0.0.1:5000/api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — Vite proxies `/api` to Flask.

## Deploy on Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** → connect `card-pairs-game`.
3. **Branch:** `master` (not `main`).
4. **Blueprint path:** `render.yaml` (repo root).
5. Review the preview — you should see **1 web service**, then click **Deploy Blueprint**.

No database is required for the current deploy (SQLite is used in-container for auth/scores if needed).

If the dashboard says **“No resources managed by this Blueprint”**:

- Open the Blueprint → **Manual Sync** (or fix **Settings → Branch** = `master` and **Blueprint Path** = `render.yaml`).
- Ensure the latest commit with `render.yaml` is on the linked branch.

The Docker image builds the React app and serves it from Flask at `/`.

## API (blueprints)

| Blueprint | Routes |
|-----------|--------|
| `auth` | `POST /api/auth/register`, `POST /api/auth/login` |
| `game` | `POST /api/game/new`, `POST /api/game/validate`, `POST /api/game/refill` |
| `scores` | `GET /api/scores/leaderboard`, `POST /api/scores/submit`, `GET /api/scores/me` |

Submit scores with `Authorization: Bearer <token>` after login.

## Project layout

```
backend/app/blueprints/   # Flask blueprints for Render
backend/app/services/     # Poker hand evaluation
frontend/src/             # React game UI
frontend/android/         # Capacitor Android project (APK)
mobile/                   # Android build scripts + APK output
render.yaml               # Render blueprint
Dockerfile                # Single-container production build
```

## Possible next steps

- Daily challenge seed (same board for everyone)
- Sound/haptics on match
- Multiplayer races
- Stricter server-side validation on every swipe (anti-cheat)
