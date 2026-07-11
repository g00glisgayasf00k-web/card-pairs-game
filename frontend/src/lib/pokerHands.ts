/**
 * Special power cards — earned as rewards for clearing big hands:
 *   arrow_h  ↔  TAP — clears the entire row
 *   arrow_v  ↕  TAP — clears the entire column
 *   bomb     💣  TAP — clears all 8 surrounding cards (Four of a Kind)
 *   joker    🃏  SWIPE — wild card, substitutes any rank/suit in a hand
 *   rainbow      DRAG onto a suit — clears every card of that suit (Royal Flush only)
 */
import type { Rng } from "./seededRng";
import { mulberry32, pickIndex } from "./seededRng";

export type SpecialType = "arrow_h" | "arrow_v" | "bomb" | "joker" | "rainbow";

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "J" | "Q" | "K" | "A";

export interface Card {
  rank: Rank;
  suit: Suit;
  special?: SpecialType;
}

export type HandLabel =
  | "pair" | "two_pair" | "three_of_a_kind" | "straight" | "flush"
  | "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush";

export const HAND_SCORES: Record<HandLabel, number> = {
  pair: 50,
  two_pair: 150,
  three_of_a_kind: 200,
  straight: 300,
  flush: 400,
  full_house: 600,
  four_of_a_kind: 900,
  straight_flush: 1500,
  royal_flush: 2500,
};

export const HAND_DISPLAY: Record<HandLabel, string> = {
  pair: "Pair",
  two_pair: "Two Pair",
  three_of_a_kind: "Three of a Kind",
  straight: "Straight",
  flush: "Flush",
  full_house: "Full House",
  four_of_a_kind: "Four of a Kind",
  straight_flush: "Straight Flush",
  royal_flush: "Royal Flush",
};

/** All hands sorted low → high, for score reference UI */
export const HAND_SCORE_LIST: { hand: HandLabel; points: number }[] = (
  Object.keys(HAND_SCORES) as HandLabel[]
)
  .map((hand) => ({ hand, points: HAND_SCORES[hand] }))
  .sort((a, b) => a.points - b.points);

export const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

export const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14,
};

const VALUE_TO_RANK: Record<number, Rank> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K", 14: "A",
};

/** Straight high cards (5 = wheel A-2-3-4-5, A = broadway 10-J-Q-K-A). */
export const STRAIGHT_HIGH_RANKS: Rank[] = ["5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

/** Five ranks for a straight ending at `high` (wheel when high is 5). */
export function ranksForStraightHigh(high: Rank): Rank[] {
  if (high === "5") return ["A", "2", "3", "4", "5"];
  const hv = RANK_VALUES[high];
  return [hv - 4, hv - 3, hv - 2, hv - 1, hv].map((v) => VALUE_TO_RANK[v]!);
}

export function rankFromValue(value: number): Rank | undefined {
  return VALUE_TO_RANK[value];
}

const ROYAL = new Set([10, 11, 12, 13, 14]);

const ALL_CARDS: { rank: Rank; suit: Suit }[] = RANKS.flatMap((rank) =>
  SUITS.map((suit) => ({ rank, suit }))
);

// ── Card generation ───────────────────────────────────────────────────────────

export function randomCard(rng?: Rng): Card {
  const roll = rng ?? Math.random;
  return {
    rank: RANKS[pickIndex(roll, RANKS.length)]!,
    suit: SUITS[pickIndex(roll, SUITS.length)]!,
  };
}

export function createBoard(rows: number, cols: number, rng?: Rng): (Card | null)[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randomCard(rng))
  );
}

/** Shared challenge boards — same seed ⇒ same opening layout. */
export function createBoardFromSeed(
  rows: number,
  cols: number,
  seed: number
): (Card | null)[][] {
  return createBoard(rows, cols, mulberry32(seed >>> 0));
}

// ── Specials earned as hand rewards ──────────────────────────────────────────

function randomArrow(): "arrow_h" | "arrow_v" {
  return Math.random() < 0.5 ? "arrow_h" : "arrow_v";
}

export function isTappableSpecial(type?: SpecialType): boolean {
  return type === "bomb" || type === "arrow_h" || type === "arrow_v";
}

export function isSwipeOnlySpecial(type?: SpecialType): boolean {
  return type === "joker" || type === "rainbow";
}

