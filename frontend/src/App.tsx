import { useState } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LevelSelectScreen } from "./screens/LevelSelectScreen";
import { GameScreen } from "./screens/GameScreen";
import { clearSession, getUsername, isLoggedIn, setSession } from "./lib/session";
import { initProgressSync } from "./lib/progressSync";

type Screen = "onboard" | "levels" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboard");
  const [playLevel, setPlayLevel] = useState<number | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [username, setUsername] = useState<string | null>(() => getUsername());

  const handleAuthSuccess = (name: string, token: string) => {
    setSession(name, token);
    setUsername(name);
    setLoggedIn(true);
    initProgressSync();
  };

  const handleSignOut = () => {
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
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        onPlay={goToLevels}
      />
    </div>
  );
}
