import { useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { Leaderboard } from "../components/Leaderboard";
import { clearProgress, loadProgress } from "../lib/progress";
import { HAND_DISPLAY, HAND_SCORE_LIST, type HandLabel } from "../lib/pokerHands";

const HANDS = HAND_SCORE_LIST.map(({ hand, points }) => [hand, points] as [HandLabel, number]);

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
    <div className="home-screen">
      <div className="mobile-shell mobile-shell--home">
        <header className="home-hero">
          <div className="home-hero__shine" aria-hidden />
          <div className="home-suits" aria-hidden>
            <span className="suit-hearts">♥</span>
            <span className="suit-spades">♠</span>
            <span className="suit-diamonds">♦</span>
            <span className="suit-clubs">♣</span>
          </div>
          <h1 className="home-title">Royal Match Poker</h1>
          <p className="home-tagline">Swipe hands · Clear the board · Level up</p>
        </header>

        {loggedIn ? (
          <>
            <button type="button" className="home-play-btn" onClick={onPlay}>
              <span className="home-play-btn__icon">🗺️</span>
              <span className="home-play-btn__label">
                {saved
                  ? `Levels — ${(saved.completedLevels ?? []).length} / 100`
                  : "Choose Level"}
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
            <p>Sign in below to unlock levels and save your progress.</p>
          </div>
        )}

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

        <div className="home-panel home-panel--auth">
          <div className="home-panel__header">
            <span className="home-panel__icon">👤</span>
            <span>{loggedIn ? "Your account" : "Sign in required"}</span>
          </div>
          {loggedIn && username ? (
            <div className="home-profile">
              <div className="home-profile__badge">
                <span className="home-profile__avatar">👤</span>
                <div className="home-profile__info">
                  <span className="home-profile__label">Signed in as</span>
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
                  <li><strong>Swipe</strong> exactly five adjacent cards (up, down, left, right).</li>
                  <li><strong>Pair</strong> — two of the same rank plus any three kickers.</li>
                  <li>
                    <strong>Straight</strong> — five consecutive ranks in any swipe order (e.g. 10-J-Q-K-A).
                  </li>
                  <li>Every hand clears five cards — like real poker.</li>
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
