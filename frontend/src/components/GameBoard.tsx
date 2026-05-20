import { useCallback, useRef, useState } from "react";
import {
  createBoard,
  evaluateHand,
  HAND_DISPLAY,
  HAND_RANK_ORDER,
  pathIsAdjacent,
  randomCard,
  straightMustStartAtEnd,
  type Card,
  type HandLabel,
} from "../lib/pokerHands";
import { useSwipePath } from "../hooks/useSwipePath";
import { PlayingCard } from "./PlayingCard";

const ROWS = 6;
const COLS = 6;
const MOVES_START = 40;

interface Props {
  onScoreChange: (score: number, hands: number, best: HandLabel) => void;
  onGameOver: (final: { score: number; hands: number; best: HandLabel }) => void;
}

export function GameBoard({ onScoreChange, onGameOver }: Props) {
  const [board, setBoard] = useState<(Card | null)[][]>(() =>
    createBoard(ROWS, COLS)
  );
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES_START);
  const [handsCleared, setHandsCleared] = useState(0);
  const [bestHand, setBestHand] = useState<HandLabel>("pair");
  const [message, setMessage] = useState<string | null>(null);
  const [popping, setPopping] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const { path, clear, onPointerDown, onPointerMove, onPointerUp } =
    useSwipePath(ROWS, COLS);

  const pathKey = (r: number, c: number) => `${r},${c}`;
  const inPath = (r: number, c: number) =>
    path.some((p) => p.row === r && p.col === c);

  const finishSwipe = useCallback(async () => {
    if (busy || path.length < 2) {
      clear();
      return;
    }
    if (!pathIsAdjacent(path)) {
      setMessage("Cards must be touching");
      clear();
      return;
    }

    const cards: Card[] = [];
    for (const p of path) {
      const cell = board[p.row]?.[p.col];
      if (!cell) {
        clear();
        return;
      }
      cards.push(cell);
    }

    const result = evaluateHand(cards);
    if (!result) {
      setMessage("Not a valid poker hand");
      clear();
      return;
    }
    if (!straightMustStartAtEnd(cards)) {
      setMessage("Straight: start on the 10 or Ace end");
      clear();
      return;
    }

    setBusy(true);
    setMessage(`${HAND_DISPLAY[result.hand]}! +${result.points}`);
    const popSet = new Set(path.map((p) => pathKey(p.row, p.col)));
    setPopping(popSet);

    await new Promise((r) => setTimeout(r, 380));

    setBoard((prev) => {
      const next = prev.map((row) => [...row]);
      for (const p of path) {
        next[p.row]![p.col] = randomCard();
      }
      return next;
    });

    const newScore = score + result.points;
    const newHands = handsCleared + 1;
    const newBest =
      HAND_RANK_ORDER[result.hand] > HAND_RANK_ORDER[bestHand]
        ? result.hand
        : bestHand;
    setScore(newScore);
    setHandsCleared(newHands);
    setBestHand(newBest);
    onScoreChange(newScore, newHands, newBest);

    setMoves((m) => {
      const nm = m - 1;
      if (nm <= 0) {
        onGameOver({ score: newScore, hands: newHands, best: newBest });
      }
      return nm;
    });
    setPopping(new Set());
    clear();
    setBusy(false);
  }, [
    busy,
    path,
    board,
    clear,
    score,
    handsCleared,
    bestHand,
    onGameOver,
    onScoreChange,
  ]);

  const handlePointerUp = () => {
    onPointerUp();
    void finishSwipe();
  };

  const reset = () => {
    setBoard(createBoard(ROWS, COLS));
    setScore(0);
    setMoves(MOVES_START);
    setHandsCleared(0);
    setBestHand("pair");
    setMessage(null);
    clear();
  };

  return (
    <div className="game-panel">
      <div className="hud">
        <div>
          <span className="label">Score</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span className="label">Moves</span>
          <strong>{moves}</strong>
        </div>
        <div>
          <span className="label">Hands</span>
          <strong>{handsCleared}</strong>
        </div>
      </div>

      {message && <p className="toast">{message}</p>}

      <div
        ref={gridRef}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
        onPointerDown={(e) => onPointerDown(e, gridRef.current)}
        onPointerMove={(e) => onPointerMove(e, gridRef.current)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="cell"
              data-row={r}
              data-col={c}
            >
              {cell && (
                <div data-row={r} data-col={c}>
                  <PlayingCard
                    card={cell}
                    selected={inPath(r, c)}
                    popping={popping.has(pathKey(r, c))}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="hint">
        Swipe adjacent cards. Pair = 2 alike. Straight = 5 in a row — start on
        10 or Ace.
      </p>
      <button type="button" className="btn secondary" onClick={reset}>
        New game
      </button>
    </div>
  );
}
