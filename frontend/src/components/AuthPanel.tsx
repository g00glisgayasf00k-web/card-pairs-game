import { useState, type FormEvent } from "react";
import { forgotPassword, login, loginWithGoogle, register } from "../lib/api";
import { beginAccountSession } from "../lib/progressSync";
import { googleSignInEnabled, setSession } from "../lib/session";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthMode = "signup" | "login" | "forgot";

interface Props {
  onSuccess: (username: string, token: string) => void;
  initialUsername?: string;
  /** Compact layout for profile modal. */
  variant?: "home" | "profile";
}

export function AuthPanel({ onSuccess, initialUsername = "", variant = "home" }: Props) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finishAuth = async (name: string, token: string) => {
    setError(null);
    setInfo(null);
    setSession(name, token);
    await beginAccountSession(name, { isNewAccount: mode === "signup" });
    onSuccess(name, token);
    setPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res =
        mode === "signup"
          ? await register(username.trim(), password, email.trim() || undefined)
          : await login(username.trim(), password);
      await finishAuth(res.username, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await forgotPassword(recoveryIdentifier.trim());
      setInfo(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setBusy(true);
    setError(null);
    setInfo(null);
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
  const showGoogle = googleSignInEnabled() && mode !== "forgot";

  return (
    <div className={`auth-panel auth-panel--${variant}`}>
      {isHome && mode !== "forgot" && (
        <p className="auth-panel__lead">
          Create a free account or sign in to play. Progress syncs to the cloud.
        </p>
      )}

      {mode === "forgot" ? (
        <>
          <p className="auth-panel__lead">
            Enter the email on your account, or your username if you linked an email when you signed up.
          </p>
          <form className="home-auth-form" onSubmit={handleForgot}>
            <div className="home-auth-fields">
              <input
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                placeholder="Email or username"
                autoComplete="username email"
                required
                disabled={busy}
              />
              <button type="submit" className="home-btn-submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </div>
          </form>
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => {
              setMode("login");
              setError(null);
              setInfo(null);
            }}
          >
            Back to sign in
          </button>
        </>
      ) : (
        <>
          {showGoogle && (
            <>
              <GoogleSignInButton
                onCredential={handleGoogle}
                disabled={busy}
                text={mode === "signup" ? "signup_with" : "signin_with"}
              />
              <div className="auth-divider">
                <span>or</span>
              </div>
            </>
          )}

          <div className="home-auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfo(null);
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
                setInfo(null);
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
              {mode === "signup" && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional, for password recovery)"
                  autoComplete="email"
                  disabled={busy}
                />
              )}
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

          {mode === "login" && (
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setRecoveryIdentifier(username.trim());
                setMode("forgot");
                setError(null);
                setInfo(null);
              }}
            >
              Forgot password?
            </button>
          )}
        </>
      )}

      {info && <p className="auth-panel__info">{info}</p>}
      {error && <p className="home-error">{error}</p>}
    </div>
  );
}
