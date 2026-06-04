import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Royal Match Poker",
        short_name: "Royal Match",
        description: "Swipe adjacent cards to make poker hands and clear the board",
        theme_color: "#0d4a2e",
        background_color: "#0a3522",
        display: "standalone",
        orientation: "portrait",
        icons: [{ src: "favicon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
  },
});
