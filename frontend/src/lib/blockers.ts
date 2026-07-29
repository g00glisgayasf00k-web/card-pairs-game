export type BlockerKind = "glass" | "crate" | "vault" | "fixed";

export interface Blocker {
  kind: BlockerKind;
  /** Hits remaining before the card underneath can be used. Fixed pillars always block. */
  hp: number;
}

export interface BlockerSpawnConfig {
  /** Share of cells that start with a blocker (0–1). */
  density: number;
  /** Of non-vault blockers: 0 = glass only, 1 = crates only. */
  crateRatio: number;
  /** Share of blockers that are vaults (0–1). */
  vaultRatio: number;
  /** Of vaults, share that spawn as iron vaults (HP 4). */
  ironVaultRatio: number;
}

export interface FixedObstacle {
  row: number;
  col: number;
}

export type BlockerGrid = (Blocker | null)[][];

export function blockerMaxHp(kind: BlockerKind, iron = false): number {
  if (kind === "fixed") return 999;
  if (kind === "glass") return 1;
  if (kind === "crate") return 2;
  if (kind === "vault") return iron ? 4 : 3;
  return 1;
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
/** Hard vault overlays (3–4 hits) from the second campaign half. */
export const VAULT_INTRO_LEVEL = 501;
/** Share of vaults may spawn as iron (HP 4). */
export const IRON_VAULT_INTRO_LEVEL = 701;

/** Blocker rules scale in gently once glass is introduced mid-campaign. */
export function blockersForLevel(level: number): BlockerSpawnConfig | null {
  if (level < GLASS_INTRO_LEVEL) return null;

  const sinceGlass = level - GLASS_INTRO_LEVEL;
  const densityCap = level >= VAULT_INTRO_LEVEL ? 0.26 : 0.2;
  const density = Math.min(
    densityCap,
    0.05 + Math.floor(sinceGlass / 10) * 0.014 + (sinceGlass % 10) * 0.0025
  );

  const crateRatio =
    level < CRATE_INTRO_LEVEL
      ? 0
      : Math.min(0.65, (Math.floor((level - CRATE_INTRO_LEVEL) / 10) + 1) * 0.12);

  const vaultRatio =
    level < VAULT_INTRO_LEVEL
      ? 0
      : Math.min(0.45, 0.12 + Math.floor((level - VAULT_INTRO_LEVEL) / 20) * 0.04);

  const ironVaultRatio =
    level < IRON_VAULT_INTRO_LEVEL
      ? 0
      : Math.min(0.55, 0.15 + Math.floor((level - IRON_VAULT_INTRO_LEVEL) / 30) * 0.08);

  return { density, crateRatio, vaultRatio, ironVaultRatio };
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

/** Named maze layouts for late / boss stages — never seal a full row or column. */
function namedFixedLayout(level: number): FixedObstacle[] | null {
  const late = level >= VAULT_INTRO_LEVEL;

  if (level % 50 === 0) {
    // Center block + corners
    return [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 1, col: 6 },
      { row: 6, col: 1 },
      ...(late
        ? [
            { row: 1, col: 1 },
            { row: 6, col: 6 },
            { row: 2, col: 5 },
            { row: 5, col: 2 },
          ]
        : []),
    ];
  }

  if (level % 25 === 0) {
    if (!late) {
      return [
        { row: 2, col: 4 },
        { row: 4, col: 2 },
        { row: 4, col: 5 },
        { row: 6, col: 4 },
      ];
    }
    // Late cross maze
    return [
      { row: 2, col: 4 },
      { row: 3, col: 4 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
      { row: 4, col: 5 },
      { row: 5, col: 4 },
      { row: 6, col: 4 },
      { row: 1, col: 3 },
      { row: 6, col: 5 },
    ];
  }

  if (late && level % 10 === 0) {
    const variant = Math.floor(level / 10) % 4;
    if (variant === 0) {
      // Vertical corridor walls
      return [
        { row: 1, col: 2 },
        { row: 2, col: 2 },
        { row: 3, col: 2 },
        { row: 5, col: 2 },
        { row: 6, col: 2 },
        { row: 1, col: 5 },
        { row: 2, col: 5 },
        { row: 4, col: 5 },
        { row: 5, col: 5 },
        { row: 6, col: 5 },
      ];
    }
    if (variant === 1) {
      // Ring (hollow center)
      return [
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 3, col: 2 },
        { row: 3, col: 5 },
        { row: 4, col: 2 },
        { row: 4, col: 5 },
        { row: 5, col: 2 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 5, col: 5 },
      ];
    }
    if (variant === 2) {
      // Split board (gap at mid)
      return [
        { row: 1, col: 3 },
        { row: 2, col: 3 },
        { row: 3, col: 3 },
        { row: 5, col: 3 },
        { row: 6, col: 3 },
        { row: 1, col: 4 },
        { row: 2, col: 4 },
        { row: 4, col: 4 },
        { row: 5, col: 4 },
        { row: 6, col: 4 },
      ];
    }
    // Diagonal stagger
    return [
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
      { row: 5, col: 5 },
      { row: 6, col: 6 },
      { row: 1, col: 6 },
      { row: 2, col: 5 },
      { row: 5, col: 2 },
      { row: 6, col: 1 },
      { row: 4, col: 1 },
      { row: 4, col: 6 },
    ];
  }

  return null;
}

/** Procedural fixed pillars — permanent obstacles that shrink the playable board. */
export function fixedObstaclesForLevel(level: number): FixedObstacle[] {
  if (level < FIXED_INTRO_LEVEL) return [];

  const named = namedFixedLayout(level);
  if (named) return named;

  const rng = seededRandom(level, 17);
  const since = level - FIXED_INTRO_LEVEL;
  const late = level >= VAULT_INTRO_LEVEL;
  const count = late
    ? Math.min(14, 6 + Math.floor((level - VAULT_INTRO_LEVEL) / 40))
    : Math.min(10, 2 + Math.floor(since / 35));
  const minGap = late ? (level >= IRON_VAULT_INTRO_LEVEL ? 1 : 2) : since < 80 ? 3 : 2;
  const placed: FixedObstacle[] = [];

  let attempts = 0;
  while (placed.length < count && attempts < 120) {
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
  const vaultRatio = config.vaultRatio ?? 0;
  const ironVaultRatio = config.ironVaultRatio ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() >= config.density) continue;

      if (vaultRatio > 0 && rng() < vaultRatio) {
        const iron = ironVaultRatio > 0 && rng() < ironVaultRatio;
        grid[r]![c] = { kind: "vault", hp: blockerMaxHp("vault", iron) };
        continue;
      }

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

/** Glass / crates / vaults lose HP when orthogonally adjacent to a cleared cell; fixed pillars never break. */
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
  if (kind === "vault") return "Vault";
  return "Pillar";
}

export function blockersGuideText(hasFixed: boolean): string {
  const base =
    "Glass breaks in one hit from a neighboring hand. Crates need two — or one bomb blast. Vaults need three (iron vaults four).";
  if (!hasFixed) return base;
  return `${base} Stone pillars are permanent — plan routes around them.`;
}

export type BlockerIntroKind = "glass" | "crate" | "fixed" | "vault";

const INTRO_SEEN_KEY: Record<BlockerIntroKind, string> = {
  glass: "royalMatchSeenGlassIntro",
  crate: "royalMatchSeenCrateIntro",
  fixed: "royalMatchSeenFixedIntro",
  vault: "royalMatchSeenVaultIntro",
};

/** Which new obstacle (if any) this level introduces that the player hasn't been shown yet. */
export function pendingBlockerIntro(
  config: BlockerSpawnConfig | null,
  fixed: FixedObstacle[] = []
): BlockerIntroKind | null {
  if (typeof localStorage === "undefined") return null;
  if (fixed.length > 0 && !localStorage.getItem(INTRO_SEEN_KEY.fixed)) return "fixed";
  if (!config) return null;
  if ((config.vaultRatio ?? 0) > 0 && !localStorage.getItem(INTRO_SEEN_KEY.vault)) return "vault";
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
  if (kind === "vault") {
    return {
      icon: "🔐",
      title: "New: Steel Vaults",
      lines: [
        "Vaults seal cards behind heavy plating.",
        "They take three neighbouring hits to crack — later worlds add iron vaults that need four.",
        "A bomb still clears the vault sitting on the blast cell.",
        "Pillar mazes get tighter from here — route carefully.",
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
