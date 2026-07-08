import {
  fetchMyProgress,
  resetMyScores,
  syncProgressToServer,
  type RemoteProgressResponse,
} from "./api";
import {
  applyImportedProgress,
  clearProgress,
  defaultProgress,
  getProgressOwner,
  isFreshAccountProgress,
  loadProgress,
  saveProgress,
  setProgressOwner,
  setProgressSyncHook,
  type SavedProgress,
} from "./progress";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pullInterval: ReturnType<typeof setInterval> | null = null;
let syncing = false;
/** Bumped on sign-out / account switch so stale pulls cannot repopulate local storage. */
let pullGeneration = 0;

const PULL_INTERVAL_MS = 45_000;

function isPullStale(generation: number): boolean {
  return generation !== pullGeneration;
}

export function invalidateProgressPulls(): void {
  pullGeneration += 1;
}

function hasAuthToken(): boolean {
  return Boolean(localStorage.getItem("token"));
}

function queueSync(payload: SavedProgress): void {
  if (!hasAuthToken()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void pushProgress(payload);
  }, 800);
}

async function pushProgress(payload?: SavedProgress): Promise<void> {
  if (!hasAuthToken() || syncing) return;
  const progress = payload ?? loadProgress();
  if (!progress) return;

  syncing = true;
  try {
    const res = await syncProgressToServer(progress);
    if (!res.saved && res.reason === "server_newer" && res.progress) {
      applyImportedProgress(res.progress);
    }
  } catch {
    /* offline or server down — local save still works */
  } finally {
    syncing = false;
  }
}

export async function pullRemoteProgress(): Promise<boolean> {
  if (!hasAuthToken()) return false;

  const generation = pullGeneration;

  try {
    const remote = await fetchMyProgress();
    if (isPullStale(generation)) return false;

    const local = loadProgress();

    if (!remote.progress) {
      clearProgress();
      const fresh = defaultProgress();
      saveProgress(fresh, { skipSync: true });
      if (!isPullStale(generation)) {
        try {
          await resetMyScores();
        } catch {
          /* offline — local fresh save still applies */
        }
        await pushProgress(fresh);
      }
      return true;
    }

    const remoteTs = remote.client_updated_at ?? 0;
    const localTs = local?.updatedAt ?? 0;

    if (!local || remoteTs > localTs) {
      if (isPullStale(generation)) return false;
      return applyImportedProgress(remote.progress);
    }

    if (localTs > remoteTs && !isPullStale(generation)) {
      await pushProgress(local);
    }
    return false;
  } catch {
    return false;
  }
}

function onFocusPull(): void {
  void pullRemoteProgress();
}

function onVisibilityPull(): void {
  if (document.visibilityState === "visible") {
    void pullRemoteProgress();
  }
}

export function initProgressSync(): void {
  setProgressSyncHook(queueSync);
  void pullRemoteProgress();
  pullInterval = setInterval(() => {
    void pullRemoteProgress();
  }, PULL_INTERVAL_MS);
  window.addEventListener("focus", onFocusPull);
  document.addEventListener("visibilitychange", onVisibilityPull);
}

/** Drop local save when switching to a different account. */
export function prepareProgressForAccount(username: string): void {
  if (getProgressOwner() !== username) {
    invalidateProgressPulls();
    clearProgress();
  }
}

/** Run after login/signup once the session token is stored. */
export async function beginAccountSession(
  username: string,
  options: { isNewAccount: boolean }
): Promise<void> {
  if (options.isNewAccount) {
    invalidateProgressPulls();
    clearProgress();
    try {
      await resetMyScores();
    } catch {
      /* new account may have no scores yet */
    }
  } else {
    prepareProgressForAccount(username);
  }

  await pullRemoteProgress();

  if (options.isNewAccount && !loadProgress()) {
    saveProgress(defaultProgress(), { skipSync: true });
  }

  await flushProgressSync();
  setProgressOwner(username);

  const saved = loadProgress();
  if (saved && isFreshAccountProgress(saved)) {
    try {
      await resetMyScores();
    } catch {
      /* offline */
    }
  }
}

export function stopProgressSync(): void {
  invalidateProgressPulls();
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  if (pullInterval) {
    clearInterval(pullInterval);
    pullInterval = null;
  }
  window.removeEventListener("focus", onFocusPull);
  document.removeEventListener("visibilitychange", onVisibilityPull);
  setProgressSyncHook(null);
}

export function flushProgressSync(): Promise<void> {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  return pushProgress();
}

export type { RemoteProgressResponse };
