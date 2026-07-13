/**
 * Score-race missions for Quick Play / Tournament.
 * Mirrors backend/app/challenge_mission.py generate_score_race_mission.
 */
import type { HandLabel, Rank, Suit } from "./pokerHands";
import { HAND_SCORES } from "./pokerHands";
import type { ChallengeMissionPayload, HandChallenge, LevelConfig } from "./levels";
import { RANKS, SUITS } from "./pokerHands";

export const SCORE_RACE_HAND_LIMIT = 20;
export const SCORE_RACE_GOAL_BONUS_PCT = 5;

const HAND_POOL: [HandLabel, number][] = [
  ["pair", 28],
  ["two_pair", 22],
  ["three_of_a_kind", 16],
  ["straight", 12],
  ["flush", 10],
  ["four_of_a_kind", 6],
  ["straight_flush", 4],
  ["royal_flush", 2],
];

const STRAIGHT_HIGH_RANKS = ["5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
const STRAIGHT_FLUSH_HIGH_RANKS = ["5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

/** Mulberry32 — deterministic from seed (matches Python Random well enough for goals). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

class SeedRng {
  private next: () => number;
  constructor(seed: number) {
    this.next = mulberry32(seed);
  }
  random(): number {
    return this.next();
  }
  randint(a: number, b: number): number {
    return a + Math.floor(this.random() * (b - a + 1));
  }
  choice<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.random() * arr.length)]!;
  }
}

function pickWeighted(rng: SeedRng, exclude: Set<string>): HandLabel {
  const pool = HAND_POOL.filter(([h]) => !exclude.has(h));
  const use = pool.length ? pool : HAND_POOL;
  const total = use.reduce((s, [, w]) => s + w, 0);
  let roll = rng.random() * total;
  for (const [hand, weight] of use) {
    roll -= weight;
    if (roll <= 0) return hand;
  }
  return use[use.length - 1]![0];
}

function pickRank(rng: SeedRng, exclude: Set<string> = new Set()): Rank {
  const choices = RANKS.filter((r) => !exclude.has(r));
  return (choices.length ? rng.choice(choices) : rng.choice(RANKS)) as Rank;
}

function ranksForStraightHigh(high: string): Rank[] {
  if (high === "5") return ["A", "2", "3", "4", "5"];
  const idx = RANKS.indexOf(high as Rank);
  return RANKS.slice(idx - 4, idx + 1) as Rank[];
}

function specify(hand: HandLabel, minCount: number, rng: SeedRng): HandChallenge {
  const goal: HandChallenge = { hand, minCount };
  const specific = rng.random() < 0.7;
  if (hand === "royal_flush" || !specific) return goal;

  if (hand === "pair" || hand === "three_of_a_kind" || hand === "four_of_a_kind") {
    goal.ranks = [pickRank(rng)];
  } else if (hand === "two_pair") {
    const a = pickRank(rng);
    const b = pickRank(rng, new Set([a]));
    goal.ranks = [a, b];
  } else if (hand === "straight") {
    goal.ranks = ranksForStraightHigh(rng.choice(STRAIGHT_HIGH_RANKS));
  } else if (hand === "flush") {
    goal.suit = rng.choice(SUITS) as Suit;
  } else if (hand === "straight_flush") {
    goal.ranks = ranksForStraightHigh(rng.choice(STRAIGHT_FLUSH_HIGH_RANKS));
    goal.suit = rng.choice(SUITS) as Suit;
  }
  return goal;
}

/** Build a score-race mission payload from a board seed. */
export function generateScoreRaceMission(seed: number): ChallengeMissionPayload {
  const rng = new SeedRng(seed >>> 0 || 1);
  const goalCount = rng.randint(3, 5);
  const goals: HandChallenge[] = [];
  const used = new Set<string>();
  for (let i = 0; i < goalCount; i++) {
    const hand = pickWeighted(rng, used);
    used.add(hand);
    const minCount =
      (hand === "pair" || hand === "two_pair") && rng.random() < 0.4 ? 2 : 1;
    goals.push(specify(hand, minCount, rng));
  }

  const challengePoints = goals.reduce((s, g) => s + HAND_SCORES[g.hand] * g.minCount, 0);
  const challengeHands = goals.reduce((s, g) => s + g.minCount, 0);
  const targetPoints = Math.max(500, challengePoints + rng.randint(300, 700));

  return {
    mode: "score_race",
    goals: goals.map((g) => ({
      hand: g.hand,
      minCount: g.minCount,
      ranks: g.ranks,
      suit: g.suit,
    })),
    target_points: targetPoints,
    star_move_limits: {
      one: SCORE_RACE_HAND_LIMIT,
      two: SCORE_RACE_HAND_LIMIT,
      three: SCORE_RACE_HAND_LIMIT,
    },
    move_limit: SCORE_RACE_HAND_LIMIT,
    hand_limit: SCORE_RACE_HAND_LIMIT,
    goal_bonus_pct: SCORE_RACE_GOAL_BONUS_PCT,
    challenge_points: challengePoints,
    challenge_hands: challengeHands,
  };
}

export function isScoreRaceMission(
  mission: ChallengeMissionPayload | null | undefined
): boolean {
  return mission?.mode === "score_race" || mission?.hand_limit === SCORE_RACE_HAND_LIMIT;
}

export function applyGoalScoreBonus(score: number, bonusPct = SCORE_RACE_GOAL_BONUS_PCT): number {
  return Math.floor(score * (1 + bonusPct / 100));
}

export function scoreRaceLevelConfig(
  mission: ChallengeMissionPayload,
  opts: { tier?: string; label?: string; level?: number } = {}
): LevelConfig {
  const challenges: HandChallenge[] = [];
  for (const g of mission.goals ?? []) {
    if (!(g.hand in HAND_SCORES)) continue;
    const goal: HandChallenge = {
      hand: g.hand as HandLabel,
      minCount: Math.max(1, Math.floor(Number(g.minCount) || 1)),
    };
    if (Array.isArray(g.ranks) && g.ranks.length > 0) {
      goal.ranks = g.ranks.filter((r): r is Rank => (RANKS as readonly string[]).includes(r));
      if (!goal.ranks.length) delete goal.ranks;
    }
    if (g.suit && (SUITS as readonly string[]).includes(g.suit)) {
      goal.suit = g.suit as Suit;
    }
    challenges.push(goal);
  }
  const challengePoints =
    mission.challenge_points ??
    challenges.reduce((s, c) => s + HAND_SCORES[c.hand] * c.minCount, 0);
  const challengeHands =
    mission.challenge_hands ?? challenges.reduce((s, c) => s + c.minCount, 0);
  const handLimit = mission.hand_limit ?? mission.move_limit ?? SCORE_RACE_HAND_LIMIT;

  return {
    level: opts.level ?? 1,
    tier: opts.tier ?? "Race",
    label: opts.label ?? "Score race",
    targetPoints: Math.max(1, Math.floor(Number(mission.target_points) || 1)),
    challenges,
    challengePoints,
    challengeHands,
    starMoveLimits: { one: handLimit, two: handLimit, three: handLimit },
    estimatedMoves: handLimit,
    moveLimit: handLimit,
    blockers: null,
    fixedObstacles: [],
  };
}
