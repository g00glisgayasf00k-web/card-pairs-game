import { STAGES_PER_WORLD, toGlobalLevel } from "./levelMap";

export type MapSide = "left" | "center" | "right";

export interface MapPoint {
  x: number;
  y: number;
}

export interface BezierSegment {
  start: MapPoint;
  c1: MapPoint;
  c2: MapPoint;
  end: MapPoint;
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

function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/** Cubic segments for a smooth Catmull-Rom path between each adjacent node. */
export function smoothBezierSegments(points: MapPoint[]): BezierSegment[] {
  if (points.length < 2) return [];

  const segments: BezierSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1]! : points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = i + 2 < points.length ? points[i + 2]! : p2;

    segments.push({
      start: { x: p1.x, y: p1.y },
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      end: { x: p2.x, y: p2.y },
    });
  }
  return segments;
}

/**
 * Segment paths trimmed at both ends so the road visually stops at each chip
 * and restarts after it exits the opposite side.
 */
export function segmentedPathThrough(points: MapPoint[], trim: number = 2.2): string[] {
  const segments = smoothBezierSegments(points);
  return segments.map((seg) => {
    const startTan = normalize(seg.c1.x - seg.start.x, seg.c1.y - seg.start.y);
    const endTan = normalize(seg.end.x - seg.c2.x, seg.end.y - seg.c2.y);

    const s = { x: seg.start.x + startTan.x * trim, y: seg.start.y + startTan.y * trim };
    const e = { x: seg.end.x - endTan.x * trim, y: seg.end.y - endTan.y * trim };
    const c1 = { x: seg.c1.x + startTan.x * trim, y: seg.c1.y + startTan.y * trim };
    const c2 = { x: seg.c2.x - endTan.x * trim, y: seg.c2.y - endTan.y * trim };

    return `M ${s.x} ${s.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${e.x} ${e.y}`;
  });
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
