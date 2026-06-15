import { useEffect, useState, type FormEvent } from "react";
import { login, loginWithGoogle, register } from "../lib/api";
import { flushProgressSync, pullRemoteProgress } from "../lib/progressSync";
import { googleSignInEnabled, resolveGoogleClientId } from "../lib/session";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthMode = "signup" | "login";

interface Props {
  onSuccess: (username: string, token: string) => void;
  initialUsername?: string;
  /** Compact layout for profile modal. */
  variant?: "home" | "profile";
}

export function AuthPanel({ onSuccess, initialUsername = "", variant = "home" }: Props) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    void resolveGoogleClientId().then((id) => setGoogleReady(id.length > 0));
  }, []);

  const finishAuth = async (name: string, token: string) => {
    setError(null);
    await pullRemoteProgress();
    await flushProgressSync();
    onSuccess(name, token);
    setPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === "signup"
          ? await register(username.trim(), password)
          : await login(username.trim(), password);
      await finishAuth(res.username, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await loginWithGoogle(credential);
      await finishAuth(res.username, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const isHome = variant === "home";
  const showGoogleDivider = googleReady || googleSignInEnabled();

  return (
    <div className={`auth-panel auth-panel--${variant}`}>
      {isHome && (
        <p className="auth-panel__lead">
          Create a free account or sign in to play. Progress syncs to the cloud.
        </p>
      )}

      <GoogleSignInButton
        onCredential={handleGoogle}
        disabled={busy}
        text={mode === "signup" ? "signup_with" : "signin_with"}
      />

      {showGoogleDivider && (
        <div className="auth-divider">
          <span>or</span>
        </div>
      )}

      <div className="home-auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={mode === "signup" ? "active" : ""}
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
        >
          Sign up
        </button>
        <button
          type="button"
          role="tab"
          className={mode === "login" ? "active" : ""}
          onClick={() => {
            setMode("login");
            setError(null);
          }}
        >
          Sign in
        </button>
      </div>

      <form className="home-auth-form" onSubmit={handleSubmit}>
        <div className="home-auth-fields">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (3–32 chars)"
            autoComplete="username"
            required
            minLength={3}
            maxLength={32}
            disabled={busy}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ chars)"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            disabled={busy}
          />
          <button type="submit" className="home-btn-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </div>
      </form>

      {error && <p className="home-error">{error}</p>}
    </div>
  );
}
