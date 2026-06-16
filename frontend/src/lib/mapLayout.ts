import { STAGES_PER_WORLD, toGlobalLevel } from "./levelMap";

export type MapSide = "left" | "center" | "right";

export interface MapPoint {
  x: number;
  y: number;
}

/** Horizontal anchor (% of map width) — tuned lanes for clean chip spacing. */
export function xForSide(side: MapSide): number {
  if (side === "left") return 30;
  if (side === "center") return 50;
  return 70;
}

const LANE_SEQUENCE: MapSide[] = [
  "center",
  "right",
  "left",
  "right",
  "left",
  "right",
  "left",
  "right",
  "left",
  "center",
];

export function sideForStageIndex(index: number): MapSide {
  if (index < LANE_SEQUENCE.length) return LANE_SEQUENCE[index]!;
  return index % 2 === 0 ? "left" : "right";
}

/**
 * Node centres for a world map (viewBox 0–100). Explicit lane positions avoid
 * overlaps and keep the route readable at mobile sizes.
 */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const topY = 8;
  const stepY = 9.4;
  return Array.from({ length: stageCount }, (_, i) => ({
    x: xForSide(sideForStageIndex(i)),
    y: topY + i * stepY,
  }));
}

/**
 * Smooth Catmull-Rom spline converted to cubic Bezier so the path naturally
 * passes through every chip center without hard elbows.
 */
export function smoothPathThrough(points: MapPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1]! : points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = i + 2 < points.length ? points[i + 2]! : p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

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
  return Math.ceil((last?.y ?? 100) + 12);
}
