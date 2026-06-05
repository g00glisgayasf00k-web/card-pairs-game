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
  evaluateHandFull,
  HAND_DISPLAY,
  pathIsAdjacent,
  randomCard,
  resolveHandFromPath,
  specialsEarnedForHand,
  straightMustStartAtEnd,
  type Card,
  type FullHandResult,
  type HandLabel,
  type Rank,
  type SpecialType,
} from "../lib/pokerHands";
import { pathMatchesGuide } from "../lib/tutorialLevel1";
import { useSwipePath } from "../hooks/useSwipePath";
import { PlayingCard } from "./PlayingCard";

const ROWS = 8;
const COLS = 8;
const BOMB_PTS_PER_CARD = 50;
const STAR_PTS_PER_CARD = 75;

/** Match .grid gap/padding in CSS */
const GRID_GAP = 3;
const GRID_PAD = 5;
/** Card width ÷ height */
const CELL_ASPECT = 5 / 7;
/** Room for border + outer glow so nothing clips */
const GRID_VISUAL_INSET = 14;

/** Keep in sync with CSS animation durations (game-mobile / index.css) */
const ANIM = {
  pop: 260,
  popStagger: 32,
  blast: 280,
  drop: 300,
  rain: 300,
  rainStagger: 18,
  settlePad: 24,
} as const;

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
  comboMultiplier: number;
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
  /** Skip gravity — parent loads the next lesson board */
  onTutorialStepComplete?: () => void;
}

// ── Gravity ───────────────────────────────────────────────────────────────────

