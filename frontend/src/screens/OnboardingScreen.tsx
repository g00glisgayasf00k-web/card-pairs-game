import { useEffect, useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { ProfileModal } from "../components/ProfileModal";
import { MultiplayerModal } from "../components/MultiplayerModal";
import { GemShopModal } from "../components/GemShopModal";
import { Leaderboard } from "../components/Leaderboard";
import {
  GameModeCard,
  HomeBottomNav,
  HomeHeader,
  HomeHeroBanner,
  type HomeNavTab,
} from "../components/home";
import { loadProgress } from "../lib/progress";
import { MAX_LEVEL } from "../lib/levels";
import type { ChallengeDto } from "../lib/api";
import { useNotificationSummary } from "../lib/useNotificationSummary";

interface Props {
  username: string | null;
  loggedIn: boolean;
  onSignOut: () => void;
  onSessionChange?: () => void;
  onPlay: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
  openChallengeSheet?: boolean;
  onChallengeSheetOpened?: () => void;
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
  openChallengeSheet,
  onChallengeSheetOpened,
}: Props) {
  const [menu, setMenu] = useState<HomeMenu>(null);
  const [playSheet, setPlaySheet] = useState<PlaySheet>(null);
  const [walletTick, setWalletTick] = useState(0);
  const { summary, refresh: refreshNotifs } = useNotificationSummary(loggedIn);
  const saved = loadProgress();
  void walletTick;

  useEffect(() => {
    if (!openChallengeSheet) return;
    setPlaySheet("challenge");
    onChallengeSheetOpened?.();
  }, [openChallengeSheet, onChallengeSheetOpened]);

  const closeMenu = () => setMenu(null);

  const handleAccountChange = () => {
    onSessionChange?.();
    setWalletTick((t) => t + 1);
  };

  const cleared = (saved?.completedLevels ?? []).length;
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
      <div className="home-screen-shell relative flex w-full max-w-[420px] flex-col gap-4 px-4">
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
                  label: `${cleared} / ${MAX_LEVEL} cleared`,
                  percent: progressPct,
                }}
                onClick={onPlay}
              />
              <GameModeCard
                glow="blue"
                label="Multiplayer"
                title="Play online"
                subtitle="Quick play or challenge a friend"
                badge={summary.total}
                onClick={() => setPlaySheet("challenge")}
              />
              <GameModeCard
                glow="green"
                label="Ranked"
                title="Compete"
                subtitle="Daily board or quick match ladder"
                onClick={() => setPlaySheet("compete")}
              />
            </div>

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
            <h2 id="home-leaderboard-title">Leaderboard</h2>
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
        <MultiplayerModal
          onClose={() => {
            setPlaySheet(null);
            void refreshNotifs();
          }}
          friendRequestCount={summary.friend_requests}
          challengeCount={summary.challenges}
          onNotificationsChange={() => void refreshNotifs()}
          onPlayChallenge={(c) => {
            setPlaySheet(null);
            void refreshNotifs();
            onPlayChallenge(c);
          }}
        />
      )}

      {playSheet === "compete" && (
        <MultiplayerModal
          initialView="quick"
          onClose={() => {
            setPlaySheet(null);
            void refreshNotifs();
          }}
          friendRequestCount={summary.friend_requests}
          challengeCount={summary.challenges}
          onNotificationsChange={() => void refreshNotifs()}
          onPlayChallenge={(c) => {
            setPlaySheet(null);
            void refreshNotifs();
            onPlayChallenge(c);
          }}
        />
      )}
    </div>
  );
}
