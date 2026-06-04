export interface LevelConfig {
  level: number;
  label: string;
  targetPoints: number;
  /** Minimum poker hands cleared this level to advance */
  minHands: number;
}

export const MAX_LEVEL = 100;

const TIER_NAMES = [
  "Veteran",
  "Expert",
  "Elite",
  "Master",
  "Legend",
  "Champion",
  "Icon",
  "Mythic",
  "Immortal",
  "Ultimate",
] as const;

/** Curated early levels — targets sit above minHands × 100 (all pairs) */
const EARLY_LEVELS: Omit<LevelConfig, "level">[] = [
  { label: "Rookie",      targetPoints: 1000,  minHands: 6 },
  { label: "Amateur",     targetPoints: 2000,  minHands: 10 },
  { label: "Regular",     targetPoints: 3500,  minHands: 14 },
  { label: "Pro",         targetPoints: 5500,  minHands: 18 },
  { label: "Shark",       targetPoints: 8500,  minHands: 22 },
  { label: "High Roller", targetPoints: 12500, minHands: 26 },
  { label: "Ace",         targetPoints: 18000, minHands: 30 },
];

function labelFromTier(level: number): string {
  const idx = level - 8;
  const tier = TIER_NAMES[Math.floor(idx / 10)] ?? "Ultimate";
  const step = (idx % 10) + 1;
  return `${tier} ${step}`;
}

function buildLevelConfigs(): LevelConfig[] {
  const configs: LevelConfig[] = EARLY_LEVELS.map((data, i) => ({
    level: i + 1,
    ...data,
  }));

  const endPoints = 320_000;
  const endHands = 52;
  const startPoints = EARLY_LEVELS[6]!.targetPoints;
  const startHands = EARLY_LEVELS[6]!.minHands;

  for (let level = 8; level <= MAX_LEVEL; level++) {
    const t = (level - 7) / (MAX_LEVEL - 7);
    const minHands = Math.round(startHands + t * (endHands - startHands));
    let targetPoints = Math.round(
      startPoints + t * t * (endPoints - startPoints)
    );
    // ~167 pts/hand floor — can't finish on pairs alone
    targetPoints = Math.max(targetPoints, minHands * 167);

    configs.push({
      level,
      label: labelFromTier(level),
      targetPoints,
      minHands,
    });
  }

  return configs;
}

const LEVEL_CONFIGS = buildLevelConfigs();

export function getLevelConfig(level: number): LevelConfig {
  const n = Math.min(Math.max(1, Math.floor(level)), MAX_LEVEL);
  return LEVEL_CONFIGS[n - 1]!;
}

/** True when the level point target is reached. */
export function levelRequirementsMet(
  levelScore: number,
  _levelHands: number,
  cfg: LevelConfig
): boolean {
  return levelScore >= cfg.targetPoints;
}

export function comboMultiplier(streak: number): number {
  if (streak < 2) return 1;
  if (streak < 4) return 1.5;
  if (streak < 6) return 2;
  if (streak < 9) return 2.5;
  return 3;
}

export function comboLabel(streak: number): string | null {
  if (streak < 2) return null;
  if (streak < 4) return "Combo ×1.5";
  if (streak < 6) return "Combo ×2";
  if (streak < 9) return "Combo ×2.5";
  return "Combo ×3 🔥";
}

/** Leaderboard total from completed level targets + current level progress (not shown in HUD). */
export function campaignLeaderboardPoints(level: number, levelScore: number): number {
  let pts = levelScore;
  for (let l = 1; l < level; l++) {
    pts += getLevelConfig(l).targetPoints;
  }
  return pts;
}
