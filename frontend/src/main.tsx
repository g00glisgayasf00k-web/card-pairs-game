import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AdminApp } from "./admin/AdminApp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PortraitGate } from "./components/PortraitGate";
import { initProgressSync } from "./lib/progressSync";
import { initNativeShell } from "./lib/nativeShell";
import { isLoggedIn } from "./lib/session";
import "./index.css";
import "./styles/home-design.css";
import "./styles/royal-theme.css";
import "./styles/game-mobile.css";
import "./styles/level-select.css";

const isAdminRoute = window.location.pathname.startsWith("/admin");

if (isAdminRoute) {
  import("./admin/admin.css");
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AdminApp />
    </StrictMode>
  );
} else {
  void initNativeShell();
  if (isLoggedIn()) initProgressSync();

  // Actively poll for a newer service worker so a fresh deploy is picked up
  // without a manual hard refresh (autoUpdate reloads once the new SW controls).
  if ("serviceWorker" in navigator) {
    const checkForUpdate = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });
    window.setInterval(checkForUpdate, 60_000);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <PortraitGate>
          <App />
        </PortraitGate>
      </ErrorBoundary>
    </StrictMode>
  );
}
