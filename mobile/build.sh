#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
ANDROID="$FRONTEND/android"
OUT_DIR="$ROOT/mobile/output"
APK_SRC="$ANDROID/app/build/outputs/apk/debug/app-debug.apk"
APK_DEST="$OUT_DIR/royal-match-poker-debug.apk"

echo "==> Installing frontend dependencies..."
cd "$FRONTEND"
npm install

echo "==> Regenerating launcher + splash icons..."
npm run icons:android

echo "==> Building mobile web bundle (Capacitor mode)..."
npm run cap:sync

echo "==> Building debug APK with Gradle..."
cd "$ANDROID"
chmod +x ./gradlew
VC="${VERSION_CODE:-6}"
VN="${VERSION_NAME:-1.2.0}"
echo "    version ${VN} (code ${VC})"
./gradlew clean assembleDebug -PversionCode="$VC" -PversionName="$VN"

mkdir -p "$OUT_DIR"
cp -f "$APK_SRC" "$APK_DEST"

echo ""
echo "Done! APK: $APK_DEST"
echo "Install: adb install -r \"$APK_DEST\""
