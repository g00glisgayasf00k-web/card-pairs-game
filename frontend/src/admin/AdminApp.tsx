import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  fetchAdminLeaderboards,
  fetchAdminStats,
  fetchAdminUserDetail,
  fetchAdminUsers,
  fetchAdminMe,
  login,
  type AdminUserRow,
  type LeaderboardsPayload,
} from "../lib/api";
import { HAND_DISPLAY, HAND_SCORE_LIST, type HandLabel } from "../lib/pokerHands";

type Tab = "overview" | "players" | "leaderboard";

const PAGE_SIZE = 25;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchAdminStats>> | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userOffset, setUserOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [leaderboards, setLeaderboards] = useState<LeaderboardsPayload | null>(null);
  const [leaderboardView, setLeaderboardView] = useState<"scores" | "level" | "hands">("scores");

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<Awaited<ReturnType<typeof fetchAdminUserDetail>> | null>(
    null
  );

  const loadStats = useCallback(async () => {
    const data = await fetchAdminStats();
    setStats(data);
  }, []);

  const loadUsers = useCallback(async (offset: number, query: string) => {
    const data = await fetchAdminUsers(offset, PAGE_SIZE, query);
    setUsers(data.users);
    setTotalUsers(data.total);
    setUserOffset(data.offset);
  }, []);

  const loadLeaderboards = useCallback(async () => {
    const data = await fetchAdminLeaderboards(15);
    setLeaderboards(data);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadUsers(0, search), loadLeaderboards()]);
      setAuthed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadUsers, loadLeaderboards, search]);

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
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
    setAdminName(null);
    setStats(null);
    setUsers([]);
    setUserDetail(null);
    setSelectedUserId(null);
    setTab("overview");
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "overview") await loadStats();
      if (tab === "players" || tab === "overview") await loadUsers(userOffset, search);
      if (tab === "leaderboard" || tab === "overview") await loadLeaderboards();
      if (selectedUserId) {
        setUserDetail(await fetchAdminUserDetail(selectedUserId));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  const openUser = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      setUserDetail(await fetchAdminUserDetail(userId));
      setSelectedUserId(userId);
      setTab("players");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const closeUser = () => {
    setUserDetail(null);
    setSelectedUserId(null);
  };

  const runSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    void loadUsers(0, searchInput.trim());
  };

  if (!authed) {
    return (
      <div className="admin-shell admin-shell--login">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <span className="admin-login-brand__icon">♠</span>
            <div>
              <h1>Royal Match</h1>
              <p>Admin console</p>
            </div>
          </div>
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
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="admin-login-foot">Players use the main game URL — not this page.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const currentPage = Math.floor(userOffset / PAGE_SIZE) + 1;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span>♠</span>
          <div>
            <strong>Royal Match</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          <button
            type="button"
            className={`admin-nav__item${tab === "overview" ? " admin-nav__item--active" : ""}`}
            onClick={() => { closeUser(); setTab("overview"); }}
          >
            Overview
          </button>
          <button
            type="button"
            className={`admin-nav__item${tab === "players" ? " admin-nav__item--active" : ""}`}
            onClick={() => { closeUser(); setTab("players"); }}
          >
            Players
          </button>
          <button
            type="button"
            className={`admin-nav__item${tab === "leaderboard" ? " admin-nav__item--active" : ""}`}
            onClick={() => { closeUser(); setTab("leaderboard"); }}
          >
            Leaderboard
          </button>
        </nav>
        <div className="admin-sidebar__foot">
          <span className="admin-sidebar__user">{adminName}</span>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>
              {tab === "overview" && "Overview"}
              {tab === "players" && (userDetail ? userDetail.username : "Players")}
              {tab === "leaderboard" && "Leaderboard"}
            </h1>
            <p className="admin-muted">
              {tab === "overview" && "Live stats from your game database"}
              {tab === "players" && !userDetail && `${totalUsers} accounts (${Math.max(0, totalUsers - 1)} players + admin)`}
              {tab === "players" && userDetail && `Joined ${fmtDate(userDetail.created_at)}`}
              {tab === "leaderboard" && "Top scores across all players"}
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error && <p className="admin-error admin-error--banner">{error}</p>}

        {tab === "overview" && stats && (
          <>
            <div className="admin-stat-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-card__val">{stats.players}</span>
                <span className="admin-stat-card__label">Registered players</span>
                <span className="admin-stat-card__sub">+{stats.signups_7d} this week</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-card__val">{stats.users}</span>
                <span className="admin-stat-card__label">Total accounts</span>
                <span className="admin-stat-card__sub">Includes admin</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-card__val">{stats.synced_players}</span>
                <span className="admin-stat-card__label">Cloud saves</span>
                <span className="admin-stat-card__sub">Progress on server</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-card__val">{stats.users_pending_sync ?? 0}</span>
                <span className="admin-stat-card__label">Awaiting first sync</span>
                <span className="admin-stat-card__sub">New accounts — play once to sync</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-card__val">{stats.scores}</span>
                <span className="admin-stat-card__label">Scores logged</span>
                <span className="admin-stat-card__sub">+{stats.scores_7d} this week</span>
              </div>
            </div>

            <div className="admin-split">
              <section className="admin-panel">
                <h2>Recent signups</h2>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_signups.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <button type="button" className="admin-link" onClick={() => openUser(u.id)}>
                              {u.username}
                            </button>
                          </td>
                          <td>{fmtShortDate(u.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="admin-panel">
                <h2>Recent scores</h2>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Pts</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_scores.map((s, i) => (
                        <tr key={`${s.username}-${s.played_at}-${i}`}>
                          <td>{s.username}</td>
                          <td className="admin-num">{s.points.toLocaleString()}</td>
                          <td>{fmtShortDate(s.played_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}

        {tab === "players" && !userDetail && (
          <section className="admin-panel">
            <form className="admin-search" onSubmit={runSearch}>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by username…"
              />
              <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm">Search</button>
              {search && (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                    void loadUsers(0, "");
                  }}
                >
                  Clear
                </button>
              )}
            </form>

            {users.length === 0 && (
              <p className="admin-muted admin-empty-hint">
                No accounts yet. Players appear here after they sign up on the live game site (same URL as admin, not localhost).
              </p>
            )}

            {users.length === 1 && users[0]?.is_admin && (
              <p className="admin-muted admin-empty-hint">
                Only the admin account exists. New sign-ups on the deployed game URL will appear here. If you tested locally, those accounts live in your local database, not production.
              </p>
            )}

            <div className="admin-table-wrap">
              <table className="admin-table admin-table--players">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Sync</th>
                    <th>Level</th>
                    <th>Cleared</th>
                    <th>Stars</th>
                    <th>Gems</th>
                    <th>Energy</th>
                    <th>Scores</th>
                    <th>Last sync</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <button type="button" className="admin-link" onClick={() => openUser(u.id)}>
                          {u.username}
                          {u.is_admin && <span className="admin-badge">admin</span>}
                        </button>
                      </td>
                      <td>
                        {u.has_synced ? (
                          <span className="admin-badge admin-badge--ok">Synced</span>
                        ) : (
                          <span className="admin-badge admin-badge--pending">Pending</span>
                        )}
                      </td>
                      <td>{u.progress?.level ?? "—"}</td>
                      <td>{u.progress?.completed ?? "—"}</td>
                      <td>{u.progress?.stars_total ?? "—"}</td>
                      <td>{u.progress?.credits ?? "—"}</td>
                      <td>{u.progress?.energy ?? "—"}</td>
                      <td>{u.score_count}</td>
                      <td>
                        {u.progress?.client_updated_at
                          ? fmtShortDate(new Date(u.progress.client_updated_at).toISOString())
                          : "—"}
                      </td>
                      <td>{u.created_at ? fmtShortDate(u.created_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalUsers > PAGE_SIZE && (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  disabled={userOffset === 0 || loading}
                  onClick={() => void loadUsers(Math.max(0, userOffset - PAGE_SIZE), search)}
                >
                  ← Prev
                </button>
                <span className="admin-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                  disabled={userOffset + PAGE_SIZE >= totalUsers || loading}
                  onClick={() => void loadUsers(userOffset + PAGE_SIZE, search)}
                >
                  Next →
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "players" && userDetail && (
          <section className="admin-panel">
            <button type="button" className="admin-back" onClick={closeUser}>
              ← Back to players
            </button>

            <div className="admin-user-hero">
              <div>
                <h2>{userDetail.username}</h2>
                <p className="admin-muted">
                  ID {userDetail.id}
                  {userDetail.is_admin ? " · Administrator" : ""}
                  {userDetail.best_score != null && ` · Best score ${userDetail.best_score.toLocaleString()}`}
                </p>
              </div>
            </div>

            <h3>Campaign progress</h3>
            {userDetail.progress_summary ? (
              <div className="admin-detail-grid">
                <div className="admin-detail-tile">
                  <span>Current level</span>
                  <strong>{userDetail.progress_summary.level ?? "—"}</strong>
                </div>
                <div className="admin-detail-tile">
                  <span>Highest unlocked</span>
                  <strong>{userDetail.progress_summary.highest_unlocked ?? "—"}</strong>
                </div>
                <div className="admin-detail-tile">
                  <span>Levels cleared</span>
                  <strong>{userDetail.progress_summary.completed ?? 0}</strong>
                </div>
                <div className="admin-detail-tile">
                  <span>Total stars</span>
                  <strong>{userDetail.progress_summary.stars_total ?? 0}</strong>
                </div>
                <div className="admin-detail-tile">
                  <span>Gems</span>
                  <strong>{userDetail.progress_summary.credits ?? 0}</strong>
                </div>
                <div className="admin-detail-tile">
                  <span>Energy</span>
                  <strong>{userDetail.progress_summary.energy ?? "—"}</strong>
                </div>
                <div className="admin-detail-tile">
                  <span>Hands cleared</span>
                  <strong>{userDetail.progress_summary.hands_cleared ?? 0}</strong>
                </div>
                <div className="admin-detail-tile">
                  <span>Last sync</span>
                  <strong>
                    {userDetail.client_updated_at
                      ? fmtDate(new Date(userDetail.client_updated_at).toISOString())
                      : "—"}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="admin-muted">No cloud save on record.</p>
            )}

            <h3>Score history</h3>
            {userDetail.scores.length === 0 ? (
              <p className="admin-muted">No scores yet.</p>
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
                        <td className="admin-num">{s.points.toLocaleString()}</td>
                        <td>{s.hands_cleared}</td>
                        <td>{s.best_hand}</td>
                        <td>{fmtDate(s.played_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === "leaderboard" && leaderboards && (
          <section className="admin-panel">
            <div className="admin-leaderboard-tabs">
              <button
                type="button"
                className={`admin-btn admin-btn--sm${leaderboardView === "scores" ? " admin-btn--primary" : " admin-btn--ghost"}`}
                onClick={() => setLeaderboardView("scores")}
              >
                Top scores
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn--sm${leaderboardView === "level" ? " admin-btn--primary" : " admin-btn--ghost"}`}
                onClick={() => setLeaderboardView("level")}
              >
                Highest level
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn--sm${leaderboardView === "hands" ? " admin-btn--primary" : " admin-btn--ghost"}`}
                onClick={() => setLeaderboardView("hands")}
              >
                Hand masters
              </button>
            </div>

            {leaderboardView === "scores" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Best score</th>
                      <th>Hands</th>
                      <th>Best hand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboards.top_scores.map((row, i) => (
                      <tr key={`${row.user_id}-${i}`}>
                        <td>{i + 1}</td>
                        <td>
                          {row.user_id ? (
                            <button type="button" className="admin-link" onClick={() => openUser(row.user_id!)}>
                              {row.username}
                            </button>
                          ) : (
                            row.username
                          )}
                        </td>
                        <td className="admin-num">{row.points.toLocaleString()}</td>
                        <td>{row.hands_cleared}</td>
                        <td>{HAND_DISPLAY[row.best_hand as HandLabel] ?? row.best_hand}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {leaderboardView === "level" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Level</th>
                      <th>Cleared</th>
                      <th>Stars</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboards.highest_level.map((row, i) => (
                      <tr key={`${row.user_id}-${i}`}>
                        <td>{i + 1}</td>
                        <td>
                          <button type="button" className="admin-link" onClick={() => openUser(row.user_id)}>
                            {row.username}
                          </button>
                        </td>
                        <td>{row.level}</td>
                        <td>{row.completed}</td>
                        <td>{row.stars_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {leaderboardView === "hands" && (
              <div className="admin-hand-leaders">
                {HAND_SCORE_LIST.map(({ hand }) => {
                  const leaders = leaderboards.hand_leaders[hand] ?? [];
                  return (
                    <div key={hand} className="admin-hand-leader-card">
                      <h3>{HAND_DISPLAY[hand]}</h3>
                      {leaders.length === 0 ? (
                        <p className="admin-muted">No synced data</p>
                      ) : (
                        <ol>
                          {leaders.map((row, i) => (
                            <li key={`${row.user_id}-${i}`}>
                              <button type="button" className="admin-link" onClick={() => openUser(row.user_id)}>
                                {row.username}
                              </button>
                              <span className="admin-num">{row.count}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
