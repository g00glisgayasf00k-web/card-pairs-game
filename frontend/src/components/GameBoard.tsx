import {
  CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  createBoard,
  createBoardFromSeed,
  enumerateWildHandOptions,
  formatEarnedSpecials,
  HAND_DISPLAY,
  HAND_SCORES,
  isTappableSpecial,
  pathIsAdjacent,
  POKER_HAND_SIZE,
  randomCard,
  resolveHandFromPath,
  specialsEarnedForHand,
  type Card,
  type FullHandResult,
  type HandLabel,
  type JokerGoalPrefer,
  type SpecialType,
  type Suit,
  type WildHandOption,
} from "../lib/pokerHands";
import { pathMatchesGuide } from "../lib/tutorialLevel1";
import {
  applyBlockerDamage,
  buildBlockerGrid,
  emptyBlockerGrid,
  isBlocked,
  isFixedBlocker,
  type Blocker,
  type BlockerGrid,
  type BlockerSpawnConfig,
  type FixedObstacle,
} from "../lib/blockers";
import { mulberry32, type Rng } from "../lib/seededRng";
import { findHintPath, type HintPath } from "../lib/hintFinder";
import { useSwipePath } from "../hooks/useSwipePath";
import { PlayingCard } from "./PlayingCard";
import { SpecialArt } from "./SpecialArt";

const ROWS = 8;
const COLS = 8;
const BOMB_PTS_PER_CARD = 50;
const LINE_PTS_PER_CARD = 45;
const RAINBOW_PTS_PER_CARD = 55;

/** Match .grid gap/padding in CSS */
const GRID_GAP = 3;
const GRID_PAD = 5;
/** Card width ÷ height */
const CELL_ASPECT = 5 / 7;
/** Room for border + outer glow so nothing clips */
const GRID_VISUAL_INSET = 6;
/** Felt frame border + padding to leave around the fitted grid */
const FRAME_INSET = 8;

/** Keep in sync with CSS animation durations (game-mobile / index.css) */
const ANIM = {
  pop: 260,
  popStagger: 32,
  blast: 380,
  bombBurst: 520,
  swoosh: 480,
  drop: 300,
  rain: 300,
  rainStagger: 18,
  settlePad: 24,
} as const;

interface ArrowSweep {
  axis: "row" | "col";
  /** Row index for horizontal sweeps, column index for vertical. */
  line: number;
  /** Tap origin along the sweep axis (col for row, row for col). */
  from: number;
}

