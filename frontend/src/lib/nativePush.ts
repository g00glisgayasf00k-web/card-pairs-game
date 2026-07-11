import { Capacitor } from "@capacitor/core";
import { registerDeviceToken, unregisterDeviceToken } from "./api";
import { isLoggedIn } from "./session";

const TOKEN_KEY = "rpm_push_token";

/**
 * Remote FCM push needs android/app/google-services.json (and matching backend
 * FCM credentials). Calling PushNotifications.register() without Firebase
 * crashes the Android process — so stay off until explicitly enabled.
 */
function isRemotePushEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_PUSH;
  return flag === "true" || flag === "1";
}

type OpenHandler = (data: Record<string, string>) => void;

let openHandler: OpenHandler | null = null;
let started = false;

export function onNotificationOpen(handler: OpenHandler | null) {
  openHandler = handler;
}

function storeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform() || started) return;
  if (!isLoggedIn()) return;
  if (!isRemotePushEnabled()) return;

  started = true;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") {
      started = false;
      return;
    }

    await PushNotifications.addListener("registration", (ev) => {
      const token = ev.value;
      if (!token) return;
      storeToken(token);
      if (isLoggedIn()) {
        void registerDeviceToken(token, Capacitor.getPlatform()).catch(() => undefined);
      }
    });

    await PushNotifications.addListener("registrationError", () => {
      /* permission or FCM misconfig — badges still work */
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (ev) => {
      const data = (ev.notification.data ?? {}) as Record<string, string>;
      openHandler?.(data);
    });

    // register() after listeners; never call without google-services.json / VITE_ENABLE_PUSH
    await PushNotifications.register();
  } catch {
    started = false;
  }
}

export async function stopPushNotifications(): Promise<void> {
  started = false;
  const token = readStoredToken();
  if (token && isLoggedIn()) {
    try {
      await unregisterDeviceToken(token);
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Re-register token after login (init may have run before auth). */
export async function syncPushTokenAfterLogin(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isLoggedIn()) return;
  if (!isRemotePushEnabled()) return;
  const token = readStoredToken();
  if (token) {
    try {
      await registerDeviceToken(token, Capacitor.getPlatform());
    } catch {
      /* ignore */
    }
  }
  await initPushNotifications();
}
