import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const resourcesDir = join(root, "resources");
const assetsDir = join(resourcesDir, "assets");

async function svgToPng(svgPath, outPath, size = 1024) {
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "rgba(0,0,0,0)",
  });
  const png = resvg.render().asPng();
  await sharp(png).ensureAlpha().png({ compressionLevel: 9 }).toFile(outPath);
}

mkdirSync(assetsDir, { recursive: true });

await svgToPng(join(resourcesDir, "icon.svg"), join(assetsDir, "icon-only.png"));
await svgToPng(join(resourcesDir, "icon-foreground.svg"), join(assetsDir, "icon-foreground.png"));
await svgToPng(join(resourcesDir, "icon.svg"), join(assetsDir, "splash.png"), 2732);

await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: { r: 13, g: 74, b: 46, alpha: 255 },
  },
})
  .png()
  .toFile(join(assetsDir, "icon-background.png"));

console.log("Wrote Capacitor asset PNGs in frontend/resources/assets/");
