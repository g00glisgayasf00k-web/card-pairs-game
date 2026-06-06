import { useState, type FormEvent } from "react";
import { login, register } from "../lib/api";
import { flushProgressSync, pullRemoteProgress } from "../lib/progressSync";

interface Props {
  displayName: string | null;
  onAccountChange?: () => void;
}

export function ProfileAccountSection({ displayName, onAccountChange }: Props) {
  const [username, setUsername] = useState(displayName ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem("token");
  const signedInAs = token ? localStorage.getItem("username") : null;

  const finishAuth = async (name: string, authToken: string) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("username", name);
    setStatus("Cloud save linked — syncing progress…");
    setError(null);
    await pullRemoteProgress();
    await flushProgressSync();
    onAccountChange?.();
    setPassword("");
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await register(username.trim(), password);
      await finishAuth(res.username, res.token);
      setStatus(`Signed up as ${res.username}. Progress will sync automatically.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await login(username.trim(), password);
      await finishAuth(res.username, res.token);
      setStatus(`Signed in as ${res.username}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setStatus("Signed out of cloud save. Local progress is still on this device.");
    setError(null);
    onAccountChange?.();
  };

  if (signedInAs) {
    return (
      <div className="profile-account">
        <h3>Cloud save</h3>
        <p className="profile-account-status profile-account-status--ok">
          Signed in as <strong>{signedInAs}</strong> — progress syncs to the server.
        </p>
        <button type="button" className="btn scores-close" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="profile-account">
      <h3>Cloud save</h3>
      <p>Create an account to back up levels, gems, and energy across devices.</p>
      <form className="profile-account-form" onSubmit={handleRegister}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username (3–32 chars)"
          autoComplete="username"
          required
          minLength={3}
          maxLength={32}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (6+ chars)"
          autoComplete="new-password"
          required
          minLength={6}
        />
        <div className="profile-account-actions">
          <button type="submit" className="btn" disabled={busy}>
            Create account
          </button>
          <button type="button" className="btn scores-close" disabled={busy} onClick={handleLogin}>
            Sign in
          </button>
        </div>
      </form>
      {status && <p className="profile-account-status profile-account-status--ok">{status}</p>}
      {error && <p className="profile-account-status profile-account-status--err">{error}</p>}
    </div>
  );
}