function applyGravity(
  board: (Card | null)[][],
  clearedKeys: Set<string>,
  earned: SpecialType[],
  spawnPath: { row: number; col: number }[]
): { newBoard: (Card | null)[][]; dropMap: Map<string, number>; newKeys: Set<string> } {
  const newBoard: (Card | null)[][] = Array.from({ length: ROWS }, () =>
    Array<Card | null>(COLS).fill(null)
  );
  const dropMap = new Map<string, number>();
  const newKeys = new Set<string>();

  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r]?.[c] && !clearedKeys.has(`${r},${c}`)) {
        newBoard[write]![c] = board[r]![c];
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
      newBoard[rr]![cc] = { ...newBoard[rr]![cc]!, special: sp };
    });
  }

  return { newBoard, dropMap, newKeys };
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
      comboMultiplier,
      onHand,
      onActivation,
      embedded,
      locked = false,
      seedBoard,
      guidedPath,
      tutorialExpectedHand,
      onTutorialStepComplete,
    },
    ref
  ) {
    const [board, setBoard] = useState<(Card | null)[][]>(() =>
      seedBoard ? cloneSeedBoard(seedBoard) : createBoard(ROWS, COLS)
    );
    const [message, setMessage] = useState<string | null>(null);
    const [toastHint, setToastHint] = useState(false);
    const toastTimer = useRef<number | null>(null);
    const [popping, setPopping] = useState<Set<string>>(new Set());
    const [popOrder, setPopOrder] = useState<Map<string, number>>(new Map());
    const [blasting, setBlasting] = useState<Set<string>>(new Set());
    const [dropMap, setDropMap] = useState<Map<string, number>>(new Map());
    const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    const fitRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const finishingSwipe = useRef(false);
    const [gridFit, setGridFit] = useState<{ width: number; height: number } | null>(null);

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

    const showToast = useCallback(
      (text: string, hint = false) => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        setMessage(text);
        setToastHint(hint);
        if (embedded) {
          toastTimer.current = window.setTimeout(() => {
            setMessage(null);
            setToastHint(false);
          }, hint ? 1250 : 1500);
        }
      },
      [embedded]
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
        allCleared: Set<string>,
        earnedSpecials: SpecialType[],
        cols: Set<number>,
        toastMsg: string,
        pts: number,
        isHand: FullHandResult | null,
        popCount: number,
        hasBlast = false
      ) => {
        if (!embedded) setMessage(toastMsg);
        else showToast(toastMsg);
        await delay(
          Math.max(waitForPop(popCount), hasBlast ? ANIM.blast + ANIM.settlePad : 0)
        );

        const gravity = applyGravity(currentBoard, allCleared, earnedSpecials, []);
        setBoard(gravity.newBoard);
        setDropMap(gravity.dropMap);
        setNewKeys(gravity.newKeys);
        setPopping(new Set());
        setPopOrder(new Map());
        setBlasting(new Set());

        if (isHand) onHand(isHand);
        else onActivation(pts);

        await delay(waitForSettle());
        setDropMap(new Map());
        setNewKeys(new Set());
        clear();
        setBusy(false);
      },
      [onHand, onActivation, clear, embedded, showToast]
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
              cleared.add(`${nr},${nc}`);
              blast.add(`${nr},${nc}`);
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

        await commitClear(
          board,
          cleared,
          [],
          new Set([c]),
          `💣 BOOM! ${cleared.size} cards cleared! +${pts}`,
          pts,
          null,
          cleared.size,
          true
        );
      },
      [board, commitClear]
    );

    // ── ⭐ Star tap ───────────────────────────────────────────────────────────
    const activateStar = useCallback(
      async (r: number, c: number, rank: Rank) => {
        setBusy(true);
        const cleared = new Set<string>();
        const poppingSet = new Set<string>();
        const order = new Map<string, number>();

        for (let rr = 0; rr < ROWS; rr++) {
          for (let cc = 0; cc < COLS; cc++) {
            const cell = board[rr]?.[cc];
            if (cell && (cell.rank === rank || (rr === r && cc === c))) {
              const k = `${rr},${cc}`;
              cleared.add(k);
              poppingSet.add(k);
              order.set(k, Math.abs(rr - r) + Math.abs(cc - c));
            }
          }
        }

        const count = cleared.size;
        const pts = count * STAR_PTS_PER_CARD;
        setPopping(poppingSet);
        setPopOrder(order);

        await commitClear(
          board,
          cleared,
          [],
          new Set([c]),
          `⭐ Cleared all ${count}× ${rank}s! +${pts}`,
          pts,
          null,
          count
        );
      },
      [board, commitClear]
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
        const cell = board[row]?.[col];
        if (cell?.special === "bomb") { await activateBomb(row, col); return; }
        if (cell?.special === "star") { await activateStar(row, col, cell.rank); return; }
        clear();
        return;
      }

      if (swipePath.length < 2) { clear(); return; }

      const resolved = resolveHandFromPath(swipePath, (p) => board[p.row]?.[p.col]);
      if (!resolved) {
        if (!pathIsAdjacent(swipePath)) {
          if (embedded) showToast("Cards must be touching", true);
          else setMessage("Cards must be touching");
        } else {
          const cards = swipePath
            .map((p) => board[p.row]?.[p.col])
            .filter((c): c is Card => !!c);
          const maybe = cards.length === swipePath.length ? evaluateHandFull(cards) : null;
          if (maybe?.hand === "straight" && !straightMustStartAtEnd(cards)) {
            if (embedded) showToast("Straight: start on the 10 or Ace end", true);
            else setMessage("Straight: start on the 10 or Ace end");
          } else {
            if (embedded) showToast("Not a valid poker hand", true);
            else setMessage("Not a valid poker hand");
          }
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
        const hint = `Swipe the glowing cards to make a ${HAND_DISPLAY[tutorialExpectedHand]}`;
        if (embedded) showToast(hint, true);
        else setMessage(hint);
        clear();
        return;
      }

      finishingSwipe.current = true;
      setBusy(true);

      const handKeys = new Set(validPath.map((p) => pathKey(p.row, p.col)));
      const allCleared = handKeys;

      const finalPts = Math.round(result.totalPoints * comboMultiplier);
      let toast = `${HAND_DISPLAY[result.hand]}! +${finalPts}`;
      if (result.hasJoker)       toast += " 🃏";
      if (comboMultiplier > 1)   toast += ` (×${comboMultiplier} combo)`;

      const order = new Map(validPath.map((p, i) => [pathKey(p.row, p.col), i]));
      setPopping(handKeys);
      setPopOrder(order);

      const earned = specialsEarnedForHand(result.hand);

      const boardSnapshot = board;
      const isTutorialStep = !!onTutorialStepComplete;
      try {
        await delay(waitForPop(validPath.length));

        setPopping(new Set());
        setPopOrder(new Map());
        if (embedded) showToast(toast);
        else setMessage(toast);

        onHand(result);

        if (isTutorialStep) {
          onTutorialStepComplete();
        } else {
          const gravity = applyGravity(boardSnapshot, allCleared, earned, validPath);
          setBoard(gravity.newBoard);
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
      busy, board, clear, comboMultiplier, locked, pathRef,
      onHand, activateBomb, activateStar,
      guidedPath, tutorialExpectedHand, onTutorialStepComplete, embedded, showToast,
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
            const isTappable = cell?.special === "bomb" || cell?.special === "star";
            const isPopping = popping.has(key);
            const isBlasting = blasting.has(key);
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
                      isBlasting         ? "card-blasting" : "",
                      isPopping          ? "card-clearing" : "",
                      isTappable         ? "card-tappable" : "",
                    ].filter(Boolean).join(" ")}
                    style={cardStyle}
                  >
                    <PlayingCard
                      card={cell}
                      selected={inPath(r, c) && !isPopping && !isBlasting}
                      guided={isGuided(r, c) && !busy && !locked}
                      popping={isPopping}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );

    return (
      <div className={`game-panel${embedded ? " game-panel--embedded" : ""}`}>
        <div className={`toast-area${embedded ? " toast-area--compact" : ""}`}>
          {message && (
            <p className={`toast${toastHint ? " toast--hint" : ""}`} key={message}>
              {message}
            </p>
          )}
        </div>

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
