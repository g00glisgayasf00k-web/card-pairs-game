import { isBlocked, type BlockerGrid } from "./blockers";
import {
  evaluateHandFull,
  POKER_HAND_SIZE,
  type Card,
  type HandLabel,
} from "./pokerHands";

const NEIGHBORS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export interface HintPath {
  path: { row: number; col: number }[];
  hand: HandLabel;
}

/** Find a valid 5-card path; prefer unmet milestone hands, then highest points. */
export function findHintPath(
  board: (Card | null)[][],
  blockers: BlockerGrid,
  rows: number,
  cols: number,
  priorityHands: HandLabel[]
): HintPath | null {
  let best: { path: { row: number; col: number }[]; hand: HandLabel; rank: number } | null =
    null;

  const getCard = (r: number, c: number): Card | null => {
    if (isBlocked(blockers[r]?.[c])) return null;
    return board[r]?.[c] ?? null;
  };

  const consider = (path: { row: number; col: number }[]) => {
    const cards: Card[] = [];
    for (const p of path) {
      const card = getCard(p.row, p.col);
      if (!card) return;
      cards.push(card);
    }
    const result = evaluateHandFull(cards);
    if (!result) return;

    const priorityIdx = priorityHands.indexOf(result.hand);
    const rank =
      (priorityIdx >= 0 ? 1_000_000 - priorityIdx * 10_000 : 0) + result.totalPoints;

    if (!best || rank > best.rank) {
      best = { path: [...path], hand: result.hand, rank };
    }
  };

  const dfs = (
    path: { row: number; col: number }[],
    visited: Set<string>
  ) => {
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

  if (!best) return null;
  return { path: best.path, hand: best.hand };
}
