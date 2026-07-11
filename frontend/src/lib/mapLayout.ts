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
 * Node centres for a world map (viewBox 0–100). Vertical gaps keep chip + star
 * rows from overlapping (especially stages 4 → 5 on the right rail).
 */
export function buildWorldMapPoints(stageCount: number = STAGES_PER_WORLD): MapPoint[] {
  const template: MapPoint[] = [
    { x: 22, y: 8 },
    { x: 44, y: 18 },
    { x: 66, y: 28 },
    { x: 82, y: 40 },
    { x: 52, y: 56 },
    { x: 28, y: 68 },
    { x: 46, y: 80 },
    { x: 68, y: 92 },
    { x: 48, y: 104 },
    { x: 72, y: 116 },
  ];

  if (stageCount === template.length) return template;

  const topY = 8;
  const stepY = 12;
  return Array.from({ length: stageCount }, (_, i) => ({
    x: xForSide(sideForStageIndex(i)),
    y: topY + i * stepY,
  }));
}

export function mapViewBoxHeight(stageCount: number = STAGES_PER_WORLD): number {
  const points = buildWorldMapPoints(stageCount);
  const maxY = points.reduce((m, p) => Math.max(m, p.y), 0);
  return Math.ceil((maxY || 100) + 18);
}
