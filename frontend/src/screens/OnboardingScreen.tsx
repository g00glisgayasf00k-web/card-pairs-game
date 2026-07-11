import { useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { Leaderboard } from "../components/Leaderboard";
import { ProfileModal } from "../components/ProfileModal";
import { ChallengeFriendModal } from "../components/ChallengeFriendModal";
import { CompeteModal } from "../components/CompeteModal";
import { clearProgress, loadProgress } from "../lib/progress";
import { MAX_LEVEL } from "../lib/levels";

interface Props {
  username: string | null;
  loggedIn: boolean;
  onSignOut: () => void;
  onSessionChange?: () => void;
  onPlay: () => void;
}

type HomeMenu = "leaderboard" | "rules" | "account" | null;
type PlaySheet = "challenge" | "compete" | null;

export function OnboardingScreen({
  username,
  loggedIn,
  onSignOut,
  onSessionChange,
  onPlay,
}: Props) {
  const [menu, setMenu] = useState<HomeMenu>(null);
  const [playSheet, setPlaySheet] = useState<PlaySheet>(null);
  const saved = loadProgress();

  const startFresh = () => {
    clearProgress();
    onPlay();
  };

  const closeMenu = () => setMenu(null);

  const handleAccountChange = () => {
    onSessionChange?.();
  };

  const cleared = (saved?.completedLevels ?? []).length;

  return (
    <div className="home-screen home-screen--royal">
      <div className="mobile-shell mobile-shell--home">
        <header className="home-toolbar">
          <span className="home-toolbar__brand" aria-hidden>
            ♠
          </span>
          <div className="home-toolbar__actions">
            <button
              type="button"
              className={`home-icon-btn home-icon-btn--labeled${menu === "leaderboard" ? " home-icon-btn--active" : ""}`}
              aria-label="High scores"
              onClick={() => setMenu(menu === "leaderboard" ? null : "leaderboard")}
            >
              <span className="home-icon-btn__label">Scores</span>
              <span className="home-icon-btn__icon" aria-hidden>
                🏆
              </span>
            </button>
            <button
              type="button"
              className={`home-icon-btn home-icon-btn--labeled${menu === "rules" ? " home-icon-btn--active" : ""}`}
              aria-label="How to play"
              onClick={() => setMenu(menu === "rules" ? null : "rules")}
            >
              <span className="home-icon-btn__label">Rules</span>
              <span className="home-icon-btn__icon" aria-hidden>
                📖
              </span>
            </button>
            <button
              type="button"
              className={`home-icon-btn home-icon-btn--labeled home-icon-btn--account${menu === "account" ? " home-icon-btn--active" : ""}${loggedIn ? " home-icon-btn--signed-in" : ""}`}
              aria-label={loggedIn ? `Account: ${username ?? "player"}` : "Sign in or create account"}
              onClick={() => setMenu(menu === "account" ? null : "account")}
            >
              <span className="home-icon-btn__label">Account</span>
              <span className="home-icon-btn__icon" aria-hidden>
                👤
              </span>
              {loggedIn && <span className="home-icon-btn__dot" aria-hidden />}
            </button>
          </div>
        </header>

        <header className={`home-hero${loggedIn ? " home-hero--compact" : ""}`}>
          <div className="home-hero__shine" aria-hidden />

          <div className={`royal-logo${loggedIn ? " royal-logo--compact" : ""}`}>
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

          {!loggedIn && (
            <>
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
            </>
          )}

          {loggedIn && (
            <p className="home-hero__ask">How do you want to play?</p>
          )}
        </header>

        {loggedIn ? (
          <>
            <div className="play-modes" role="group" aria-label="Play modes">
              <button type="button" className="play-mode-card play-mode-card--solo" onClick={onPlay}>
                <span className="play-mode-card__tag">Solo</span>
                <span className="play-mode-card__title">Enter table</span>
                <span className="play-mode-card__desc">
                  Campaign levels, stars &amp; energy
                </span>
                <span className="play-mode-card__meta">
                  {saved ? `${cleared} / ${MAX_LEVEL} cleared` : "Choose your level"}
                </span>
              </button>

              <button
                type="button"
                className="play-mode-card play-mode-card--challenge"
                onClick={() => setPlaySheet("challenge")}
              >
                <span className="play-mode-card__tag">Async</span>
                <span className="play-mode-card__title">Challenge a friend</span>
                <span className="play-mode-card__desc">
                  Same seed — best stars / fewest moves
                </span>
                <span className="play-mode-card__meta">Optional gem wager</span>
              </button>

              <button
                type="button"
                className="play-mode-card play-mode-card--compete"
                onClick={() => setPlaySheet("compete")}
              >
                <span className="play-mode-card__tag">Ranked</span>
                <span className="play-mode-card__title">Compete</span>
                <span className="play-mode-card__desc">
                  Daily board or quick match ladder
                </span>
                <span className="play-mode-card__meta">No friends required</span>
              </button>
            </div>

            {saved && (
              <button type="button" className="home-start-over" onClick={startFresh}>
                Start over from level 1
              </button>
            )}
          </>
        ) : (
          <div className="home-auth-inline">
            <AuthPanel variant="home" onSuccess={() => handleAccountChange()} />
          </div>
        )}
      </div>

      {menu === "leaderboard" && (
        <div className="modal-overlay scores-overlay home-menu-overlay" onClick={closeMenu} role="presentation">
          <div
            className="modal scores-modal home-menu-modal home-menu-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="home-leaderboard-title"
          >
            <h2 id="home-leaderboard-title">Top scores</h2>
            <Leaderboard />
            <button type="button" className="btn scores-close" onClick={closeMenu}>
              Close
            </button>
          </div>
        </div>
      )}

      {menu === "rules" && (
        <div className="modal-overlay scores-overlay home-menu-overlay" onClick={closeMenu} role="presentation">
          <div
            className="modal scores-modal home-menu-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="home-rules-title"
          >
            <h2 id="home-rules-title">How to play</h2>
            <ul className="home-rules-list home-rules-list--modal">
              <li><strong>Swipe</strong> exactly five adjacent cards.</li>
              <li>Make poker hands to clear cards and score points.</li>
              <li>Reach the point goal before moves run out.</li>
              <li>Earn up to 3★ per level for speed and challenges.</li>
              <li>Use gems for extra moves; energy refills +1 every 2 hours (max 12).</li>
            </ul>
            <button type="button" className="btn scores-close" onClick={closeMenu}>
              Close
            </button>
          </div>
        </div>
      )}

      {menu === "account" && (
        <ProfileModal
          username={username}
          onClose={closeMenu}
          onAccountChange={handleAccountChange}
          onSignOut={() => {
            onSignOut();
            closeMenu();
          }}
        />
      )}

      {playSheet === "challenge" && (
        <ChallengeFriendModal onClose={() => setPlaySheet(null)} onPlaySolo={onPlay} />
      )}

      {playSheet === "compete" && (
        <CompeteModal onClose={() => setPlaySheet(null)} onPlaySolo={onPlay} />
      )}
    </div>
  );
}
