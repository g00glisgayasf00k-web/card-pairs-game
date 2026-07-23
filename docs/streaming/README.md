# Stream Royal Poker Match (Twitch + OBS)

Branded overlay pack for **1920×1080** streams. Uses your gold/felt look and logo.

## What’s in the box

| File | Use |
|------|-----|
| [`overlay/main.html`](overlay/main.html) | Transparent HUD over gameplay (logo, LIVE, cam + chat frames) |
| [`overlay/starting-soon.html`](overlay/starting-soon.html) | Fullscreen “Starting soon” |
| [`overlay/brb.html`](overlay/brb.html) | Fullscreen “Be right back” |
| [`overlay/ending.html`](overlay/ending.html) | Fullscreen “Thanks for watching” |
| [`overlay/overlay.css`](overlay/overlay.css) | Shared styles |
| [`overlay/assets/`](overlay/assets/) | Logo files |

Preview any file by double-opening it in Chrome first.

---

## 0. One-time installs

1. **OBS Studio** — https://obsproject.com/  
2. A **Twitch** account — https://www.twitch.tv/  
3. In OBS: **File → Settings → Stream** → Service **Twitch** → **Connect Account** (or paste stream key from Twitch Creator Dashboard)

Set canvas size:

**Settings → Video**

| Setting | Value |
|---------|--------|
| Base (Canvas) Resolution | **1920x1080** |
| Output (Scaled) Resolution | **1920x1080** (or 1280x720 if your PC struggles) |
| FPS | 30 or 60 |

---

## 1. How you’ll show the game

Pick one:

### A. Browser on PC (easiest)
1. Open https://royal-match-poker.onrender.com in Chrome (or your local build)
2. In OBS: **+ → Window Capture** → pick that Chrome window  
   (or **Game Capture** if you prefer; Window Capture is fine for a browser game)

### B. Phone / Play internal test
1. USB into PC, enable USB debugging, use **scrcpy** (mirror phone to a window), then Window Capture that window  
2. Or use a phone capture card / Android emulator window

Tip: Crop the capture so the game fills most of the screen — leave room at the bottom for the cam/chat frames if you use them.

---

## 2. Build OBS scenes

Create three scenes (bottom of OBS: **Scenes** panel → **+**):

### Scene: `Starting Soon`
1. **+ → Browser**  
2. Name: `Overlay Starting`  
3. Check **Local file**  
4. Browse to:

```
…\Card Pairs Game\docs\streaming\overlay\starting-soon.html
```

5. Width **1920**, Height **1080**  
6. FPS **30**, custom CSS leave blank  
7. OK  

Optional: add a quiet music track under it (**+ → Media Source**, loop on).

### Scene: `Gameplay`
Layer order (bottom → top):

1. **Game** — Window Capture / Game Capture of the game  
2. **Webcam** (optional) — **+ → Video Capture Device**  
   - Resize/move into the bottom-left **Cam** frame (about 340×220 near the corner)  
3. **Chat** (optional) — use [Streamlabs](https://streamlabs.com/) / [Streamelements](https://streamelements.com/) chat browser source, or Twitch’s own chat popout  
   - Size it to fit the bottom-right **Chat** frame  
4. **Overlay Main** — **+ → Browser** → Local file → `main.html`  
   - Width **1920**, Height **1080**  
   - **Shutdown source when not visible**: off (optional)  
   - This layer must stay **on top**

If the overlay looks too big/small, right-click the Browser source → **Transform → Fit to Screen**.

### Scene: `BRB`
Same as Starting Soon, but use `brb.html`.

### Scene: `Ending`
Same pattern with `ending.html`.

---

## 3. Customize the text

Open `overlay/main.html` in Notepad / Cursor and edit:

```html
<div class="info-bar__sub">
  First Play Store build · Come say hi in chat
</div>
```

Save the file. In OBS, right-click the Browser source → **Refresh** (or toggle visibility).

Same idea for titles on `starting-soon.html` / `brb.html` / `ending.html`.

---

## 4. Go live checklist

1. Twitch Creator Dashboard → set **stream title** + category (**Mobile Game** or **Poker** / **Just Chatting** while waiting)  
2. OBS: select **Starting Soon** → **Start Streaming**  
3. When ready: switch scene to **Gameplay**  
4. Breaks → **BRB**  
5. End → **Ending** → **Stop Streaming** after ~30–60s  

Audio:

- **Settings → Audio** — Desktop audio = game + browser sounds  
- Mic = your headset  
- Keep desktop audio a bit quieter than your mic  

---

## 5. Common issues

| Problem | Fix |
|---------|-----|
| Overlay is opaque black | You opened a fullscreen scene (`starting-soon`) on top of the game — use `main.html` for gameplay |
| Logo missing | Keep the `assets` folder next to the HTML files; don’t move only the HTML |
| Webcam not in the frame | Move/resize the webcam source until it sits inside the gold Cam box |
| Game looks stretched | Right-click capture → **Transform → Fit to Screen**, then crop black bars if needed |
| Twitch says “Offline” | Check stream key / Connect Account; firewall; try Stop/Start Streaming |
| PC is slow | Lower Output resolution to 1280x720, FPS 30, and close extra Chrome tabs |

---

## 6. Optional polish

- **Alerts** (follows/subs): free overlays from StreamElements / Streamlabs — add as another Browser source above `main.html`  
- **VOD**: Twitch Dashboard → turn on **Store past broadcasts**  
- **Panels**: add your Play Store / privacy / deletion links under the Twitch About panel when the listing is public  

Privacy reminder: don’t show passwords, emails, or admin screens on stream.

---

## Quick path (minimal)

1. Install OBS → connect Twitch  
2. Canvas 1920×1080  
3. Scene **Gameplay**: Window Capture (game) + Browser `main.html`  
4. Hit **Start Streaming**  

That’s enough for a first session — add cam/chat frames when you’re comfortable.
