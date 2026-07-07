const TOKEN_KEY = "token";
const USERNAME_KEY = "username";

export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function setSession(username: string, token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

let cachedGoogleClientId: string | null = null;
let configPromise: Promise<string> | null = null;

declare global {
  interface Window {
    RMP_CONFIG?: {
      restUrl?: string;
      googleClientId?: string;
      view?: string;
    };
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function authConfigUrl(): string {
  if (window.RMP_CONFIG?.restUrl) {
    return `${window.RMP_CONFIG.restUrl.replace(/\/$/, "")}/auth/config`;
  }
  return `${API_BASE}/api/auth/config`;
}

/** Set to true when Google sign-in should appear in the auth UI. */
export const GOOGLE_SIGNIN_UI_ENABLED = false;

/** Resolve Google OAuth client ID from server config or local env. */
export async function resolveGoogleClientId(): Promise<string> {
  if (cachedGoogleClientId !== null) return cachedGoogleClientId;
  const fromWp = window.RMP_CONFIG?.googleClientId ?? "";
  if (fromWp) {
    cachedGoogleClientId = fromWp;
    return fromWp;
  }
  const fromEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
  if (fromEnv) {
    cachedGoogleClientId = fromEnv;
    return fromEnv;
  }
  if (configPromise) return configPromise;

  configPromise = fetch(authConfigUrl())
    .then((res) => res.json())
    .then((data: { googleClientId?: string }) => {
      cachedGoogleClientId = data.googleClientId ?? "";
      return cachedGoogleClientId;
    })
    .catch(() => {
      cachedGoogleClientId = "";
      return "";
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
}

export function getGoogleClientIdSync(): string {
  return (
    cachedGoogleClientId ??
    window.RMP_CONFIG?.googleClientId ??
    import.meta.env.VITE_GOOGLE_CLIENT_ID ??
    ""
  );
}

export function googleSignInEnabled(): boolean {
  return GOOGLE_SIGNIN_UI_ENABLED && getGoogleClientIdSync().length > 0;
}
