# Google Play — beginner walkthrough (Royal Poker Match)

You’ve never shipped to Play before — this guide is written for that. Your game is **already wrapped** as an Android app with Capacitor. You are **not** starting from zero code.

| Item | Your value |
|------|------------|
| App name | Royal Poker Match |
| Package / application ID | `com.royalmatch.poker` (**never change** after first upload) |
| Android project | `frontend/android/` |
| Live website / API | https://royal-match-poker.onrender.com |
| Privacy policy URL | https://royal-match-poker.onrender.com/privacy.html |

**Big picture (what you’re doing):**

1. Install tools (Android Studio)  
2. Pay once for a Google Play developer account  
3. Create a secret signing key (like a password for updates)  
4. Build a signed **`.aab`** file  
5. Upload it to Play Console (Internal testing first)  
6. Fill in listing / safety forms  
7. Promote to Production when ready  

---

## Phase 0 — What you need (one-time installs)

### A. Android Studio (required)

1. Download: https://developer.android.com/studio  
2. Install with defaults.  
3. Open Android Studio → **More Actions → SDK Manager** (or Settings → Languages & Frameworks → Android SDK).  
4. Install:
   - **Android SDK Platform** (API 34 or 35)
   - **Android SDK Build-Tools**
   - **Android SDK Platform-Tools**
5. Accept licenses if prompted.

Android Studio includes its own Java — you do **not** need a separate JDK install for most steps.

### B. Node.js (you likely already have this)

Needed to build the web app into the Android shell.

```powershell
node -v
```

If missing: https://nodejs.org/ (LTS).

### C. A Google account + Play developer fee

- Go to https://play.google.com/console  
- Sign in with the Google account that will **own** the app forever  
- Pay the **one-time** Google Play developer registration fee (currently USD $25)  
- Complete identity verification if Google asks (can take hours–days)

Do this in parallel while you install Android Studio.

---

## Phase 1 — Create the app listing in Play Console

1. Open https://play.google.com/console  
2. **Create app**  
3. Fill in:
   - **App name:** Royal Poker Match  
   - **Default language:** English (United States) or your preference  
   - **App or game:** Game  
   - **Free or paid:** Free  
4. Accept declarations → Create  

You now have an empty listing. You still need a signed build before reviewers can install it.

**Important:** When you later upload the first `.aab`, the package name inside it must be `com.royalmatch.poker`. That is already set in your project.

---

## Phase 2 — Create your upload keystore (do this once, keep forever)

This key proves future updates are from you. **Lose it = you can’t update the same app** (unless Play App Signing can recover — still treat it as sacred).

### Where to put it

Create a folder **outside** the git repo, e.g.:

```
C:\Users\g00gl\Documents\RoyalMatchKeys\
```

Never commit `.jks` / `.keystore` files or passwords to GitHub.

### Generate the key (from Android Studio’s terminal)

1. Open **Android Studio**  
2. **View → Tool Windows → Terminal**  
3. Run (adjust the path if needed):

```powershell
mkdir "$env:USERPROFILE\Documents\RoyalMatchKeys" -Force
cd "$env:USERPROFILE\Documents\RoyalMatchKeys"

& "$env:LOCALAPPDATA\Android\Sdk\..\..\Programs\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore royal-match-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias royal-match
```

If `keytool` isn’t found, use Android Studio’s JDK:

```powershell
# Common path on Windows:
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore royal-match-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias royal-match
```

Answer the prompts (name/org can be yours). Remember:

| Secret | Example |
|--------|---------|
| Keystore file | `royal-match-upload.jks` |
| Keystore password | (you choose) |
| Key alias | `royal-match` |
| Key password | (often same as keystore) |

**Backup** the `.jks` + passwords to a password manager / encrypted USB.

When Play asks about **Play App Signing**, choose **Let Google manage** (recommended). You keep the upload keystore for uploading; Google holds the final signing key.

---

## Phase 3 — Build the signed App Bundle (`.aab`)

Play wants an **Android App Bundle** (`.aab`), not a debug APK.

### 3.1 Sync your latest game into Android

In PowerShell:

```powershell
cd "c:\Users\g00gl\OneDrive\Desktop\Games\Card Pairs Game\frontend"
npm install
npm run cap:sync:android
npm run cap:open:android
```

This builds the web game pointed at your live Render API and opens Android Studio.

### 3.2 Generate signed bundle in Android Studio

1. Wait for Gradle sync to finish (bottom progress bar).  
2. Menu: **Build → Generate Signed App Bundle or APK…**  
3. Choose **Android App Bundle** → Next  
4. Select your `royal-match-upload.jks`  
5. Enter passwords + alias `royal-match` → Next  
6. Build variant: **release** → Create  

