import { MAX_LEVEL } from "./levels";

export type LevelNodeState = "locked" | "unlocked" | "completed";

export const WORLDS = 50;
export const STAGES_PER_WORLD = 10;
export const TOTAL_LEVELS = MAX_LEVEL;

export function toGlobalLevel(world: number, stage: number): number {
  return (world - 1) * STAGES_PER_WORLD + stage;
}

export function fromGlobalLevel(global: number): { world: number; stage: number } {
  const clamped = Math.min(Math.max(1, Math.floor(global)), TOTAL_LEVELS);
  const world = Math.ceil(clamped / STAGES_PER_WORLD);
  const stage = ((clamped - 1) % STAGES_PER_WORLD) + 1;
  return { world, stage };
}

/** World index shown in UI (0 = first world). Internal world numbers stay 1-based. */
export function displayWorld(world: number): number {
  return Math.max(0, Math.floor(world) - 1);
}

export function formatLevelId(global: number): string {
  const { world, stage } = fromGlobalLevel(global);
  return `${displayWorld(world)}-${stage}`;
}

const TIER_NAMES = [
  "Beginner",
  "Amateur",
  "Regular",
  "Pro",
  "Shark",
  "High Roller",
  "Ace",
  "Veteran",
  "Expert",
  "Elite",
] as const;

export function worldTitle(world: number): string {
  const n = Math.min(Math.max(1, Math.floor(world)), WORLDS);
  const tierIndex = (n - 1) % TIER_NAMES.length;
  const base = TIER_NAMES[tierIndex] ?? "Elite";
  const cycle = Math.floor((n - 1) / TIER_NAMES.length);
  const suffix = cycle === 0 ? "" : ` ${cycle + 1}`;
  return `${base}${suffix} ${displayWorld(n)}`;
}

export function allWorlds(): number[] {
  return Array.from({ length: WORLDS }, (_, i) => i + 1);
}

export function stagesInWorld(_world: number): number[] {
  return Array.from({ length: STAGES_PER_WORLD }, (_, i) => i + 1);
}

export function worldForLevel(globalLevel: number): number {
  return Math.ceil(Math.max(1, globalLevel) / STAGES_PER_WORLD);
}

export interface WorldTheme {
  /** Main chip / path colour. */
  main: string;
  /** Darker shade for chip edges and shadows. */
  dark: string;
  /** Lighter highlight for chip face sheen. */
  light: string;
  /** Felt table base colour for this world. */
  felt: string;
  /** Felt vignette edge colour. */
  feltEdge: string;
}

/** Each world has its own casino-felt colourway. Chips and the path adopt these. */
const WORLD_THEMES: WorldTheme[] = [
  { main: "#10b981", dark: "#065f46", light: "#6ee7b7", felt: "#0f5132", feltEdge: "#08321f" },
  { main: "#3b82f6", dark: "#1e3a8a", light: "#93c5fd", felt: "#173a6b", feltEdge: "#0c2147" },
  { main: "#a855f7", dark: "#6b21a8", light: "#d8b4fe", felt: "#46217a", feltEdge: "#2c0f52" },
  { main: "#ef4444", dark: "#991b1b", light: "#fca5a5", felt: "#7a1f1f", feltEdge: "#4a0f0f" },
  { main: "#f59e0b", dark: "#b45309", light: "#fcd34d", felt: "#7c4a13", feltEdge: "#4a2c08" },
  { main: "#14b8a6", dark: "#0f766e", light: "#5eead4", felt: "#0f5f57", feltEdge: "#073b36" },
  { main: "#ec4899", dark: "#9d174d", light: "#f9a8d4", felt: "#7a1f4d", feltEdge: "#4a1030" },
  { main: "#f97316", dark: "#9a3412", light: "#fdba74", felt: "#7c3b13", feltEdge: "#4a2208" },
  { main: "#6366f1", dark: "#3730a3", light: "#a5b4fc", felt: "#312a7a", feltEdge: "#1c1850" },
  { main: "#e8c547", dark: "#a16207", light: "#fde68a", felt: "#6b5311", feltEdge: "#43340a" },
];

export function worldTheme(world: number): WorldTheme {
  const n = Math.min(Math.max(1, Math.floor(world)), WORLDS);
  const idx = (n - 1) % WORLD_THEMES.length;
  return WORLD_THEMES[idx] ?? WORLD_THEMES[0]!;
}