interface BombBurst {
  row: number;
  col: number;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function waitForPop(count: number) {
  const n = Math.max(1, count);
  return ANIM.pop + (n - 1) * ANIM.popStagger + ANIM.settlePad;
}

function waitForSettle() {
  return ANIM.drop + (ROWS - 1) * ANIM.rainStagger + ANIM.settlePad;
}

function computeGridFit(availW: number, availH: number): { width: number; height: number } | null {
  const chromeW = 2 * GRID_PAD + (COLS - 1) * GRID_GAP;
  const chromeH = 2 * GRID_PAD + (ROWS - 1) * GRID_GAP;
  const w = Math.max(0, availW - GRID_VISUAL_INSET);
  const h = Math.max(0, availH - GRID_VISUAL_INSET);
  const cellW = Math.min((w - chromeW) / COLS, ((h - chromeH) / ROWS) * CELL_ASPECT);
  if (cellW <= 0) return null;
  const cellH = cellW / CELL_ASPECT;
  return {
    width: Math.floor(cellW * COLS + chromeW),
    height: Math.floor(cellH * ROWS + chromeH),
  };
}

export interface GameBoardHandle {
  shuffle: () => void;
  revealHint: (goals?: JokerGoalPrefer[]) => HintPath | null;
  clearHint: () => void;
}

interface Props {
  onHand: (result: FullHandResult) => void;
  onActivation: (pts: number) => void;
  /** Hide internal HUD — parent renders mobile shell */
  embedded?: boolean;
  /** Block input during level transitions */
  locked?: boolean;
  /** Fixed opening board (Beginner 1 tutorial / free-play layout) */
  seedBoard?: (Card | null)[][];
  /** Shared challenge seed — opening board + refills + blockers. */
  boardSeed?: number;
  /** Cells the player should swipe during a guided lesson */
  guidedPath?: { row: number; col: number }[];
  /** Required hand for the current guided lesson */
  tutorialExpectedHand?: HandLabel;
  /** Hint when the player swipes the wrong glowing cells */
  tutorialWrongSwipeHint?: string;
  /** Skip gravity — parent loads the next lesson board */
  onTutorialStepComplete?: () => void;
  /** Glass / crate overlays (level 31+). */
  blockerConfig?: BlockerSpawnConfig | null;
  /** Permanent pillars (level 101+) — cannot move or be destroyed. */
  fixedObstacles?: FixedObstacle[];
  /** Unmet goals — jokers prefer substitutions that credit these. */
  preferJokerGoals?: JokerGoalPrefer[];
  /** Parent HUD feedback — avoids board overlay flash in embedded mode */
  onFeedback?: (message: string | null, hint?: boolean) => void;
}

// ── Gravity ───────────────────────────────────────────────────────────────────

function columnSegments(rows: number, fixedRows: number[]): [number, number][] {
  const sorted = [...fixedRows].sort((a, b) => a - b);
  const segments: [number, number][] = [];
  let start = 0;
  for (const fixed of sorted) {
    if (start <= fixed - 1) segments.push([start, fixed - 1]);
    start = fixed + 1;
  }
  if (start <= rows - 1) segments.push([start, rows - 1]);
  return segments;
}

function applyGravity(
  board: (Card | null)[][],
  blockers: BlockerGrid,
  clearedKeys: Set<string>,
  earned: SpecialType[],
  spawnPath: { row: number; col: number }[],
  cardRng?: Rng
): {
  newBoard: (Card | null)[][];
  newBlockers: BlockerGrid;
  dropMap: Map<string, number>;
  newKeys: Set<string>;
} {
  const damagedBlockers = applyBlockerDamage(blockers, clearedKeys, ROWS, COLS);
  const nextCard = () => randomCard(cardRng);

  const newBoard: (Card | null)[][] = Array.from({ length: ROWS }, () =>
    Array<Card | null>(COLS).fill(null)
  );
  const newBlockers = emptyBlockerGrid(ROWS, COLS);
  const dropMap = new Map<string, number>();
  const newKeys = new Set<string>();

  for (let c = 0; c < COLS; c++) {
    const fixedRows: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (isFixedBlocker(damagedBlockers[r]?.[c])) fixedRows.push(r);
    }

    for (const [segStart, segEnd] of columnSegments(ROWS, fixedRows)) {
      const floating: { card: Card; blocker: Blocker | null; fromRow: number }[] = [];
      for (let r = segEnd; r >= segStart; r--) {
        const key = `${r},${c}`;
        if (clearedKeys.has(key)) continue;
        const card = board[r]?.[c];
        if (!card) continue;
        const b = damagedBlockers[r]?.[c];
        floating.push({
          card,
          blocker: b && !isFixedBlocker(b) ? { ...b } : null,
          fromRow: r,
        });
      }

      let floatIdx = 0;
      for (let r = segEnd; r >= segStart; r--) {
        if (floatIdx < floating.length) {
          const f = floating[floatIdx++]!;
          newBoard[r]![c] = f.card;
          newBlockers[r]![c] = f.blocker;
          const dropped = r - f.fromRow;
          if (dropped > 0) dropMap.set(`${r},${c}`, dropped);
        } else {
          newBoard[r]![c] = nextCard();
          newKeys.add(`${r},${c}`);
        }
      }
    }

    for (const r of fixedRows) {
      const key = `${r},${c}`;
      newBlockers[r]![c] = { kind: "fixed", hp: 999 };
      if (!clearedKeys.has(key) && board[r]?.[c]) {
        newBoard[r]![c] = board[r]![c];
      } else if (!newBoard[r]![c]) {
        newBoard[r]![c] = nextCard();
      }
    }
  }

  if (earned.length > 0) {
    const used = new Set<string>();
    earned.forEach((sp, i) => {
      // Spawn on swipe path cells — first reward on first card selected, then along the path
      let key: string | undefined;
      if (i < spawnPath.length) {
        const { row, col } = spawnPath[i]!;
        if (newBoard[row]?.[col]) key = `${row},${col}`;
      }
      if (!key || used.has(key)) {
        key = [...newKeys].find((k) => !used.has(k));
      }
      if (!key) return;
      used.add(key);
      const [rr, cc] = key.split(",").map(Number) as [number, number];
      if (sp === "arrow_h" || sp === "arrow_v") {
        newBoard[rr]![cc] = { rank: "A", suit: "spades", special: sp };
      } else {
        newBoard[rr]![cc] = { ...newBoard[rr]![cc]!, special: sp };
      }
    });
  }

