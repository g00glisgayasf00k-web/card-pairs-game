const API_BASE = import.meta.env.VITE_API_URL ?? "";

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers(), ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as T;
}

export async function register(username: string, password: string) {
  return request<{ token: string; username: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string) {
  return request<{ token: string; username: string; email?: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function loginWithGoogle(credential: string) {
  return request<{ token: string; username: string; email?: string }>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export async function fetchLeaderboard(limit = 20) {
  return request<{
    leaderboard: {
      username: string;
      points: number;
      hands_cleared: number;
      best_hand: string;
      played_at: string;
    }[];
  }>(`/api/scores/leaderboard?limit=${limit}`);
}

export interface LeaderboardScoreRow {
  user_id?: number;
  username: string;
  points: number;
  hands_cleared: number;
  best_hand: string;
  played_at: string;
}

export interface LeaderboardLevelRow {
  user_id: number;
  username: string;
  level: number;
  highest_unlocked: number;
  completed: number;
  stars_total: number;
}

export interface LeaderboardHandRow {
  user_id: number;
  username: string;
  count: number;
}

export interface LeaderboardsPayload {
  top_scores: LeaderboardScoreRow[];
  highest_level: LeaderboardLevelRow[];
  hand_leaders: Record<string, LeaderboardHandRow[]>;
}

export async function fetchLeaderboards(limit = 10) {
  return request<LeaderboardsPayload>(`/api/scores/leaderboards?limit=${limit}`);
}

export async function submitScore(payload: {
  points: number;
  hands_cleared: number;
  best_hand: string;
}) {
  return request<{ saved: boolean; id?: number; message?: string }>("/api/scores/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetMyScores() {
  return request<{ reset: boolean }>("/api/scores/me", { method: "DELETE" });
}

export interface RemoteProgressResponse {
  progress: Record<string, unknown> | null;
  client_updated_at: number;
  server_updated_at?: string;
  saved?: boolean;
  reason?: string;
}

export async function fetchMyProgress() {
  return request<RemoteProgressResponse>("/api/progress/me");
}

export async function syncProgressToServer(progress: Record<string, unknown>) {
  return request<RemoteProgressResponse & { saved: boolean }>("/api/progress/sync", {
    method: "POST",
    body: JSON.stringify({
      progress,
      client_updated_at: progress.updatedAt ?? Date.now(),
    }),
  });
}

export async function fetchAdminMe() {
  return request<{ username: string; is_admin: boolean }>("/api/admin/me");
}

export async function fetchAdminStats() {
  return request<{
    users: number;
    players: number;
    scores: number;
    db_backend?: string;
    synced_players: number;
    signups_7d: number;
    scores_7d: number;
    users_pending_sync?: number;
    recent_scores: {
      username: string;
      points: number;
      hands_cleared: number;
      best_hand: string;
      played_at: string;
    }[];
    recent_signups: { id: number; username: string; created_at: string }[];
  }>("/api/admin/stats");
}

export async function fetchAdminLeaderboard(limit = 25) {
  return request<{
    leaderboard: LeaderboardScoreRow[];
  }>(`/api/admin/leaderboard?limit=${limit}`);
}

export async function fetchAdminLeaderboards(limit = 10) {
  return request<LeaderboardsPayload>(`/api/admin/leaderboards?limit=${limit}`);
}

export interface AdminUserRow {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string | null;
  score_count: number;
  has_synced?: boolean;
  progress: {
    level?: number;
    credits?: number;
    energy?: number;
    completed?: number;
    highest_unlocked?: number;
    stars_total?: number;
    hands_cleared?: number;
    client_updated_at?: number;
  } | null;
}

export async function fetchAdminUsers(offset = 0, limit = 25, query = "") {
  const q = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
  return request<{ users: AdminUserRow[]; total: number; offset: number; limit: number }>(
    `/api/admin/users?offset=${offset}&limit=${limit}${q}`
  );
}

export async function fetchAdminUserDetail(userId: number) {
  return request<{
    id: number;
    username: string;
    is_admin: boolean;
    created_at: string;
    progress: Record<string, unknown> | null;
    progress_summary: AdminUserRow["progress"];
    client_updated_at: number;
    best_score: number | null;
    scores: {
      points: number;
      hands_cleared: number;
      best_hand: string;
      played_at: string;
    }[];
  }>(`/api/admin/users/${userId}`);
}
