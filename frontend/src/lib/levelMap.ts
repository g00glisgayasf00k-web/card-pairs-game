import { MAX_LEVEL } from "./levels";

export type LevelNodeState = "locked" | "unlocked" | "completed";

export const WORLDS = 10;
export const STAGES_PER_WORLD = 10;
export const TOTAL_LEVELS = MAX_LEVEL;

export function toGlobalLevel(world: number, stage: number): number {
  return (world - 1) * STAGES_PER_WORLD + stage;
}

export function fromGlobalLevel(global: number): { world: number; stage: number } {
  const clamped = Math.min(Math.max(1, Math.floor(global)), TOTAL_LEVELS);
  const world = Math.ceil(clamped / STAGES_PER_WORLD);
  const stage = ((clamped - 1) % STAGES_PER_WORLD) + 1;
  return { world, stage };
}

export function formatLevelId(global: number): string {
  const { world, stage } = fromGlobalLevel(global);
  return `${world}-${stage}`;
}

export function worldTitle(world: number): string {
  return `Beginner ${world}`;
}

export function allWorlds(): number[] {
  return Array.from({ length: WORLDS }, (_, i) => i + 1);
}

export function stagesInWorld(_world: number): number[] {
  return Array.from({ length: STAGES_PER_WORLD }, (_, i) => i + 1);
}
