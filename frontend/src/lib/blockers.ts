export type BlockerKind = "glass" | "crate" | "fixed";

export interface Blocker {
  kind: BlockerKind;
  /** Hits remaining before the card underneath can be used. Fixed pillars always block. */
  hp: number;
}

export interface BlockerSpawnConfig {
  /** Share of cells that start with a blocker (0–1). */
  density: number;
  /** 0 = glass only, 1 = crates only, values in between mix both. */
  crateRatio: number;
}

export interface FixedObstacle {
  row: number;
  col: number;
}

export type BlockerGrid = (Blocker | null)[][];

export function blockerMaxHp(kind: BlockerKind): number {
  if (kind === "fixed") return 999;
  return kind === "glass" ? 1 : 2;
}

export function isFixedBlocker(blocker: Blocker | null | undefined): boolean {
  return blocker?.kind === "fixed";
}

export function isBlocked(blocker: Blocker | null | undefined): boolean {
  if (!blocker) return false;
  if (blocker.kind === "fixed") return true;
  return blocker.hp > 0;
}

/** Global level where glass panels first appear (UI world "3-1"). */
export const GLASS_INTRO_LEVEL = 31;
/** Global level where sturdier crates first appear (UI world "5-1"). */
export const CRATE_INTRO_LEVEL = 51;
/** Permanent pillars that cannot be cleared or moved (UI world "11-1"). */
export const FIXED_INTRO_LEVEL = 101;

/** Blocker rules scale in gently once glass is introduced mid-campaign. */
export function blockersForLevel(level: number): BlockerSpawnConfig | null {
  if (level < GLASS_INTRO_LEVEL) return null;

  const sinceGlass = level - GLASS_INTRO_LEVEL;
  const density = Math.min(
    0.2,
    0.05 + Math.floor(sinceGlass / 10) * 0.014 + (sinceGlass % 10) * 0.0025
  );

  const crateRatio =
    level < CRATE_INTRO_LEVEL
      ? 0
      : Math.min(0.65, (Math.floor((level - CRATE_INTRO_LEVEL) / 10) + 1) * 0.12);

  return { density, crateRatio };
}

/** Deterministic seeded RNG for fixed board layouts. */
function seededRandom(level: number, salt: number): () => number {
  let state = (level * 9301 + salt * 49297 + 233280) | 0;
  return () => {
    state = (state * 1103515245 + 12345) | 0;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function canPlaceFixed(
  row: number,
  col: number,
  placed: FixedObstacle[],
  minGap: number
): boolean {
  if (row <= 0 || row >= 7 || col <= 0 || col >= 7) return false;
  return placed.every(
    (p) => Math.abs(p.row - row) + Math.abs(p.col - col) >= minGap
  );
}

/** Procedural fixed pillars — permanent obstacles that shrink the playable board. */
export function fixedObstaclesForLevel(level: number): FixedObstacle[] {
  if (level < FIXED_INTRO_LEVEL) return [];

  const rng = seededRandom(level, 17);
  const since = level - FIXED_INTRO_LEVEL;
  const count = Math.min(10, 2 + Math.floor(since / 35));
  const minGap = since < 80 ? 3 : 2;
  const placed: FixedObstacle[] = [];

  // Named patterns on milestone levels for variety.
  if (level % 50 === 0) {
    return [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 1, col: 6 },
      { row: 6, col: 1 },
    ];
  }
  if (level % 25 === 0) {
    return [
      { row: 2, col: 4 },
      { row: 4, col: 2 },
      { row: 4, col: 5 },
      { row: 6, col: 4 },
    ];
  }

  let attempts = 0;
  while (placed.length < count && attempts < 80) {
    attempts++;
    const row = 1 + Math.floor(rng() * 6);
    const col = 1 + Math.floor(rng() * 6);
    if (!canPlaceFixed(row, col, placed, minGap)) continue;
    placed.push({ row, col });
  }

  return placed;
}

export function emptyBlockerGrid(rows: number, cols: number): BlockerGrid {
  return Array.from({ length: rows }, () => Array<Blocker | null>(cols).fill(null));
}

export function spawnBlockers(
  rows: number,
  cols: number,
  config: BlockerSpawnConfig,
  rng: () => number = Math.random
): BlockerGrid {
  const grid = emptyBlockerGrid(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() >= config.density) continue;
      const kind: BlockerKind = rng() < config.crateRatio ? "crate" : "glass";
      grid[r]![c] = { kind, hp: blockerMaxHp(kind) };
    }
  }
  return grid;
}

