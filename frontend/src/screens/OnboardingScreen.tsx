import { useEffect, useState } from "react";
import { AuthPanel } from "../components/AuthPanel";
import { ProfileModal } from "../components/ProfileModal";
import { MultiplayerModal } from "../components/MultiplayerModal";
import { TournamentModal } from "../components/TournamentModal";
import { GemShopModal } from "../components/GemShopModal";
import { Leaderboard } from "../components/Leaderboard";
import {
  GameModeCard,
  HomeBottomNav,
  HomeHeader,
  HomeHeroBanner,
  HomeKitShell,
  HOME_ASSETS,
  type HomeNavTab,
} from "../components/home";
import { loadProgress } from "../lib/progress";
import { MAX_LEVEL } from "../lib/levels";
import type { ChallengeDto } from "../lib/api";
import type { TournamentBoardPick } from "../lib/tournamentTiers";
import { useNotificationSummary } from "../lib/useNotificationSummary";
import { onHardwareBack } from "../lib/nativeBack";

interface Props {
  username: string | null;
  loggedIn: boolean;
  onSignOut: () => void;
  onSessionChange?: () => void;
  onPlay: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
  onPlayTournament: (board: TournamentBoardPick) => void;
  openChallengeSheet?: boolean;
  onChallengeSheetOpened?: () => void;
}

type HomeMenu = "leaderboard" | "rules" | "account" | "shop" | null;
type PlaySheet = "challenge" | "tournament" | null;

export function OnboardingScreen({
  username,
  loggedIn,
  onSignOut,
  onSessionChange,
  onPlay,
  onPlayChallenge,
  onPlayTournament,
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

  useEffect(() => {
    return onHardwareBack(() => {
      if (playSheet) {
        setPlaySheet(null);
        return true;
      }
      if (menu) {
        setMenu(null);
        return true;
      }
      return false;
    });
  }, [playSheet, menu]);

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
                label="Tournament"
                title="Enter a cup"
                subtitle="Entry fees, prize pools & top-3 payouts"
                onClick={() => setPlaySheet("tournament")}
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
        <HomeKitShell
          tone="scores"
          title="Scores"
          lead="Campaign stars earned across all levels."
          brandIcon={HOME_ASSETS.nav.scores}
          onClose={closeMenu}
        >
          <Leaderboard />
        </HomeKitShell>
      )}

      {menu === "rules" && (
        <HomeKitShell
          tone="rules"
          title="Rules"
          lead="Swipe five cards. Make poker hands. Beat the goal."
          brandIcon={HOME_ASSETS.nav.rules}
          onClose={closeMenu}
        >
          <ol className="hk-kit__rules">
            {[
              <>
                <strong>Swipe</strong> exactly five adjacent cards.
              </>,
              <>Make poker hands to clear cards and score points.</>,
              <>Reach the point goal before moves run out.</>,
              <>Earn up to 3★ per level for speed and challenges.</>,
              <>Use gems for extra moves; energy refills +1 every 2 hours (max 12).</>,
            ].map((text, i) => (
              <li key={i}>
                <span className="hk-kit__rules-num">{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </HomeKitShell>
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

      {playSheet === "tournament" && (
        <TournamentModal
          onClose={() => setPlaySheet(null)}
          onBalanceChange={() => setWalletTick((t) => t + 1)}
          onOpenShop={() => {
            setPlaySheet(null);
            setMenu("shop");
          }}
          onPlayTournament={(board) => {
            setPlaySheet(null);
            onPlayTournament(board);
          }}
        />
      )}
    </div>
  );
}
