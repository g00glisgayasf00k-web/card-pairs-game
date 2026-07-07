import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0d4a2e" });
  } catch {
    /* status bar plugin optional on some devices */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* splash may already be hidden */
  }
}
