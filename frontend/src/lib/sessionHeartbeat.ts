import { Capacitor } from "@capacitor/core";
import { pingGameSession } from "./api";
import { isLoggedIn } from "./session";

/** Heartbeat interval — playtime accrues between successful pings. */
const INTERVAL_MS = 30_000;

/** Heartbeat while the player is logged in — powers admin playtime metrics. */
export function startSessionHeartbeat(): () => void {
  let timer: number | null = null;
  let stopped = false;

  const ping = () => {
    if (stopped || !isLoggedIn()) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web";
    void pingGameSession(platform).catch(() => {
      /* ignore offline / auth errors */
    });
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") ping();
  };

  const onFocus = () => ping();

  ping();
  timer = window.setInterval(ping, INTERVAL_MS);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onFocus);

  return () => {
    stopped = true;
    if (timer != null) window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onFocus);
  };
}
