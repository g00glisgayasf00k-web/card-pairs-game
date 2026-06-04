import { useState } from "react";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { GameScreen } from "./screens/GameScreen";

type Screen = "onboard" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboard");
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("username")
  );

  const onAuth = (u: string, token: string) => {
    localStorage.setItem("username", u);
    localStorage.setItem("token", token);
    setUsername(u);
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
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
        onAuth={onAuth}
        onLogout={onLogout}
        onPlay={() => setScreen("game")}
      />
    </div>
  );
}
