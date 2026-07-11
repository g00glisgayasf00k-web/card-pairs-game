import { useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { Leaderboard } from "../components/Leaderboard";
import { ProfileModal } from "../components/ProfileModal";
import { ChallengeFriendModal } from "../components/ChallengeFriendModal";
import { CompeteModal } from "../components/CompeteModal";
import { GemShopModal } from "../components/GemShopModal";
import { clearProgress, loadProgress } from "../lib/progress";
import { MAX_LEVEL } from "../lib/levels";
import { formatLevelId } from "../lib/levelMap";
import type { ChallengeDto } from "../lib/api";

interface Props {
  username: string | null;
  loggedIn: boolean;
  onSignOut: () => void;
  onSessionChange?: () => void;
  onPlay: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
}

type HomeMenu = "leaderboard" | "rules" | "account" | "shop" | null;
type PlaySheet = "challenge" | "compete" | null;
type BottomTab = "play" | "scores" | "rules" | "shop" | "settings";

export function OnboardingScreen({
  username,
  loggedIn,
  onSignOut,
  onSessionChange,
  onPlay,
  onPlayChallenge,
}: Props) {
  const [menu, setMenu] = useState<HomeMenu>(null);
  const [playSheet, setPlaySheet] = useState<PlaySheet>(null);
  const [walletTick, setWalletTick] = useState(0);
  const saved = loadProgress();
  void walletTick;

  const startFresh = () => {
    clearProgress();
    onPlay();
  };

  const closeMenu = () => setMenu(null);

  const handleAccountChange = () => {
    onSessionChange?.();
    setWalletTick((t) => t + 1);
  };

  const cleared = (saved?.completedLevels ?? []).length;
  const currentLevel = saved?.level ?? 1;
  const gems = saved?.credits ?? 0;
  const progressPct = Math.min(100, Math.round((cleared / MAX_LEVEL) * 100));

  const openTab = (tab: BottomTab) => {
    if (tab === "play") {
      setMenu(null);
      return;
    }
    if (tab === "scores") setMenu("leaderboard");
    else if (tab === "rules") setMenu("rules");
    else if (tab === "shop") setMenu("shop");
    else setMenu("account");
  };

  const activeTab: BottomTab =
    menu === "leaderboard"
      ? "scores"
      : menu === "rules"
        ? "rules"
        : menu === "shop"
          ? "shop"
          : menu === "account"
            ? "settings"
            : "play";

  return (
    <div className="home-screen home-screen--royal home-screen--v2">
      <div className="mobile-shell mobile-shell--home">
        <header className="home-topbar">
          <div className="home-topbar__brand" aria-label="Royal Poker Match">
            <span className="home-topbar__crown" aria-hidden>
              👑
            </span>
            <span className="home-topbar__royal">Royal</span>
            <span className="home-topbar__title">Poker Match</span>
            <span className="home-topbar__suits" aria-hidden>
              <span className="suit-spades">♠</span>
              <span className="suit-hearts">♥</span>
              <span className="suit-clubs">♣</span>
              <span className="suit-diamonds">♦</span>
            </span>
          </div>

          <div className="home-topbar__right">
            {loggedIn && (
              <button
                type="button"
                className="home-gem-chip"
                onClick={() => setMenu("shop")}
                aria-label={`${gems} gems`}
              >
                <span aria-hidden>💎</span>
                <strong>{gems.toLocaleString()}</strong>
                <span className="home-gem-chip__plus" aria-hidden>
                  +
                </span>
              </button>
            )}
            <button
              type="button"
              className={`home-avatar-btn${loggedIn ? " home-avatar-btn--on" : ""}`}
              aria-label={loggedIn ? `Account: ${username ?? "player"}` : "Sign in"}
              onClick={() => setMenu(menu === "account" ? null : "account")}
            >
              👤
            </button>
          </div>
        </header>

        {loggedIn ? (
          <>
            <section className="home-hero-banner" aria-label="Play modes">
              <div className="home-hero-banner__art" aria-hidden>
                <div className="home-hero-cards">
                  <span className="home-hero-card home-hero-card--a">A♠</span>
                  <span className="home-hero-card home-hero-card--k">K♥</span>
                  <span className="home-hero-card home-hero-card--q">Q♣</span>
                </div>
                <div className="home-hero-chips">
                  <span className="home-hero-chip home-hero-chip--red" />
                  <span className="home-hero-chip home-hero-chip--blue" />
                  <span className="home-hero-chip home-hero-chip--gold" />
                </div>
              </div>
              <h1 className="home-hero-banner__ask">How do you want to play?</h1>
            </section>

            <div className="play-modes play-modes--v2" role="group" aria-label="Play modes">
              <button type="button" className="play-mode-card play-mode-card--solo" onClick={onPlay}>
                <div className="play-mode-card__body">
                  <span className="play-mode-card__tag">Solo</span>
                  <span className="play-mode-card__title">Enter table</span>
                  <span className="play-mode-card__desc">Campaign levels, stars &amp; energy</span>
                  <span className="play-mode-card__progress-label">
                    ★ {cleared} / {MAX_LEVEL} cleared
                  </span>
                  <span className="play-mode-card__progress" aria-hidden>
                    <span style={{ width: `${progressPct}%` }} />
                  </span>
                </div>
                <span className="play-mode-card__icon play-mode-card__icon--solo" aria-hidden>
                  🏆
                </span>
                <span className="play-mode-card__chev" aria-hidden>
                  ›
                </span>
              </button>

              <button
                type="button"
                className="play-mode-card play-mode-card--challenge"
                onClick={() => setPlaySheet("challenge")}
              >
                <div className="play-mode-card__body">
                  <span className="play-mode-card__tag">Async</span>
                  <span className="play-mode-card__title">Challenge a friend</span>
                  <span className="play-mode-card__desc">Same seed — best stars / fewest moves</span>
                  <span className="play-mode-card__meta">💎 Optional gem wager</span>
                </div>
                <span className="play-mode-card__icon play-mode-card__icon--challenge" aria-hidden>
                  ⚔️
                </span>
                <span className="play-mode-card__chev" aria-hidden>
                  ›
                </span>
              </button>

              <button
                type="button"
                className="play-mode-card play-mode-card--compete"
                onClick={() => setPlaySheet("compete")}
              >
                <div className="play-mode-card__body">
                  <span className="play-mode-card__tag">Ranked</span>
                  <span className="play-mode-card__title">Compete</span>
                  <span className="play-mode-card__desc">Daily board or quick match ladder</span>
                  <span className="play-mode-card__meta">🛡 No friends required</span>
                </div>
                <span className="play-mode-card__icon play-mode-card__icon--compete" aria-hidden>
                  👑
                </span>
                <span className="play-mode-card__chev" aria-hidden>
                  ›
                </span>
              </button>
            </div>

            <button type="button" className="home-level-strip" onClick={startFresh}>
              <span className="home-level-strip__badge">{currentLevel}</span>
              <span className="home-level-strip__text">
                <strong>Level {formatLevelId(currentLevel)}</strong>
                <span>Start over from level 1</span>
              </span>
              <span className="home-level-strip__chest" aria-hidden>
                <span className="home-level-strip__bar">
                  <span style={{ width: `${Math.min(100, (currentLevel % 20) * 5)}%` }} />
                </span>
                🧰
              </span>
            </button>
          </>
        ) : (
          <>
            <header className="home-hero home-hero--compact">
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
              <div className="royal-plaque">
                <span>Build hands</span>
                <span>Beat levels</span>
                <span>Become royal</span>
              </div>
            </header>
            <div className="home-auth-inline">
              <AuthPanel variant="home" onSuccess={() => handleAccountChange()} />
            </div>
          </>
        )}

        {loggedIn && (
          <nav className="home-bottom-nav" aria-label="Main">
            {(
              [
                ["play", "Play", "🏠"],
                ["scores", "Scores", "🏆"],
                ["rules", "Rules", "📖"],
                ["shop", "Shop", "🛒"],
                ["settings", "Settings", "⚙️"],
              ] as const
            ).map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={`home-bottom-nav__btn${activeTab === id ? " home-bottom-nav__btn--on" : ""}`}
                onClick={() => openTab(id)}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
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
              <li>
                <strong>Swipe</strong> exactly five adjacent cards.
              </li>
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

      {menu === "shop" && (
        <GemShopModal
          onClose={closeMenu}
          onBalanceChange={() => {
            handleAccountChange();
          }}
        />
      )}

      {playSheet === "challenge" && (
        <ChallengeFriendModal
          onClose={() => setPlaySheet(null)}
          onPlayChallenge={(c) => {
            setPlaySheet(null);
            onPlayChallenge(c);
          }}
        />
      )}

      {playSheet === "compete" && (
        <CompeteModal
          onClose={() => setPlaySheet(null)}
          onPlaySolo={() => {
            setPlaySheet(null);
            onPlay();
          }}
          onPlayChallenge={(c) => {
            setPlaySheet(null);
            onPlayChallenge(c);
          }}
        />
      )}
    </div>
  );
}
