import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  deleteAdminUser,
  fetchAdminLeaderboards,
  fetchAdminStats,
  fetchAdminUserDetail,
  fetchAdminUsers,
  fetchAdminMe,
  grantAdminUserResources,
  login,
  resetAdminUser,
  resetAdminUserPassword,
  setAdminUserRole,
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
  const [adminUserId, setAdminUserId] = useState<number | null>(null);
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
  const [grantGems, setGrantGems] = useState("100");
  const [grantEnergy, setGrantEnergy] = useState("5");
  const [tempPassword, setTempPassword] = useState("");
  const [issuedTempPassword, setIssuedTempPassword] = useState<string | null>(null);

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
      setAdminUserId(me.user_id);
      await loadDashboard();
    } catch {
      localStorage.removeItem("token");
    }
  }, [loadDashboard]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!authed) return;
    if (tab !== "players" && tab !== "overview") return;
    const id = window.setInterval(() => {
      void loadStats();
      void loadUsers(userOffset, search);
    }, 20000);
    return () => window.clearInterval(id);
  }, [authed, tab, userOffset, search, loadStats, loadUsers]);

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
      setAdminUserId(me.user_id);
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
    setAdminUserId(null);
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
    setIssuedTempPassword(null);
    setTempPassword("");
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
    setIssuedTempPassword(null);
    setTempPassword("");
  };

  const runSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    void loadUsers(0, searchInput.trim());
  };

  const canModerate = (userId: number) =>
    adminUserId !== null && userId !== adminUserId;

  const canManageRole = (userId: number) =>
    adminUserId !== null && userId !== adminUserId;

  const handleToggleAdmin = async (userId: number, name: string, makeAdmin: boolean) => {
    if (
      !window.confirm(
        makeAdmin
          ? `Make "${name}" an admin?\n\nThey will get full access to this console — including managing players and other admins.`
          : `Revoke admin access for "${name}"?\n\nThey become a regular player and lose access to this console.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setAdminUserRole(userId, makeAdmin);
      if (selectedUserId === userId) {
        setUserDetail(await fetchAdminUserDetail(userId));
      }
      await loadUsers(userOffset, search);
      await loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update admin status");
    } finally {
      setLoading(false);
    }
  };

  const handleResetUser = async (userId: number, name: string) => {
    if (
      !window.confirm(
        `Reset progress and scores for "${name}"?\n\nTheir account stays active but they start from level 1.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetAdminUser(userId);
      if (selectedUserId === userId) {
        setUserDetail(await fetchAdminUserDetail(userId));
      }
      await loadUsers(userOffset, search);
      await loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (
      !window.confirm(
        `Permanently delete "${name}"?\n\nThis removes their account, scores, and cloud save. This cannot be undone.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteAdminUser(userId);
      if (selectedUserId === userId) {
        closeUser();
      }
      await loadUsers(userOffset, search);
      await loadStats();
      await loadLeaderboards();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantResources = async (gems?: number, energy?: number) => {
    if (!userDetail) return;
    if (!gems && !energy) return;

    setLoading(true);
    setError(null);
    try {
      await grantAdminUserResources(userDetail.id, {
        ...(gems ? { gems } : {}),
        ...(energy ? { energy } : {}),
      });
      setUserDetail(await fetchAdminUserDetail(userDetail.id));
      await loadUsers(userOffset, search);
      await loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grant failed");
    } finally {
      setLoading(false);
    }
  };

  const submitGrantGems = (e: FormEvent) => {
    e.preventDefault();
    const amount = parseInt(grantGems, 10);
    if (!Number.isFinite(amount) || amount < 1) {
      setError("Enter a valid gem amount (1 or more)");
      return;
    }
    void handleGrantResources(amount, undefined);
  };

  const submitGrantEnergy = (e: FormEvent) => {
    e.preventDefault();
    const amount = parseInt(grantEnergy, 10);
    if (!Number.isFinite(amount) || amount < 1) {
      setError("Enter a valid energy amount (1 or more)");
      return;
    }
    void handleGrantResources(undefined, amount);
  };

  const handleResetPassword = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!userDetail) return;
    const custom = tempPassword.trim();
    if (custom && custom.length < 6) {
      setError("Custom password must be at least 6 characters");
      return;
    }
    if (
      !window.confirm(
        custom
          ? `Set a custom temporary password for ${userDetail.username}?`
          : `Generate a new temporary password for ${userDetail.username}? Their old password will stop working.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await resetAdminUserPassword(userDetail.id, custom || undefined);
      setIssuedTempPassword(res.temporary_password);
      setTempPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  const copyTempPassword = async () => {
    if (!issuedTempPassword || !userDetail) return;
    const text = `Royal Match Poker login\nUsername: ${userDetail.username}\nTemporary password: ${issuedTempPassword}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Could not copy to clipboard");
    }
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

        {stats?.db_backend === "sqlite" && (
          <p className="admin-error admin-error--banner admin-error--warn">
            Database is SQLite (not Postgres). Player accounts can disappear on deploy. In Render, link{" "}
            <strong>DATABASE_URL</strong> to the <strong>royal-match-db</strong> Postgres instance and redeploy.
          </p>
        )}

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
                    <th className="admin-table__actions-col">Actions</th>
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
                      <td className="admin-table__actions-col">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--xs"
                            disabled={loading}
                            onClick={() => openUser(u.id)}
                          >
                            View
                          </button>
                          {canModerate(u.id) && (
                            <>
                              <button
                                type="button"
                                className="admin-btn admin-btn--warn admin-btn--xs"
                                disabled={loading}
                                onClick={() => void handleResetUser(u.id, u.username)}
                              >
                                Reset
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger admin-btn--xs"
                                disabled={loading}
                                onClick={() => void handleDeleteUser(u.id, u.username)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {canManageRole(u.id) &&
                            (u.is_admin ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn--warn admin-btn--xs"
                                disabled={loading}
                                onClick={() => void handleToggleAdmin(u.id, u.username, false)}
                              >
                                Revoke admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost admin-btn--xs"
                                disabled={loading}
                                onClick={() => void handleToggleAdmin(u.id, u.username, true)}
                              >
                                Make admin
                              </button>
                            ))}
                          {u.id === adminUserId && (
                            <span className="admin-badge">you</span>
                          )}
                        </div>
                      </td>
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
                  {userDetail.email ? ` · ${userDetail.email}` : ""}
                  {userDetail.has_google ? " · Google linked" : ""}
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

            {canManageRole(userDetail.id) && (
              <div className="admin-role">
                <h3>Admin role</h3>
                <p className="admin-muted">
                  {userDetail.is_admin
                    ? "This account has full admin access. Revoke it to turn them back into a regular player."
                    : "Promote this player to an admin with full access to this console."}
                </p>
                <div className="admin-role__actions">
                  {userDetail.is_admin ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--warn"
                      disabled={loading}
                      onClick={() => void handleToggleAdmin(userDetail.id, userDetail.username, false)}
                    >
                      Revoke admin access
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={loading}
                      onClick={() => void handleToggleAdmin(userDetail.id, userDetail.username, true)}
                    >
                      Make admin
                    </button>
                  )}
                </div>
              </div>
            )}

            {userDetail.id !== adminUserId && (
              <div className="admin-password-reset">
                <h3>Password recovery</h3>
                <p className="admin-muted">
                  Generate a temporary password for players who cannot sign in. Share it privately — their old
                  password stops working immediately.
                </p>
                <form className="admin-grant__form" onSubmit={handleResetPassword}>
                  <label className="admin-grant__label" htmlFor="temp-password">
                    Custom temp password (optional)
                  </label>
                  <div className="admin-grant__row">
                    <input
                      id="temp-password"
                      type="text"
                      autoComplete="off"
                      placeholder="Leave blank to auto-generate"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                    />
                    <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm" disabled={loading}>
                      Set temp password
                    </button>
                  </div>
                </form>
                {issuedTempPassword && (
                  <div className="admin-password-reset__result" role="status">
                    <p>
                      <strong>Username:</strong> {userDetail.username}
                    </p>
                    <p>
                      <strong>Temporary password:</strong>{" "}
                      <code className="admin-password-reset__code">{issuedTempPassword}</code>
                    </p>
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost admin-btn--sm"
                      onClick={() => void copyTempPassword()}
                    >
                      Copy login details
                    </button>
                  </div>
                )}
              </div>
            )}

            {(
              <div className="admin-grant">
                <h3>Grant resources</h3>
                <p className="admin-muted">
                  Adds gems or energy to the {userDetail.is_admin ? "account" : "player"}&apos;s cloud save. It appears within a minute, or immediately on refocusing the game tab.
                  {userDetail.id === adminUserId && " This is your own account."}
                  {!userDetail.progress_summary && " A new cloud save will be created if needed."}
                </p>
                <div className="admin-grant__grid">
                  <form className="admin-grant__form" onSubmit={submitGrantGems}>
                    <label className="admin-grant__label" htmlFor="grant-gems">
                      💎 Gems to add
                    </label>
                    <div className="admin-grant__row">
                      <input
                        id="grant-gems"
                        type="number"
                        min={1}
                        max={100000}
                        value={grantGems}
                        onChange={(e) => setGrantGems(e.target.value)}
                        disabled={loading}
                      />
                      <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm" disabled={loading}>
                        Add gems
                      </button>
                    </div>
                    <div className="admin-grant__quick">
                      {[100, 500, 1000].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--xs"
                          disabled={loading}
                          onClick={() => void handleGrantResources(n, undefined)}
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </form>

                  <form className="admin-grant__form" onSubmit={submitGrantEnergy}>
                    <label className="admin-grant__label" htmlFor="grant-energy">
                      ⚡ Energy to add
                    </label>
                    <div className="admin-grant__row">
                      <input
                        id="grant-energy"
                        type="number"
                        min={1}
                        max={10}
                        value={grantEnergy}
                        onChange={(e) => setGrantEnergy(e.target.value)}
                        disabled={loading}
                      />
                      <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm" disabled={loading}>
                        Add energy
                      </button>
                    </div>
                    <div className="admin-grant__quick">
                      {[1, 5, 10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--xs"
                          disabled={loading}
                          onClick={() => void handleGrantResources(undefined, n)}
                        >
                          +{n}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>
              </div>
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

            {canModerate(userDetail.id) && (
              <div className="admin-moderation">
                <h3>Moderation</h3>
                <p className="admin-muted">
                  Reset clears progress and scores but keeps the login. Delete removes the account entirely.
                </p>
                <div className="admin-moderation__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--warn"
                    disabled={loading}
                    onClick={() => void handleResetUser(userDetail.id, userDetail.username)}
                  >
                    Reset progress &amp; scores
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    disabled={loading}
                    onClick={() => void handleDeleteUser(userDetail.id, userDetail.username)}
                  >
                    Delete account
                  </button>
                </div>
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
