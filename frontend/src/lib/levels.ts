import { HAND_DISPLAY, HAND_SCORES, type HandLabel } from "./pokerHands";
import { blockersForLevel, type BlockerSpawnConfig } from "./blockers";

export interface HandChallenge {
  hand: HandLabel;
  minCount: number;
}

export interface LevelConfig {
  level: number;
  tier: string;
  label: string;
  targetPoints: number;
  challenges: HandChallenge[];
  /** Typical swipes needed to finish (5-card hands, base scores). */
  estimatedMoves: number;
  /** Max hands allowed — derived from target + challenges with path-finding grace. */
  moveLimit: number;
  /** Glass / crate overlays from level 11+. */
  blockers: BlockerSpawnConfig | null;
}

export type HandCounts = Partial<Record<HandLabel, number>>;

export const MAX_LEVEL = 100;

/** Average pts per filler swipe after challenge hands (pairs + occasional combos). */
const AVG_FILLER_PTS = 130;

const CAMPAIGN_TIERS = [
  "Beginner",
  "Amateur",
  "Regular",
  "Pro",
  "Shark",
  "High Roller",
  "Ace",
  "Veteran",
  "Expert",
  "Elite",
] as const;

/** Levels 1–10 — curated Beginner progression */
const BEGINNER_LEVELS: {
  targetPoints: number;
  challenges: HandChallenge[];
}[] = [
  { targetPoints: 1000, challenges: [{ hand: "three_of_a_kind", minCount: 1 }] },
  { targetPoints: 1200, challenges: [{ hand: "pair", minCount: 3 }] },
  { targetPoints: 1400, challenges: [{ hand: "two_pair", minCount: 1 }] },
  { targetPoints: 1600, challenges: [{ hand: "three_of_a_kind", minCount: 2 }] },
  { targetPoints: 1800, challenges: [{ hand: "straight", minCount: 1 }] },
  { targetPoints: 2000, challenges: [{ hand: "flush", minCount: 1 }] },
  { targetPoints: 2400, challenges: [{ hand: "full_house", minCount: 1 }] },
  { targetPoints: 2700, challenges: [{ hand: "straight", minCount: 2 }] },
  { targetPoints: 3000, challenges: [{ hand: "four_of_a_kind", minCount: 1 }] },
  {
    targetPoints: 3500,
    challenges: [
      { hand: "flush", minCount: 1 },
      { hand: "full_house", minCount: 1 },
    ],
  },
];

function tierForLevel(level: number): string {
  const idx = Math.min(CAMPAIGN_TIERS.length - 1, Math.floor((level - 1) / 10));
  return CAMPAIGN_TIERS[idx] ?? "Elite";
}

function stepInTier(level: number): number {
  return ((level - 1) % 10) + 1;
}

function labelForLevel(level: number): string {
  return `${tierForLevel(level)} ${stepInTier(level)}`;
}

/** Minimum points the challenge hands must contribute (base scores). */
export function challengePointsFloor(challenges: HandChallenge[]): number {
  return challenges.reduce((sum, c) => sum + HAND_SCORES[c.hand] * c.minCount, 0);
}

/**
 * Estimate swipes to reach the point target.
 * 1) Count swipes for each required challenge hand (at base payout).
 * 2) Fill remaining points with average filler swipes.
 */
export function computeEstimatedMoves(
  targetPoints: number,
  challenges: HandChallenge[]
): number {
  let remaining = targetPoints;
  let moves = 0;

  for (const { hand, minCount } of challenges) {
    remaining -= HAND_SCORES[hand] * minCount;
    moves += minCount;
  }

  remaining = Math.max(0, remaining);
  if (remaining > 0) {
    moves += Math.ceil(remaining / AVG_FILLER_PTS);
  }

  return Math.max(moves, 1);
}

/**
 * Move budget for the level — tight but achievable.
 * Starts from the theoretical minimum, then adds grace for imperfect 5-card paths.
 */
export function computeMoveLimit(
  targetPoints: number,
  challenges: HandChallenge[],
  level: number
): number {
  const base = computeEstimatedMoves(targetPoints, challenges);
  const tierIdx = Math.floor((level - 1) / 10);
  const grace = Math.ceil(base * 0.48) + 4 + tierIdx;
  const limit = base + grace;
  const floor = base + 2;
  return Math.max(floor, limit);
}

export function movesRemaining(moveLimit: number, handsUsed: number): number {
  return Math.max(0, moveLimit - handsUsed);
}

export function outOfMoves(moveLimit: number, handsUsed: number): boolean {
  return handsUsed >= moveLimit;
}

