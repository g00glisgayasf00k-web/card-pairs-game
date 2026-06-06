import { STAGES_PER_WORLD, toGlobalLevel } from "./levelMap";

export type MapSide = "left" | "center" | "right";

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapSegment {
  from: number;
  to: number;
  tiles: MapPoint[];
}

/** Winding pixel-map node layout (viewBox 0–100 wide). */
const WINDING_MAP_NODES: MapPoint[] = [
  { x: 22, y: 6 },
  { x: 50, y: 12 },
  { x: 78, y: 18 },
  { x: 58, y: 26 },
  { x: 28, y: 34 },
  { x: 48, y: 42 },
  { x: 72, y: 50 },
  { x: 52, y: 58 },
  { x: 26, y: 66 },
  { x: 50, y: 74 },
];

/** Decorative stone tiles between chips — varies per segment like a pixel trail. */
const SEGMENT_TILE_COUNTS = [3, 5, 4, 5, 3, 4, 5, 4, 3];

/** Node centres for a world map (viewBox 0–100). */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  return WINDING_MAP_NODES.slice(0, stageCount);
}

export function buildPathSegments(points: MapPoint[]): MapSegment[] {
  const segments: MapSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const n = SEGMENT_TILE_COUNTS[i] ?? 4;
    const tiles: MapPoint[] = [];
    for (let t = 1; t <= n; t++) {
      const f = t / (n + 1);
      tiles.push({
        x: p0.x + (p1.x - p0.x) * f,
        y: p0.y + (p1.y - p0.y) * f,
      });
    }
    segments.push({ from: i, to: i + 1, tiles });
  }
  return segments;
}

/** Straight segments through stage nodes — round joins keep corners soft. */
export function pathThrough(points: MapPoint[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i]!.x} ${points[i]!.y}`;
  }
  return d;
}

/** How far along the world path the player has reached (0–9, or -1 if before world). */
export function progressIndexInWorld(world: number, currentLevel: number): number {
  const start = toGlobalLevel(world, 1);
  const end = toGlobalLevel(world, STAGES_PER_WORLD);
  if (currentLevel < start) return -1;
  if (currentLevel > end) return STAGES_PER_WORLD - 1;
  return currentLevel - start;
}

export function mapViewBoxHeight(stageCount: number = STAGES_PER_WORLD): number {
  const points = buildWorldMapPoints(stageCount);
  const last = points[points.length - 1];
  return Math.ceil((last?.y ?? 100) + 10);
}

/** Chip accent palette — cycles through stages (pixel-art reference). */
export type ChipPalette = "blue" | "green" | "gold" | "dark" | "red";

export function chipPaletteForStage(stage: number): ChipPalette {
  const palettes: ChipPalette[] = ["blue", "green", "gold", "dark", "red"];
  return palettes[(stage - 1) % palettes.length]!;
}

/** @deprecated Left/center/right layout — winding map ignores sides. */
export function xForSide(side: MapSide): number {
  if (side === "left") return 20;
  if (side === "center") return 50;
  return 80;
}

/** @deprecated */
export function sideForStageIndex(index: number): MapSide {
  return index % 3 === 0 ? "left" : index % 3 === 1 ? "center" : "right";
}
