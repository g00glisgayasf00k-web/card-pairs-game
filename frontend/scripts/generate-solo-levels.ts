/**
 * Regenerate docs/solo-campaign-levels.md from live level config.
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
const outPath = join(outDir, "solo-campaign-levels.md");

const lines: string[] = [];
lines.push(`# Solo campaign levels (1–${MAX_LEVEL})`);
lines.push("");
lines.push(
  "Generated from `frontend/src/lib/levels.ts` — goals, point target, and hand budgets for 3★ / 2★ / 1★."
);
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
lines.push("## Notes");
lines.push("");
lines.push("- **Target pts**: total score required to clear (plus all milestone goals).");
lines.push("- **Hands**: maximum hands used for each star tier; **1★** column is the fail limit (`moveLimit`).");
lines.push(
  `- **Avg pts/hand** (pacing): ~${campaignAvgPtsForLevel(1)} early → ~${campaignAvgPtsForLevel(500)} late worlds.`
);
lines.push(`- From level ${SPECIFIC_CHALLENGE_FROM_LEVEL}+, goals often require specific ranks/suits.`);
lines.push("- Solo hands pay base poker values only (no Quick Play ×10 goal bonus).");
lines.push("");
lines.push("Regenerate: `cd frontend && npx tsx scripts/generate-solo-levels.ts`");

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${MAX_LEVEL} levels)`);
