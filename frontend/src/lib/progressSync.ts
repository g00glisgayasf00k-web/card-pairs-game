import {
  fetchMyProgress,
  syncProgressToServer,
  type RemoteProgressResponse,
} from "./api";
import {
  applyImportedProgress,
  loadProgress,
  saveProgress,
  setProgressSyncHook,
  type SavedProgress,
} from "./progress";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;

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

  try {
    const remote = await fetchMyProgress();
    const local = loadProgress();

    if (!remote.progress) {
      if (local) await pushProgress(local);
      return false;
    }

    const remoteTs = remote.client_updated_at ?? 0;
    const localTs = local?.updatedAt ?? 0;

    if (!local || remoteTs > localTs) {
      return applyImportedProgress(remote.progress);
    }

    if (localTs > remoteTs) {
      await pushProgress(local);
    }
    return false;
  } catch {
    return false;
  }
}

export function initProgressSync(): void {
  setProgressSyncHook(queueSync);
  void pullRemoteProgress();
}

export function flushProgressSync(): Promise<void> {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  return pushProgress();
}

export type { RemoteProgressResponse };
