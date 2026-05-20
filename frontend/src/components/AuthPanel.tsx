import { useState } from "react";
import { login, register } from "../lib/api";

interface Props {
  username: string | null;
  onAuth: (username: string, token: string) => void;
  onLogout: () => void;
}

export function AuthPanel({ username, onAuth, onLogout }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (username) {
    return (
      <div className="auth-bar">
        <span>Hi, {username}</span>
        <button type="button" className="btn ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fn = mode === "login" ? login : register;
      const res = await fn(user.trim(), pass);
      localStorage.setItem("token", res.token);
      onAuth(res.username, res.token);
      setPass("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="tabs">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>
      <input
        placeholder="Username"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
      </button>
      <p className="auth-note">Log in to save scores to the leaderboard</p>
    </form>
  );
}
