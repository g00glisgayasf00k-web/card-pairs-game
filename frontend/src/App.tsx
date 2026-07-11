import { useState, useEffect } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LevelSelectScreen } from "./screens/LevelSelectScreen";
import { GameScreen } from "./screens/GameScreen";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";
import { clearSession, getUsername, isLoggedIn } from "./lib/session";
import { clearProgress } from "./lib/progress";
import { initProgressSync, pullRemoteProgress, stopProgressSync } from "./lib/progressSync";
import type { ChallengeDto } from "./lib/api";
import type { ChallengeMatch } from "./screens/GameScreen";

type Screen = "onboard" | "levels" | "game";

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
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [username, setUsername] = useState<string | null>(() => getUsername());
  const [resetToken, setResetToken] = useState<string | null>(() => readResetTokenFromUrl());

  useEffect(() => {
    if (!loggedIn) {
      stopProgressSync();
      return;
    }
    initProgressSync();
    return () => stopProgressSync();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn || screen === "onboard") return;
    void pullRemoteProgress();
  }, [screen, loggedIn]);

  const handleSignOut = () => {
    stopProgressSync();
    clearProgress();
    clearSession();
    setUsername(null);
    setLoggedIn(false);
    setScreen("onboard");
    setPlayLevel(undefined);
    setChallengeMatch(null);
  };

  const startLevel = (globalLevel: number) => {
    if (!isLoggedIn()) {
      setScreen("onboard");
      return;
    }
    setChallengeMatch(null);
    setPlayLevel(globalLevel);
    setScreen("game");
  };

  const startChallenge = (challenge: ChallengeDto) => {
    if (!isLoggedIn()) return;
    if (challenge.status === "completed") {
      // Still open game screen in view/result mode via GameScreen
    }
    setPlayLevel(undefined);
    setChallengeMatch({
      id: challenge.id,
      level: challenge.level,
      boardSeed: challenge.board_seed,
    });
    setScreen("game");
  };

  const goToLevels = () => {
    if (!isLoggedIn()) return;
    setChallengeMatch(null);
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
      <div className="app app--game">
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
      <div className="app app--levels">
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
      />
    </div>
  );
}
