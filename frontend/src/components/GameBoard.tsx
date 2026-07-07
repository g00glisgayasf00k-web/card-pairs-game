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
  formatEarnedSpecials,
  HAND_DISPLAY,
  isTappableSpecial,
  pathIsAdjacent,
  POKER_HAND_SIZE,
  randomCard,
  resolveHandFromPath,
  specialsEarnedForHand,
  type Card,
  type FullHandResult,
  type HandLabel,
  type SpecialType,
  type Suit,
} from "../lib/pokerHands";
import { pathMatchesGuide } from "../lib/tutorialLevel1";
import {
  applyBlockerDamage,
  emptyBlockerGrid,
  isBlocked,
  spawnBlockers,
  type BlockerGrid,
  type BlockerSpawnConfig,
} from "../lib/blockers";
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
  /** Cells the player should swipe during a guided lesson */
  guidedPath?: { row: number; col: number }[];
  /** Required hand for the current guided lesson */
  tutorialExpectedHand?: HandLabel;
  /** Hint when the player swipes the wrong glowing cells */
  tutorialWrongSwipeHint?: string;
  /** Skip gravity — parent loads the next lesson board */
  onTutorialStepComplete?: () => void;
  /** Glass / crate overlays (level 11+). */
  blockerConfig?: BlockerSpawnConfig | null;
  /** Parent HUD feedback — avoids board overlay flash in embedded mode */
  onFeedback?: (message: string | null, hint?: boolean) => void;
}

// ── Gravity ───────────────────────────────────────────────────────────────────

