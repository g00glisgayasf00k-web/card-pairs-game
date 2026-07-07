import { useState, useEffect } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LevelSelectScreen } from "./screens/LevelSelectScreen";
import { GameScreen } from "./screens/GameScreen";
import { clearSession, getUsername, isLoggedIn } from "./lib/session";
import { clearProgress } from "./lib/progress";
import { initProgressSync, pullRemoteProgress, stopProgressSync } from "./lib/progressSync";
import { ensureAdSenseLoaded, setGameplayAdSuppression } from "./lib/adsense";

type Screen = "onboard" | "levels" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboard");
  const [playLevel, setPlayLevel] = useState<number | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [username, setUsername] = useState<string | null>(() => getUsername());

  useEffect(() => {
    if (!loggedIn) {
      stopProgressSync();
      return;
    }
    initProgressSync();
    return () => stopProgressSync();
  }, [loggedIn]);

  useEffect(() => {
    const inGame = screen === "game" && loggedIn;
    setGameplayAdSuppression(inGame);
    if (!inGame) ensureAdSenseLoaded();
    return () => setGameplayAdSuppression(false);
  }, [screen, loggedIn]);

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
  };

  const startLevel = (globalLevel: number) => {
    if (!isLoggedIn()) {
      setScreen("onboard");
      return;
    }
    setPlayLevel(globalLevel);
    setScreen("game");
  };

  const goToLevels = () => {
    if (!isLoggedIn()) return;
    setScreen("levels");
  };

  if (screen === "game" && loggedIn) {
    return (
      <div className="app app--game">
        <GameScreen
          username={username}
          startLevel={playLevel}
          onMenu={() => {
            setPlayLevel(undefined);
            setScreen("levels");
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
      />
    </div>
  );
}
