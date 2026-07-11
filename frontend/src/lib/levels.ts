import {
  HAND_DISPLAY,
  HAND_SCORES,
  RANKS,
  RANK_VALUES,
  ranksForStraightHigh,
  STRAIGHT_HIGH_RANKS,
  SUITS,
  type FullHandResult,
  type HandLabel,
  type Rank,
  type Suit,
} from "./pokerHands";
import {
  blockersForLevel,
  fixedObstaclesForLevel,
  type BlockerSpawnConfig,
  type FixedObstacle,
} from "./blockers";

export interface HandChallenge {
  hand: HandLabel;
  minCount: number;
  /**
   * Specific ranks when required (level 100+):
   * pair / trips / quads → one rank
   * two_pair → two ranks
   * full_house → [trips, pair]
   * straight / straight_flush → five ranks in order
   */
  ranks?: Rank[];
  /** Specific suit for flush / straight flush. */
  suit?: Suit;
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
  /** Glass / crate overlays from level 31+. */
  blockers: BlockerSpawnConfig | null;
  /** Permanent pillars from level 101+ — cannot be moved or destroyed. */
  fixedObstacles: FixedObstacle[];
}

/** Level progress keys may be hand labels or specific challenge keys (e.g. pair:A). */
export type HandCounts = Partial<Record<string, number>>;

export const MAX_LEVEL = 500;
/** From this level, milestone hands require exact ranks / suits. */
export const SPECIFIC_CHALLENGE_FROM_LEVEL = 100;

/** Typical points earned per hand/swipe (used for move budgets). */
export const AVG_PTS_PER_MOVE = 360;

/** World N starts at N×1000 pts; ~9% growth per stage within a world. */
const WORLD_BASE_POINTS = 1000;
const STAGE_TARGET_GROWTH = 1.09;
/** Applied after world × stage scale. */
const TARGET_POINT_BOOST = 1.3;

/**
 * Each world introduces one new hand type for milestone goals.
 * World 1 = Pair + Two Pair only; world 2 adds Three of a Kind; and so on.
 */
const WORLD_INTRO_HAND: HandLabel[] = [
  "two_pair",
  "three_of_a_kind",
  "straight",
  "flush",
  "full_house",
  "four_of_a_kind",
  "straight_flush",
  "royal_flush",
  "royal_flush",
  "royal_flush",
];