function applyGravity(
  board: (Card | null)[][],
  blockers: BlockerGrid,
  clearedKeys: Set<string>,
  earned: SpecialType[],
  spawnPath: { row: number; col: number }[]
): {
  newBoard: (Card | null)[][];
  newBlockers: BlockerGrid;
  dropMap: Map<string, number>;
  newKeys: Set<string>;
} {
  const damagedBlockers = applyBlockerDamage(blockers, clearedKeys, ROWS, COLS);

  const newBoard: (Card | null)[][] = Array.from({ length: ROWS }, () =>
    Array<Card | null>(COLS).fill(null)
  );
  const newBlockers = emptyBlockerGrid(ROWS, COLS);
  const dropMap = new Map<string, number>();
  const newKeys = new Set<string>();

  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      const key = `${r},${c}`;
      if (board[r]?.[c] && !clearedKeys.has(key)) {
        newBoard[write]![c] = board[r]![c];
        newBlockers[write]![c] = damagedBlockers[r]?.[c]
          ? { ...damagedBlockers[r]![c]! }
          : null;
        const dropped = write - r;
        if (dropped > 0) dropMap.set(`${write},${c}`, dropped);
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      newBoard[r]![c] = randomCard();
      newKeys.add(`${r},${c}`);
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
      guidedPath,
      tutorialExpectedHand,
      tutorialWrongSwipeHint,
      onTutorialStepComplete,
      blockerConfig,
      onFeedback,
    },
    ref
  ) {
    const [board, setBoard] = useState<(Card | null)[][]>(() =>
      seedBoard ? cloneSeedBoard(seedBoard) : createBoard(ROWS, COLS)
    );
    const [blockers, setBlockers] = useState<BlockerGrid>(() =>
      seedBoard || !blockerConfig
        ? emptyBlockerGrid(ROWS, COLS)
        : spawnBlockers(ROWS, COLS, blockerConfig)
    );
    const [message, setMessage] = useState<string | null>(null);
    const [toastHint, setToastHint] = useState(false);
    const toastTimer = useRef<number | null>(null);
    const [popping, setPopping] = useState<Set<string>>(new Set());
    const [popOrder, setPopOrder] = useState<Map<string, number>>(new Map());
    const [blasting, setBlasting] = useState<Set<string>>(new Set());
    const [arrowSweep, setArrowSweep] = useState<ArrowSweep | null>(null);
    const [bombBurst, setBombBurst] = useState<BombBurst | null>(null);
    const [dropMap, setDropMap] = useState<Map<string, number>>(new Map());
    const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
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
      } else if (blockerConfig) {
        setBlockers(spawnBlockers(ROWS, COLS, blockerConfig));
      } else {
        setBlockers(emptyBlockerGrid(ROWS, COLS));
      }
    }, [seedBoard, blockerConfig]);

    useEffect(() => {
      if (!embedded) return;
      const el = fitRef.current;
      if (!el) return;

      const measure = () => {
        const { width, height } = el.getBoundingClientRect();
        const next = computeGridFit(width, height);
        setGridFit((prev) => {
          if (!next) return prev;
          if (prev?.width === next.width && prev?.height === next.height) return prev;
          return next;
        });
      };

      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
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
        setBoard((prev) => {
          const flat = prev.flat().filter(Boolean) as Card[];
          const shuffled = fisherYatesShuffle(flat);
          return Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => shuffled[r * COLS + c] ?? null)
          );
        });
      },
    }), [busy, locked]);

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
          []
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

        if (isHand) onHand(isHand);
        else onActivation(pts);

        await delay(waitForSettle());
        setDropMap(new Map());
        setNewKeys(new Set());
        clear();
        setBusy(false);
      },
      [onHand, onActivation, clear, embedded, showFeedback]
    );

    // ── 💣 Bomb tap ───────────────────────────────────────────────────────────
    const activateBomb = useCallback(
      async (r: number, c: number) => {
        setBusy(true);
        const bombKey = pathKey(r, c);
        const cleared = new Set<string>([bombKey]);
        const blast = new Set<string>();

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (board[nr]?.[nc]) {
                cleared.add(`${nr},${nc}`);
                blast.add(`${nr},${nc}`);
              }
            }
          }
        }

        const pts = cleared.size * BOMB_PTS_PER_CARD;
        const blastOrder = new Map<string, number>();
        blast.forEach((k) => {
          const [rr, cc] = k.split(",").map(Number) as [number, number];
          blastOrder.set(k, Math.abs(rr - r) + Math.abs(cc - c));
        });
        setPopping(new Set([bombKey]));
        setPopOrder(new Map([[bombKey, 0], ...blastOrder]));
        setBlasting(blast);
        setBombBurst({ row: r, col: c });

        await commitClear(
          board,
          blockers,
          cleared,
          [],
          new Set([c]),
          `💣 BOOM! ${cleared.size} cards cleared! +${pts}`,
          pts,
          null,
          cleared.size,
          ANIM.bombBurst
        );
      },
      [board, blockers, commitClear]
    );

    // ── ↔↕ Arrow tap — clear row or column ────────────────────────────────────
    const activateArrow = useCallback(
      async (r: number, c: number, axis: "row" | "col") => {
        setBusy(true);
        const cleared = new Set<string>();
        const order = new Map<string, number>();

        if (axis === "row") {
          for (let cc = 0; cc < COLS; cc++) {
            if (!board[r]?.[cc]) continue;
            const k = `${r},${cc}`;
            cleared.add(k);
            order.set(k, Math.abs(cc - c));
          }
        } else {
          for (let rr = 0; rr < ROWS; rr++) {
            if (!board[rr]?.[c]) continue;
            const k = `${rr},${c}`;
            cleared.add(k);
            order.set(k, Math.abs(rr - r));
          }
        }

        const count = cleared.size;
        const pts = count * LINE_PTS_PER_CARD;
        setArrowSweep({
          axis: axis === "row" ? "row" : "col",
          line: axis === "row" ? r : c,
          from: axis === "row" ? c : r,
        });
        setPopping(cleared);
        setPopOrder(order);

        const label = axis === "row" ? "row" : "column";
        const icon = axis === "row" ? "↔" : "↕";
        await commitClear(
          board,
          blockers,
          cleared,
          [],
          new Set([c]),
          `${icon} Cleared the ${label}! ${count} cards +${pts}`,
          pts,
          null,
          count,
          ANIM.swoosh
        );
      },
      [board, blockers, commitClear]
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
          if (embedded) showFeedback("Break the glass or crate first", true);
          else setMessage("Break the glass or crate first");
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
        if (embedded) showFeedback("Clear the glass or crate blocking that card", true);
        else setMessage("Clear the glass or crate blocking that card");
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

      const resolved = resolveHandFromPath(swipePath, (p) => {
        if (isBlocked(blockers[p.row]?.[p.col])) return undefined;
        return board[p.row]?.[p.col] ?? undefined;
      });
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

      finishingSwipe.current = true;
      setBusy(true);

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
            validPath
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
    }, [
      busy, board, blockers, clear, locked, pathRef,
      onHand, activateBomb, activateArrow, activateRainbow,
      guidedPath, tutorialExpectedHand, tutorialWrongSwipeHint, onTutorialStepComplete, embedded, showFeedback,
    ]);

    const handlePointerUp = () => {
      onPointerUp();
      void finishSwipe();
    };

    const gridStyle: CSSProperties = {
      gridTemplateColumns: `repeat(${COLS}, 1fr)`,
      gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      ...(embedded && gridFit
        ? { width: gridFit.width, height: gridFit.height, maxWidth: "100%", maxHeight: "100%" }
        : {}),
    };

    const grid = (
      <div
        ref={gridRef}
        className="grid"
        data-sized={embedded && gridFit ? "" : undefined}
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
            const cardStyle: CSSProperties | undefined =
              drop > 0
                ? { "--drop-n": drop }
                : isNew
                  ? { "--new-row": r }
                  : isPopping || isBlasting
                    ? { "--pop-order": popOrder.get(key) ?? 0 }
                    : undefined;

            return (
              <div key={`${r}-${c}`} className="cell" data-row={r} data-col={c}>
                {cell && (
                  <div
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
                      popping={isPopping}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
        {arrowSweep && (
          <div
            className={`arrow-swoosh-layer arrow-swoosh-layer--${arrowSweep.axis}`}
            style={{
              ...(arrowSweep.axis === "row"
                ? { gridRow: arrowSweep.line + 1, gridColumn: "1 / -1" }
                : { gridColumn: arrowSweep.line + 1, gridRow: "1 / -1" }),
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
            className="bomb-burst-layer"
            style={{ gridRow: bombBurst.row + 1, gridColumn: bombBurst.col + 1 }}
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
      </div>
    );
  }
);
