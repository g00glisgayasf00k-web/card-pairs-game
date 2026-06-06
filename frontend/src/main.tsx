import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AdminApp } from "./admin/AdminApp";
import { PortraitGate } from "./components/PortraitGate";
import { initProgressSync } from "./lib/progressSync";
import "./index.css";
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
  initProgressSync();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <PortraitGate>
        <App />
      </PortraitGate>
    </StrictMode>
  );
}
