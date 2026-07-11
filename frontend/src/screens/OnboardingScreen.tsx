import { useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { Leaderboard } from "../components/Leaderboard";
import { ProfileModal } from "../components/ProfileModal";
import { ChallengeFriendModal } from "../components/ChallengeFriendModal";
import { CompeteModal } from "../components/CompeteModal";
import { GemShopModal } from "../components/GemShopModal";
import { HomeMockupPage } from "../components/home/HomeMockupPage";
import { HomeHeroBanner } from "../components/home/HomeHeroBanner";
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

  return (
    <div className="bg-home-page flex min-h-dvh justify-center text-home-text">
      {loggedIn ? (
        <HomeMockupPage
          gems={gems}
          cleared={cleared}
          maxLevels={MAX_LEVEL}
          level={currentLevel}
          onMenu={() => setMenu(menu === "account" ? null : "account")}
          onShop={() => setMenu("shop")}
          onProfile={() => setMenu(menu === "account" ? null : "account")}
          onSolo={onPlay}
          onChallenge={() => setPlaySheet("challenge")}
          onCompete={() => setPlaySheet("compete")}
          onLevelBar={startFresh}
          onScores={() => setMenu("leaderboard")}
          onRules={() => setMenu("rules")}
          onSettings={() => setMenu("account")}
        />
      ) : (
        <div className="relative flex w-full max-w-[420px] flex-col gap-4 px-4 pt-3 pb-8">
          <HomeHeroBanner />
          <div className="rounded-home-card border border-home-gold/30 bg-home-bg p-4">
            <AuthPanel variant="home" onSuccess={() => handleAccountChange()} />
          </div>
        </div>
      )}

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
