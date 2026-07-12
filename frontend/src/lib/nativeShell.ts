import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

const BRAND_STATUS = "#0D2B22";

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Keep content below the status bar / camera cutout instead of drawing under it.
    await StatusBar.setOverlaysWebView({ overlay: false });
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
