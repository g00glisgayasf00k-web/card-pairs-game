import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PortraitGate } from "./components/PortraitGate";
import "./index.css";
import "./styles/game-mobile.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PortraitGate>
      <App />
    </PortraitGate>
  </StrictMode>
);
