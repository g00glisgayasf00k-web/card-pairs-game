import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  fetchAdminStats,
  fetchAdminUserDetail,
  fetchAdminUsers,
  fetchAdminMe,
  login,
  type AdminUserRow,
} from "../lib/api";

type View = "login" | "dashboard" | "user";

export function AdminApp() {
  const [view, setView] = useState<View>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [stats, setStats] = useState<{ users: number; scores: number; synced_players: number } | null>(
    null
  );
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<Awaited<ReturnType<typeof fetchAdminUserDetail>> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([fetchAdminStats(), fetchAdminUsers()]);
      setStats(statsRes);
      setUsers(usersRes.users);
      setTotalUsers(usersRes.total);
      setView("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const me = await fetchAdminMe();
      if (!me.is_admin) {
        localStorage.removeItem("token");
        return;
      }
      setAdminName(me.username);
      await loadDashboard();
    } catch {
      localStorage.removeItem("token");
    }
  }, [loadDashboard]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      localStorage.setItem("token", res.token);
      localStorage.setItem("username", res.username);
      const me = await fetchAdminMe();
      if (!me.is_admin) {
        localStorage.removeItem("token");
        throw new Error("This account is not an admin");
      }
      setAdminName(me.username);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setView("login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAdminName(null);
    setView("login");
    setUsers([]);
    setStats(null);
    setUserDetail(null);
    setSelectedUserId(null);
  };

  const openUser = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminUserDetail(userId);
      setUserDetail(detail);
      setSelectedUserId(userId);
      setView("user");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  if (view === "login") {
    return (
      <div className="admin-app">
        <div className="admin-card admin-card--narrow">
          <h1>Royal Match Admin</h1>
          <p className="admin-muted">Sign in with an admin account. Players use the main game URL.</p>
          <form className="admin-form" onSubmit={handleLogin}>
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div>
          <h1>Royal Match Admin</h1>
          <p className="admin-muted">Signed in as {adminName}</p>
        </div>
        <div className="admin-header__actions">
          {view === "user" && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setView("dashboard")}>
              ← Users
            </button>
          )}
          <button type="button" className="admin-btn admin-btn--ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {error && <p className="admin-error admin-error--banner">{error}</p>}

      {view === "dashboard" && stats && (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <span className="admin-stat__val">{stats.users}</span>
              <span className="admin-stat__label">Users</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat__val">{stats.synced_players}</span>
              <span className="admin-stat__label">Cloud saves</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat__val">{stats.scores}</span>
              <span className="admin-stat__label">Scores</span>
            </div>
          </div>

          <div className="admin-card">
            <h2>Players ({totalUsers})</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Level</th>
                    <th>Gems</th>
                    <th>Energy</th>
                    <th>Cleared</th>
                    <th>Scores</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <button type="button" className="admin-link" onClick={() => openUser(u.id)}>
                          {u.username}
                          {u.is_admin ? " · admin" : ""}
                        </button>
                      </td>
                      <td>{u.progress?.level ?? "—"}</td>
                      <td>{u.progress?.credits ?? "—"}</td>
                      <td>{u.progress?.energy ?? "—"}</td>
                      <td>{u.progress?.completed ?? "—"}</td>
                      <td>{u.score_count}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "user" && userDetail && (
        <div className="admin-card">
          <h2>{userDetail.username}</h2>
          <p className="admin-muted">
            Joined {new Date(userDetail.created_at).toLocaleString()}
            {userDetail.is_admin ? " · Admin" : ""}
          </p>

          <h3>Cloud progress</h3>
          {userDetail.progress ? (
            <ul className="admin-kv">
              <li>
                <span>Current level</span>
                <strong>{String(userDetail.progress.level ?? "—")}</strong>
              </li>
              <li>
                <span>Highest unlocked</span>
                <strong>{String(userDetail.progress.highestUnlocked ?? "—")}</strong>
              </li>
              <li>
                <span>Levels cleared</span>
                <strong>{(userDetail.progress.completedLevels as number[] | undefined)?.length ?? 0}</strong>
              </li>
              <li>
                <span>Gems</span>
                <strong>{String(userDetail.progress.credits ?? "—")}</strong>
              </li>
              <li>
                <span>Energy</span>
                <strong>{String(userDetail.progress.energy ?? "—")}</strong>
              </li>
              <li>
                <span>Hands cleared</span>
                <strong>{String(userDetail.progress.handsCleared ?? "—")}</strong>
              </li>
              <li>
                <span>Last sync</span>
                <strong>
                  {userDetail.client_updated_at
                    ? new Date(userDetail.client_updated_at).toLocaleString()
                    : "—"}
                </strong>
              </li>
            </ul>
          ) : (
            <p className="admin-muted">No cloud save yet.</p>
          )}

          <h3>Recent scores</h3>
          {userDetail.scores.length === 0 ? (
            <p className="admin-muted">No scores recorded.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Points</th>
                    <th>Hands</th>
                    <th>Best hand</th>
                    <th>Played</th>
                  </tr>
                </thead>
                <tbody>
                  {userDetail.scores.map((s, i) => (
                    <tr key={`${s.played_at}-${i}`}>
                      <td>{s.points.toLocaleString()}</td>
                      <td>{s.hands_cleared}</td>
                      <td>{s.best_hand}</td>
                      <td>{new Date(s.played_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loading && <p className="admin-muted admin-loading">Loading…</p>}
    </div>
  );
}
