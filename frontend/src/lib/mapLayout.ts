import { STAGES_PER_WORLD } from "./levelMap";

export type MapSide = "left" | "center" | "right";

export interface MapPoint {
  x: number;
  y: number;
}

/** Horizontal anchor (% of map width). */
export function xForSide(side: MapSide): number {
  if (side === "left") return 28;
  if (side === "center") return 50;
  return 72;
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
 * Poker-table zigzag — matches the reference path (1 top-center → alternate → 10 bottom).
 */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const template: MapPoint[] = [
    { x: 50, y: 10 },
    { x: 72, y: 20 },
    { x: 28, y: 30 },
    { x: 72, y: 40 },
    { x: 28, y: 50 },
    { x: 72, y: 60 },
    { x: 28, y: 70 },
    { x: 72, y: 80 },
    { x: 28, y: 90 },
    { x: 50, y: 100 },
  ];

  if (stageCount === template.length) return template;

  const topY = 10;
  const stepY = 10;
  return Array.from({ length: stageCount }, (_, i) => ({
    x: xForSide(sideForStageIndex(i)),
    y: topY + i * stepY,
  }));
}

export function mapViewBoxHeight(stageCount: number = STAGES_PER_WORLD): number {
  const points = buildWorldMapPoints(stageCount);
  const maxY = points.reduce((m, p) => Math.max(m, p.y), 0);
  return Math.ceil((maxY || 100) + 12);
}

/** SVG polyline points for the dotted path (viewBox 0 0 100 height). */
export function mapPathPolyline(
  stageCount: number = STAGES_PER_WORLD
): string {
  return buildWorldMapPoints(stageCount)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
}
