/**
 * Regenerate docs/README-solo-levels.md from live level config.
 * Run: npx tsx scripts/generate-solo-levels.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  MAX_LEVEL,
  SPECIFIC_CHALLENGE_FROM_LEVEL,
  campaignAvgPtsForLevel,
  formatChallenge,
  getLevelConfig,
} from "../src/lib/levels.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = join(root, "docs");
const outPath = join(outDir, "README-solo-levels.md");

const lines: string[] = [];
lines.push("# Solo Campaign Levels");
lines.push("");
lines.push(
  `Full list of all **${MAX_LEVEL}** Solo levels: goals, point targets, and hand budgets for 3★ / 2★ / 1★.`
);
lines.push("");
lines.push("**Source of truth:** `frontend/src/lib/levels.ts`");
lines.push("");
lines.push("## How to read this table");
lines.push("");
lines.push(
  "- **Target pts** — total score required to clear (plus all milestone goals)."
);
lines.push(
  "- **3★ / 2★ / 1★ hands** — maximum hands used for each star tier. The **1★** column is the fail limit (`moveLimit`)."
);
lines.push(
  `- **Goals** — milestone hands required. From level ${SPECIFIC_CHALLENGE_FROM_LEVEL}+ these often need specific ranks/suits.`
);
lines.push(
  `- **Avg pts/hand** (pacing math): ~${campaignAvgPtsForLevel(1)} early → ~${campaignAvgPtsForLevel(500)} late worlds.`
);
lines.push(
  "- Solo hands pay **base poker values only** (no Quick Play ×10 goal bonus)."
);
lines.push("");
lines.push("## All levels");
lines.push("");
lines.push("| Level | Label | Target pts | 3★ hands | 2★ hands | 1★ hands | Goals |");
lines.push("|------:|-------|----------:|---------:|---------:|---------:|-------|");

for (let level = 1; level <= MAX_LEVEL; level++) {
  const c = getLevelConfig(level);
  const goals = c.challenges.length
    ? c.challenges.map((g) => formatChallenge(g)).join("; ")
    : "—";
  lines.push(
    `| ${level} | ${c.label} | ${c.targetPoints} | ${c.starMoveLimits.three} | ${c.starMoveLimits.two} | ${c.starMoveLimits.one} | ${goals.replace(/\|/g, "/")} |`
  );
}

lines.push("");
lines.push("---");
lines.push("");
lines.push("Regenerate: `cd frontend && npx tsx scripts/generate-solo-levels.ts`");

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${MAX_LEVEL} levels)`);