/** Dynamic estimate from current progress (uses your actual pts/swipe pace when available). */
export function estimateRemainingSwipes(
  cfg: LevelConfig,
  levelScore: number,
  handCounts: HandCounts,
  swipesUsed: number
): number {
  if (levelPointsMet(levelScore, cfg)) return 0;

  let challengeSwipesLeft = 0;
  let challengePtsLeft = 0;
  for (const { hand, minCount } of cfg.challenges) {
    const have = handCounts[hand] ?? 0;
    const need = Math.max(0, minCount - have);
    challengeSwipesLeft += need;
    challengePtsLeft += need * HAND_SCORES[hand];
  }

  const pointsLeft = Math.max(0, cfg.targetPoints - levelScore);
  const fillerPts = Math.max(0, pointsLeft - challengePtsLeft);
  const pace =
    swipesUsed > 0 ? Math.max(levelScore / swipesUsed, HAND_SCORES.pair) : AVG_FILLER_PTS;
  const fillerSwipes = fillerPts > 0 ? Math.ceil(fillerPts / pace) : 0;

  return challengeSwipesLeft + fillerSwipes;
}

export function challengesMet(handCounts: HandCounts, challenges: HandChallenge[]): boolean {
  return challenges.every((c) => (handCounts[c.hand] ?? 0) >= c.minCount);
}

export function formatChallenge(c: HandChallenge): string {
  const name = HAND_DISPLAY[c.hand];
  return c.minCount === 1 ? `1× ${name}` : `${c.minCount}× ${name}`;
}

function challengesForAdvancedLevel(level: number): HandChallenge[] {
  const step = stepInTier(level);
  const tierIdx = Math.floor((level - 1) / 10);

  const ladder: HandLabel[] = [
    "pair",
    "two_pair",
    "three_of_a_kind",
    "straight",
    "flush",
    "full_house",
    "four_of_a_kind",
    "straight_flush",
  ];
  const rank = Math.min(ladder.length - 1, tierIdx + Math.floor(step / 4));
  const primary = ladder[rank]!;
  const secondary = ladder[Math.max(0, rank - 1)]!;
  const primaryCount = 1 + Math.floor(step / 5);

  if (step >= 7 && rank >= 2) {
    return [
      { hand: primary, minCount: primaryCount },
      { hand: secondary, minCount: 1 },
    ];
  }
  return [{ hand: primary, minCount: primaryCount }];
}

function targetPointsForAdvancedLevel(level: number): number {
  const floor = challengePointsFloor(challengesForAdvancedLevel(level));
  const start = BEGINNER_LEVELS[9]!.targetPoints;
  const end = 320_000;
  const t = (level - 11) / (MAX_LEVEL - 11);
  const scaled = Math.round(start + t * t * (end - start));
  return Math.max(scaled, floor + 400);
}

function buildLevelConfig(level: number): LevelConfig {
  if (level <= 10) {
    const data = BEGINNER_LEVELS[level - 1]!;
    const challenges = data.challenges;
    return {
      level,
      tier: "Beginner",
      label: `Beginner ${level}`,
      targetPoints: data.targetPoints,
      challenges,
      estimatedMoves: computeEstimatedMoves(data.targetPoints, challenges),
      moveLimit: computeMoveLimit(data.targetPoints, challenges, level),
      blockers: blockersForLevel(level),
    };
  }

  const challenges = challengesForAdvancedLevel(level);
  const targetPoints = targetPointsForAdvancedLevel(level);
  return {
    level,
    tier: tierForLevel(level),
    label: labelForLevel(level),
    targetPoints,
    challenges,
    estimatedMoves: computeEstimatedMoves(targetPoints, challenges),
    moveLimit: computeMoveLimit(targetPoints, challenges, level),
    blockers: blockersForLevel(level),
  };
}

const LEVEL_CONFIGS: LevelConfig[] = Array.from({ length: MAX_LEVEL }, (_, i) =>
  buildLevelConfig(i + 1)
);

export function getLevelConfig(level: number): LevelConfig {
  const n = Math.min(Math.max(1, Math.floor(level)), MAX_LEVEL);
  return LEVEL_CONFIGS[n - 1]!;
}

export function levelPointsMet(levelScore: number, cfg: LevelConfig): boolean {
  return levelScore >= cfg.targetPoints;
}

/** Move budget used for 2★ — base limit only (purchased moves don't help). */
export const STAR_MOVE_EFFICIENCY = 0.5;

/**
 * Star rating for a cleared level:
 * 1★ reach point target · 2★ use ≤50% of moves · 3★ also finish hand challenges
 */
export function computeLevelStars(
  levelScore: number,
  handCounts: HandCounts,
  handsUsed: number,
  cfg: LevelConfig
): number {
  if (!levelPointsMet(levelScore, cfg)) return 0;

  const efficient = handsUsed <= cfg.moveLimit * STAR_MOVE_EFFICIENCY;
  const challengesDone = challengesMet(handCounts, cfg.challenges);

  if (efficient && challengesDone) return 3;
  if (efficient) return 2;
  return 1;
}

export function levelRequirementsMet(
  levelScore: number,
  handCounts: HandCounts,
  cfg: LevelConfig
): boolean {
  return levelScore >= cfg.targetPoints && challengesMet(handCounts, cfg.challenges);
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

export function campaignLeaderboardPoints(level: number, levelScore: number): number {
  let pts = levelScore;
  for (let l = 1; l < level; l++) {
    pts += getLevelConfig(l).targetPoints;
  }
  return pts;
}
