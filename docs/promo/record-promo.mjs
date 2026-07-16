/**
 * Capture a short Royal Poker Match promo video via Playwright.
 * Run from frontend/:
 *   node scripts/record-promo.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync, existsSync, readdirSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMO_ROOT = join(__dirname, "..", "..", "docs", "promo");
const OUT_DIR = join(PROMO_ROOT, "out");
const FRAMES = join(PROMO_ROOT, "frames");
const BASE = process.env.PROMO_URL || "http://127.0.0.1:5173";
const API = process.env.PROMO_API || "http://127.0.0.1:5000";
const USER = process.env.PROMO_USER || `promo_${Date.now().toString(36)}`;
const PASS = process.env.PROMO_PASS || "PromoPass123!";

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(FRAMES, { recursive: true });
for (const f of readdirSync(FRAMES)) {
  if (f.endsWith(".png")) unlinkSync(join(FRAMES, f));
}

async function registerToken(request) {
  const res = await request.post(`${API}/api/auth/register`, {
    data: { username: USER, password: PASS, privacy_accepted: true },
  });
  if (res.ok()) {
    const body = await res.json();
    return body.token || body.access_token || null;
  }
  const login = await request.post(`${API}/api/auth/login`, {
    data: { username: USER, password: PASS },
  });
  if (login.ok()) {
    const body = await login.json();
    return body.token || body.access_token || null;
  }
  return null;
}

async function shot(page, name) {
  const path = join(FRAMES, `${name}.png`);
  await page.screenshot({ path, type: "png" });
  return path;
}

async function tryClick(page, selectors, timeout = 3000) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    try {
      await loc.waitFor({ state: "visible", timeout });
      await loc.click({ timeout });
      return true;
    } catch {
      /* next */
    }
  }
  return false;
}

async function swipeHintOrBoard(page) {
  // Prefer hint button
  if (
    await tryClick(
      page,
      ['button[aria-label*="Hint" i]', 'button:has-text("Hint")', ".hint-btn", '[title*="Hint" i]'],
      1200
    )
  ) {
    await page.waitForTimeout(1800);
    return;
  }

  // Drag across card cells if present
  const cells = page.locator(
    ".card-cell, .board-cell, [data-row][data-col], .game-board button, .game-board .card"
  );
  const count = await cells.count().catch(() => 0);
  if (count >= 5) {
    const a = cells.nth(0);
    const b = cells.nth(Math.min(4, count - 1));
    const boxA = await a.boundingBox();
    const boxB = await b.boundingBox();
    if (boxA && boxB) {
      await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
      await page.mouse.down();
      await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2, { steps: 16 });
      await page.mouse.up();
      await page.waitForTimeout(700);
      return;
    }
  }

  const board = page.locator(".mobile-shell__play, .game-board, .board").first();
  const box = await board.boundingBox().catch(() => null);
  if (!box) return;
  for (let i = 0; i < 8; i++) {
    const y = box.y + box.height * (0.2 + (i % 5) * 0.12);
    const x0 = box.x + box.width * 0.15;
    const x1 = box.x + box.width * 0.85;
    await page.mouse.move(x0, y);
    await page.mouse.down();
    await page.mouse.move(x1, y, { steps: 14 });
    await page.mouse.up();
    await page.waitForTimeout(500);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 860 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT_DIR, size: { width: 420, height: 860 } },
  });

  const token = await registerToken(context.request);
  if (!token) {
    console.error("Could not register/login promo user");
    process.exit(1);
  }
  console.log("Logged in as", USER);

  await context.addInitScript(
    ({ token, username }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);
    },
    { token, username: USER }
  );

  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  await shot(page, "01-home");

  // Solo
  const entered = await tryClick(page, [
    'button:has-text("Enter table")',
    "text=Enter table",
    '[aria-label*="Solo" i]',
  ]);
  console.log("enter solo", entered);
  await page.waitForTimeout(1400);
  await shot(page, "02-levels");

  // Start a level — try several selectors used by the map UI
  const played = await tryClick(page, [
    'button:has-text("Play")',
    'button:has-text("Continue")',
    ".level-node--playable",
    ".level-node--unlocked",
    ".map-node--unlocked",
    ".level-chip",
    'button:has-text("0-1")',
    'button:has-text("1")',
  ]);
  console.log("start level", played);
  await page.waitForTimeout(1800);
  await shot(page, "03-game-start");

  for (let i = 0; i < 5; i++) {
    await swipeHintOrBoard(page);
    await shot(page, `04-play-${i + 1}`);
  }

  await page.waitForTimeout(1000);
  await shot(page, "05-end");

  const video = page.video();
  const videoPath = video ? await video.path() : null;
  await context.close();
  await browser.close();

  if (videoPath && existsSync(videoPath)) {
    const dest = join(OUT_DIR, "raw-gameplay.webm");
    copyFileSync(videoPath, dest);
    console.log("RAW_VIDEO", dest);
  } else {
    console.log("NO_VIDEO");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
