const KEY = "rpm_welcome_onboarding_v1";

export function hasSeenWelcomeOnboarding(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeOnboardingSeen(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearWelcomeOnboardingSeen(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