export function applyFixedObstacles(
  grid: BlockerGrid,
  fixed: FixedObstacle[]
): BlockerGrid {
  const next = grid.map((row) => row.map((b) => (b ? { ...b } : null)));
  for (const { row, col } of fixed) {
    next[row]![col] = { kind: "fixed", hp: blockerMaxHp("fixed") };
  }
  return next;
}

export function buildBlockerGrid(
  rows: number,
  cols: number,
  config: BlockerSpawnConfig | null,
  fixed: FixedObstacle[] = [],
  rng: () => number = Math.random
): BlockerGrid {
  const base = config ? spawnBlockers(rows, cols, config, rng) : emptyBlockerGrid(rows, cols);
  return applyFixedObstacles(base, fixed);
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

/** Glass / crates lose HP when orthogonally adjacent to a cleared cell; fixed pillars never break. */
export function applyBlockerDamage(
  blockers: BlockerGrid,
  clearedKeys: Set<string>,
  rows: number,
  cols: number
): BlockerGrid {
  const next = blockers.map((row) => row.map((b) => (b ? { ...b } : null)));

  for (const key of clearedKeys) {
    const [r, c] = key.split(",").map(Number) as [number, number];
    const self = next[r]?.[c];
    if (self && !isFixedBlocker(self)) next[r]![c] = null;

    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      const b = next[nr]?.[nc];
      if (!b || isFixedBlocker(b)) continue;
      b.hp -= 1;
      if (b.hp <= 0) next[nr]![nc] = null;
    }
  }

  return next;
}

export function blockerLabel(kind: BlockerKind): string {
  if (kind === "glass") return "Glass";
  if (kind === "crate") return "Crate";
  return "Pillar";
}

export function blockersGuideText(hasFixed: boolean): string {
  const base =
    "Glass breaks in one hit from a neighboring hand. Crates need two — or one bomb blast.";
  if (!hasFixed) return base;
  return `${base} Stone pillars are permanent — plan routes around them.`;
}

export type BlockerIntroKind = "glass" | "crate" | "fixed";

const INTRO_SEEN_KEY: Record<BlockerIntroKind, string> = {
  glass: "royalMatchSeenGlassIntro",
  crate: "royalMatchSeenCrateIntro",
  fixed: "royalMatchSeenFixedIntro",
};

/** Which new obstacle (if any) this level introduces that the player hasn't been shown yet. */
export function pendingBlockerIntro(
  config: BlockerSpawnConfig | null,
  fixed: FixedObstacle[] = []
): BlockerIntroKind | null {
  if (typeof localStorage === "undefined") return null;
  if (fixed.length > 0 && !localStorage.getItem(INTRO_SEEN_KEY.fixed)) return "fixed";
  if (!config) return null;
  if (config.crateRatio < 1 && !localStorage.getItem(INTRO_SEEN_KEY.glass)) return "glass";
  if (config.crateRatio > 0 && !localStorage.getItem(INTRO_SEEN_KEY.crate)) return "crate";
  return null;
}

export function markBlockerIntroSeen(kind: BlockerIntroKind): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(INTRO_SEEN_KEY[kind], "1");
}

export function blockerIntroContent(kind: BlockerIntroKind): {
  icon: string;
  title: string;
  lines: string[];
} {
  if (kind === "glass") {
    return {
      icon: "🧊",
      title: "New: Glass Panels",
      lines: [
        "From here on, some cards start sealed under glass.",
        "You can't use a card while glass covers it.",
        "Clear any poker hand next to a panel and the glass shatters in one hit.",
        "Plan a swipe that touches the glass, then play the freed card underneath.",
      ],
    };
  }
  if (kind === "crate") {
    return {
      icon: "📦",
      title: "New: Wooden Crates",
      lines: [
        "Crates are tougher than glass.",
        "They take two hits from neighbouring hands to break open.",
        "Or blow one apart instantly with a bomb power-up.",
      ],
    };
  }
  return {
    icon: "🪨",
    title: "New: Stone Pillars",
    lines: [
      "Some levels now have permanent stone pillars on the board.",
      "Pillars cannot be moved, broken, or swiped through.",
      "Cards around them still fall — route your hands through the gaps.",
      "Later worlds add more pillars and tighter layouts.",
    ],
  };
}
