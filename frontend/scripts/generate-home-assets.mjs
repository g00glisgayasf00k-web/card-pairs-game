/**
 * Generate home PNG assets from the design-system palette.
 * Run: node scripts/generate-home-assets.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "assets");

const C = {
  bgBase: "#061A17",
  bgTop: "#0E2F28",
  bgBottom: "#04110F",
  gold: "#FFD700",
  goldHighlight: "#FFF3B0",
  goldDeep: "#C9A23A",
  purple: "#6C2BD9",
  purpleDark: "#3B0E91",
  blue: "#0D47A1",
  blueDark: "#072A66",
  green: "#1B5E20",
  greenDark: "#0F3A13",
  white: "#FFFFFF",
};

function ensure(p) {
  mkdirSync(dirname(p), { recursive: true });
}

async function writeSvgPng(path, svg) {
  ensure(path);
  await sharp(Buffer.from(svg)).png().toFile(path);
}

function gradientRect(w, h, c1, c2, angle = 135) {
  // approximate 135deg as diagonal
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle - 135} 0.5 0.5)">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="20" ry="20" fill="url(#g)"/>
</svg>`;
}

function glowOrb(w, h, color, alpha = 0.45) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="r" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="${alpha}"/>
      <stop offset="55%" stop-color="${color}" stop-opacity="${alpha * 0.35}"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#r)"/>
</svg>`;
}

async function main() {
  // background
  await writeSvgPng(
    join(root, "background/bg_main.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C.bgTop}"/>
          <stop offset="100%" stop-color="${C.bgBottom}"/>
        </linearGradient>
      </defs>
      <rect width="720" height="1280" fill="${C.bgBase}"/>
      <rect width="720" height="1280" fill="url(#bg)"/>
    </svg>`
  );

  // hero panel
  await writeSvgPng(
    join(root, "hero/panel_hero_bg.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="280">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C.bgTop}"/>
          <stop offset="100%" stop-color="${C.bgBottom}"/>
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${C.white}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="${C.white}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="800" height="280" rx="20" fill="url(#hg)"/>
      <rect width="800" height="280" rx="20" fill="url(#shine)" opacity="0.3"/>
    </svg>`
  );

  // cards hand
  await writeSvgPng(
    join(root, "hero/cards_hand.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">
      <g transform="translate(40,30) rotate(-14)">
        <rect width="90" height="130" rx="8" fill="${C.white}" stroke="${C.goldDeep}" stroke-width="2"/>
        <text x="12" y="28" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${C.bgBase}">A♠</text>
      </g>
      <g transform="translate(100,18) rotate(2)">
        <rect width="90" height="130" rx="8" fill="${C.white}" stroke="${C.goldDeep}" stroke-width="2"/>
        <text x="12" y="28" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${C.purple}">K♥</text>
      </g>
      <g transform="translate(160,30) rotate(14)">
        <rect width="90" height="130" rx="8" fill="${C.white}" stroke="${C.goldDeep}" stroke-width="2"/>
        <text x="12" y="28" font-family="Georgia, serif" font-size="22" font-weight="700" fill="${C.bgBase}">Q♣</text>
      </g>
    </svg>`
  );

  // chips stack
  await writeSvgPng(
    join(root, "hero/chips_stack.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="160">
      <circle cx="70" cy="100" r="28" fill="${C.purple}" stroke="${C.white}" stroke-width="3" stroke-dasharray="6 5"/>
      <circle cx="110" cy="90" r="28" fill="${C.blue}" stroke="${C.white}" stroke-width="3" stroke-dasharray="6 5"/>
      <circle cx="145" cy="105" r="34" fill="${C.gold}" stroke="${C.goldHighlight}" stroke-width="4"/>
      <path d="M145 88l3 5.5 6 .5-4.5 3.8 1.3 5.7-5.8-3.3-5.8 3.3 1.3-5.7-4.5-3.8 6-.5 3-5.5z" fill="${C.white}"/>
    </svg>`
  );

  // gold particles
  await writeSvgPng(
    join(root, "hero/particles_gold.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280">
      ${Array.from({ length: 40 }, (_, i) => {
        const x = (i * 47) % 400;
        const y = (i * 73) % 280;
        const r = 1 + (i % 3);
        const o = 0.25 + (i % 5) * 0.12;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.gold}" opacity="${o}"/>`;
      }).join("")}
    </svg>`
  );

  // card bases + glows
  const themes = [
    ["purple", C.purple, C.purpleDark],
    ["blue", C.blue, C.blueDark],
    ["green", C.green, C.greenDark],
  ];
  for (const [name, c1, c2] of themes) {
    await writeSvgPng(
      join(root, `cards/${name}/card_base.png`),
      gradientRect(720, 220, c1, c2, 135)
    );
    await writeSvgPng(
      join(root, `cards/${name}/card_glow.png`),
      glowOrb(512, 512, c1, 0.5)
    );
  }

  // ui
  await writeSvgPng(
    join(root, "ui/icon_circle_bg.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
      <defs>
        <radialGradient id="c" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${C.white}" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="${C.bgBase}" stop-opacity="0.85"/>
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="60" fill="url(#c)" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
    </svg>`
  );

  await writeSvgPng(
    join(root, "ui/progress_bg.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="12">
      <rect width="400" height="12" rx="6" fill="${C.bgBottom}"/>
      <rect width="400" height="12" rx="6" fill="rgba(0,0,0,0.45)"/>
    </svg>`
  );

  await writeSvgPng(
    join(root, "ui/progress_fill.png"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="12">
      <defs>
        <linearGradient id="pf" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${C.goldDeep}"/>
          <stop offset="50%" stop-color="${C.gold}"/>
          <stop offset="100%" stop-color="${C.goldHighlight}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="12" rx="6" fill="url(#pf)"/>
    </svg>`
  );

  console.log("Home assets generated under public/assets");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
