/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Build version stamp injected at compile time (see vite.config.ts). */
declare const __APP_VERSION__: string;