  return { newBoard, newBlockers, dropMap, newKeys };
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ── Component ─────────────────────────────────────────────────────────────────

function cloneSeedBoard(seed: (Card | null)[][]): (Card | null)[][] {
  return seed.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export const GameBoard = forwardRef<GameBoardHandle, Props>(
  function GameBoard(
    {
      onHand,
      onActivation,
      embedded,
      locked = false,
      seedBoard,
      boardSeed,
      guidedPath,
      tutorialExpectedHand,
      tutorialWrongSwipeHint,
      onTutorialStepComplete,
      blockerConfig,
      fixedObstacles = [],
      preferJokerGoals,
      onFeedback,
    },
    ref
  ) {
    const refillRngRef = useRef<Rng | null>(
      boardSeed != null ? mulberry32((boardSeed ^ 0x9e3779b9) >>> 0) : null
    );

    const [board, setBoard] = useState<(Card | null)[][]>(() => {
      if (seedBoard) return cloneSeedBoard(seedBoard);
      if (boardSeed != null) return createBoardFromSeed(ROWS, COLS, boardSeed);
      return createBoard(ROWS, COLS);
    });
    const [blockers, setBlockers] = useState<BlockerGrid>(() => {
      if (seedBoard) return emptyBlockerGrid(ROWS, COLS);
      const rng = boardSeed != null ? mulberry32((boardSeed ^ 0x85ebca6b) >>> 0) : Math.random;
      return buildBlockerGrid(ROWS, COLS, blockerConfig ?? null, fixedObstacles, rng);
    });
    const [message, setMessage] = useState<string | null>(null);
    const [toastHint, setToastHint] = useState(false);
    const toastTimer = useRef<number | null>(null);
    const [popping, setPopping] = useState<Set<string>>(new Set());
    const [popOrder, setPopOrder] = useState<Map<string, number>>(new Map());
    const [blasting, setBlasting] = useState<Set<string>>(new Set());
    const [arrowSweep, setArrowSweep] = useState<ArrowSweep | null>(null);
    const [bombBurst, setBombBurst] = useState<BombBurst | null>(null);
    const [hintCell, setHintCell] = useState<{ row: number; col: number } | null>(null);
    const [dropMap, setDropMap] = useState<Map<string, number>>(new Map());
    const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    const [jokerChoice, setJokerChoice] = useState<{
      path: { row: number; col: number }[];
      options: WildHandOption[];
    } | null>(null);
    const fitRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const finishingSwipe = useRef(false);
    const [gridFit, setGridFit] = useState<{ width: number; height: number } | null>(null);
    const seedBoardKeyRef = useRef<string | null>(null);

    useEffect(() => {
      if (!seedBoard) return;
      const key = JSON.stringify(seedBoard);
      if (seedBoardKeyRef.current === key) return;
      seedBoardKeyRef.current = key;
      setBoard(cloneSeedBoard(seedBoard));
      setBlockers(emptyBlockerGrid(ROWS, COLS));
      setPopping(new Set());
      setPopOrder(new Map());
      setBlasting(new Set());
      setArrowSweep(null);
      setBombBurst(null);
      setDropMap(new Map());
      setNewKeys(new Set());
      setBusy(false);
    }, [seedBoard]);

    useEffect(() => {
      if (seedBoard) {
        setBlockers(emptyBlockerGrid(ROWS, COLS));
      } else {
        const rng = boardSeed != null ? mulberry32((boardSeed ^ 0x85ebca6b) >>> 0) : Math.random;
        setBlockers(buildBlockerGrid(ROWS, COLS, blockerConfig ?? null, fixedObstacles, rng));
      }
      if (boardSeed != null && !seedBoard) {
        refillRngRef.current = mulberry32((boardSeed ^ 0x9e3779b9) >>> 0);
        setBoard(createBoardFromSeed(ROWS, COLS, boardSeed));
      }
    }, [seedBoard, blockerConfig, fixedObstacles, boardSeed]);

    useEffect(() => {
      if (!embedded) return;
      const el = fitRef.current;
      if (!el) return;
      // Size the grid to the board stage (inside the play arena, beside the rail).
      const frame =
        (el.closest(".board-stage") as HTMLElement | null) ??
        (el.closest(".board-stage__frame") as HTMLElement | null) ??
        el;

      const measure = () => {
        const { width, height } = frame.getBoundingClientRect();
        const next = computeGridFit(width - FRAME_INSET, height - FRAME_INSET);
        setGridFit((prev) => {
          if (!next) return prev;
          if (prev?.width === next.width && prev?.height === next.height) return prev;
          return next;
        });
      };

      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(frame);
      window.addEventListener("resize", measure);
      const vv = window.visualViewport;
      vv?.addEventListener("resize", measure);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", measure);
        vv?.removeEventListener("resize", measure);
      };
    }, [embedded]);

    const { path, pathRef, clear, onPointerDown, onPointerMove, onPointerUp } =
      useSwipePath(ROWS, COLS);

    const showFeedback = useCallback(
      (text: string, hint = false) => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        if (embedded && onFeedback) {
          onFeedback(text, hint);
          if (!hint) {
            toastTimer.current = window.setTimeout(() => onFeedback(null), 1500);
          }
          return;
        }
        setMessage(text);
        setToastHint(hint);
        if (embedded) {
          toastTimer.current = window.setTimeout(() => {
            setMessage(null);
            setToastHint(false);
          }, hint ? 1300 : 1500);
        }
      },
      [embedded, onFeedback]
    );

    useEffect(
      () => () => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
      },
      []
    );

    const pathKey = (r: number, c: number) => `${r},${c}`;
    const inPath = (r: number, c: number) => path.some((p) => p.row === r && p.col === c);
    const guidedKeys = new Set((guidedPath ?? []).map((p) => pathKey(p.row, p.col)));
    const isGuided = (r: number, c: number) => guidedKeys.has(pathKey(r, c));

