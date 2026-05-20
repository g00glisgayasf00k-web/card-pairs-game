import { useCallback, useRef, useState } from "react";

export interface CellPos {
  row: number;
  col: number;
}

export function useSwipePath(rows: number, cols: number) {
  const [path, setPath] = useState<CellPos[]>([]);
  const dragging = useRef(false);

  const key = (r: number, c: number) => `${r},${c}`;

  const isAdjacent = (a: CellPos, b: CellPos) =>
    Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

  const addCell = useCallback(
    (row: number, col: number) => {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      setPath((prev) => {
        const pos = { row, col };
        const k = key(row, col);
        const seen = new Set(prev.map((p) => key(p.row, p.col)));
        if (seen.has(k)) {
          // Backtrack: pop back to this cell if it's the previous one
          if (prev.length >= 2) {
            const last = prev[prev.length - 1]!;
            const secondLast = prev[prev.length - 2]!;
            if (last.row === row && last.col === col) return prev;
            if (secondLast.row === row && secondLast.col === col) {
              return prev.slice(0, -1);
            }
          }
          return prev;
        }
        if (prev.length > 0 && !isAdjacent(prev[prev.length - 1]!, pos)) {
          return prev;
        }
        return [...prev, pos];
      });
    },
    [rows, cols]
  );

  const start = useCallback(() => {
    dragging.current = true;
    setPath([]);
  }, []);

  const end = useCallback(() => {
    dragging.current = false;
    return path;
  }, [path]);

  const clear = useCallback(() => setPath([]), []);

  const cellFromPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      gridEl: HTMLElement | null
    ): CellPos | null => {
      if (!gridEl) return null;
      const el = document.elementFromPoint(clientX, clientY);
      const card = el?.closest("[data-row][data-col]") as HTMLElement | null;
      if (!card) return null;
      const row = Number(card.dataset.row);
      const col = Number(card.dataset.col);
      if (Number.isNaN(row) || Number.isNaN(col)) return null;
      return { row, col };
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, gridRef: HTMLElement | null) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      start();
      const cell = cellFromPoint(e.clientX, e.clientY, gridRef);
      if (cell) addCell(cell.row, cell.col);
    },
    [start, cellFromPoint, addCell]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent, gridRef: HTMLElement | null) => {
      if (!dragging.current) return;
      const cell = cellFromPoint(e.clientX, e.clientY, gridRef);
      if (cell) addCell(cell.row, cell.col);
    },
    [cellFromPoint, addCell]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return {
    path,
    setPath,
    clear,
    end,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
