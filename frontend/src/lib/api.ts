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

export async function register(username: string, password: string, email?: string) {
  return request<{ token: string; username: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password, ...(email ? { email } : {}) }),
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

export async function forgotPassword(identifier: string) {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export async function resetPassword(token: string, password: string) {
  return request<{ message: string; username?: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
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
  most_stars?: LeaderboardLevelRow[];
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
  return request<{ username: string; is_admin: boolean; user_id: number }>("/api/admin/me");
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
    email: string | null;
    has_google: boolean;
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

export async function resetAdminUser(userId: number) {
  return request<{ reset: boolean; username: string }>(`/api/admin/users/${userId}/reset`, {
    method: "POST",
  });
}

export async function deleteAdminUser(userId: number) {
  return request<{ deleted: boolean; username: string }>(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}

export async function grantAdminUserResources(
  userId: number,
  body: { gems?: number; energy?: number }
) {
  return request<{
    granted: boolean;
    username: string;
    gems_added: number;
    energy_added: number;
    progress_summary: AdminUserRow["progress"];
    client_updated_at: number;
  }>(`/api/admin/users/${userId}/grant`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function setAdminUserRole(userId: number, isAdmin: boolean) {
  return request<{ updated: boolean; username: string; is_admin: boolean }>(
    `/api/admin/users/${userId}/admin`,
    {
      method: "POST",
      body: JSON.stringify({ is_admin: isAdmin }),
    }
  );
}

export async function resetAdminUserPassword(userId: number, password?: string) {
  return request<{ reset: boolean; username: string; temporary_password: string }>(
    `/api/admin/users/${userId}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify(password ? { password } : {}),
    }
  );
}

// ── Friends & challenges ─────────────────────────────────────────────────────

export interface FriendUser {
  id: number;
  username: string;
}

export interface FriendshipItem {
  id: number;
  user: FriendUser;
  status: string;
  created_at: string;
}

export async function fetchFriends() {
  return request<{
    friends: FriendshipItem[];
    incoming: FriendshipItem[];
    outgoing: FriendshipItem[];
  }>("/api/friends");
}

export async function requestFriend(username: string) {
  return request<{ friendship: FriendshipItem }>("/api/friends/request", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function acceptFriend(friendshipId: number) {
  return request<{ friendship: FriendshipItem }>(`/api/friends/${friendshipId}/accept`, {
    method: "POST",
  });
}

export async function declineFriend(friendshipId: number) {
  return request<{ ok: boolean }>(`/api/friends/${friendshipId}/decline`, {
    method: "POST",
  });
}

export interface ChallengeAttempt {
  stars: number;
  moves: number;
  score: number;
  submitted_at: string | null;
}

export interface ChallengeMissionDto {
  goals: Array<{
    hand: string;
    minCount: number;
    ranks?: string[];
    suit?: string;
  }>;
  target_points: number;
  star_move_limits: { one: number; two: number; three: number };
  move_limit: number;
  challenge_points?: number;
  challenge_hands?: number;
}

export interface ChallengeDto {
  id: number;
  level: number;
  board_seed: number;
  status: string;
  kind?: "friend" | "quick" | string;
  wager_gems: number;
  expires_at: string;
  /** Random duel goals + move budget; omit on legacy challenges. */
  mission?: ChallengeMissionDto | null;
  challenger: FriendUser | null;
  opponent: FriendUser | null;
  you_are: "challenger" | "opponent";
  challenger_result: ChallengeAttempt | null;
  opponent_result: ChallengeAttempt | null;
  winner_user_id: number | null;
  created_at: string;
}

export async function fetchChallenges() {
  return request<{ challenges: ChallengeDto[] }>("/api/challenges");
}

export async function createChallenge(friendUserId: number) {
  return request<{ challenge: ChallengeDto }>("/api/challenges", {
    method: "POST",
    body: JSON.stringify({ friend_user_id: friendUserId }),
  });
}

export async function fetchChallenge(id: number) {
  return request<{ challenge: ChallengeDto }>(`/api/challenges/${id}`);
}

export async function acceptChallenge(id: number) {
  return request<{ challenge: ChallengeDto }>(`/api/challenges/${id}/accept`, {
    method: "POST",
  });
}

export async function declineChallenge(id: number) {
  return request<{ challenge: ChallengeDto }>(`/api/challenges/${id}/decline`, {
    method: "POST",
  });
}

export async function submitChallenge(
  id: number,
  payload: { stars: number; moves: number; score: number }
) {
  const res = await fetch(`${API_BASE}/api/challenges/${id}/submit`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    challenge?: ChallengeDto;
  };
  // Already submitted / expired still include the locked-in challenge for the results UI
  if (data.challenge && (res.ok || res.status === 409)) {
    return { challenge: data.challenge };
  }
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  throw new Error("Challenge response missing");
}

export type MatchmakingStatus = "idle" | "waiting" | "matched";

export async function joinQuickMatch() {
  return request<{ status: MatchmakingStatus; ticket_id?: number; challenge?: ChallengeDto }>(
    "/api/matchmaking/quick",
    { method: "POST" }
  );
}

export async function pollQuickMatch() {
  return request<{ status: MatchmakingStatus; ticket_id?: number; challenge?: ChallengeDto }>(
    "/api/matchmaking/quick"
  );
}

export async function leaveQuickMatch() {
  return request<{ ok: boolean }>("/api/matchmaking/quick", { method: "DELETE" });
}

export interface NotificationSummary {
  friend_requests: number;
  challenges: number;
  total: number;
}

export async function fetchNotificationSummary() {
  return request<NotificationSummary>("/api/notifications/summary");
}

export async function registerDeviceToken(token: string, platform: string) {
  return request<{ ok: boolean }>("/api/notifications/devices", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

export async function unregisterDeviceToken(token: string) {
  return request<{ ok: boolean }>("/api/notifications/devices", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}

