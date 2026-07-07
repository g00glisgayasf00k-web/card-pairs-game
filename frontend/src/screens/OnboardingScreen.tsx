import { useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { Leaderboard } from "../components/Leaderboard";
import { clearProgress, loadProgress } from "../lib/progress";

interface Props {
  username: string | null;
  loggedIn: boolean;
  onAuthSuccess: (username: string, token: string) => void;
  onSignOut: () => void;
  onPlay: () => void;
}

export function OnboardingScreen({
  username,
  loggedIn,
  onAuthSuccess,
  onSignOut,
  onPlay,
}: Props) {
  const [section, setSection] = useState<"leaderboard" | "rules" | null>(null);
  const saved = loadProgress();

  const startFresh = () => {
    clearProgress();
    onPlay();
  };

  return (
    <div className="home-screen home-screen--royal">
      <div className="mobile-shell mobile-shell--home">
        <div className="home-panel home-panel--auth home-panel--auth-top">
          <div className="home-panel__header">
            <span className="home-panel__icon">👤</span>
            <span>{loggedIn ? "Your account" : "Royal invitation — sign in"}</span>
          </div>
          {loggedIn && username ? (
            <div className="home-profile">
              <div className="home-profile__badge">
                <span className="home-profile__avatar">👤</span>
                <div className="home-profile__info">
                  <span className="home-profile__label">Playing as</span>
                  <strong className="home-profile__name">{username}</strong>
                </div>
              </div>
              <button type="button" className="home-btn-ghost" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <AuthPanel onSuccess={onAuthSuccess} variant="home" />
          )}
        </div>

        <header className="home-hero">
          <div className="home-hero__shine" aria-hidden />

          <div className="royal-logo">
            <div className="royal-logo__crown" aria-hidden>
              👑
            </div>
            <div className="royal-logo__shield">
              <span className="royal-logo__line">Royal</span>
              <span className="royal-logo__line royal-logo__line--main">Poker Match</span>
              <div className="royal-logo__suits" aria-hidden>
                <span className="suit-spades">♠</span>
                <span className="suit-hearts">♥</span>
                <span className="suit-clubs">♣</span>
                <span className="suit-diamonds">♦</span>
              </div>
            </div>
          </div>

          <div className="home-hero__portrait" aria-hidden>
            🦊
          </div>

          <div className="royal-plaque">
            <span>Build hands</span>
            <span>Beat levels</span>
            <span>Become royal</span>
          </div>

          <div className="home-motto-chips" aria-hidden>
            <span>🪙</span>
            <span>🃏</span>
            <span>👑</span>
          </div>
        </header>

        {loggedIn ? (
          <>
            <button type="button" className="btn-royal-cta" onClick={onPlay}>
              <span className="btn-royal-cta__main">Enter the table</span>
              <span className="btn-royal-cta__sub">
                {saved
                  ? `${(saved.completedLevels ?? []).length} / 100 levels cleared`
                  : "Choose your level"}
              </span>
            </button>

            {saved && (
              <button type="button" className="home-start-over" onClick={startFresh}>
                Start over from level 1
              </button>
            )}
          </>
        ) : (
          <div className="home-play-locked">
            <span className="home-play-locked__icon">🔒</span>
            <p>Sign in to take your seat at the royal table.</p>
          </div>
        )}

        <div className="home-panels">
          <div className="home-panel-group">
            <button
              type="button"
              className={`home-panel-toggle ${section === "leaderboard" ? "open" : ""}`}
              onClick={() => setSection(section === "leaderboard" ? null : "leaderboard")}
            >
              <span className="home-panel-toggle__left">
                <span className="home-panel-toggle__icon">🏆</span>
                <span>Top scores</span>
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
                  <li><strong>Swipe</strong> exactly five adjacent cards.</li>
                  <li>Make poker hands to clear cards and score points.</li>
                  <li>Reach the point goal before moves run out.</li>
                  <li>Earn up to 3★ per level for speed and challenges.</li>
                  <li>Use gems for extra moves and energy when needed.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
