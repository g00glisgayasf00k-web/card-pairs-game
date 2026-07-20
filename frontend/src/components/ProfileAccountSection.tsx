import { useState } from "react";
import { AuthPanel } from "./AuthPanel";
import { requestMyAccountDeletion } from "../lib/api";
import { setSession, getUsername, isLoggedIn } from "../lib/session";

const DELETE_ACCOUNT_URL = "/delete-account.html";

interface Props {
  displayName: string | null;
  onAccountChange?: () => void;
  onSignOut?: () => void;
}

export function ProfileAccountSection({ displayName, onAccountChange, onSignOut }: Props) {
  const signedIn = isLoggedIn();
  const signedInAs = signedIn ? getUsername() : null;
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const handleSuccess = (username: string, token: string) => {
    setSession(username, token);
    onAccountChange?.();
  };

  const handleLogout = () => {
    onSignOut?.();
    onAccountChange?.();
  };

  const handleDeletionRequest = async () => {
    const ok = window.confirm(
      "Request permanent deletion of your account and associated data?\n\nWe’ll process verified requests within 30 days. This cannot be undone."
    );
    if (!ok) return;
    setDeleteBusy(true);
    setDeleteMsg(null);
    setDeleteErr(null);
    try {
      const res = await requestMyAccountDeletion();
      setDeleteMsg(res.message);
    } catch (err) {
      setDeleteErr(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setDeleteBusy(false);
    }
  };

  if (signedInAs) {
    return (
      <div className="profile-account">
        <h3>Account</h3>
        <p className="profile-account-status profile-account-status--ok">
          Signed in as <strong>{signedInAs}</strong> — progress syncs automatically.
        </p>
        <button type="button" className="btn scores-close" onClick={handleLogout}>
          Sign out
        </button>
        <div className="profile-account-delete">
          <button
            type="button"
            className="profile-account-delete__btn"
            onClick={() => void handleDeletionRequest()}
            disabled={deleteBusy}
          >
            {deleteBusy ? "Sending…" : "Request account deletion"}
          </button>
          <p className="profile-account-delete__hint">
            Or use the web form:{" "}
            <a href={DELETE_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
              Request account deletion
            </a>
          </p>
          {deleteMsg && (
            <p className="profile-account-status profile-account-status--ok">{deleteMsg}</p>
          )}
          {deleteErr && (
            <p className="profile-account-status profile-account-status--err">{deleteErr}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-account">
      <h3>Sign in required</h3>
      <p>You need an account to play and save progress.</p>
      <AuthPanel
        onSuccess={handleSuccess}
        initialUsername={displayName ?? ""}
        variant="profile"
      />
      <p className="profile-account-delete__hint">
        Need to remove an account?{" "}
        <a href={DELETE_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
          Request account deletion
        </a>
      </p>
    </div>
  );
}
