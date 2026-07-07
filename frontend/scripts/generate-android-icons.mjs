import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const resourcesDir = join(root, "resources");
const assetsDir = join(resourcesDir, "assets");

function svgToPng(svgPath, outPath, size = 1024) {
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "transparent",
  });
  writeFileSync(outPath, resvg.render().asPng());
}

mkdirSync(assetsDir, { recursive: true });

svgToPng(join(resourcesDir, "icon.svg"), join(assetsDir, "icon-only.png"));
svgToPng(join(resourcesDir, "icon-foreground.svg"), join(assetsDir, "icon-foreground.png"));

await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 3,
    background: "#0d4a2e",
  },
})
  .png()
  .toFile(join(assetsDir, "icon-background.png"));

console.log("Wrote Capacitor asset PNGs in frontend/resources/assets/");
