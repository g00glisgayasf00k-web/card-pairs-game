import { STAGES_PER_WORLD } from "./levelMap";

export type MapSide = "left" | "center" | "right";

export interface MapPoint {
  x: number;
  y: number;
}

/** Horizontal anchor (% of map width) — tuned lanes for clean chip spacing. */
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
 * Clean serpentine path — even vertical rhythm so stars never collide.
 */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const template: MapPoint[] = [
    { x: 50, y: 9 },
    { x: 74, y: 20 },
    { x: 28, y: 31 },
    { x: 74, y: 42 },
    { x: 28, y: 53 },
    { x: 74, y: 64 },
    { x: 28, y: 75 },
    { x: 74, y: 86 },
    { x: 28, y: 97 },
    { x: 50, y: 108 },
  ];

  if (stageCount === template.length) return template;

  const topY = 9;
  const stepY = 11;
  return Array.from({ length: stageCount }, (_, i) => ({
    x: xForSide(sideForStageIndex(i)),
    y: topY + i * stepY,
  }));
}

export function mapViewBoxHeight(stageCount: number = STAGES_PER_WORLD): number {
  const points = buildWorldMapPoints(stageCount);
  const maxY = points.reduce((m, p) => Math.max(m, p.y), 0);
  return Math.ceil((maxY || 100) + 14);
}
