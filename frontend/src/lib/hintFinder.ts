import { isBlocked, type BlockerGrid } from "./blockers";
import {
  evaluateHandFull,
  jokerGoalScore,
  POKER_HAND_SIZE,
  type Card,
  type HandLabel,
  type JokerGoalPrefer,
  type Rank,
  type Suit,
} from "./pokerHands";

const NEIGHBORS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** Cards the player can include in a swipe hand — only plain cards + jokers. */
function isHintEligible(card: Card | null | undefined): card is Card {
  if (!card) return false;
  const sp = card.special;
  if (!sp) return true;
  return sp === "joker";
}

export interface HintPath {
  path: { row: number; col: number }[];
  hand: HandLabel;
  keyRanks: Rank[];
  flushSuit?: Suit;
  /** True when this path credits an unmet level goal (including specific ranks). */
  goalMatch: boolean;
}

/**
 * Find a valid 5-card path.
 * Prefers paths that credit unmet goals (specific ranks/suits first), then highest points.
 */
export function findHintPath(
  board: (Card | null)[][],
  blockers: BlockerGrid,
  rows: number,
  cols: number,
  goals: JokerGoalPrefer[] = []
): HintPath | null {
  type BestHint = {
    path: { row: number; col: number }[];
    hand: HandLabel;
    keyRanks: Rank[];
    flushSuit?: Suit;
    rank: number;
  };
  // Mutable box — TS does not track assignments inside nested dfs/consider closures.
  const state: { best: BestHint | null } = { best: null };

  const getCard = (r: number, c: number): Card | null => {
    if (isBlocked(blockers[r]?.[c])) return null;
    const card = board[r]?.[c] ?? null;
    return isHintEligible(card) ? card : null;
  };

  const consider = (path: { row: number; col: number }[]) => {
    const cards: Card[] = [];
    for (const p of path) {
      const card = getCard(p.row, p.col);
      if (!card) return;
      cards.push(card);
    }
    const result = evaluateHandFull(cards, goals);
    if (!result) return;

    const goalScore = jokerGoalScore(
      {
        hand: result.hand,
        points: result.totalPoints,
        keyRanks: result.keyRanks,
        flushSuit: result.flushSuit,
      },
      goals
    );
    // Prefer goal matches heavily; among equals prefer more points; tiny tie-break for path start
    const rank = goalScore * 1_000 + result.totalPoints;

    if (!state.best || rank > state.best.rank) {
      state.best = {
        path: [...path],
        hand: result.hand,
        keyRanks: result.keyRanks,
        flushSuit: result.flushSuit,
        rank,
      };
    }
  };

  const dfs = (path: { row: number; col: number }[], visited: Set<string>) => {
    if (path.length === POKER_HAND_SIZE) {
      consider(path);
      return;
    }
    const last = path[path.length - 1]!;
    for (const [dr, dc] of NEIGHBORS) {
      const nr = last.row + dr;
      const nc = last.col + dc;
      const key = `${nr},${nc}`;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited.has(key)) continue;
      if (!getCard(nr, nc)) continue;
      visited.add(key);
      path.push({ row: nr, col: nc });
      dfs(path, visited);
      path.pop();
      visited.delete(key);
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!getCard(r, c)) continue;
      dfs([{ row: r, col: c }], new Set([`${r},${c}`]));
    }
  }

  const best = state.best;
  if (!best) return null;
  const goalScore = jokerGoalScore(
    {
      hand: best.hand,
      points: 0,
      keyRanks: best.keyRanks,
      flushSuit: best.flushSuit,
    },
    goals
  );
  return {
    path: best.path,
    hand: best.hand,
    keyRanks: best.keyRanks,
    flushSuit: best.flushSuit,
    goalMatch: goalScore > 0,
  };
}