/** Move budget multipliers on target ÷ avg pts: 3★ +20%, 2★ +70%, 1★ +120%. */
export const STAR_MOVE_MULTIPLIER = {
  threeStar: 1.2,
  twoStar: 1.7,
  oneStar: 2.2,
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

function sortChallengesByHand(challenges: HandChallenge[]): HandChallenge[] {
  return [...challenges].sort(
    (a, b) => HAND_LADDER.indexOf(a.hand) - HAND_LADDER.indexOf(b.hand)
  );
}

function seededRng(level: number, salt = 0): () => number {
  let state = (level * 9301 + salt * 49297 + 233280) | 0;
  return () => {
    state = (state * 1103515245 + 12345) | 0;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function pickRank(rng: () => number, exclude: Rank[] = []): Rank {
  const pool = RANKS.filter((r) => !exclude.includes(r));
  return pool[Math.floor(rng() * pool.length)]!;
}

function pickSuit(rng: () => number): Suit {
  return SUITS[Math.floor(rng() * SUITS.length)]!;
}

/** Attach seeded rank/suit targets so each level 100+ run has unique goals. */
function specifyChallenge(c: HandChallenge, rng: () => number): HandChallenge {
  if (c.hand === "royal_flush") return { ...c };

  if (c.hand === "pair" || c.hand === "three_of_a_kind" || c.hand === "four_of_a_kind") {
    return { ...c, ranks: [pickRank(rng)] };
  }
  if (c.hand === "two_pair") {
    const a = pickRank(rng);
    const b = pickRank(rng, [a]);
    const ranks = [a, b].sort((x, y) => RANK_VALUES[y] - RANK_VALUES[x]);
    return { ...c, ranks };
  }
  if (c.hand === "full_house") {
    const trips = pickRank(rng);
    const pair = pickRank(rng, [trips]);
    return { ...c, ranks: [trips, pair] };
  }
  if (c.hand === "straight" || c.hand === "straight_flush") {
    const high = STRAIGHT_HIGH_RANKS[Math.floor(rng() * STRAIGHT_HIGH_RANKS.length)]!;
    const ranks = ranksForStraightHigh(high);
    if (c.hand === "straight_flush") {
      return { ...c, ranks, suit: pickSuit(rng) };
    }
    return { ...c, ranks };
  }
  if (c.hand === "flush") {
    return { ...c, suit: pickSuit(rng) };
  }
  return { ...c };
}

function specifyChallenges(challenges: HandChallenge[], level: number): HandChallenge[] {
  if (level < SPECIFIC_CHALLENGE_FROM_LEVEL) return challenges;
  const rng = seededRng(level, 41);
  return challenges.map((c) => specifyChallenge(c, rng));
}

/** Light milestone hands — points target is the main goal; scales up in later worlds. */
function challengesForLevel(level: number): HandChallenge[] {
  const world = worldForLevel(level);
  const step = stepInTier(level);
  const introHand = WORLD_INTRO_HAND[Math.min(world - 1, WORLD_INTRO_HAND.length - 1)] ?? "royal_flush";
  const bump = world > 10 ? Math.floor((world - 10) / 4) : 0;

  let base: HandChallenge[];

  if (step === 1) {
    base = [{ hand: "pair", minCount: 2 + Math.min(bump, 2) }];
  } else if (world === 1) {
    if (step <= 5) {
      base = [{ hand: "pair", minCount: (step <= 3 ? 2 : 3) + Math.min(bump, 1) }];
    } else if (step <= 7) {
      base = [{ hand: "two_pair", minCount: 1 + Math.min(bump, 1) }];
    } else {
      base = sortChallengesByHand([
        { hand: "pair", minCount: 2 + Math.min(bump, 1) },
        { hand: "two_pair", minCount: 1 + Math.min(bump, 1) },
      ]);
    }
  } else {
    const prevHand =
      HAND_LADDER.indexOf(introHand) > 0
        ? HAND_LADDER[HAND_LADDER.indexOf(introHand) - 1]!
        : "pair";

    if (step <= 5) {
      base = [{ hand: introHand, minCount: 1 + Math.min(bump, 2) }];
    } else if (step <= 8) {
      base = sortChallengesByHand([
        { hand: "pair", minCount: 2 + Math.min(bump, 1) },
        { hand: introHand, minCount: 1 + Math.min(bump, 1) },
      ]);
    } else {
      base = sortChallengesByHand([
        { hand: prevHand, minCount: 1 + Math.min(bump, 1) },
        { hand: introHand, minCount: 2 + Math.min(bump, 2) },
      ]);
    }
  }

  return specifyChallenges(base, level);
}

function worldForLevel(level: number): number {
  return Math.ceil(level / 10);
}

function tierForLevel(level: number): string {
  const world = worldForLevel(level);
  const base = CAMPAIGN_TIERS[(world - 1) % CAMPAIGN_TIERS.length] ?? "Elite";
  const cycle = Math.floor((world - 1) / CAMPAIGN_TIERS.length);
  if (cycle === 0) return base;
  return `${base} ${cycle + 1}`;
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

/** Move budgets tied to the point target (~360 pts per move). */
export function movesBudgetForStars(stars: 1 | 2 | 3, targetPoints: number): number {
  const mult =
    stars === 3
      ? STAR_MOVE_MULTIPLIER.threeStar
      : stars === 2
        ? STAR_MOVE_MULTIPLIER.twoStar
        : STAR_MOVE_MULTIPLIER.oneStar;
  return Math.ceil((targetPoints / AVG_PTS_PER_MOVE) * mult);
}

export function starMoveLimitsForTarget(
  targetPoints: number,
  challengeHands = 0
): {
  one: number;
  two: number;
  three: number;
} {
  const three = Math.max(
    challengeHands + 1,
    movesBudgetForStars(3, targetPoints)
  );
  const two = Math.max(three + 1, movesBudgetForStars(2, targetPoints));
  const one = Math.max(two + 1, movesBudgetForStars(1, targetPoints));
  return { three, two, one };
}

export function starMoveLimit(stars: 1 | 2 | 3, targetPoints: number): number {
  return movesBudgetForStars(stars, targetPoints);
}

/** Theoretical minimum moves to reach the point target at ~360 pts/move. */
export function baseMovesForTarget(targetPoints: number): number {
  return Math.max(1, Math.ceil(targetPoints / AVG_PTS_PER_MOVE));
}

/**
 * Estimate swipes to reach the point target (~360 pts per move).
 */
export function computeEstimatedMoves(
  targetPoints: number,
  _challenges: HandChallenge[] = []
): number {
  return baseMovesForTarget(targetPoints);
}

/** Max hands before game over — 1★ budget (+120% on base). */
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
  return challenges.every((c) => (handCounts[challengeKey(c)] ?? 0) >= c.minCount);
}

export function isChallengeSpecific(c: HandChallenge): boolean {
  return (c.ranks != null && c.ranks.length > 0) || c.suit != null;
}

/** Stable progress key — hand label for generic goals, detailed key for specific ones. */
export function challengeKey(c: HandChallenge): string {
  if (!isChallengeSpecific(c)) return c.hand;
  const parts = [c.hand];
  if (c.ranks?.length) parts.push(c.ranks.join("-"));
  if (c.suit) parts.push(c.suit);
  return parts.join(":");
}

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

function compactRank(rank: Rank): string {
  return rank === "10" ? "T" : rank;
}

function formatRankCluster(rank: Rank, count: number): string {
  return compactRank(rank).repeat(count);
}

export function formatChallengeLabel(c: HandChallenge): string {
  if (!isChallengeSpecific(c)) return HAND_DISPLAY[c.hand];

  if (c.hand === "pair" && c.ranks?.[0]) {
    return `Pair of ${c.ranks[0]}'s`;
  }
  if (c.hand === "three_of_a_kind" && c.ranks?.[0]) {
    return formatRankCluster(c.ranks[0], 3);
  }
  if (c.hand === "four_of_a_kind" && c.ranks?.[0]) {
    return formatRankCluster(c.ranks[0], 4);
  }
  if (c.hand === "two_pair" && c.ranks && c.ranks.length >= 2) {
    return `${formatRankCluster(c.ranks[0]!, 2)}+${formatRankCluster(c.ranks[1]!, 2)}`;
  }
  if (c.hand === "full_house" && c.ranks && c.ranks.length >= 2) {
    return `${formatRankCluster(c.ranks[0]!, 3)}${formatRankCluster(c.ranks[1]!, 2)}`;
  }
  if ((c.hand === "straight" || c.hand === "straight_flush") && c.ranks?.length === 5) {
    const seq = c.ranks.map(compactRank).join("");
    if (c.hand === "straight_flush" && c.suit) {
      return `${SUIT_SYMBOL[c.suit]} ${seq}`;
    }
    return seq;
  }
  if (c.hand === "flush" && c.suit) {
    return `${SUIT_SYMBOL[c.suit]} Flush`;
  }
  return HAND_DISPLAY[c.hand];
}

export function formatChallenge(c: HandChallenge): string {
  const name = formatChallengeLabel(c);
  return c.minCount === 1 ? `1× ${name}` : `${c.minCount}× ${name}`;
}

export function handMatchesChallenge(result: FullHandResult, c: HandChallenge): boolean {
  if (result.hand !== c.hand) return false;
  if (!isChallengeSpecific(c)) return true;

  if (c.hand === "pair" || c.hand === "three_of_a_kind" || c.hand === "four_of_a_kind") {
    return result.keyRanks[0] === c.ranks?.[0];
  }
  if (c.hand === "two_pair") {
    if (!c.ranks || c.ranks.length < 2 || result.keyRanks.length < 2) return false;
    const need = new Set(c.ranks.slice(0, 2));
    return result.keyRanks.slice(0, 2).every((r) => need.has(r)) && need.size === 2;
  }
  if (c.hand === "full_house") {
    return result.keyRanks[0] === c.ranks?.[0] && result.keyRanks[1] === c.ranks?.[1];
  }
  if (c.hand === "straight") {
    if (!c.ranks || c.ranks.length !== 5 || result.keyRanks.length !== 5) return false;
    return c.ranks.every((r, i) => result.keyRanks[i] === r);
  }
  if (c.hand === "straight_flush") {
    if (!c.ranks || c.ranks.length !== 5 || result.keyRanks.length !== 5) return false;
    if (c.suit && result.flushSuit !== c.suit) return false;
    return c.ranks.every((r, i) => result.keyRanks[i] === r);
  }
  if (c.hand === "flush") {
    return c.suit != null && result.flushSuit === c.suit;
  }
  return true;
}

/** Apply a scored hand to level challenge progress (and generic hand tally). */
export function applyHandToChallengeCounts(
  counts: HandCounts,
  challenges: HandChallenge[],
  result: FullHandResult
): HandCounts {
  const next: HandCounts = {
    ...counts,
    [result.hand]: (counts[result.hand] ?? 0) + 1,
  };

  for (const c of challenges) {
    if (!handMatchesChallenge(result, c)) continue;
    const key = challengeKey(c);
    if (key === result.hand) continue; // already counted above for generic goals
    next[key] = (next[key] ?? 0) + 1;
  }

  return next;
}

export function challengeProgress(counts: HandCounts, c: HandChallenge): number {
  return counts[challengeKey(c)] ?? 0;
}

function targetPointsForLevel(level: number): number {
  const world = worldForLevel(level);
  const stage = stepInTier(level);
  const worldStart = world * WORLD_BASE_POINTS;
  const scaled = Math.round(worldStart * STAGE_TARGET_GROWTH ** (stage - 1));
  let pts = Math.round(scaled * TARGET_POINT_BOOST);
  if (level > 50) {
    pts = Math.round(pts * (1 + (level - 50) * 0.003));
  }
  return pts;
}

function buildLevelConfig(level: number): LevelConfig {
  const challenges = challengesForLevel(level);
  const { challengePoints, challengeHands } = challengeMetrics(challenges);
  const targetPoints = targetPointsForLevel(level);
  const starMoveLimits = starMoveLimitsForTarget(targetPoints, challengeHands);
  const fixedObstacles = fixedObstaclesForLevel(level);
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
    fixedObstacles,
  };
}

const LEVEL_CONFIGS: LevelConfig[] = Array.from({ length: MAX_LEVEL }, (_, i) =>
  buildLevelConfig(i + 1)
);

export function getLevelConfig(level: number): LevelConfig {
  const n = Math.min(Math.max(1, Math.floor(level)), MAX_LEVEL);
  return LEVEL_CONFIGS[n - 1]!;
}

const CHALLENGE_HANDS = new Set<HandLabel>([
  "pair",
  "two_pair",
  "three_of_a_kind",
  "straight",
  "flush",
  "four_of_a_kind",
  "straight_flush",
  "royal_flush",
]);

export interface ChallengeMissionPayload {
  goals: Array<{
    hand: string;
    minCount: number;
    ranks?: string[];
    suit?: string;
  }>;
  target_points: number;
  star_move_limits: { one: number; two: number; three: number };
  move_limit: number;
  challenge_points?: number;
  challenge_hands?: number;
}

/** Shared-board duel config from API mission (no campaign blockers). */
export function buildChallengeMissionConfig(
  mission: ChallengeMissionPayload,
  displayLevel = 1
): LevelConfig {
  const challenges: HandChallenge[] = [];
  for (const g of mission.goals ?? []) {
    if (!CHALLENGE_HANDS.has(g.hand as HandLabel)) continue;
    const goal: HandChallenge = {
      hand: g.hand as HandLabel,
      minCount: Math.max(1, Math.floor(Number(g.minCount) || 1)),
    };
    if (Array.isArray(g.ranks) && g.ranks.length > 0) {
      goal.ranks = g.ranks.filter((r): r is Rank =>
        (RANKS as readonly string[]).includes(r)
      );
      if (goal.ranks.length === 0) delete goal.ranks;
    }
    if (g.suit && (SUITS as readonly string[]).includes(g.suit)) {
      goal.suit = g.suit as Suit;
    }
    challenges.push(goal);
  }

  const challengePoints =
    mission.challenge_points ??
    challenges.reduce((sum, c) => sum + HAND_SCORES[c.hand] * c.minCount, 0);
  const challengeHands =
    mission.challenge_hands ?? challenges.reduce((sum, c) => sum + c.minCount, 0);
  const starMoveLimits = {
    one: Math.max(1, mission.star_move_limits?.one ?? mission.move_limit ?? 16),
    two: Math.max(1, mission.star_move_limits?.two ?? 12),
    three: Math.max(1, mission.star_move_limits?.three ?? 8),
  };
  const targetPoints = Math.max(100, Math.floor(Number(mission.target_points) || 600));

  return {
    level: Math.max(1, displayLevel),
    tier: "Challenge",
    label: "Shared board duel",
    targetPoints,
    challenges,
    challengePoints,
    challengeHands,
    starMoveLimits,
    estimatedMoves: starMoveLimits.three,
    moveLimit: Math.max(starMoveLimits.one, mission.move_limit ?? starMoveLimits.one),
    blockers: null,
    fixedObstacles: [],
  };
}

export function levelPointsMet(levelScore: number, cfg: LevelConfig): boolean {
  return levelScore >= cfg.targetPoints;
}

/**
 * Star rating for a cleared level:
 * Hit the point target + milestone hands; move budget sets 1★ / 2★ / 3★.
 */
export function computeLevelStars(
  levelScore: number,
  handCounts: HandCounts,
  handsUsed: number,
  cfg: LevelConfig
): number {
  if (!levelPointsMet(levelScore, cfg)) return 0;
  if (!challengesMet(handCounts, cfg.challenges)) return 0;

  const { three, two } = cfg.starMoveLimits;

  if (handsUsed <= three) return 3;
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

/** Leaderboard total from saved progress — avoids phantom points from a stale level field. */
export function campaignLeaderboardPointsFromProgress(saved: {
  completedLevels: number[];
  levelScore: number;
}): number {
  let pts = saved.levelScore;
  for (const lvl of saved.completedLevels) {
    pts += getLevelConfig(lvl).targetPoints;
  }
  return pts;
}
