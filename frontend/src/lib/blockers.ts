export type BlockerKind = "glass" | "crate";

export interface Blocker {
  kind: BlockerKind;
  /** Hits remaining before the card underneath can be used. */
  hp: number;
}

export interface BlockerSpawnConfig {
  /** Share of cells that start with a blocker (0–1). */
  density: number;
  /** 0 = glass only, 1 = crates only, values in between mix both. */
  crateRatio: number;
}

export type BlockerGrid = (Blocker | null)[][];

export function blockerMaxHp(kind: BlockerKind): number {
  return kind === "glass" ? 1 : 2;
}

export function isBlocked(blocker: Blocker | null | undefined): boolean {
  return blocker != null && blocker.hp > 0;
}

/** Blocker rules scale in from world 2 (level 11+). */
export function blockersForLevel(level: number): BlockerSpawnConfig | null {
  if (level <= 10) return null;

  const tier = Math.floor((level - 1) / 10);
  const step = ((level - 1) % 10) + 1;
  const density = Math.min(0.16, 0.05 + tier * 0.012 + step * 0.002);
  const crateRatio = tier <= 1 ? 0 : Math.min(0.55, (tier - 1) * 0.11);

  return { density, crateRatio };
}

export function emptyBlockerGrid(rows: number, cols: number): BlockerGrid {
  return Array.from({ length: rows }, () => Array<Blocker | null>(cols).fill(null));
}

export function spawnBlockers(
  rows: number,
  cols: number,
  config: BlockerSpawnConfig
): BlockerGrid {
  const grid = emptyBlockerGrid(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() >= config.density) continue;
      const kind: BlockerKind = Math.random() < config.crateRatio ? "crate" : "glass";
      grid[r]![c] = { kind, hp: blockerMaxHp(kind) };
    }
  }
  return grid;
}

const NEIGHBOR_DELTAS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function neighbors(r: number, c: number, rows: number, cols: number): [number, number][] {
  const out: [number, number][] = [];
  for (const [dr, dc] of NEIGHBOR_DELTAS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
  }
  return out;
}

/** Glass / crates lose HP when orthogonally adjacent to a cleared cell; cleared cells lose their overlay. */
export function applyBlockerDamage(
  blockers: BlockerGrid,
  clearedKeys: Set<string>,
  rows: number,
  cols: number
): BlockerGrid {
  const next = blockers.map((row) => row.map((b) => (b ? { ...b } : null)));

  for (const key of clearedKeys) {
    const [r, c] = key.split(",").map(Number) as [number, number];
    if (next[r]?.[c]) next[r]![c] = null;

    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      const b = next[nr]?.[nc];
      if (!b) continue;
      b.hp -= 1;
      if (b.hp <= 0) next[nr]![nc] = null;
    }
  }

  return next;
}

export function blockerLabel(kind: BlockerKind): string {
  return kind === "glass" ? "Glass" : "Crate";
}

export function blockersGuideText(): string {
  return "Glass breaks in one hit from a neighboring hand. Crates need two — or one bomb blast.";
}