    useImperativeHandle(ref, () => ({
      shuffle: () => {
        if (busy || locked) return;
        setHintCell(null);
        setBoard((prev) => {
          const slots: { r: number; c: number; card: Card }[] = [];
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (isFixedBlocker(blockers[r]?.[c])) continue;
              const card = prev[r]?.[c];
              if (card) slots.push({ r, c, card });
            }
          }
          const shuffled = fisherYatesShuffle(slots.map((s) => s.card));
          const next = prev.map((row) => [...row]);
          slots.forEach((slot, i) => {
            next[slot.r]![slot.c] = shuffled[i]!;
          });
          return next;
        });
      },
      revealHint: (goals = []) => {
        if (busy || locked) return null;
        const result = findHintPath(board, blockers, ROWS, COLS, goals);
        if (!result) return null;
        const first = result.path[0]!;
        setHintCell({ row: first.row, col: first.col });
        return result;
      },
      clearHint: () => setHintCell(null),
    }), [busy, locked, board, blockers]);

    // ── Shared gravity commit ─────────────────────────────────────────────────
    const commitClear = useCallback(
      async (
        currentBoard: (Card | null)[][],
        currentBlockers: BlockerGrid,
        allCleared: Set<string>,
        earnedSpecials: SpecialType[],
        cols: Set<number>,
        toastMsg: string,
        pts: number,
        isHand: FullHandResult | null,
        popCount: number,
        fxWait = 0
      ) => {
        if (!embedded) setMessage(toastMsg);
        else showFeedback(toastMsg);
        await delay(Math.max(waitForPop(popCount), fxWait));

        const gravity = applyGravity(
          currentBoard,
          currentBlockers,
          allCleared,
          earnedSpecials,
          [],
          refillRngRef.current ?? undefined
        );
        setBoard(gravity.newBoard);
        setBlockers(gravity.newBlockers);
        setDropMap(gravity.dropMap);
        setNewKeys(gravity.newKeys);
        setPopping(new Set());
        setPopOrder(new Map());
        setBlasting(new Set());
        setArrowSweep(null);
        setBombBurst(null);
        setHintCell(null);

        if (isHand) {
          onHand(isHand);
        } else onActivation(pts);

        await delay(waitForSettle());
        setDropMap(new Map());
        setNewKeys(new Set());
        clear();
        setBusy(false);
      },
      [onHand, onActivation, clear, embedded, showFeedback]
    );

    // ── Bomb / arrow chain — each can trigger the other ───────────────────────
    const activateSpecialChain = useCallback(
      async (
        start:
          | { kind: "bomb"; r: number; c: number }
          | { kind: "arrow"; r: number; c: number; axis: "row" | "col" }
      ) => {
        setBusy(true);
        const cleared = new Set<string>();
        const order = new Map<string, number>();
        const blast = new Set<string>();
        const activated = new Set<string>();
        type ChainItem =
          | { kind: "bomb"; r: number; c: number; wave: number }
          | { kind: "arrow"; r: number; c: number; axis: "row" | "col"; wave: number };
        const queue: ChainItem[] = [
          start.kind === "bomb"
            ? { kind: "bomb", r: start.r, c: start.c, wave: 0 }
            : { kind: "arrow", r: start.r, c: start.c, axis: start.axis, wave: 0 },
        ];
        let chainCount = 0;
        let anyBomb = start.kind === "bomb";
        let primaryArrowAxis: "row" | "col" | null =
          start.kind === "arrow" ? start.axis : null;

        const enqueueHit = (
          cell: Card,
          rr: number,
          cc: number,
          wave: number,
          skipKey: string
        ) => {
          const k = `${rr},${cc}`;
          if (k === skipKey || activated.has(k)) return;
          if (cell.special === "bomb") {
            queue.push({ kind: "bomb", r: rr, c: cc, wave });
          } else if (cell.special === "arrow_h") {
            queue.push({ kind: "arrow", r: rr, c: cc, axis: "row", wave });
          } else if (cell.special === "arrow_v") {
            queue.push({ kind: "arrow", r: rr, c: cc, axis: "col", wave });
          }
        };

        while (queue.length > 0) {
          const cur = queue.shift()!;
          const originKey = `${cur.r},${cur.c}`;
          if (activated.has(originKey)) continue;
          activated.add(originKey);
          if (cur.wave > 0) chainCount += 1;

          if (cur.kind === "bomb") {
            anyBomb = true;
            if (!cleared.has(originKey) && board[cur.r]?.[cur.c]) {
              cleared.add(originKey);
              order.set(originKey, cur.wave * (COLS + ROWS));
            }
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = cur.r + dr;
                const nc = cur.c + dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                const cell = board[nr]?.[nc];
                if (!cell) continue;
                const k = `${nr},${nc}`;
                if (!cleared.has(k)) {
                  cleared.add(k);
                  order.set(k, cur.wave * (COLS + ROWS) + Math.abs(dr) + Math.abs(dc));
                  blast.add(k);
                }
                enqueueHit(cell, nr, nc, cur.wave + 1, originKey);
              }
            }
          } else {
            if (primaryArrowAxis == null) primaryArrowAxis = cur.axis;
            if (cur.axis === "row") {
              for (let cc = 0; cc < COLS; cc++) {
                const cell = board[cur.r]?.[cc];
                if (!cell) continue;
                const k = `${cur.r},${cc}`;
                if (!cleared.has(k)) {
                  cleared.add(k);
                  order.set(k, cur.wave * (COLS + ROWS) + Math.abs(cc - cur.c));
                }
                enqueueHit(cell, cur.r, cc, cur.wave + 1, originKey);
              }
            } else {
              for (let rr = 0; rr < ROWS; rr++) {
                const cell = board[rr]?.[cur.c];
                if (!cell) continue;
                const k = `${rr},${cur.c}`;
                if (!cleared.has(k)) {
                  cleared.add(k);
                  order.set(k, cur.wave * (COLS + ROWS) + Math.abs(rr - cur.r));
                }
                enqueueHit(cell, rr, cur.c, cur.wave + 1, originKey);
              }
            }
          }
        }

        const count = cleared.size;
        const ptsPer = anyBomb ? BOMB_PTS_PER_CARD : LINE_PTS_PER_CARD;
        const pts = count * ptsPer;
        const colsHit = new Set<number>();
        cleared.forEach((k) => {
          const col = Number(k.split(",")[1]);
          if (Number.isFinite(col)) colsHit.add(col);
        });

        if (anyBomb) {
          setBombBurst({ row: start.r, col: start.c });
          setBlasting(blast.size > 0 ? blast : new Set(cleared));
        }
        if (primaryArrowAxis) {
          setArrowSweep({
            axis: primaryArrowAxis === "row" ? "row" : "col",
            line: primaryArrowAxis === "row" ? start.r : start.c,
            from: primaryArrowAxis === "row" ? start.c : start.r,
          });
        }
        setPopping(cleared);
        setPopOrder(order);

        const chainNote =
          chainCount > 0 ? ` · ${chainCount} chain reaction!` : "";
        let toastMsg: string;
        if (start.kind === "bomb") {
          toastMsg = `💣 BOOM! ${count} cards cleared! +${pts}${chainNote}`;
        } else {
          const label = start.axis === "row" ? "row" : "column";
          const icon = start.axis === "row" ? "↔" : "↕";
          toastMsg = `${icon} Cleared the ${label}! ${count} cards +${pts}${chainNote}`;
        }

        await commitClear(
          board,
          blockers,
          cleared,
          [],
          colsHit.size > 0 ? colsHit : new Set([start.c]),
          toastMsg,
          pts,
          null,
          count,
          Math.max(anyBomb ? ANIM.bombBurst : 0, primaryArrowAxis ? ANIM.swoosh : 0)
        );
      },
      [board, blockers, commitClear]
    );

    const activateBomb = useCallback(
      async (r: number, c: number) => {
        await activateSpecialChain({ kind: "bomb", r, c });
      },
      [activateSpecialChain]
    );

    const activateArrow = useCallback(
      async (r: number, c: number, axis: "row" | "col") => {
        await activateSpecialChain({ kind: "arrow", r, c, axis });
      },
      [activateSpecialChain]
    );

    // ── Rainbow suit clear — drag onto a card ───────────────────────────────
    const activateRainbow = useCallback(
      async (targetSuit: Suit) => {
        setBusy(true);
        const cleared = new Set<string>();
        const order = new Map<string, number>();
        let i = 0;

        for (let rr = 0; rr < ROWS; rr++) {
          for (let cc = 0; cc < COLS; cc++) {
            const cell = board[rr]?.[cc];
            if (!cell) continue;
            if (cell.special === "rainbow" || cell.suit === targetSuit) {
              const k = `${rr},${cc}`;
              cleared.add(k);
              order.set(k, i++);
            }
          }
        }

        const count = cleared.size;
        const pts = count * RAINBOW_PTS_PER_CARD;
        setPopping(cleared);
        setPopOrder(order);

        const suitLabel =
          targetSuit === "hearts"
            ? "Hearts"
            : targetSuit === "diamonds"
              ? "Diamonds"
              : targetSuit === "clubs"
                ? "Clubs"
                : "Spades";

        await commitClear(
          board,
          blockers,
          cleared,
          [],
          new Set(Array.from({ length: COLS }, (_, idx) => idx)),
          `🌈 Cleared all ${suitLabel}! ${count} cards +${pts}`,
          pts,
          null,
          count
        );
      },
      [board, blockers, commitClear]
    );

    // ── Commit a resolved 5-card hand (pop → score → gravity/refill) ──────────
    const commitResolvedHand = useCallback(
      async (
        validPath: { row: number; col: number }[],
        result: FullHandResult
      ) => {
        finishingSwipe.current = true;
        setBusy(true);
        setJokerChoice(null);

        const handKeys = new Set(validPath.map((p) => pathKey(p.row, p.col)));
        const allCleared = handKeys;

        const finalPts = result.totalPoints;
        let toast = `${HAND_DISPLAY[result.hand]}! +${finalPts}`;
        if (result.hasJoker) toast += " 🃏";

        const earned = specialsEarnedForHand(result.hand);
        toast += formatEarnedSpecials(earned);
        const order = new Map(validPath.map((p, i) => [pathKey(p.row, p.col), i]));
        setPopping(handKeys);
        setPopOrder(order);

        const boardSnapshot = board;
        const blockersSnapshot = blockers;
        const isTutorialStep = !!onTutorialStepComplete;
        try {
          await delay(waitForPop(validPath.length));

          setPopping(new Set());
          setPopOrder(new Map());
          setHintCell(null);
          showFeedback(toast);

          onHand(result);

          if (isTutorialStep) {
            onTutorialStepComplete();
          } else {
            const gravity = applyGravity(
              boardSnapshot,
              blockersSnapshot,
              allCleared,
              earned,
              validPath,
              refillRngRef.current ?? undefined
            );
            setBoard(gravity.newBoard);
            setBlockers(gravity.newBlockers);
            setDropMap(gravity.dropMap);
            setNewKeys(gravity.newKeys);

            await delay(waitForSettle());
            setDropMap(new Map());
            setNewKeys(new Set());
          }
        } finally {
          finishingSwipe.current = false;
          clear();
          setBusy(false);
        }
      },
      [board, blockers, clear, onHand, onTutorialStepComplete, showFeedback]
    );

    const cancelJokerChoice = useCallback(() => {
      setJokerChoice(null);
      finishingSwipe.current = false;
      setBusy(false);
      clear();
    }, [clear]);

    // ── Main swipe handler ────────────────────────────────────────────────────
    const finishSwipe = useCallback(async () => {
      if (finishingSwipe.current || locked || busy) {
        clear();
        return;
      }

      const swipePath = pathRef.current;

      // Single tap
      if (swipePath.length === 1) {
        const { row, col } = swipePath[0]!;
        if (isBlocked(blockers[row]?.[col])) {
          const msg = isFixedBlocker(blockers[row]?.[col])
            ? "Stone pillars can't be cleared — route around them"
            : "Break the glass or crate first";
          if (embedded) showFeedback(msg, true);
          else setMessage(msg);
          clear();
          return;
        }
        const cell = board[row]?.[col];
        if (cell?.special === "bomb") {
          await activateBomb(row, col);
          return;
        }
        if (cell?.special === "arrow_h") {
          await activateArrow(row, col, "row");
          return;
        }
        if (cell?.special === "arrow_v") {
          await activateArrow(row, col, "col");
          return;
        }
        if (cell?.special === "rainbow") {
          if (embedded) showFeedback("Drag the rainbow card onto any suit to clear it", true);
          else setMessage("Drag the rainbow card onto any suit to clear it");
          clear();
          return;
        }
        clear();
        return;
      }

      if (swipePath.some((p) => isBlocked(blockers[p.row]?.[p.col]))) {
        const hitsFixed = swipePath.some((p) => isFixedBlocker(blockers[p.row]?.[p.col]));
        const msg = hitsFixed
          ? "Can't swipe through stone pillars"
          : "Clear the glass or crate blocking that card";
        if (embedded) showFeedback(msg, true);
        else setMessage(msg);
        clear();
        return;
      }

      if (swipePath.length < POKER_HAND_SIZE) {
        const hasRainbow = swipePath.some((p) => board[p.row]?.[p.col]?.special === "rainbow");
        if (hasRainbow && swipePath.length >= 2 && pathIsAdjacent(swipePath)) {
          let targetSuit: Suit | null = null;
          for (let i = swipePath.length - 1; i >= 0; i--) {
            const p = swipePath[i]!;
            const c = board[p.row]?.[p.col];
            if (c && c.special !== "rainbow") {
              targetSuit = c.suit;
              break;
            }
          }
          if (targetSuit) {
            finishingSwipe.current = true;
            await activateRainbow(targetSuit);
            finishingSwipe.current = false;
            return;
          }
          if (embedded) showFeedback("Drag the rainbow onto a card to pick a suit", true);
          else setMessage("Drag the rainbow onto a card to pick a suit");
          clear();
          return;
        }

        if (embedded) showFeedback(`Swipe exactly ${POKER_HAND_SIZE} cards`, true);
        else setMessage(`Swipe exactly ${POKER_HAND_SIZE} cards for a poker hand`);
        clear();
        return;
      }

      const blockedSpecial = swipePath.find((p) => {
        const sp = board[p.row]?.[p.col]?.special;
        return sp && sp !== "joker";
      });
      if (blockedSpecial) {
        const sp = board[blockedSpecial.row]?.[blockedSpecial.col]?.special;
        if (sp === "rainbow") {
          let targetSuit: Suit | null = null;
          for (let i = swipePath.length - 1; i >= 0; i--) {
            const p = swipePath[i]!;
            const c = board[p.row]?.[p.col];
            if (c && c.special !== "rainbow") {
              targetSuit = c.suit;
              break;
            }
          }
          if (targetSuit && pathIsAdjacent(swipePath)) {
            finishingSwipe.current = true;
            await activateRainbow(targetSuit);
            finishingSwipe.current = false;
            return;
          }
        }
        const hint =
          sp === "rainbow"
            ? "Drag the rainbow onto a card to clear that suit"
            : "Tap arrow and bomb power cards — only the Joker swipes into hands";
        if (embedded) showFeedback(hint, true);
        else setMessage(hint);
        clear();
        return;
      }

      const resolved = resolveHandFromPath(
        swipePath,
        (p) => {
          if (isBlocked(blockers[p.row]?.[p.col])) return undefined;
          return board[p.row]?.[p.col] ?? undefined;
        },
        preferJokerGoals
      );
      if (!resolved) {
        if (!pathIsAdjacent(swipePath)) {
          if (embedded) showFeedback("Cards must be touching", true);
          else setMessage("Cards must be touching");
        } else if (swipePath.length > POKER_HAND_SIZE) {
          if (embedded) showFeedback(`Use exactly ${POKER_HAND_SIZE} cards (lift finger sooner)`, true);
          else setMessage(`Use exactly ${POKER_HAND_SIZE} cards — lift finger sooner`);
        } else {
          if (embedded) showFeedback("Not a valid 5-card poker hand", true);
          else setMessage("Not a valid 5-card poker hand");
        }
        clear();
        return;
      }

      const { path: validPath, result } = resolved;

      if (
        guidedPath &&
        tutorialExpectedHand &&
        onTutorialStepComplete &&
        (result.hand !== tutorialExpectedHand || !pathMatchesGuide(validPath, guidedPath))
      ) {
        let hint: string;
        if (!pathMatchesGuide(validPath, guidedPath)) {
          hint =
            tutorialWrongSwipeHint ??
            `Swipe all ${guidedPath.length} glowing cards — they must touch edge-to-edge.`;
        } else {
          hint = `Those cards don't make a ${HAND_DISPLAY[tutorialExpectedHand]}. Follow the glowing path.`;
        }
        if (embedded) showFeedback(hint, true);
        else setMessage(hint);
        clear();
        return;
      }

      // Joker in the hand → let the player pick which poker hand to make,
      // unless it's a guided tutorial step (which expects one exact hand).
      if (result.hasJoker && !onTutorialStepComplete) {
        const cards = validPath
          .map((p) => board[p.row]?.[p.col])
          .filter((c): c is Card => !!c);
        const options = enumerateWildHandOptions(cards, preferJokerGoals);
        if (options.length > 1) {
          finishingSwipe.current = true;
          setBusy(true);
          setJokerChoice({ path: validPath, options });
          return;
        }
        await commitResolvedHand(validPath, options[0] ?? result);
        return;
      }

      await commitResolvedHand(validPath, result);
    }, [
      busy, board, blockers, clear, locked, pathRef,
      activateBomb, activateArrow, activateRainbow, commitResolvedHand,
      guidedPath, tutorialExpectedHand, tutorialWrongSwipeHint, onTutorialStepComplete, embedded, showFeedback,
      preferJokerGoals,
    ]);

    const handlePointerUp = () => {
      onPointerUp();
      void finishSwipe();
    };

    const gridStyle: CSSProperties = {
      gridTemplateColumns: `repeat(${COLS}, 1fr)`,
      gridTemplateRows: `repeat(${ROWS}, 1fr)`,
    };

    const gridWrapStyle: CSSProperties = {
      ...(embedded && gridFit
        ? { width: gridFit.width, height: gridFit.height, maxWidth: "100%", maxHeight: "100%" }
        : {}),
      "--grid-rows": ROWS,
      "--grid-cols": COLS,
    } as CSSProperties;

    const grid = (
      <div
        className="grid-fx-wrap"
        data-sized={embedded && gridFit ? "" : undefined}
        style={gridWrapStyle}
      >
        <div
          ref={gridRef}
          className="grid"
          data-locked={locked ? "" : undefined}
          style={gridStyle}
          onPointerDown={(e) => onPointerDown(e, gridRef.current)}
          onPointerMove={(e) => onPointerMove(e, gridRef.current)}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const key = pathKey(r, c);
            const drop = dropMap.get(key) ?? 0;
            const isNew = newKeys.has(key);
            const overlay = blockers[r]?.[c] ?? null;
            const blocked = isBlocked(overlay);
            const isRainbow = cell?.special === "rainbow";
            const isTappable = !blocked && isTappableSpecial(cell?.special);
            const isPopping = popping.has(key);
            const isBlasting = blasting.has(key);
            const isBombOrigin = bombBurst?.row === r && bombBurst?.col === c;
            const isHinted =
              hintCell?.row === r && hintCell?.col === c && !locked && !blocked;
            const cardStyle: CSSProperties | undefined =
              drop > 0
                ? { "--drop-n": drop }
                : isNew
                  ? { "--new-row": r }
                  : isPopping || isBlasting
                    ? { "--pop-order": popOrder.get(key) ?? 0 }
                    : undefined;

            return (
              <div
                key={`${r}-${c}`}
                className={`cell${isHinted ? " cell--hint-active" : ""}`}
                data-row={r}
                data-col={c}
              >
                {cell && (
                  <div
                    key={`${r}-${c}-${cell.rank}-${cell.suit}-${cell.special ?? ""}`}
                    data-row={r}
                    data-col={c}
                    className={[
                      drop > 0           ? "card-dropping" : "",
                      isNew              ? "card-new"      : "",
                      isBombOrigin       ? "card-bomb-origin" : "",
                      isBlasting         ? "card-blasting" : "",
                      isPopping          ? "card-clearing" : "",
                      isTappable         ? "card-tappable" : "",
                      isRainbow          ? "card-rainbow-drag" : "",
                    ].filter(Boolean).join(" ")}
                    style={cardStyle}
                  >
                    <PlayingCard
                      card={cell}
                      blocker={overlay}
                      selected={inPath(r, c) && !isPopping && !isBlasting && !blocked}
                      guided={isGuided(r, c) && !busy && !locked && !blocked}
                      hinted={isHinted}
                      popping={isPopping}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
        {arrowSweep && (
          <div
            className={`arrow-swoosh-overlay arrow-swoosh-overlay--${arrowSweep.axis}`}
            style={{
              "--line": arrowSweep.line,
              "--swoosh-from": arrowSweep.from,
            } as CSSProperties}
            aria-hidden
          >
            <div className={`arrow-swoosh-fx arrow-swoosh-fx--${arrowSweep.axis}`}>
              <SpecialArt
                type={arrowSweep.axis === "row" ? "arrow_h" : "arrow_v"}
                className="arrow-swoosh-fx__art"
              />
            </div>
            <div className={`arrow-swoosh-trail arrow-swoosh-trail--${arrowSweep.axis}`} />
          </div>
        )}
        {bombBurst && (
          <div
            className="bomb-burst-overlay"
            style={{
              "--row": bombBurst.row,
              "--col": bombBurst.col,
            } as CSSProperties}
            aria-hidden
          >
            <div className="bomb-burst-flash" />
            <div className="bomb-burst-ring bomb-burst-ring--1" />
            <div className="bomb-burst-ring bomb-burst-ring--2" />
            <div className="bomb-burst-ring bomb-burst-ring--3" />
            <div className="bomb-burst-sparks" />
          </div>
        )}
      </div>
    );

    const useHudFeedback = embedded && !!onFeedback;

    return (
      <div className={`game-panel${embedded ? " game-panel--embedded" : ""}`}>
        {!useHudFeedback && (
          <div className={`toast-area${embedded ? " toast-area--compact" : ""}`}>
            {message && (
              <p className={`toast${toastHint ? " toast--hint" : ""}`} key={message}>
                {message}
              </p>
            )}
          </div>
        )}

        {embedded ? (
          <div className="board-fit" ref={fitRef}>
            {grid}
          </div>
        ) : (
          grid
        )}

        {jokerChoice && (
          <div className="joker-picker" role="dialog" aria-modal="true" aria-labelledby="joker-picker-title">
            <div className="joker-picker__backdrop" onClick={cancelJokerChoice} />
            <div className="joker-picker__panel">
              <div className="joker-picker__head">
                <span className="joker-picker__emoji" aria-hidden>🃏</span>
                <div>
                  <h3 id="joker-picker-title">Play your Joker</h3>
                  <p>Pick the hand to score</p>
                </div>
              </div>
              <ul className="joker-picker__list">
                {jokerChoice.options.map((opt) => {
                  const rewards = formatEarnedSpecials(specialsEarnedForHand(opt.hand)).replace(
                    /^ · /,
                    ""
                  );
                  return (
                    <li key={opt.hand}>
                      <button
                        type="button"
                        className={`joker-picker__opt${opt.goalMatch ? " joker-picker__opt--goal" : ""}`}
                        onClick={() => void commitResolvedHand(jokerChoice.path, opt)}
                      >
                        <span className="joker-picker__opt-main">
                          <span className="joker-picker__opt-name">{HAND_DISPLAY[opt.hand]}</span>
                          {rewards && <span className="joker-picker__opt-reward">{rewards}</span>}
                        </span>
                        <span className="joker-picker__opt-side">
                          {opt.goalMatch && <span className="joker-picker__opt-goal">Goal</span>}
                          <span className="joker-picker__opt-pts">
                            +{HAND_SCORES[opt.hand]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="joker-picker__cancel" onClick={cancelJokerChoice}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
