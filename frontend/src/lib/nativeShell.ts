import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { dispatchHardwareBack } from "./nativeBack";

const BRAND_STATUS = "#0D2B22";

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add("native-shell");

  try {
    // Draw under system bars; CSS safe-area insets keep content clear of camera / nav.
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: BRAND_STATUS });
  } catch {
    /* status bar plugin optional on some devices */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* splash may already be hidden */
  }
}

/**
 * Android back: let the active screen close modals / step back.
 * `onNavigateBack` returns true if App-level navigation handled it.
 * Only exits the app when nothing else can go back.
 */
export function bindHardwareBackButton(onNavigateBack: () => boolean): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  const sub = App.addListener("backButton", () => {
    if (dispatchHardwareBack()) return;
    if (onNavigateBack()) return;
    void App.exitApp();
  });

  return () => {
    void sub.then((handle) => handle.remove());
  };
}
