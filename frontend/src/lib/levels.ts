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
  /** Base points if every required hand scores once (no combos). */
  challengePoints: number;
  /** Total hands required across all challenges. */
  challengeHands: number;
  /** Max hands for 1★ / 2★ / 3★ (derived from challengeHands). */
  starMoveLimits: { one: number; two: number; three: number };
  /** Typical swipes to finish all challenge hands. */
  estimatedMoves: number;
  /** Max hands before game over — 1★ budget. */
  moveLimit: number;
  /** Glass / crate overlays from level 11+. */
  blockers: BlockerSpawnConfig | null;
}

export type HandCounts = Partial<Record<HandLabel, number>>;

export const MAX_LEVEL = 100;

/** Typical points earned per hand/swipe (used for estimates only). */
export const AVG_PTS_PER_MOVE = 300;

/**
 * Point goal as a fraction of challenge base score.
 * Completing every required hand clears the bar; set below 100% so combos
 * from one lucky hand alone rarely finish the level before missions are done.
 */
const TARGET_POINT_RATIO = 0.88;

/** Extra moves beyond required challenge hands, per star tier. */
const STAR_HAND_BUFFER = {
  threeStar: 0.2,
  twoStar: 0.38,
  oneStar: 0.62,
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

const HAND_LADDER: HandLabel[] = [
  "pair",
  "two_pair",
  "three_of_a_kind",
  "straight",
  "flush",
  "full_house",
  "four_of_a_kind",
  "straight_flush",
  "royal_flush",
];

/** World 1 (display 0-x) hand requirements — steps 1–10. Step 1 is always 3× Pair for every world. */
const STAGE_CHALLENGE_TEMPLATE: HandChallenge[][] = [
  [{ hand: "pair", minCount: 3 }],
  [
    { hand: "pair", minCount: 3 },
    { hand: "two_pair", minCount: 1 },
  ],
  [
    { hand: "pair", minCount: 3 },
    { hand: "two_pair", minCount: 2 },
  ],
  [
    { hand: "pair", minCount: 3 },
    { hand: "two_pair", minCount: 2 },
    { hand: "three_of_a_kind", minCount: 1 },
  ],
  [
    { hand: "pair", minCount: 3 },
    { hand: "two_pair", minCount: 2 },
    { hand: "three_of_a_kind", minCount: 2 },
  ],
  [
    { hand: "two_pair", minCount: 3 },
    { hand: "three_of_a_kind", minCount: 2 },
    { hand: "straight", minCount: 1 },
  ],
  [
    { hand: "two_pair", minCount: 3 },
    { hand: "three_of_a_kind", minCount: 2 },
    { hand: "straight", minCount: 1 },
    { hand: "flush", minCount: 1 },
  ],
  [
    { hand: "two_pair", minCount: 3 },
    { hand: "three_of_a_kind", minCount: 2 },
    { hand: "straight", minCount: 1 },
    { hand: "flush", minCount: 1 },
    { hand: "full_house", minCount: 1 },
  ],
  [
    { hand: "three_of_a_kind", minCount: 3 },
    { hand: "straight", minCount: 1 },
    { hand: "flush", minCount: 1 },
    { hand: "full_house", minCount: 1 },
    { hand: "four_of_a_kind", minCount: 1 },
  ],
  [
    { hand: "three_of_a_kind", minCount: 2 },
    { hand: "straight", minCount: 1 },
    { hand: "flush", minCount: 1 },
    { hand: "full_house", minCount: 1 },
    { hand: "four_of_a_kind", minCount: 2 },
  ],
];

function mergeChallenge(list: HandChallenge[], hand: HandLabel, add: number): void {
  if (add <= 0) return;
  const existing = list.find((c) => c.hand === hand);
  if (existing) existing.minCount += add;
  else list.push({ hand, minCount: add });
}

function cloneChallenges(challenges: HandChallenge[]): HandChallenge[] {
  return challenges.map((c) => ({ ...c }));
}

function sortChallengesByHand(challenges: HandChallenge[]): HandChallenge[] {
  return [...challenges].sort(
    (a, b) => HAND_LADDER.indexOf(a.hand) - HAND_LADDER.indexOf(b.hand)
  );
}

/**
 * Later worlds repeat the same stage shape with higher counts and premium hands.
 * Every world's first stage stays at exactly 3× Pair.
 */
function scaleChallengesForWorld(challenges: HandChallenge[], world: number, step: number): HandChallenge[] {
  if (world <= 1) return cloneChallenges(challenges);

  const bump = world - 1;
  const scaled = cloneChallenges(challenges).map((c) => ({
    hand: c.hand,
    minCount: c.minCount + bump,
  }));

  if (step >= 5) {
    mergeChallenge(scaled, "straight_flush", Math.max(1, Math.ceil(bump / 2)));
  }
  if (step >= 7 && world >= 3) {
    mergeChallenge(scaled, "four_of_a_kind", 1);
  }
  if (step >= 8 && world >= 4) {
    mergeChallenge(scaled, "straight_flush", bump);
  }
  if (step >= 9 && world >= 5) {
    mergeChallenge(scaled, "royal_flush", Math.max(1, Math.floor(bump / 2)));
  }
  if (step >= 10 && world >= 6) {
    mergeChallenge(scaled, "royal_flush", 1);
    mergeChallenge(scaled, "straight_flush", 1);
  }

  return sortChallengesByHand(scaled);
}

function worldForLevel(level: number): number {
  return Math.min(CAMPAIGN_TIERS.length, Math.ceil(level / 10));
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

/** Minimum points the challenge hands must contribute (base scores, no combos). */
export function challengePointsFloor(challenges: HandChallenge[]): number {
  return challenges.reduce((sum, c) => sum + HAND_SCORES[c.hand] * c.minCount, 0);
}

export function challengeHandCount(challenges: HandChallenge[]): number {
  return challenges.reduce((sum, c) => sum + c.minCount, 0);
}

export function challengeMetrics(challenges: HandChallenge[]): {
  challengePoints: number;
  challengeHands: number;
} {
  return {
    challengePoints: challengePointsFloor(challenges),
    challengeHands: challengeHandCount(challenges),
  };
}

/** Move budgets tied to required hands — not point target ÷ 300. */
export function starMoveLimitsForChallenges(challenges: HandChallenge[]): {
  one: number;
  two: number;
  three: number;
} {
  const hands = Math.max(1, challengeHandCount(challenges));
  let three = Math.ceil(hands * (1 + STAR_HAND_BUFFER.threeStar));
  let two = Math.ceil(hands * (1 + STAR_HAND_BUFFER.twoStar));
  let one = Math.ceil(hands * (1 + STAR_HAND_BUFFER.oneStar));
  two = Math.max(two, three + 1);
  one = Math.max(one, two + 2);
  return { one, two, three };
}

export function starMoveLimit(stars: 1 | 2 | 3, challenges: HandChallenge[]): number {
  const limits = starMoveLimitsForChallenges(challenges);
  return stars === 3 ? limits.three : stars === 2 ? limits.two : limits.one;
}

/** Theoretical minimum moves to reach the point target at ~300 pts/move. */
export function baseMovesForTarget(targetPoints: number): number {
  return Math.max(1, Math.ceil(targetPoints / AVG_PTS_PER_MOVE));
}

/**
 * Estimate swipes — minimum challenge hands plus a small filler allowance.
 */
export function computeEstimatedMoves(
  _targetPoints: number,
  challenges: HandChallenge[] = []
): number {
  const { challengeHands } = challengeMetrics(challenges);
  return Math.ceil(challengeHands * 1.2);
}

/** Max hands before game over — 1★ budget from challenge hand count. */
export function computeMoveLimit(
  _targetPoints: number,
  challenges: HandChallenge[] = [],
  _level: number = 1
): number {
  return starMoveLimitsForChallenges(challenges).one;
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

/** Progressive hand requirements per stage; worlds 2+ scale counts and add premium hands. */
function challengesForLevel(level: number): HandChallenge[] {
  const world = worldForLevel(level);
  const step = stepInTier(level);

  if (step === 1) {
    return [{ hand: "pair", minCount: 3 }];
  }

  const template = STAGE_CHALLENGE_TEMPLATE[step - 1] ?? STAGE_CHALLENGE_TEMPLATE[9]!;
  return scaleChallengesForWorld(template, world, step);
}

function targetPointsForLevel(challenges: HandChallenge[]): number {
  const { challengePoints } = challengeMetrics(challenges);
  return Math.max(200, Math.round(challengePoints * TARGET_POINT_RATIO));
}

function buildLevelConfig(level: number): LevelConfig {
  const challenges = challengesForLevel(level);
  const { challengePoints, challengeHands } = challengeMetrics(challenges);
  const starMoveLimits = starMoveLimitsForChallenges(challenges);
  const targetPoints = targetPointsForLevel(challenges);
  return {
    level,
    tier: tierForLevel(level),
    label: labelForLevel(level),
    targetPoints,
    challenges,
    challengePoints,
    challengeHands,
    starMoveLimits,
    estimatedMoves: computeEstimatedMoves(targetPoints, challenges),
    moveLimit: starMoveLimits.one,
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
 * 1★ reach target within 1★ move budget · 2★ within 2★ budget · 3★ within 3★ budget and all challenges
 */
export function computeLevelStars(
  levelScore: number,
  handCounts: HandCounts,
  handsUsed: number,
  cfg: LevelConfig
): number {
  if (!levelPointsMet(levelScore, cfg)) return 0;

  const challengesDone = challengesMet(handCounts, cfg.challenges);
  const { three, two } = cfg.starMoveLimits;

  if (handsUsed <= three && challengesDone) return 3;
  if (handsUsed <= two) return 2;
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
