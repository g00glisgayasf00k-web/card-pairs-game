$ErrorActionPreference = "Stop"

if (-not $env:JAVA_HOME) {
    $studioJbr = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path $studioJbr) {
        $env:JAVA_HOME = $studioJbr
        Write-Host "Using JAVA_HOME from Android Studio: $studioJbr"
    }
}
if (-not $env:ANDROID_HOME) {
    $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
    if (Test-Path $sdk) {
        $env:ANDROID_HOME = $sdk
    }
}

$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "frontend"
$Android = Join-Path $Frontend "android"
$OutDir = Join-Path $PSScriptRoot "output"
$ApkSource = Join-Path $Android "app\build\outputs\apk\debug\app-debug.apk"
$ApkDest = Join-Path $OutDir "royal-match-poker-debug.apk"

Write-Host "==> Installing frontend dependencies..."
Push-Location $Frontend
npm install

Write-Host "==> Building mobile web bundle (Capacitor mode)..."
npm run cap:sync
Pop-Location

Write-Host "==> Building debug APK with Gradle..."
Push-Location $Android
if (Test-Path ".\gradlew.bat") {
    .\gradlew.bat assembleDebug
} else {
    throw "gradlew.bat not found. Run 'npx cap add android' from frontend/ first."
}
Pop-Location

if (-not (Test-Path $ApkSource)) {
    throw "APK not found at $ApkSource"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
Copy-Item -Force $ApkSource $ApkDest

Write-Host ""
Write-Host "Done! APK:" -ForegroundColor Green
Write-Host "  $ApkDest"
Write-Host ""
Write-Host "Install on a connected device:"
Write-Host "  adb install -r `"$ApkDest`""
