import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

/** Unique per-build stamp (UTC time + short commit) so every deploy is a new version. */
function resolveAppVersion(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${now.getUTCFullYear()}.${pad(now.getUTCMonth() + 1)}.${pad(now.getUTCDate())}` +
    `.${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
  let commit = process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "";
  if (!commit) {
    try {
      commit = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      /* git unavailable — timestamp alone is still unique */
    }
  }
  const short = commit ? commit.slice(0, 7) : "";
  return short ? `${stamp}-${short}` : stamp;
}

export default defineConfig(({ mode }) => ({
  base: mode === "capacitor" ? "./" : "/",
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-64.png", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Royal Poker Match",
        short_name: "Royal Poker",
        description: "Swipe adjacent cards to make poker hands and clear the board",
        theme_color: "#0D2B22",
        background_color: "#061A17",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "favicon-64.png", sizes: "64x64", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
  },
}));
