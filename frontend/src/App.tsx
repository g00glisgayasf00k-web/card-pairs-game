import { useState } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LevelSelectScreen } from "./screens/LevelSelectScreen";
import { GameScreen } from "./screens/GameScreen";

type Screen = "onboard" | "levels" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboard");
  const [playLevel, setPlayLevel] = useState<number | undefined>(undefined);
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("username")
  );

  const onSetName = (u: string) => {
    localStorage.setItem("username", u);
    localStorage.removeItem("token");
    setUsername(u);
  };

  const onClearName = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    setUsername(null);
  };

  const startLevel = (globalLevel: number) => {
    setPlayLevel(globalLevel);
    setScreen("game");
  };

  if (screen === "game") {
    return (
      <div className="app app--game">
        <GameScreen
          username={username}
          startLevel={playLevel}
          onMenu={() => {
            setPlayLevel(undefined);
            setScreen("levels");
          }}
        />
      </div>
    );
  }

  if (screen === "levels") {
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
        onSetName={onSetName}
        onClearName={onClearName}
        onPlay={() => setScreen("levels")}
      />
    </div>
  );
}
