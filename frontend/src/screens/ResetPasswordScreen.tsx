import { useState, type FormEvent } from "react";
import { resetPassword } from "../lib/api";

interface Props {
  token: string;
  onDone: () => void;
}

export function ResetPasswordScreen({ token, onDone }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await resetPassword(token, password);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app app--home">
      <div className="reset-password-screen">
        <div className="reset-password-card">
          <h1>Choose a new password</h1>
          {success ? (
            <>
              <p className="reset-password-success">{success}</p>
              <button type="button" className="home-btn-submit" onClick={onDone}>
                Back to sign in
              </button>
            </>
          ) : (
            <form className="home-auth-form" onSubmit={handleSubmit}>
              <div className="home-auth-fields">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (6+ chars)"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={busy}
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={busy}
                />
                <button type="submit" className="home-btn-submit" disabled={busy}>
                  {busy ? "Saving…" : "Update password"}
                </button>
              </div>
            </form>
          )}
          {error && <p className="home-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
