# Google Play — upload guide (Royal Poker Match)

This walkthrough is for shipping **`com.royalmatch.poker`** to Google Play Console.

Play Console needs a **signed Android App Bundle (`.aab`)**, not the debug APK from GitHub Actions.

| Item | Value |
|------|--------|
| Package / application ID | `com.royalmatch.poker` |
| Capacitor / Android project | `frontend/android/` |
| Live API | `https://royal-match-poker.onrender.com` |
| Privacy policy URL (for Play listing) | `https://royal-match-poker.onrender.com/privacy.html` |

---

## 1. Create the app in Play Console

1. Open [Google Play Console](https://play.google.com/console).
2. Create the app (name, language, free/paid, declarations).
3. Keep the package name **`com.royalmatch.poker`** — it is locked forever once you upload the first build.

Complete later (before production):

- Store listing (icon, screenshots, description)
- Content rating questionnaire
- Data safety form
- Privacy policy URL → `https://royal-match-poker.onrender.com/privacy.html`
- App access (test account if login is required)

---

## 2. Create a signing keystore (one-time — keep forever)

Generate the keystore **outside** this repo (e.g. Documents). Never commit the `.jks` or passwords.

```powershell
keytool -genkey -v -keystore royal-match-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias royal-match
```

Save:

- the `.jks` file
- keystore password
- key alias (`royal-match`)
- key password

If you lose these and you are **not** enrolled in Play App Signing with a recoverable upload key, you cannot update the same listing.

**Recommended:** when Play asks about **Play App Signing**, let Google hold the app signing key. You keep the upload keystore above for uploading new releases.

---

## 3. Build a release AAB (Android Studio)

Debug APKs from Actions / `mobile\build.ps1` are for sideloading only. Do **not** upload those to Play.

1. Sync the web app into Capacitor:

```powershell
cd "c:\Users\g00gl\OneDrive\Desktop\Games\Card Pairs Game\frontend"
npm install
npm run cap:sync
npm run cap:open
```

2. In Android Studio: **Build → Generate Signed App Bundle / APK**
3. Choose **Android App Bundle**
4. Select your `.jks`, enter alias + passwords
5. Build type: **release**
6. Finish — output is typically:

```
frontend\android\app\release\app-release.aab
```

(or under `app\build\outputs\bundle\release\app-release.aab`)

---

## 4. Upload the package

Best path for a first upload:

1. Play Console → **Testing → Internal testing**
2. **Create new release**
3. Upload the `.aab`
4. Add short release notes
5. **Review release → Start rollout to Internal testing**

Install via the internal testing link on a device signed into a tester Google account before promoting to Closed / Open / Production.

### Do not upload

- `mobile\output\royal-match-poker-debug.apk`
- GitHub Actions debug APK artifacts
- Unsigned builds

---

## 5. Version codes

| Field | Meaning |
|-------|--------|
| `versionCode` | Integer Play uses for updates (must increase every upload) |
| `versionName` | User-visible string (e.g. `1.2.0`) |

Set in `frontend/android/app/build.gradle` (`versionCode` / `versionName`), or via Gradle properties / env:

- `VERSION_CODE`
- `VERSION_NAME`

Bump **`versionCode`** for every new Play upload.

---

## 6. Common first-upload blockers

| Blocker | What to do |
|---------|------------|
| Privacy policy | Use `https://royal-match-poker.onrender.com/privacy.html` |
| Data safety | Declare account data, progress, optional email, ads, purchases as applicable |
| Content rating | Complete the questionnaire |
| App access | Provide a test username/password if reviewers must sign in |
| Target API | Use Android Studio’s release checks; fix any SDK warnings before production |

---

## 7. Checklist before Production

- [ ] Signed `.aab` uploaded and stable on Internal testing
- [ ] Store listing complete (icon 512, feature graphic, screenshots)
- [ ] Privacy policy URL live
- [ ] Data safety completed
- [ ] Content rating completed
- [ ] Test account documented for reviewers (if needed)
- [ ] Keystore backed up safely offline

---

## Related

- Sideload / debug APK: see [README.md](./README.md)
- In-app privacy acceptance: users must accept the policy when creating an account (Sign up / Google Sign-up)