/** Returns the special cards injected into the board after clearing the given hand. */
export function specialsEarnedForHand(hand: HandLabel): SpecialType[] {
  switch (hand) {
    case "three_of_a_kind":
      return [randomArrow()];
    case "straight":
      return [randomArrow()];
    case "four_of_a_kind":
      return ["bomb"];
    case "flush":
      return ["joker"];
    case "full_house":
      return [randomArrow(), "joker"];
    case "straight_flush":
      return ["joker", "bomb"];
    case "royal_flush":
      return ["rainbow"];
    default:
      return [];
  }
}

const SPECIAL_REWARD_NAME: Record<SpecialType, string> = {
  arrow_h: "Row Arrow",
  arrow_v: "Column Arrow",
  bomb: "Bomb",
  joker: "Joker",
  rainbow: "Rainbow",
};

/** Toast suffix when a hand spawns power-ups, e.g. " · Row Arrow earned!" */
export function formatEarnedSpecials(types: SpecialType[]): string {
  if (types.length === 0) return "";
  const names = types.map((t) => SPECIAL_REWARD_NAME[t]);
  return ` · ${names.join(" + ")} earned!`;
}

/** UI copy for the power-ups guide modal */
export const SPECIALS_GUIDE: {
  type: SpecialType;
  name: string;
  earn: string;
  effect: string;
}[] = [
  {
    type: "arrow_h",
    name: "Row arrow ↔",
    earn: "Clear Three of a Kind, Straight, or Full House",
    effect: "Tap to wipe out the entire row (+45 pts per card)",
  },
  {
    type: "arrow_v",
    name: "Column arrow ↕",
    earn: "Clear Three of a Kind, Straight, or Full House",
    effect: "Tap to wipe out the entire column (+45 pts per card)",
  },
  {
    type: "bomb",
    name: "Bomb",
    earn: "Clear Four of a Kind or Straight Flush",
    effect: "Tap to blast all 8 surrounding cards (+50 pts each)",
  },
  {
    type: "joker",
    name: "Joker",
    earn: "Clear Flush, Full House, or Straight Flush",
    effect: "Swipe into a 5-card hand — counts as any rank or suit",
  },
  {
    type: "rainbow",
    name: "Rainbow suit",
    earn: "Clear a Royal Flush only",
    effect: "Drag onto any card to clear every card of that suit (+55 pts each)",
  },
];

export const SPECIALS_EARN_BY_HAND: { hand: HandLabel; types: SpecialType[] }[] = [
  { hand: "three_of_a_kind", types: ["arrow_h", "arrow_v"] },
  { hand: "straight", types: ["arrow_h", "arrow_v"] },
  { hand: "four_of_a_kind", types: ["bomb"] },
  { hand: "flush", types: ["joker"] },
  { hand: "full_house", types: ["arrow_h", "arrow_v", "joker"] },
  { hand: "straight_flush", types: ["joker", "bomb"] },
  { hand: "royal_flush", types: ["rainbow"] },
];

// ── Plain evaluator (rank/suit only, ignores special field) ──────────────────

function rankCounts(cards: { rank: Rank }[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of cards) {
    const v = RANK_VALUES[c.rank];
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return m;
}

export const HAND_CARD_COUNT: Record<HandLabel, number> = {
  pair: 5,
  two_pair: 5,
  three_of_a_kind: 5,
  straight: 5,
  flush: 5,
  full_house: 5,
  four_of_a_kind: 5,
  straight_flush: 5,
  royal_flush: 5,
};

/** Every poker hand is built from exactly five cards. */
export const POKER_HAND_SIZE = 5;

function isFlush5(cards: { suit: Suit }[]): boolean {
  return cards.length === 5 && new Set(cards.map((c) => c.suit)).size === 1;
}

function straightValues(values: number[]): boolean {
  if (values.length !== 5) return false;
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length !== 5) return false;
  if (unique.join() === "2,3,4,5,14") return true;
  return unique[4]! - unique[0]! === 4;
}

function isStraight(cards: { rank: Rank }[]): boolean {
  return cards.length === 5 && straightValues(cards.map((c) => RANK_VALUES[c.rank]));
}

function isRoyal(cards: { rank: Rank; suit: Suit }[]): boolean {
  if (cards.length !== 5 || !isFlush5(cards)) return false;
  const vals = new Set(cards.map((c) => RANK_VALUES[c.rank]));
  return vals.size === 5 && [...vals].every((v) => ROYAL.has(v)) && isStraight(cards);
}

