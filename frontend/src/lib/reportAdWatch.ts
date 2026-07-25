import { Capacitor } from "@capacitor/core";
import { reportAdWatch } from "./api";
import { isLoggedIn } from "./session";

export type AdWatchKind = "gem" | "energy" | "tournament";

/** Best-effort server log after a rewarded ad completes (powers admin revenue). */
export function trackAdWatch(kind: AdWatchKind): void {
  if (!isLoggedIn()) return;
  const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web";
  void reportAdWatch(kind, platform).catch(() => {
    /* ignore offline / auth errors */
  });
}
