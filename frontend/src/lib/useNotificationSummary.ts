import { useCallback, useEffect, useState } from "react";
import { fetchNotificationSummary, type NotificationSummary } from "./api";
import { isLoggedIn } from "./session";

const EMPTY: NotificationSummary = {
  friend_requests: 0,
  challenges: 0,
  total: 0,
};

const POLL_MS = 30_000;

export function useNotificationSummary(enabled: boolean) {
  const [summary, setSummary] = useState<NotificationSummary>(EMPTY);

  const refresh = useCallback(async () => {
    if (!enabled || !isLoggedIn()) {
      setSummary(EMPTY);
      return;
    }
    try {
      const next = await fetchNotificationSummary();
      setSummary(next);
    } catch {
      /* keep previous */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSummary(EMPTY);
      return;
    }
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, refresh]);

  return { summary, refresh };
}
