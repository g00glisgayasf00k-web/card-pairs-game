import { STAGES_PER_WORLD, toGlobalLevel } from "./levelMap";

export type MapSide = "left" | "center" | "right";

export interface MapPoint {
  x: number;
  y: number;
}

/** Horizontal anchor (% of map width) — matches chip positions. */
export function xForSide(side: MapSide): number {
  if (side === "left") return 20;
  if (side === "center") return 50;
  return 80;
}

export function sideForStageIndex(index: number): MapSide {
  return index % 3 === 0 ? "left" : index % 3 === 1 ? "center" : "right";
}

/** Node centres for a world map (viewBox 0–100). */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const topY = 6;
  const stepY = 9.2;
  return Array.from({ length: stageCount }, (_, i) => ({
    x: xForSide(sideForStageIndex(i)),
    y: topY + i * stepY,
  }));
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
  return Math.ceil((last?.y ?? 100) + 8);
}
