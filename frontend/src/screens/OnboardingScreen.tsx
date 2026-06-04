import { useState, type FormEvent } from "react";
import { login, register } from "../lib/api";
import { Leaderboard } from "../components/Leaderboard";
import { HAND_DISPLAY, HAND_SCORE_LIST, type HandLabel } from "../lib/pokerHands";

const HANDS = HAND_SCORE_LIST.map(({ hand, points }) => [hand, points] as [HandLabel, number]);

interface Props {
  username: string | null;
  onAuth: (username: string, token: string) => void;
  onLogout: () => void;
  onPlay: () => void;
}

export function OnboardingScreen({ username, onAuth, onLogout, onPlay }: Props) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [section, setSection] = useState<"leaderboard" | "rules" | null>(null);

  const submitAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const fn = authMode === "login" ? login : register;
      const res = await fn(user.trim(), pass);
      localStorage.setItem("token", res.token);
      onAuth(res.username, res.token);
      setPass("");
      setUser("");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="home-screen">
      <div className="mobile-shell mobile-shell--home">
        {/* ── Hero banner ── */}
        <header className="home-hero">
          <div className="home-hero__shine" aria-hidden />
          <div className="home-suits" aria-hidden>
            <span className="suit-hearts">♥</span>
            <span className="suit-spades">♠</span>
            <span className="suit-diamonds">♦</span>
            <span className="suit-clubs">♣</span>
          </div>
          <h1 className="home-title">Poker Pairs</h1>
          <p className="home-tagline">Swipe hands · Clear the board · Level up</p>
        </header>

        {/* ── Play CTA ── */}
        <button type="button" className="home-play-btn" onClick={onPlay}>
          <span className="home-play-btn__icon">🎴</span>
          <span className="home-play-btn__label">Play</span>
        </button>

        {/* ── Feature chips ── */}
        <div className="home-features">
          <div className="home-feature-chip">
            <span>🃏</span>
            <span>9 hands</span>
          </div>
          <div className="home-feature-chip">
            <span>⭐</span>
            <span>Levels</span>
          </div>
          <div className="home-feature-chip">
            <span>💣</span>
            <span>Power-ups</span>
          </div>
        </div>

        {/* ── Auth / profile ── */}
        <div className="home-panel home-panel--auth">
          {username ? (
            <div className="home-profile">
              <div className="home-profile__badge">
                <span className="home-profile__avatar">👤</span>
                <div className="home-profile__info">
                  <span className="home-profile__label">Signed in</span>
                  <strong className="home-profile__name">{username}</strong>
                </div>
              </div>
              <button type="button" className="home-btn-ghost" onClick={onLogout}>
                Log out
              </button>
            </div>
          ) : (
            <>
              <div className="home-panel__header">
                <span className="home-panel__icon">🏆</span>
                <span>Save scores to the leaderboard</span>
              </div>
              <form className="home-auth-form" onSubmit={submitAuth}>
                <div className="home-auth-tabs">
                  <button
                    type="button"
                    className={authMode === "login" ? "active" : ""}
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    className={authMode === "register" ? "active" : ""}
                    onClick={() => { setAuthMode("register"); setAuthError(null); }}
                  >
                    Register
                  </button>
                </div>
                <div className="home-auth-fields">
                  <input
                    placeholder="Username"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    autoComplete="username"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  />
                  <button type="submit" className="home-btn-submit" disabled={authLoading}>
                    {authLoading ? "…" : authMode === "login" ? "Log in" : "Create account"}
                  </button>
                </div>
                {authError && <p className="home-error">{authError}</p>}
              </form>
            </>
          )}
        </div>

        {/* ── Expandable panels ── */}
        <div className="home-panels">
          <div className="home-panel-group">
            <button
              type="button"
              className={`home-panel-toggle ${section === "leaderboard" ? "open" : ""}`}
              onClick={() => setSection(section === "leaderboard" ? null : "leaderboard")}
            >
              <span className="home-panel-toggle__left">
                <span className="home-panel-toggle__icon">🏆</span>
                <span>Leaderboard</span>
              </span>
              <span className="home-panel-toggle__chev">{section === "leaderboard" ? "▲" : "▼"}</span>
            </button>
            {section === "leaderboard" && (
              <div className="home-panel-body">
                <Leaderboard />
              </div>
            )}
          </div>

          <div className="home-panel-group">
            <button
              type="button"
              className={`home-panel-toggle ${section === "rules" ? "open" : ""}`}
              onClick={() => setSection(section === "rules" ? null : "rules")}
            >
              <span className="home-panel-toggle__left">
                <span className="home-panel-toggle__icon">📖</span>
                <span>How to play</span>
              </span>
              <span className="home-panel-toggle__chev">{section === "rules" ? "▲" : "▼"}</span>
            </button>
            {section === "rules" && (
              <div className="home-panel-body home-rules">
                <ul className="home-rules-list">
                  <li><strong>Swipe</strong> adjacent cards (up, down, left, right).</li>
                  <li><strong>Pair</strong> — two of the same rank side by side.</li>
                  <li>
                    <strong>Straight</strong> — five in a row (e.g. 10-J-Q-K-A).
                    Start on the <em>10 or Ace</em> end.
                  </li>
                  <li>Flush = 5 same suit. Full house, four of a kind, and more.</li>
                  <li>Cleared cards drop down — new ones refill from the top.</li>
                </ul>
                <div className="home-score-grid">
                  {HANDS.map(([h, pts]) => (
                    <div key={h} className="home-score-row">
                      <span className="home-score-hand">{HAND_DISPLAY[h]}</span>
                      <span className="home-score-pts">{pts.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
