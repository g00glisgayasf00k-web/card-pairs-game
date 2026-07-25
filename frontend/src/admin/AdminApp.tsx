import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  closeAdminSupport,
  deleteAdminUser,
  fetchAdminMe,
  fetchAdminRevenue,
  fetchAdminSessions,
  fetchAdminStats,
  fetchAdminSupport,
  fetchAdminUserDetail,
  fetchAdminUsers,
  grantAdminUserResources,
  login,
  replyAdminSupport,
  resetAdminUser,
  resetAdminUserPassword,
  setAdminUserRole,
  type AdminUserRow,
  type SupportTicket,
} from "../lib/api";

type Tab = "dashboard" | "users" | "revenue" | "engagement" | "support";
type SupportFilter = "all" | "open" | "answered" | "closed";

type AdminStats = Awaited<ReturnType<typeof fetchAdminStats>>;
type AdminUserDetail = Awaited<ReturnType<typeof fetchAdminUserDetail>>;
type RevenuePurchase = Awaited<ReturnType<typeof fetchAdminRevenue>>["purchases"][number];
type RevenueAd = Awaited<ReturnType<typeof fetchAdminRevenue>>["ads"][number];
type SessionRow = Awaited<ReturnType<typeof fetchAdminSessions>>["sessions"][number];

const PAGE_SIZE = 25;
const REVENUE_PAGE = 50;

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  return `${sec}s`;
}

