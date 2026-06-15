import { STAGES_PER_WORLD, toGlobalLevel } from "./levelMap";

export type MapSide = "left" | "center" | "right";

export interface MapPoint {
  x: number;
  y: number;
}

/** Horizontal anchor (% of map width) — wider zigzag for island trail. */
export function xForSide(side: MapSide): number {
  if (side === "left") return 22;
  if (side === "center") return 50;
  return 78;
}

export function sideForStageIndex(index: number): MapSide {
  return index % 3 === 0 ? "left" : index % 3 === 1 ? "center" : "right";
}

/** Node centres for a world map (viewBox 0–100). Extra vertical spacing for island platforms. */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const topY = 8;
  const stepY = 10.5;
  return Array.from({ length: stageCount }, (_, i) => ({
    x: xForSide(sideForStageIndex(i)),
    y: topY + i * stepY,
  }));
}

/** Smooth cubic curve through every stage node — rounded S-curves, no sharp corners. */
export function smoothPathThrough(points: MapPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]!;
    const p1 = points[i]!;
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
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
