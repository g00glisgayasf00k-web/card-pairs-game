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
 * overlaps and keep chips + star rows readable at mobile sizes.
 */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const template: MapPoint[] = [
    { x: 22, y: 10 },
    { x: 42, y: 18 },
    { x: 62, y: 26 },
    { x: 78, y: 36 },
    { x: 68, y: 48 },
    { x: 46, y: 56 },
    { x: 26, y: 66 },
    { x: 40, y: 76 },
    { x: 60, y: 86 },
    { x: 78, y: 96 },
  ];

  if (stageCount === template.length) return template;

  const topY = 10;
  const stepY = 9.5;
  return Array.from({ length: stageCount }, (_, i) => ({
    x: xForSide(sideForStageIndex(i)),
    y: topY + i * stepY,
  }));
}

export function mapViewBoxHeight(stageCount: number = STAGES_PER_WORLD): number {
  const points = buildWorldMapPoints(stageCount);
  const maxY = points.reduce((m, p) => Math.max(m, p.y), 0);
  return Math.ceil((maxY || 100) + 16);
}