Output is usually:

```
frontend\android\app\build\outputs\bundle\release\app-release.aab
```

or

```
frontend\android\app\release\app-release.aab
```

That `.aab` is what you upload.

### Do **not** upload

- `mobile\output\royal-match-poker-debug.apk`  
- GitHub Actions debug APKs  
- Unsigned / debug builds  

---

## Phase 4 — Upload to Internal testing (safest first release)

1. Play Console → your app  
2. **Test and release → Testing → Internal testing**  
3. **Create new release**  
4. Upload `app-release.aab`  
5. Release name / notes (e.g. `1.2.0 — first internal build`)  
6. **Next → Save → Review release → Start rollout to Internal testing**  

### Add yourself as a tester

1. Internal testing → **Testers** tab  
2. Create an email list with your Gmail  
3. Copy the **join link**, open it on your phone while signed into that Google account  
4. Accept → Install from Play (may say “Internal test”)

Confirm the game loads, login works, and talks to https://royal-match-poker.onrender.com.

---

## Phase 5 — Store listing assets (required before production)

Prepare these (can use Canva / your existing brand art):

| Asset | Spec |
|-------|------|
| App icon | **512×512** PNG (no alpha for Play high-res icon) |
| Feature graphic | **1024×500** PNG |
| Phone screenshots | At least **2** (usually 1080×1920 or similar portrait) |
| Short description | ≤ 80 characters |
| Full description | Longer pitch (you already wrote a Reddit blurb) |

Also set:

- **Privacy policy URL:** `https://royal-match-poker.onrender.com/privacy.html`  
- Category: Game → Card / Casino-style (pick closest)  
- Contact email  

---

## Phase 6 — Policy forms Google will block you without

Complete these in Play Console (left menu under **Policy** / **App content**):

1. **Privacy policy** — URL above  
2. **Data safety** — declare account login, cloud progress, optional email, ads (AdMob), purchases/gems if applicable  
3. **Content rating** — IARC questionnaire (honest answers for card game / mild competition)  
4. **Target audience** — typically 13+ or 18+ depending on your answers  
5. **App access** — if reviewers must sign in, provide a **test username + password**  

Until these are done, Production stays blocked even if the AAB uploaded fine.

---

## Phase 7 — Promote toward Production

Typical path:

**Internal testing** → (optional) **Closed testing** → **Open testing** → **Production**

For a first solo game, many people:

1. Stabilize on Internal testing  
2. Complete all policy forms + listing  
3. Create a **Production** release with the same (or newer) AAB  
4. Submit for review (often 1–7+ days the first time)

Every new upload must bump **`versionCode`** in `frontend/android/app/build.gradle` (currently `6` / name `1.2.0`). Example next upload: `versionCode 7`, `versionName "1.2.1"`.

---

## Version codes (when you update later)

| Field | Meaning |
|-------|--------|
| `versionCode` | Integer Play uses — **must increase** every upload |
| `versionName` | What users see (`1.2.1`) |

Edit `frontend/android/app/build.gradle`, then:

```powershell
cd frontend
npm run cap:sync:android
```

Build a new signed AAB again.

---

## Common first-time blockers

| Problem | Fix |
|---------|-----|
| “You need a privacy policy” | Use the live URL above |
| Data safety incomplete | Fill every section; save drafts carefully |
| App crashes for reviewers | Give them a working test account |
| Wrong package name | Must stay `com.royalmatch.poker` |
| Uploaded APK instead of AAB | Build **Android App Bundle** |
| Lost keystore | Avoid this — backup now; enroll Play App Signing |
| Render asleep on first open | Cold start can take ~30–60s; note that for reviewers if needed |

---

## Checklist before Production

- [ ] Play developer account paid + verified  
- [ ] Keystore backed up offline  
- [ ] Signed `.aab` installs via Internal testing  
- [ ] Login + gameplay works on a real phone  
- [ ] Store listing (icon, feature graphic, screenshots, descriptions)  
- [ ] Privacy policy URL live  
- [ ] Data safety completed  
- [ ] Content rating completed  
- [ ] Reviewer test account (if login required)  
- [ ] `versionCode` / `versionName` set  

---

## Commands cheat sheet

```powershell
# Build web → sync into Android → open Android Studio
cd "c:\Users\g00gl\OneDrive\Desktop\Games\Card Pairs Game\frontend"
npm run cap:sync:android
npm run cap:open:android

# Optional: regenerate launcher icons
npm run icons:android
```

Sideload / debug only (not for Play): see [README.md](./README.md).

---

## Related

- Debug APK / device install: [README.md](./README.md)  
- iOS / App Store: [IOS.md](./IOS.md)  
- In-app privacy acceptance already exists on account signup  
