import type { ChallengeDto } from "./api";

const KEY = "rpm_seen_challenge_results";

function myAttempt(c: ChallengeDto) {
  return c.you_are === "challenger" ? c.challenger_result : c.opponent_result;
}

export function readSeenChallengeResultIds(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n): n is number => typeof n === "number"));
  } catch {
    return new Set();
  }
}

export function markChallengeResultsSeen(ids: number[]): void {
  if (ids.length === 0) return;
  const seen = readSeenChallengeResultIds();
  let changed = false;
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      changed = true;
    }
  }
  if (!changed) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

/** Completed challenges the player has scored on but not opened in Results yet. */
export function countUnseenCompletedResults(
  challenges: ChallengeDto[],
  kind: "friend" | "quick" | "any" = "friend"
): number {
  const seen = readSeenChallengeResultIds();
  return challenges.filter((c) => {
    if (kind !== "any" && (c.kind ?? "friend") !== kind) return false;
    if (c.status !== "completed") return false;
    if (!myAttempt(c)) return false;
    return !seen.has(c.id);
  }).length;
}

export function resultIdsToMarkSeen(
  challenges: ChallengeDto[],
  kind: "friend" | "quick" | "any" = "friend"
): number[] {
  return challenges
    .filter((c) => {
      if (kind !== "any" && (c.kind ?? "friend") !== kind) return false;
      if (!myAttempt(c)) return false;
      return c.status === "completed" || c.status === "active" || c.status === "expired";
    })
    .map((c) => c.id);
}
