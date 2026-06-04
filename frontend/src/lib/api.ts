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
  return request<{ token: string; username: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
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

export async function submitScore(payload: {
  points: number;
  hands_cleared: number;
  best_hand: string;
  username?: string | null;
}) {
  const username = payload.username ?? localStorage.getItem("username");
  return request<{ saved: boolean; id?: number; message?: string }>("/api/scores/submit", {
    method: "POST",
    body: JSON.stringify({
      points: payload.points,
      hands_cleared: payload.hands_cleared,
      best_hand: payload.best_hand,
      username: username?.trim() || undefined,
    }),
  });
}
