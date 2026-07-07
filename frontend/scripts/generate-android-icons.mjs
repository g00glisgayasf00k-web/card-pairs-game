import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const resourcesDir = join(root, "resources");
const assetsDir = join(resourcesDir, "assets");
const resDir = join(root, "android", "app", "src", "main", "res");

const LAUNCHER_SIZES = {
  "mipmap-ldpi": 36,
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const FOREGROUND_SIZES = {
  "mipmap-ldpi": 81,
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

const SPLASH_SIZES = {
  "drawable-port-ldpi": 320,
  "drawable-port-mdpi": 480,
  "drawable-port-hdpi": 800,
  "drawable-port-xhdpi": 1280,
  "drawable-port-xxhdpi": 1600,
  "drawable-port-xxxhdpi": 1920,
  "drawable-land-ldpi": 480,
  "drawable-land-mdpi": 800,
  "drawable-land-hdpi": 1280,
  "drawable-land-xhdpi": 1920,
  "drawable-land-xxhdpi": 2560,
  "drawable-land-xxxhdpi": 3840,
};

async function renderSvg(svgPath, size) {
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "rgba(0,0,0,0)",
  });
  return resvg.render().asPng();
}

async function writePng(buffer, outPath) {
  await sharp(buffer).png({ compressionLevel: 9 }).toFile(outPath);
}

async function writeResizedPng(buffer, outPath, size) {
  await sharp(buffer).resize(size, size, { fit: "contain", background: "#0d4a2e" }).png().toFile(outPath);
}

async function writeSplashPng(buffer, outPath, width, landscape) {
  const height = landscape ? Math.round(width * 0.625) : Math.round(width * 1.777);
  await sharp(buffer)
    .resize(width, height, { fit: "cover", position: "centre" })
    .png()
    .toFile(outPath);
}

mkdirSync(assetsDir, { recursive: true });

const iconPng = await renderSvg(join(resourcesDir, "icon.svg"), 1024);
const foregroundPng = await renderSvg(join(resourcesDir, "icon-foreground.svg"), 1024);
const splashPng = await renderSvg(join(resourcesDir, "icon.svg"), 2732);

await writePng(iconPng, join(assetsDir, "icon-only.png"));
await writePng(foregroundPng, join(assetsDir, "icon-foreground.png"));
await writePng(splashPng, join(assetsDir, "splash.png"));

for (const [folder, size] of Object.entries(LAUNCHER_SIZES)) {
  const dir = join(resDir, folder);
  mkdirSync(dir, { recursive: true });
  await writeResizedPng(iconPng, join(dir, "ic_launcher.png"), size);
  await writeResizedPng(iconPng, join(dir, "ic_launcher_round.png"), size);
}

for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
  const dir = join(resDir, folder);
  mkdirSync(dir, { recursive: true });
  await writeResizedPng(foregroundPng, join(dir, "ic_launcher_foreground.png"), size);
}

for (const [folder, width] of Object.entries(SPLASH_SIZES)) {
  const dir = join(resDir, folder);
  mkdirSync(dir, { recursive: true });
  const landscape = folder.includes("land");
  await writeSplashPng(splashPng, join(dir, "splash.png"), width, landscape);
}

mkdirSync(join(resDir, "drawable"), { recursive: true });
await writeSplashPng(splashPng, join(resDir, "drawable", "splash.png"), 480, false);

const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });
await writeResizedPng(iconPng, join(publicDir, "icon-192.png"), 192);
await writeResizedPng(iconPng, join(publicDir, "icon-512.png"), 512);

const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

const anydpiDir = join(resDir, "mipmap-anydpi-v26");
mkdirSync(anydpiDir, { recursive: true });
writeFileSync(join(anydpiDir, "ic_launcher.xml"), adaptiveIconXml);
writeFileSync(join(anydpiDir, "ic_launcher_round.xml"), adaptiveIconXml);

console.log("Installed Ace of Spades launcher + splash assets into android/app/src/main/res/");
