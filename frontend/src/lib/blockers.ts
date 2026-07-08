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

/** Global level where glass panels first appear (UI world "3-1"). */
export const GLASS_INTRO_LEVEL = 31;
/** Global level where sturdier crates first appear (UI world "5-1"). */
export const CRATE_INTRO_LEVEL = 51;

/** Blocker rules scale in gently once glass is introduced mid-campaign. */
export function blockersForLevel(level: number): BlockerSpawnConfig | null {
  if (level < GLASS_INTRO_LEVEL) return null;

  const sinceGlass = level - GLASS_INTRO_LEVEL;
  const density = Math.min(
    0.16,
    0.05 + Math.floor(sinceGlass / 10) * 0.012 + (sinceGlass % 10) * 0.002
  );

  const crateRatio =
    level < CRATE_INTRO_LEVEL
      ? 0
      : Math.min(0.55, (Math.floor((level - CRATE_INTRO_LEVEL) / 10) + 1) * 0.11);

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

export type BlockerIntroKind = "glass" | "crate";

const INTRO_SEEN_KEY: Record<BlockerIntroKind, string> = {
  glass: "royalMatchSeenGlassIntro",
  crate: "royalMatchSeenCrateIntro",
};

/** Which new obstacle (if any) this level introduces that the player hasn't been shown yet. */
export function pendingBlockerIntro(config: BlockerSpawnConfig | null): BlockerIntroKind | null {
  if (!config || typeof localStorage === "undefined") return null;
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
