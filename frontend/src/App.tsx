import { useState, useEffect } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LevelSelectScreen } from "./screens/LevelSelectScreen";
import { GameScreen } from "./screens/GameScreen";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";
import { clearSession, getUsername, isLoggedIn } from "./lib/session";
import { clearProgress } from "./lib/progress";
import { initProgressSync, pullRemoteProgress, stopProgressSync } from "./lib/progressSync";
import {
  onNotificationOpen,
  stopPushNotifications,
  syncPushTokenAfterLogin,
} from "./lib/nativePush";
import type { ChallengeDto } from "./lib/api";
import type { ChallengeMatch } from "./screens/GameScreen";

type Screen = "onboard" | "levels" | "game";
export type PlayTheme = "solo" | "challenge" | "compete";

function readResetTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("reset");
}

function clearResetTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("reset");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboard");
  const [playLevel, setPlayLevel] = useState<number | undefined>(undefined);
  const [challengeMatch, setChallengeMatch] = useState<ChallengeMatch | null>(null);
  const [playTheme, setPlayTheme] = useState<PlayTheme>("solo");
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [username, setUsername] = useState<string | null>(() => getUsername());
  const [resetToken, setResetToken] = useState<string | null>(() => readResetTokenFromUrl());
  const [openChallengeSheet, setOpenChallengeSheet] = useState(false);

  useEffect(() => {
    if (!loggedIn) {
      stopProgressSync();
      void stopPushNotifications();
      return;
    }
    initProgressSync();
    void syncPushTokenAfterLogin();
    return () => stopProgressSync();
  }, [loggedIn]);

  useEffect(() => {
    onNotificationOpen((data) => {
      const type = data.type ?? "";
      if (
        type === "friend_request" ||
        type === "friend_accepted" ||
        type === "challenge" ||
        type === "challenge_complete"
      ) {
        setScreen("onboard");
        setOpenChallengeSheet(true);
      }
    });
    return () => onNotificationOpen(null);
  }, []);

  useEffect(() => {
    if (!loggedIn || screen === "onboard") return;
    void pullRemoteProgress();
  }, [screen, loggedIn]);

  const handleSignOut = () => {
    stopProgressSync();
    void stopPushNotifications();
    clearProgress();
    clearSession();
    setUsername(null);
    setLoggedIn(false);
    setScreen("onboard");
    setPlayLevel(undefined);
    setChallengeMatch(null);
    setPlayTheme("solo");
    setOpenChallengeSheet(false);
  };

  const startLevel = (globalLevel: number) => {
    if (!isLoggedIn()) {
      setScreen("onboard");
      return;
    }
    setChallengeMatch(null);
    setPlayTheme("solo");
    setPlayLevel(globalLevel);
    setScreen("game");
  };

  const startChallenge = (challenge: ChallengeDto) => {
    if (!isLoggedIn()) return;
    setPlayTheme(challenge.kind === "quick" ? "compete" : "challenge");
    setPlayLevel(undefined);
    setChallengeMatch({
      id: challenge.id,
      level: challenge.level,
      boardSeed: challenge.board_seed,
      mission: challenge.mission ?? null,
      youAre: challenge.you_are,
    });
    setScreen("game");
  };

  const goToLevels = () => {
    if (!isLoggedIn()) return;
    setChallengeMatch(null);
    setPlayTheme("solo");
    setScreen("levels");
  };

  if (resetToken) {
    return (
      <ResetPasswordScreen
        token={resetToken}
        onDone={() => {
          clearResetTokenFromUrl();
          setResetToken(null);
          setScreen("onboard");
        }}
      />
    );
  }

  if (screen === "game" && loggedIn) {
    return (
      <div className={`app app--game app--theme-${playTheme}`} data-play-theme={playTheme}>
        <GameScreen
          username={username}
          startLevel={challengeMatch?.level ?? playLevel}
          challengeMatch={challengeMatch}
          onMenu={() => {
            setPlayLevel(undefined);
            setChallengeMatch(null);
            setScreen(challengeMatch ? "onboard" : "levels");
          }}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  if (screen === "levels" && loggedIn) {
    return (
      <div className={`app app--levels app--theme-${playTheme}`} data-play-theme={playTheme}>
        <LevelSelectScreen
          onBack={() => setScreen("onboard")}
          onSelectLevel={startLevel}
        />
      </div>
    );
  }

  return (
    <div className="app app--home">
      <OnboardingScreen
        username={username}
        loggedIn={loggedIn}
        onSignOut={handleSignOut}
        onSessionChange={() => {
          setLoggedIn(isLoggedIn());
          setUsername(getUsername());
        }}
        onPlay={goToLevels}
        onPlayChallenge={startChallenge}
        openChallengeSheet={openChallengeSheet}
        onChallengeSheetOpened={() => setOpenChallengeSheet(false)}
      />
    </div>
  );
}
