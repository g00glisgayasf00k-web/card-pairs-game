# Royal Match Poker — Android (APK)

This folder holds scripts and build output for the native Android app. The Capacitor project lives in `frontend/android/` and wraps the same React game, talking to the live API on Render.

## What you get

| Item | Location |
|------|----------|
| Capacitor config | `frontend/capacitor.config.ts` |
| Android Studio project | `frontend/android/` |
| Mobile web build (API → Render) | `frontend/.env.capacitor` |
| Debug APK (after build) | `mobile/output/royal-match-poker-debug.apk` |

**App ID:** `com.royalmatch.poker`  
**API:** `https://royal-match-poker.onrender.com`

## Prerequisites (one-time)

1. **Node.js 18+** (you already have this for the web app)
2. **JDK 17+** — [Adoptium Temurin](https://adoptium.net/) recommended
3. **Android Studio** — install **Android SDK** (API 34+) and accept licenses

Set environment variables (Windows example):

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17..."
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
```

Or open the project in Android Studio once — it configures the SDK path in `frontend/android/local.properties` automatically.

## Build a debug APK (install on your phone)

From the repo root:

```powershell
.\mobile\build.ps1
```

Or manually:

```powershell
cd frontend
npm install
npm run cap:sync
cd android
.\gradlew.bat assembleDebug
```

Copy the APK:

```
frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

→ `mobile\output\royal-match-poker-debug.apk` (the script does this).

Install via USB (developer mode + USB debugging):

```powershell
adb install -r mobile\output\royal-match-poker-debug.apk
```

## Open in Android Studio

```powershell
cd frontend
npm run cap:open
```

Then **Run ▶** on a device or emulator.

## Release / Play Store

1. Create a signing keystore (keep it safe — never commit it).
2. Configure signing in `frontend/android/app/build.gradle`.
3. Build: `.\gradlew.bat assembleRelease` or **Build → Generate Signed Bundle/APK** in Android Studio.
4. Upload the **AAB** to Google Play Console.

## Notes

- **Login & saves** use the same Render backend as the website.
- **Google Sign-In** inside the WebView may need extra native setup; username/password login works today.
- **Ads** (AdSense / Nitro) behave differently in WebView — test treasury video rewards on a real device.
- After changing the React app, always run `npm run cap:sync` before rebuilding the APK.

## npm scripts (from `frontend/`)

| Script | Purpose |
|--------|---------|
| `npm run build:mobile` | Vite build with production API URL |
| `npm run cap:sync` | Build + copy into Android project |
| `npm run cap:open` | Open Android Studio |
| `npm run cap:run` | Sync + run on connected device |
