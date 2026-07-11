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

### Automatic build on every push

Every push to `master` runs the **Android APK** GitHub Action. It builds a fresh debug APK and uploads it as a workflow artifact (kept 90 days).

1. Open the repo on GitHub → **Actions** → latest **Android APK** run.
2. Scroll to **Artifacts** → download `royal-match-poker-debug`.
3. Copy to your phone and install (uninstall the old app first if the icon looks stale).

CI sets `versionName` to `1.2.<run>` and bumps `versionCode` each build — check **Settings → Apps** on the phone to confirm you have the new build.

### Local build (optional)

Pushing to GitHub also triggers the CI APK above. Use a local build only if you need to test before push or CI is unavailable.

From the repo root:

```powershell
.\mobile\build.ps1
```

The script regenerates launcher + splash icons, syncs Capacitor, then builds the APK.

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

If the old icon still shows, uninstall the app first, then install again (Android caches launcher icons).

**Important:** The website (browser / “Add to home screen”) and the **APK app** use different icons. Pushing to GitHub updates the website; the phone home-screen icon for the native app only changes when you reinstall the APK built locally.

To confirm you have the new app, check version **1.2.0** in Android Settings → Apps → Royal Match Poker.

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

## Push notifications (FCM)

In-app badges work without Firebase. Device push needs:

1. Create a Firebase project linked to app id `com.royalmatch.poker`.
2. Download `google-services.json` into `frontend/android/app/` (Gradle already applies the plugin when this file exists).
3. On the Render backend, set:
   - `FCM_PROJECT_ID` — Firebase project id
   - `FCM_SERVICE_ACCOUNT_JSON` — full service-account JSON (one line) with Firebase Cloud Messaging permission
4. Rebuild the APK after adding `google-services.json`, then grant notification permission on the device.

Push fires for friend requests, challenge invites, accepts, and finished matches. Tapping a notification opens **Challenge your friends**.

## npm scripts (from `frontend/`)

| Script | Purpose |
|--------|---------|
| `npm run build:mobile` | Vite build with production API URL |
| `npm run cap:sync` | Build + copy into Android project |
| `npm run icons:android` | Regenerate launcher icons from `resources/icon.svg` |
| `npm run cap:open` | Open Android Studio |
| `npm run cap:run` | Sync + run on connected device |