export interface HandAnalysis {
  hand: HandLabel;
  points: number;
  /**
   * Defining ranks for the hand:
   * pair / trips / quads → [rank]
   * two_pair → [highPair, lowPair]
   * full_house → [trips, pair]
   * straight / straight_flush / royal → five ranks low→high (wheel: A,2,3,4,5)
   */
  keyRanks: Rank[];
  flushSuit?: Suit;
}

function keyRanksForHand(
  hand: HandLabel,
  cards: { rank: Rank; suit: Suit }[]
): { keyRanks: Rank[]; flushSuit?: Suit } {
  const byRank = new Map<Rank, number>();
  for (const c of cards) {
    byRank.set(c.rank, (byRank.get(c.rank) ?? 0) + 1);
  }
  const ranked = [...byRank.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return RANK_VALUES[b[0]] - RANK_VALUES[a[0]];
  });

  if (hand === "pair" || hand === "three_of_a_kind" || hand === "four_of_a_kind") {
    return { keyRanks: [ranked[0]![0]] };
  }
  if (hand === "two_pair") {
    const pairs = ranked.filter(([, n]) => n === 2).map(([r]) => r);
    pairs.sort((a, b) => RANK_VALUES[b] - RANK_VALUES[a]);
    return { keyRanks: pairs.slice(0, 2) };
  }
  if (hand === "full_house") {
    const trips = ranked.find(([, n]) => n === 3)?.[0];
    const pair = ranked.find(([, n]) => n === 2)?.[0];
    return { keyRanks: trips && pair ? [trips, pair] : [] };
  }
  if (hand === "straight" || hand === "straight_flush" || hand === "royal_flush") {
    const vals = [...new Set(cards.map((c) => RANK_VALUES[c.rank]))].sort((a, b) => a - b);
    let ordered: Rank[];
    if (vals.join() === "2,3,4,5,14") {
      ordered = ["A", "2", "3", "4", "5"];
    } else {
      ordered = vals.map((v) => VALUE_TO_RANK[v]!);
    }
    const flushSuit = hand === "straight" ? undefined : cards[0]?.suit;
    return { keyRanks: ordered, flushSuit };
  }
  if (hand === "flush") {
    return { keyRanks: [], flushSuit: cards[0]?.suit };
  }
  return { keyRanks: [] };
}

export function evaluateHand(
  cards: { rank: Rank; suit: Suit }[]
): HandAnalysis | null {
  if (cards.length !== POKER_HAND_SIZE) return null;

  const counts = rankCounts(cards);
  const freq = [...counts.values()].sort((a, b) => b - a);
  const flush = isFlush5(cards);
  const straight = isStraight(cards);

  let hand: HandLabel | null = null;
  if (isRoyal(cards))                                              hand = "royal_flush";
  else if (straight && flush)                                      hand = "straight_flush";
  else if (freq[0] === 4 && freq[1] === 1)                         hand = "four_of_a_kind";
  else if (freq[0] === 3 && freq[1] === 2)                         hand = "full_house";
  else if (flush)                                                  hand = "flush";
  else if (straight)                                               hand = "straight";
  else if (freq[0] === 3 && freq[1] === 1 && freq[2] === 1)      hand = "three_of_a_kind";
  else if (freq[0] === 2 && freq[1] === 2 && freq[2] === 1)       hand = "two_pair";
  else if (freq[0] === 2 && freq[1] === 1 && freq[2] === 1 && freq[3] === 1) hand = "pair";
  else return null;

  const detail = keyRanksForHand(hand, cards);
  return { hand, points: HAND_SCORES[hand], keyRanks: detail.keyRanks, flushSuit: detail.flushSuit };
}

// ── Wild (joker) substitution ─────────────────────────────────────────────────

