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
  /** Typical swipes to finish at ~300 pts/move. */
  estimatedMoves: number;
  /** Max hands allowed — 1★ budget (+150% on target ÷ 300). */
  moveLimit: number;
  /** Glass / crate overlays from level 11+. */
  blockers: BlockerSpawnConfig | null;
}

export type HandCounts = Partial<Record<HandLabel, number>>;

export const MAX_LEVEL = 100;

/** Typical points earned per hand/swipe (used for move budgets). */
export const AVG_PTS_PER_MOVE = 300;

/** Move budget multipliers on target ÷ 300: 3★ +50%, 2★ +100%, 1★ +150%. */
export const STAR_MOVE_MULTIPLIER = {
  threeStar: 1.5,
  twoStar: 2,
  oneStar: 2.5,
} as const;

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

/** World 1 starts at 1,000 pts; world 2 at 2,000; ~8% growth per stage within a world. */
const WORLD_BASE_POINTS = 1000;
const STAGE_TARGET_GROWTH = 1.08;

const HAND_LADDER: HandLabel[] = [
  "pair",
  "two_pair",
  "three_of_a_kind",
  "straight",
  "flush",
  "full_house",
  "four_of_a_kind",
  "straight_flush",
];

function worldForLevel(level: number): number {
  return Math.min(CAMPAIGN_TIERS.length, Math.ceil(level / 10));
}

/**
 * Allowed challenge hands per world:
 * 1 → pair, two pair · 2 → + three of a kind · 3 → + straight · 4 → + flush · 5+ → ladder continues
 */
function handPoolForWorld(world: number): HandLabel[] {
  const size = Math.min(HAND_LADDER.length, world + 1);
  return HAND_LADDER.slice(0, size);
}

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

/** Theoretical minimum moves to reach the point target at ~300 pts/move. */
export function baseMovesForTarget(targetPoints: number): number {
  return Math.max(1, Math.ceil(targetPoints / AVG_PTS_PER_MOVE));
}

/** Move budget for a star tier (1★ = level move limit / game over). */
export function movesBudgetForStars(stars: 1 | 2 | 3, targetPoints: number): number {
  const mult =
    stars === 3
      ? STAR_MOVE_MULTIPLIER.threeStar
      : stars === 2
        ? STAR_MOVE_MULTIPLIER.twoStar
        : STAR_MOVE_MULTIPLIER.oneStar;
  return Math.ceil((targetPoints / AVG_PTS_PER_MOVE) * mult);
}

/**
 * Estimate swipes to reach the point target (~300 pts per move).
 */
export function computeEstimatedMoves(
  targetPoints: number,
  _challenges: HandChallenge[] = []
): number {
  return baseMovesForTarget(targetPoints);
}

/** Max hands before game over — 1★ budget (+150% on base). */
export function computeMoveLimit(
  targetPoints: number,
  _challenges: HandChallenge[] = [],
  _level: number = 1
): number {
  return movesBudgetForStars(1, targetPoints);
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
    swipesUsed > 0
      ? Math.max(levelScore / swipesUsed, HAND_SCORES.pair)
      : AVG_PTS_PER_MOVE;
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

/** Hand challenges ramp through the world's allowed pool (harder hands on later stages). */
function challengesForLevel(level: number): HandChallenge[] {
  const world = worldForLevel(level);
  const step = stepInTier(level);
  const pool = handPoolForWorld(world);
  const topIndex = pool.length - 1;

  // World 1 early stages — pairs only, then mix in two pair
  if (world === 1 && step <= 4) {
    return [{ hand: "pair", minCount: step }];
  }
  if (world === 1 && step <= 7) {
    return [
      { hand: "pair", minCount: 2 },
      { hand: "two_pair", minCount: step >= 6 ? 2 : 1 },
    ];
  }
  if (world === 1) {
    return [
      { hand: "pair", minCount: 3 },
      { hand: "two_pair", minCount: step >= 10 ? 3 : 2 },
    ];
  }

  // Which hand tier this stage focuses on (low → high through the world)
  const focusIndex = Math.min(topIndex, Math.floor(((step - 1) / 9) * topIndex));
  const focusHand = pool[focusIndex]!;
  const focusCount = 1 + Math.floor(step / 4);

  const challenges: HandChallenge[] = [{ hand: focusHand, minCount: focusCount }];

  // Support challenge from one step lower in the pool
  if (step >= 4 && focusIndex > 0) {
    const supportHand = pool[focusIndex - 1]!;
    challenges.unshift({
      hand: supportHand,
      minCount: step >= 8 ? 2 : 1,
    });
  } else if (step >= 4) {
    challenges.unshift({ hand: "pair", minCount: step >= 8 ? 3 : 2 });
  }

  return challenges;
}

function targetPointsForLevel(level: number, challenges: HandChallenge[]): number {
  const world = worldForLevel(level);
  const stage = stepInTier(level);
  const worldStart = world * WORLD_BASE_POINTS;
  const scaled = Math.round(worldStart * STAGE_TARGET_GROWTH ** (stage - 1));
  const floor = challengePointsFloor(challenges);
  return Math.max(scaled, floor + 300);
}

function buildLevelConfig(level: number): LevelConfig {
  const challenges = challengesForLevel(level);
  const targetPoints = targetPointsForLevel(level, challenges);
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

/**
 * Star rating for a cleared level:
 * 1★ reach target within +150% move budget · 2★ within +100% · 3★ within +50% and hand challenges
 */
export function computeLevelStars(
  levelScore: number,
  handCounts: HandCounts,
  handsUsed: number,
  cfg: LevelConfig
): number {
  if (!levelPointsMet(levelScore, cfg)) return 0;

  const threeStarMoves = movesBudgetForStars(3, cfg.targetPoints);
  const twoStarMoves = movesBudgetForStars(2, cfg.targetPoints);
  const challengesDone = challengesMet(handCounts, cfg.challenges);

  if (handsUsed <= threeStarMoves && challengesDone) return 3;
  if (handsUsed <= twoStarMoves) return 2;
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
