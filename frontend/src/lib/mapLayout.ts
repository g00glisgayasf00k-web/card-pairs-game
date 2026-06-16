import { STAGES_PER_WORLD } from "./levelMap";

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
 * overlaps and keep chips readable at mobile sizes.
 */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const template: MapPoint[] = [
    { x: 20, y: 12 },
    { x: 38, y: 18 },
    { x: 58, y: 22 },
    { x: 78, y: 27 },
    { x: 82, y: 37 },
    { x: 64, y: 46 },
    { x: 40, y: 50 },
    { x: 24, y: 60 },
    { x: 48, y: 70 },
    { x: 76, y: 78 },
  ];

  if (stageCount === template.length) return template;

  const topY = 12;
  const stepY = 7.5;
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