function evaluateHandWithWilds(cards: Card[]): HandAnalysis | null {
  const wilds = cards.filter((c) => c.special === "joker");
  const normals = cards.filter((c) => c.special !== "joker");
  const wc = wilds.length;
  const n = cards.length;

  if (wc === 0) return evaluateHand(normals);
  if (n !== POKER_HAND_SIZE) return null;

  if (normals.length === 0) {
    return {
      hand: "royal_flush",
      points: HAND_SCORES.royal_flush,
      keyRanks: ["10", "J", "Q", "K", "A"],
      flushSuit: "spades",
    };
  }

  if (wc === 1) {
    let best: HandAnalysis | null = null;
    for (const sub of ALL_CARDS) {
      const filled = cards.map((c) =>
        c.special === "joker"
          ? { rank: sub.rank, suit: sub.suit }
          : { rank: c.rank, suit: c.suit }
      );
      const result = evaluateHand(filled);
      if (result && (!best || result.points > best.points)) {
        best = result;
      }
    }
    return best;
  }

  if (wc === 2) {
    let best: HandAnalysis | null = null;
    for (const s1 of ALL_CARDS) {
      for (const s2 of ALL_CARDS) {
        let j = 0;
        const filled = cards.map((c) => {
          if (c.special === "joker") {
            const sub = j === 0 ? s1 : s2;
            j++;
            return { rank: sub.rank, suit: sub.suit };
          }
          return { rank: c.rank, suit: c.suit };
        });
        const result = evaluateHand(filled);
        if (result && (!best || result.points > best.points)) {
          best = result;
        }
      }
    }
    return best;
  }

  return {
    hand: "royal_flush",
    points: HAND_SCORES.royal_flush,
    keyRanks: ["10", "J", "Q", "K", "A"],
    flushSuit: "spades",
  };
}

// ── Full result with special effects ─────────────────────────────────────────

export interface FullHandResult {
  hand: HandLabel;
  basePoints: number;
  totalPoints: number;
  hasJoker: boolean;
  keyRanks: Rank[];
  flushSuit?: Suit;
}

export function evaluateHandFull(cards: Card[]): FullHandResult | null {
  const hasJoker = cards.some((c) => c.special === "joker");
  const base = hasJoker ? evaluateHandWithWilds(cards) : evaluateHand(cards);
  if (!base) return null;
  return {
    hand: base.hand,
    basePoints: base.points,
    totalPoints: base.points,
    hasJoker,
    keyRanks: base.keyRanks,
    flushSuit: base.flushSuit,
  };
}

// ── Path helpers ─────────────────────────────────────────────────────────────

export function pathIsAdjacent(cells: { row: number; col: number }[]): boolean {
  for (let i = 1; i < cells.length; i++) {
    const a = cells[i - 1]!;
    const b = cells[i]!;
    if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) return false;
  }
  return true;
}

function tryPathHand(
  path: { row: number; col: number }[],
  getCard: (p: { row: number; col: number }) => Card | null | undefined
): { path: { row: number; col: number }[]; result: FullHandResult } | null {
  if (path.length !== POKER_HAND_SIZE || !pathIsAdjacent(path)) return null;

  const cards: Card[] = [];
  for (const cell of path) {
    const card = getCard(cell);
    if (!card) return null;
    cards.push(card);
  }

  const result = evaluateHandFull(cards);
  if (!result) return null;

  return { path, result };
}

/**
 * Resolve a swipe path to a valid 5-card poker hand.
 * Trims trailing touch overshoot so the first five cells of the path are used.
 */
export function resolveHandFromPath(
  path: { row: number; col: number }[],
  getCard: (p: { row: number; col: number }) => Card | null | undefined
): { path: { row: number; col: number }[]; result: FullHandResult } | null {
  if (path.length < POKER_HAND_SIZE || !pathIsAdjacent(path)) return null;

  const maxTrim = path.length - POKER_HAND_SIZE;
  const candidates: {
    path: { row: number; col: number }[];
    result: FullHandResult;
    trim: number;
  }[] = [];

  for (let trim = 0; trim <= maxTrim; trim++) {
    const candidate = tryPathHand(path.slice(0, path.length - trim), getCard);
    if (candidate) candidates.push({ ...candidate, trim });
  }

  if (candidates.length === 0) return null;

  const pathHasJoker = path.some((cell) => getCard(cell)?.special === "joker");

  if (pathHasJoker) {
    candidates.sort(
      (a, b) =>
        a.trim - b.trim ||
        b.result.totalPoints - a.result.totalPoints
    );
    const best = candidates[0]!;
    return { path: best.path, result: best.result };
  }

  const exact = candidates.find((c) => c.trim === 0);
  if (exact) return { path: exact.path, result: exact.result };

  candidates.sort(
    (a, b) =>
      a.trim - b.trim ||
      b.result.totalPoints - a.result.totalPoints
  );
  const best = candidates[0]!;
  return { path: best.path, result: best.result };
}

export const HAND_RANK_ORDER: Record<HandLabel, number> = {
  pair: 1, two_pair: 2, three_of_a_kind: 3, straight: 4,
  flush: 5, full_house: 6, four_of_a_kind: 7, straight_flush: 8, royal_flush: 9,
};
