import { useState } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { GameScreen } from "./screens/GameScreen";

type Screen = "onboard" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboard");
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

  if (screen === "game") {
    return (
      <div className="app app--game">
        <GameScreen username={username} onMenu={() => setScreen("onboard")} />
      </div>
    );
  }

  return (
    <div className="app app--home">
      <OnboardingScreen
        username={username}
        onSetName={onSetName}
        onClearName={onClearName}
        onPlay={() => setScreen("game")}
      />
    </div>
  );
}
