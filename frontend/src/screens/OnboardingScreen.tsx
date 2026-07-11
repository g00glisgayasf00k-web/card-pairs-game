import { useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { ProfileModal } from "../components/ProfileModal";
import { ChallengeFriendModal } from "../components/ChallengeFriendModal";
import { CompeteModal } from "../components/CompeteModal";
import { GemShopModal } from "../components/GemShopModal";
import {
  GameModeCard,
  HomeBottomNav,
  HomeHeader,
  HomeHeroBanner,
  HomeLevelBar,
  type HomeNavTab,
} from "../components/home";
import { clearProgress, loadProgress } from "../lib/progress";
import { MAX_LEVEL } from "../lib/levels";
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

  const openTab = (tab: HomeNavTab) => {
    if (tab === "play") {
      setMenu(null);
      return;
    }
    if (tab === "scores") setMenu("leaderboard");
    else if (tab === "rules") setMenu("rules");
    else if (tab === "shop") setMenu("shop");
    else setMenu("account");
  };

  const activeTab: HomeNavTab =
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
    <div className="bg-home-page flex min-h-dvh justify-center text-home-text">
      <div className="relative flex w-full max-w-[420px] flex-col gap-4 px-4 pt-3 pb-[max(5.5rem,calc(4.25rem+env(safe-area-inset-bottom)))]">
        <HomeHeader
          gems={gems}
          loggedIn={loggedIn}
          username={username}
          onShop={() => setMenu("shop")}
          onProfile={() => setMenu(menu === "account" ? null : "account")}
        />

        {loggedIn ? (
          <>
            <HomeHeroBanner />

            <div className="flex flex-col gap-3" role="group" aria-label="Play modes">
              <GameModeCard
                glow="purple"
                label="Solo"
                title="Enter table"
                subtitle="Campaign levels, stars & energy"
                progress={{
                  label: `★ ${cleared} / ${MAX_LEVEL} cleared`,
                  percent: progressPct,
                }}
                onClick={onPlay}
              />
              <GameModeCard
                glow="blue"
                label="Friends"
                title="Challenge your friends"
                subtitle="Same seed — best stars / fewest moves"
                meta="Optional gem wager"
                onClick={() => setPlaySheet("challenge")}
              />
              <GameModeCard
                glow="green"
                label="Ranked"
                title="Compete"
                subtitle="Daily board or quick match ladder"
                meta="No friends required"
                onClick={() => setPlaySheet("compete")}
              />
            </div>

            <HomeLevelBar
              levelLabel={String(currentLevel)}
              progressPercent={Math.min(100, ((currentLevel - 1) % 20) * 5)}
              onClick={startFresh}
            />

            <HomeBottomNav active={activeTab} onSelect={openTab} />
          </>
        ) : (
          <div className="rounded-home-card border border-home-border bg-home-glass p-4">
            <HomeHeroBanner />
            <div className="mt-4">
              <AuthPanel variant="home" onSuccess={() => handleAccountChange()} />
            </div>
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
            <h2 id="home-leaderboard-title">Scores</h2>
            <p className="play-mode-modal__lead" style={{ textAlign: "center", margin: "1.5rem 0" }}>
              Coming soon
            </p>
            <p className="play-mode-modal__hint" style={{ textAlign: "center" }}>
              Global leaderboards are on the way. Keep clearing levels for now.
            </p>
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