/** Admin dates are UTC on the server — show UK local (GMT/BST). */
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Dashboard",
  users: "Users",
  revenue: "Revenue",
  engagement: "Engagement",
  support: "Support",
};

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userOffset, setUserOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [purchases, setPurchases] = useState<RevenuePurchase[]>([]);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [revenueOffset, setRevenueOffset] = useState(0);
  const [adWatches, setAdWatches] = useState<RevenueAd[]>([]);
  const [adsTotal, setAdsTotal] = useState(0);
  const [adsOffset, setAdsOffset] = useState(0);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [grantGems, setGrantGems] = useState("100");
  const [grantEnergy, setGrantEnergy] = useState("5");
  const [tempPassword, setTempPassword] = useState("");
  const [issuedTempPassword, setIssuedTempPassword] = useState<string | null>(null);

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportOpenCount, setSupportOpenCount] = useState(0);
  const [supportFilter, setSupportFilter] = useState<SupportFilter>("open");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [supportReply, setSupportReply] = useState("");

  const loadStats = useCallback(async () => {
    setStats(await fetchAdminStats());
  }, []);

  const loadUsers = useCallback(async (offset: number, query: string) => {
    const data = await fetchAdminUsers(offset, PAGE_SIZE, query);
    setUsers(data.users);
    setTotalUsers(data.total);
    setUserOffset(data.offset);
  }, []);

  const loadRevenue = useCallback(async (offset: number, nextAdsOffset = 0) => {
    const data = await fetchAdminRevenue(offset, REVENUE_PAGE, nextAdsOffset);
    setPurchases(data.purchases);
    setRevenueTotal(data.total);
    setRevenueOffset(data.offset);
    setAdWatches(data.ads ?? []);
    setAdsTotal(data.ads_total ?? 0);
    setAdsOffset(data.ads_offset ?? 0);
  }, []);

  const loadSessions = useCallback(async () => {
    const data = await fetchAdminSessions(40);
    setSessions(data.sessions);
  }, []);

  const loadSupport = useCallback(async (status: SupportFilter) => {
    const data = await fetchAdminSupport(status);
    setSupportTickets(data.tickets);
    setSupportOpenCount(data.open_count);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadStats(),
        loadUsers(0, search),
        loadRevenue(0),
        loadSessions(),
        loadSupport("open"),
      ]);
      setAuthed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadUsers, loadRevenue, loadSessions, loadSupport, search]);

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
    if (tab !== "dashboard" && tab !== "users") return;
    const id = window.setInterval(() => {
      void loadStats();
      if (tab === "users") void loadUsers(userOffset, search);
    }, 20000);
    return () => window.clearInterval(id);
  }, [authed, tab, userOffset, search, loadStats, loadUsers]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setNavOpen(false);
    setSelectedUserId(null);
    setUserDetail(null);
    setIssuedTempPassword(null);
    setTempPassword("");
    if (next === "support") {
      void loadSupport(supportFilter).catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load support")
      );
    }
    if (next === "revenue") {
      void Promise.all([loadStats(), loadRevenue(revenueOffset)]).catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load revenue")
      );
    }
    if (next === "engagement") {
      void Promise.all([loadStats(), loadSessions()]).catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load engagement")
      );
    }
    if (next === "dashboard") {
      void loadStats().catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load dashboard")
      );
    }
  };

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
    setPurchases([]);
    setSessions([]);
    setTab("dashboard");
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "dashboard") await loadStats();
      if (tab === "users") {
        await loadUsers(userOffset, search);
        if (selectedUserId) {
          setUserDetail(await fetchAdminUserDetail(selectedUserId));
        }
      }
      if (tab === "revenue") {
        await Promise.all([loadStats(), loadRevenue(revenueOffset)]);
      }
      if (tab === "engagement") {
        await Promise.all([loadStats(), loadSessions()]);
      }
      if (tab === "support") await loadSupport(supportFilter);
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
      setTab("users");
      setNavOpen(false);
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

  const changeSupportFilter = (next: SupportFilter) => {
    setSupportFilter(next);
    setSelectedTicketId(null);
    setSupportReply("");
    void loadSupport(next).catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load support")
    );
  };

  const handleSupportReply = async (closeAfter: boolean) => {
    if (selectedTicketId == null) return;
    setLoading(true);
    setError(null);
    try {
      await replyAdminSupport(selectedTicketId, supportReply.trim(), closeAfter);
      setSupportReply("");
      await loadSupport(supportFilter);
      await loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setLoading(false);
    }
  };

  const handleSupportClose = async (ticketId: number) => {
    setLoading(true);
    setError(null);
    try {
      await closeAdminSupport(ticketId);
      await loadSupport(supportFilter);
      await loadStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to close ticket");
    } finally {
      setLoading(false);
    }
  };

  const runSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearch(q);
    void loadUsers(0, q);
  };

  const canModerate = (userId: number) => adminUserId !== null && userId !== adminUserId;

  const handleToggleAdmin = async (userId: number, name: string, makeAdmin: boolean) => {
    if (
      !window.confirm(
        makeAdmin
          ? `Make "${name}" an admin?\n\nThey will get full access to this console.`
          : `Revoke admin access for "${name}"?\n\nThey become a regular player.`
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
        `Reset progress for "${name}"?\n\nTheir account stays active but campaign progress resets.`
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
        `Permanently delete "${name}"?\n\nThis removes their account and cloud save. This cannot be undone.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteAdminUser(userId);
      if (selectedUserId === userId) closeUser();
      await loadUsers(userOffset, search);
      await loadStats();
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
    const text = `Royal Poker Match login\nUsername: ${userDetail.username}\nTemporary password: ${issuedTempPassword}`;
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
              <h1>Royal Poker Match</h1>
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
  const revenuePages = Math.max(1, Math.ceil(revenueTotal / REVENUE_PAGE));
  const revenuePage = Math.floor(revenueOffset / REVENUE_PAGE) + 1;
  const adsPages = Math.max(1, Math.ceil(adsTotal / REVENUE_PAGE));
  const adsPage = Math.floor(adsOffset / REVENUE_PAGE) + 1;
  const rev = stats?.revenue;
  const seriesMax = Math.max(1, ...(stats?.revenue_series.map((d) => d.cents) ?? [1]));
  const selectedTicket = supportTickets.find((t) => t.id === selectedTicketId) ?? null;

  const topbarSub =
    tab === "dashboard"
      ? "Live KPIs from your game database"
      : tab === "users" && userDetail
        ? `Joined ${fmtDate(userDetail.created_at)}`
        : tab === "users"
          ? `${totalUsers} accounts`
          : tab === "revenue"
            ? rev
              ? `${fmtMoney(rev.all_cents)} lifetime · ${rev.purchases_all} IAP · ${rev.ads_all ?? 0} ads`
              : "Gem packs & rewarded ads"
            : tab === "engagement"
              ? stats
                ? `${fmtDuration(stats.play_seconds_7d)} playtime · ${stats.sessions_7d} sessions (7d)`
                : "Sessions & playtime"
              : `${supportOpenCount} open · Settings → Contact support`;

  return (
    <div className={`admin-shell${navOpen ? " admin-shell--nav-open" : ""}`}>
      <button
        type="button"
        className="admin-nav-toggle"
        aria-label={navOpen ? "Close menu" : "Open menu"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      {navOpen && (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span>♠</span>
          <div>
            <strong>Royal Poker Match</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`admin-nav__item${tab === key ? " admin-nav__item--active" : ""}`}
              onClick={() => switchTab(key)}
            >
              {TAB_LABELS[key]}
              {key === "support" && supportOpenCount > 0 ? ` (${supportOpenCount})` : ""}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__foot">
          <span className="admin-sidebar__user">{adminName}</span>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-main__inner">
          <header className="admin-topbar">
            <div>
              <h1>{userDetail && tab === "users" ? userDetail.username : TAB_LABELS[tab]}</h1>
              <p className="admin-muted">{topbarSub}</p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => void refresh()}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </header>

          {error && <p className="admin-error admin-error--banner">{error}</p>}

          {stats?.db_backend === "sqlite" && (
            <p className="admin-error admin-error--banner admin-error--warn">
              Database is SQLite (not Postgres). Player accounts can disappear on deploy. In Render, link{" "}
              <strong>DATABASE_URL</strong> to the <strong>royal-match-db</strong> Postgres instance and
              redeploy.
            </p>
          )}

          <div className="admin-content">
            {tab === "dashboard" && stats && (
              <div className="admin-stack">
                <div className="admin-stat-grid">
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.users}</span>
                    <span className="admin-stat-card__label">Total accounts</span>
                    <span className="admin-stat-card__sub">{stats.players} players</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.signups_24h}</span>
                    <span className="admin-stat-card__label">Signups (24h)</span>
                    <span className="admin-stat-card__sub">{stats.signups_7d} this week</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.active_24h}</span>
                    <span className="admin-stat-card__label">Active (24h)</span>
                    <span className="admin-stat-card__sub">{stats.active_7d} this week</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.logins_24h}</span>
                    <span className="admin-stat-card__label">Logins (24h)</span>
                    <span className="admin-stat-card__sub">{stats.logins_7d} this week</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{fmtDuration(stats.play_seconds_total)}</span>
                    <span className="admin-stat-card__label">Playtime (all)</span>
                    <span className="admin-stat-card__sub">
                      {fmtDuration(stats.play_seconds_7d)} · {stats.sessions_7d} sessions (7d)
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{fmtMoney(stats.revenue.all_cents)}</span>
                    <span className="admin-stat-card__label">Revenue (all)</span>
                    <span className="admin-stat-card__sub">
                      IAP {fmtMoney(stats.revenue.iap_cents ?? 0)} · Ads est.{" "}
                      {fmtMoney(stats.revenue.ads_cents ?? 0)}
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.revenue.purchases_all}</span>
                    <span className="admin-stat-card__label">Gem purchases</span>
                    <span className="admin-stat-card__sub">
                      {stats.revenue.paying_users} paying · ARPPU {fmtMoney(stats.revenue.arppu_cents)}
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.revenue.ads_all ?? 0}</span>
                    <span className="admin-stat-card__label">Ads watched</span>
                    <span className="admin-stat-card__sub">
                      Est. {fmtMoney(stats.revenue.ads_cents ?? 0)} · {stats.revenue.ads_7d ?? 0} (7d)
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-card__val">{stats.open_tickets}</span>
                    <span className="admin-stat-card__label">Open tickets</span>
                    <span className="admin-stat-card__sub">Support queue</span>
                  </div>
                </div>

                <div className="admin-split">
                  <section className="admin-panel">
                    <h2>Revenue (daily)</h2>
                    {stats.revenue_series.length === 0 ? (
                      <p className="admin-muted">No revenue data yet.</p>
                    ) : (
                      <div className="admin-bars" role="img" aria-label="Daily revenue">
                        {stats.revenue_series.map((d) => (
                          <div
                            key={d.date}
                            className="admin-bars__col"
                            title={`${d.date}: ${fmtMoney(d.cents)} (IAP ${fmtMoney(d.iap_cents ?? 0)} · ads ${fmtMoney(d.ads_cents ?? 0)})`}
                          >
                            <div
                              className="admin-bars__bar"
                              style={{ height: `${Math.max(4, (d.cents / seriesMax) * 100)}%` }}
                            />
                            <span className="admin-bars__label">{d.date.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="admin-panel">
                    <h2>Gem packs</h2>
                    {stats.packs.length === 0 ? (
                      <p className="admin-muted">No pack sales yet.</p>
                    ) : (
                      <div className="admin-table-wrap admin-table-wrap--compact">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Pack</th>
                              <th>Count</th>
                              <th>Revenue</th>
                              <th>Gems</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.packs.map((p) => (
                              <tr key={p.pack_id}>
                                <td>{p.pack_id}</td>
                                <td className="admin-num">{p.count}</td>
                                <td className="admin-num">{fmtMoney(p.cents)}</td>
                                <td className="admin-num">{p.gems.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>

                <div className="admin-split">
                  <section className="admin-panel">
                    <h2>Ad kinds</h2>
                    {!stats.ad_kinds || stats.ad_kinds.length === 0 ? (
                      <p className="admin-muted">No ad watches logged yet.</p>
                    ) : (
                      <div className="admin-table-wrap admin-table-wrap--compact">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Kind</th>
                              <th>Watches</th>
                              <th>Est. revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.ad_kinds.map((a) => (
                              <tr key={a.kind}>
                                <td>{a.kind}</td>
                                <td className="admin-num">{a.count}</td>
                                <td className="admin-num">{fmtMoney(a.cents)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="admin-panel">
                    <h2>Recent ads</h2>
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Kind</th>
                            <th>Est.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats.recent_ads ?? []).map((a) => (
                            <tr key={a.id}>
                              <td>
                                <button
                                  type="button"
                                  className="admin-link"
                                  onClick={() => void openUser(a.user_id)}
                                >
                                  {a.username}
                                </button>
                              </td>
                              <td>{a.kind}</td>
                              <td className="admin-num">{fmtMoney(a.estimated_cents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(stats.recent_ads ?? []).length === 0 && (
                        <p className="admin-muted">No ad watches yet.</p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="admin-split admin-split--4">
                  <section className="admin-panel">
                    <h2>Recent signups</h2>
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recent_signups.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <button type="button" className="admin-link" onClick={() => void openUser(u.id)}>
                                  {u.username}
                                </button>
                              </td>
                              <td>{fmtDate(u.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="admin-panel">
                    <h2>Recent logins</h2>
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Last login</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recent_logins.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <button type="button" className="admin-link" onClick={() => void openUser(u.id)}>
                                  {u.username}
                                </button>
                              </td>
                              <td>{fmtDate(u.last_login_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="admin-panel">
                    <h2>Recent purchases</h2>
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Pack</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recent_purchases.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <button
                                  type="button"
                                  className="admin-link"
                                  onClick={() => void openUser(p.user_id)}
                                >
                                  {p.username}
                                </button>
                              </td>
                              <td>{p.pack_id}</td>
                              <td className="admin-num">{fmtMoney(p.cents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="admin-panel">
                    <h2>Top playtime</h2>
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Playtime</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.top_playtime.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <button type="button" className="admin-link" onClick={() => void openUser(u.id)}>
                                  {u.username}
                                </button>
                              </td>
                              <td className="admin-num">{fmtDuration(u.total_play_seconds)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {tab === "users" && !userDetail && (
              <section className="admin-panel admin-panel--fill">
                <form className="admin-search" onSubmit={runSearch}>
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search username or email…"
                  />
                  <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm">
                    Search
                  </button>
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
                    No accounts found. Players appear after they sign up on the live game.
                  </p>
                )}

                <div className="admin-table-wrap">
                  <table className="admin-table admin-table--users">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Last login</th>
                        <th>Last seen</th>
                        <th>Playtime</th>
                        <th>Gems</th>
                        <th>Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <button type="button" className="admin-link" onClick={() => void openUser(u.id)}>
                              {u.username}
                              {u.is_admin && <span className="admin-badge">admin</span>}
                              {u.id === adminUserId && <span className="admin-badge admin-badge--you">you</span>}
                            </button>
                          </td>
                          <td>{u.email || "—"}</td>
                          <td>{fmtDate(u.created_at)}</td>
                          <td>{fmtDate(u.last_login_at)}</td>
                          <td>{fmtDate(u.last_seen_at)}</td>
                          <td className="admin-num">{fmtDuration(u.total_play_seconds ?? 0)}</td>
                          <td className="admin-num">{u.progress?.credits ?? "—"}</td>
                          <td className="admin-num">{fmtMoney(u.lifetime_spend_cents ?? 0)}</td>
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

            {tab === "users" && userDetail && (
              <div className="admin-user-layout">
                <section className="admin-panel admin-panel--fill">
                  <button type="button" className="admin-back" onClick={closeUser}>
                    ← Back to users
                  </button>

                  <div className="admin-user-hero">
                    <div>
                      <h2>
                        {userDetail.username}
                        {userDetail.is_admin && <span className="admin-badge">admin</span>}
                      </h2>
                      <p className="admin-muted">
                        ID {userDetail.id}
                        {userDetail.email ? ` · ${userDetail.email}` : ""}
                        {userDetail.has_google ? " · Google linked" : ""}
                      </p>
                    </div>
                  </div>

                  <h3>Account</h3>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-tile">
                      <span>Joined</span>
                      <strong>{fmtDate(userDetail.created_at)}</strong>
                    </div>
                    <div className="admin-detail-tile">
                      <span>Last login</span>
                      <strong>{fmtDate(userDetail.last_login_at)}</strong>
                    </div>
                    <div className="admin-detail-tile">
                      <span>Last seen</span>
                      <strong>{fmtDate(userDetail.last_seen_at)}</strong>
                    </div>
                    <div className="admin-detail-tile">
                      <span>Playtime</span>
                      <strong>{fmtDuration(userDetail.total_play_seconds)}</strong>
                    </div>
                    <div className="admin-detail-tile">
                      <span>Lifetime spend</span>
                      <strong>{fmtMoney(userDetail.lifetime_spend_cents)}</strong>
                    </div>
                    <div className="admin-detail-tile">
                      <span>Gem purchases</span>
                      <strong>{fmtMoney(userDetail.lifetime_iap_cents ?? 0)}</strong>
                    </div>
                    <div className="admin-detail-tile">
                      <span>Ads (est.)</span>
                      <strong>
                        {fmtMoney(userDetail.lifetime_ads_cents ?? 0)} · {userDetail.ads_watched ?? 0}{" "}
                        watches
                      </strong>
                    </div>
                  </div>

                  <h3>Progress</h3>
                  {userDetail.progress_summary ? (
                    <div className="admin-detail-grid">
                      <div className="admin-detail-tile">
                        <span>Level</span>
                        <strong>{userDetail.progress_summary.level ?? "—"}</strong>
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
                        <span>Levels cleared</span>
                        <strong>{userDetail.progress_summary.completed ?? 0}</strong>
                      </div>
                      <div className="admin-detail-tile">
                        <span>Highest unlocked</span>
                        <strong>{userDetail.progress_summary.highest_unlocked ?? "—"}</strong>
                      </div>
                      <div className="admin-detail-tile">
                        <span>Stars</span>
                        <strong>{userDetail.progress_summary.stars_total ?? 0}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="admin-muted">No cloud save on record.</p>
                  )}

                  <h3>Purchases</h3>
                  {userDetail.purchases.length === 0 ? (
                    <p className="admin-muted">No purchases.</p>
                  ) : (
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Pack</th>
                            <th>Amount</th>
                            <th>Gems</th>
                            <th>When</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetail.purchases.map((p) => (
                            <tr key={p.id}>
                              <td>{p.pack_id}</td>
                              <td className="admin-num">{fmtMoney(p.cents)}</td>
                              <td className="admin-num">{p.gems}</td>
                              <td>{fmtDate(p.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h3>Ad watches</h3>
                  {!userDetail.ad_watches || userDetail.ad_watches.length === 0 ? (
                    <p className="admin-muted">No ad watches.</p>
                  ) : (
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Kind</th>
                            <th>Platform</th>
                            <th>Est.</th>
                            <th>When</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetail.ad_watches.map((a) => (
                            <tr key={a.id}>
                              <td>{a.kind}</td>
                              <td>{a.platform ?? "—"}</td>
                              <td className="admin-num">{fmtMoney(a.estimated_cents)}</td>
                              <td>{fmtDate(a.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h3>Sessions</h3>
                  {userDetail.sessions.length === 0 ? (
                    <p className="admin-muted">No sessions recorded.</p>
                  ) : (
                    <div className="admin-table-wrap admin-table-wrap--compact">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Started</th>
                            <th>Duration</th>
                            <th>Platform</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetail.sessions.map((s) => (
                            <tr key={s.id}>
                              <td>{fmtDate(s.started_at)}</td>
                              <td className="admin-num">{fmtDuration(s.duration_seconds)}</td>
                              <td>{s.platform ?? "—"}</td>
                              <td>{s.active ? "Active" : "Ended"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="admin-grant">
                    <h3>Grant resources</h3>
                    <p className="admin-muted">
                      Adds gems or energy to the cloud save. Appears within a minute, or on tab refocus.
                    </p>
                    <div className="admin-grant__grid">
                      <form className="admin-grant__form" onSubmit={submitGrantGems}>
                        <label className="admin-grant__label" htmlFor="grant-gems">
                          Gems to add
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
                          <button
                            type="submit"
                            className="admin-btn admin-btn--primary admin-btn--sm"
                            disabled={loading}
                          >
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
                          Energy to add
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
                          <button
                            type="submit"
                            className="admin-btn admin-btn--primary admin-btn--sm"
                            disabled={loading}
                          >
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

                  {userDetail.id !== adminUserId && (
                    <div className="admin-password-reset">
                      <h3>Password recovery</h3>
                      <p className="admin-muted">
                        Generate a temporary password for players who cannot sign in. Share it privately.
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
                          <button
                            type="submit"
                            className="admin-btn admin-btn--primary admin-btn--sm"
                            disabled={loading}
                          >
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

                  {canModerate(userDetail.id) && (
                    <>
                      <div className="admin-role">
                        <h3>Admin role</h3>
                        <p className="admin-muted">
                          {userDetail.is_admin
                            ? "This account has full admin access."
                            : "Promote this player to an admin with console access."}
                        </p>
                        <div className="admin-role__actions">
                          {userDetail.is_admin ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--warn"
                              disabled={loading}
                              onClick={() =>
                                void handleToggleAdmin(userDetail.id, userDetail.username, false)
                              }
                            >
                              Revoke admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn--primary"
                              disabled={loading}
                              onClick={() =>
                                void handleToggleAdmin(userDetail.id, userDetail.username, true)
                              }
                            >
                              Make admin
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="admin-moderation">
                        <h3>Moderation</h3>
                        <p className="admin-muted">
                          Reset clears campaign progress but keeps the login. Delete removes the account.
                        </p>
                        <div className="admin-moderation__actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--warn"
                            disabled={loading}
                            onClick={() => void handleResetUser(userDetail.id, userDetail.username)}
                          >
                            Reset progress
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
                    </>
                  )}
                </section>
              </div>
            )}

            {tab === "revenue" && (
              <div className="admin-stack">
                {rev && (
                  <div className="admin-stat-grid admin-stat-grid--compact">
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{fmtMoney(rev.all_cents)}</span>
                      <span className="admin-stat-card__label">Lifetime (IAP + ads)</span>
                      <span className="admin-stat-card__sub">
                        {fmtMoney(rev.cents_7d)} 7d · {fmtMoney(rev.cents_30d)} 30d
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{fmtMoney(rev.iap_cents ?? 0)}</span>
                      <span className="admin-stat-card__label">Gem purchases</span>
                      <span className="admin-stat-card__sub">
                        {rev.purchases_all} sales · {rev.paying_users} paying
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{fmtMoney(rev.ads_cents ?? 0)}</span>
                      <span className="admin-stat-card__label">Ads (estimated)</span>
                      <span className="admin-stat-card__sub">
                        {rev.ads_all ?? 0} watches · ~{fmtMoney(rev.ads_cents_per_watch ?? 1)}/watch
                      </span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{rev.gems_sold_all.toLocaleString()}</span>
                      <span className="admin-stat-card__label">Gems sold</span>
                      <span className="admin-stat-card__sub">
                        ARPU {fmtMoney(rev.arpu_cents)} · ARPPU {fmtMoney(rev.arppu_cents)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="admin-split">
                  <section className="admin-panel">
                    <h2>Revenue series</h2>
                    {!stats || stats.revenue_series.length === 0 ? (
                      <p className="admin-muted">No series data.</p>
                    ) : (
                      <div className="admin-bars" role="img" aria-label="Daily revenue">
                        {stats.revenue_series.map((d) => (
                          <div
                            key={d.date}
                            className="admin-bars__col"
                            title={`${d.date}: ${fmtMoney(d.cents)} (IAP ${fmtMoney(d.iap_cents ?? 0)} · ads ${fmtMoney(d.ads_cents ?? 0)})`}
                          >
                            <div
                              className="admin-bars__bar"
                              style={{ height: `${Math.max(4, (d.cents / seriesMax) * 100)}%` }}
                            />
                            <span className="admin-bars__label">{d.date.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="admin-panel">
                    <h2>Gem packs</h2>
                    {!stats || stats.packs.length === 0 ? (
                      <p className="admin-muted">No pack sales.</p>
                    ) : (
                      <div className="admin-table-wrap admin-table-wrap--compact">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Pack</th>
                              <th>Count</th>
                              <th>Revenue</th>
                              <th>Gems</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.packs.map((p) => (
                              <tr key={p.pack_id}>
                                <td>{p.pack_id}</td>
                                <td className="admin-num">{p.count}</td>
                                <td className="admin-num">{fmtMoney(p.cents)}</td>
                                <td className="admin-num">{p.gems.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>

                <div className="admin-split">
                  <section className="admin-panel">
                    <h2>Ad kinds</h2>
                    {!stats || !stats.ad_kinds || stats.ad_kinds.length === 0 ? (
                      <p className="admin-muted">No ad watches logged yet.</p>
                    ) : (
                      <div className="admin-table-wrap admin-table-wrap--compact">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Kind</th>
                              <th>Watches</th>
                              <th>Est. revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.ad_kinds.map((a) => (
                              <tr key={a.kind}>
                                <td>{a.kind}</td>
                                <td className="admin-num">{a.count}</td>
                                <td className="admin-num">{fmtMoney(a.cents)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                  <section className="admin-panel">
                    <h2>Note</h2>
                    <p className="admin-muted">
                      Ad revenue is an estimate ({fmtMoney(rev?.ads_cents_per_watch ?? 1)} per rewarded
                      completion). Tune with env <code>AD_REWARD_CENTS_PER_WATCH</code>. Gem pack totals
                      are actual IAP amounts.
                    </p>
                  </section>
                </div>

                <section className="admin-panel">
                  <h2>Gem purchases</h2>
                  {purchases.length === 0 ? (
                    <p className="admin-muted">No purchases yet.</p>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>When</th>
                            <th>User</th>
                            <th>Pack</th>
                            <th>Amount</th>
                            <th>Gems</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.map((p) => (
                            <tr key={p.id}>
                              <td>{fmtDate(p.created_at)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-link"
                                  onClick={() => void openUser(p.user_id)}
                                >
                                  {p.username}
                                </button>
                              </td>
                              <td>{p.pack_id}</td>
                              <td className="admin-num">{fmtMoney(p.cents)}</td>
                              <td className="admin-num">{p.gems}</td>
                              <td>{p.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {revenueTotal > REVENUE_PAGE && (
                    <div className="admin-pagination">
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={revenueOffset === 0 || loading}
                        onClick={() =>
                          void loadRevenue(Math.max(0, revenueOffset - REVENUE_PAGE), adsOffset)
                        }
                      >
                        ← Prev
                      </button>
                      <span className="admin-muted">
                        Page {revenuePage} of {revenuePages}
                      </span>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={revenueOffset + REVENUE_PAGE >= revenueTotal || loading}
                        onClick={() => void loadRevenue(revenueOffset + REVENUE_PAGE, adsOffset)}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </section>

                <section className="admin-panel">
                  <h2>Ad watches</h2>
                  {adWatches.length === 0 ? (
                    <p className="admin-muted">No ad watches logged yet.</p>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>When</th>
                            <th>User</th>
                            <th>Kind</th>
                            <th>Platform</th>
                            <th>Est.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adWatches.map((a) => (
                            <tr key={a.id}>
                              <td>{fmtDate(a.created_at)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-link"
                                  onClick={() => void openUser(a.user_id)}
                                >
                                  {a.username}
                                </button>
                              </td>
                              <td>{a.kind}</td>
                              <td>{a.platform ?? "—"}</td>
                              <td className="admin-num">{fmtMoney(a.estimated_cents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {adsTotal > REVENUE_PAGE && (
                    <div className="admin-pagination">
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={adsOffset === 0 || loading}
                        onClick={() =>
                          void loadRevenue(revenueOffset, Math.max(0, adsOffset - REVENUE_PAGE))
                        }
                      >
                        ← Prev
                      </button>
                      <span className="admin-muted">
                        Page {adsPage} of {adsPages}
                      </span>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                        disabled={adsOffset + REVENUE_PAGE >= adsTotal || loading}
                        onClick={() => void loadRevenue(revenueOffset, adsOffset + REVENUE_PAGE)}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}

            {tab === "engagement" && (
              <div className="admin-stack">
                {stats && (
                  <div className="admin-stat-grid admin-stat-grid--compact">
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{fmtDuration(stats.play_seconds_total)}</span>
                      <span className="admin-stat-card__label">Total playtime</span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{fmtDuration(stats.play_seconds_7d)}</span>
                      <span className="admin-stat-card__label">Playtime (7d)</span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{stats.sessions_7d}</span>
                      <span className="admin-stat-card__label">Sessions (7d)</span>
                    </div>
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__val">{stats.active_7d}</span>
                      <span className="admin-stat-card__label">Active users (7d)</span>
                    </div>
                  </div>
                )}

                <div className="admin-split">
                  <section className="admin-panel">
                    <h2>Top playtime</h2>
                    {!stats || stats.top_playtime.length === 0 ? (
                      <p className="admin-muted">No playtime data.</p>
                    ) : (
                      <div className="admin-table-wrap admin-table-wrap--compact">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>User</th>
                              <th>Playtime</th>
                              <th>Last seen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.top_playtime.map((u, i) => (
                              <tr key={u.id}>
                                <td>{i + 1}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="admin-link"
                                    onClick={() => void openUser(u.id)}
                                  >
                                    {u.username}
                                  </button>
                                </td>
                                <td className="admin-num">{fmtDuration(u.total_play_seconds)}</td>
                                <td>{fmtDate(u.last_seen_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="admin-panel">
                    <h2>Recent sessions</h2>
                    {sessions.length === 0 ? (
                      <p className="admin-muted">No sessions yet.</p>
                    ) : (
                      <div className="admin-table-wrap admin-table-wrap--compact">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Started</th>
                              <th>Duration</th>
                              <th>Platform</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map((s) => (
                              <tr key={s.id}>
                                <td>
                                  <button
                                    type="button"
                                    className="admin-link"
                                    onClick={() => void openUser(s.user_id)}
                                  >
                                    {s.username}
                                  </button>
                                </td>
                                <td>{fmtDate(s.started_at)}</td>
                                <td className="admin-num">{fmtDuration(s.duration_seconds)}</td>
                                <td>{s.platform ?? "—"}</td>
                                <td>
                                  {s.active ? (
                                    <span className="admin-badge admin-badge--ok">Active</span>
                                  ) : (
                                    "Ended"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {tab === "support" && (
              <section className="admin-panel admin-panel--fill">
                <div className="admin-filter-tabs">
                  {(["open", "answered", "closed", "all"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`admin-btn admin-btn--sm${
                        supportFilter === f ? " admin-btn--primary" : " admin-btn--ghost"
                      }`}
                      onClick={() => changeSupportFilter(f)}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {supportTickets.length === 0 ? (
                  <p className="admin-muted">No support messages in this filter.</p>
                ) : (
                  <div className="admin-support-layout">
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>When</th>
                            <th>Player</th>
                            <th>Subject</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supportTickets.map((t) => (
                            <tr
                              key={t.id}
                              className={selectedTicketId === t.id ? "admin-row--selected" : undefined}
                              onClick={() => {
                                setSelectedTicketId(t.id);
                                setSupportReply(t.admin_reply ?? "");
                              }}
                            >
                              <td>{fmtDate(t.created_at)}</td>
                              <td>
                                {t.user_id ? (
                                  <button
                                    type="button"
                                    className="admin-link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void openUser(t.user_id!);
                                    }}
                                  >
                                    {t.username ?? `#${t.user_id}`}
                                  </button>
                                ) : (
                                  t.username ?? "—"
                                )}
                              </td>
                              <td>{t.subject}</td>
                              <td>{t.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedTicket ? (
                      <div className="admin-support-detail">
                        <h3>{selectedTicket.subject}</h3>
                        <p className="admin-muted">
                          From {selectedTicket.username ?? "player"}
                          {selectedTicket.created_at ? ` · ${fmtDate(selectedTicket.created_at)}` : ""}
                          {` · ${selectedTicket.status}`}
                        </p>
                        <p className="admin-support-message">{selectedTicket.message}</p>
                        {selectedTicket.admin_reply && selectedTicket.status !== "open" && (
                          <div className="admin-support-prior-reply">
                            <strong>Previous reply</strong>
                            <p>{selectedTicket.admin_reply}</p>
                          </div>
                        )}
                        <label className="admin-field">
                          Reply
                          <textarea
                            value={supportReply}
                            onChange={(e) => setSupportReply(e.target.value)}
                            rows={5}
                            placeholder="Write a reply the player will see in Settings…"
                          />
                        </label>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--primary"
                            disabled={loading || supportReply.trim().length < 2}
                            onClick={() => void handleSupportReply(false)}
                          >
                            Send reply
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            disabled={loading || supportReply.trim().length < 2}
                            onClick={() => void handleSupportReply(true)}
                          >
                            Reply &amp; close
                          </button>
                          {selectedTicket.status !== "closed" && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              disabled={loading}
                              onClick={() => void handleSupportClose(selectedTicket.id)}
                            >
                              Close without reply
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="admin-muted">Select a message to reply.</p>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
