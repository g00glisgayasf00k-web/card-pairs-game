import { AuthPanel } from "./AuthPanel";
import { setSession, getUsername, isLoggedIn } from "../lib/session";

interface Props {
  displayName: string | null;
  onAccountChange?: () => void;
  onSignOut?: () => void;
}

export function ProfileAccountSection({ displayName, onAccountChange, onSignOut }: Props) {
  const signedIn = isLoggedIn();
  const signedInAs = signedIn ? getUsername() : null;

  const handleSuccess = (username: string, token: string) => {
    setSession(username, token);
    onAccountChange?.();
  };

  const handleLogout = () => {
    onSignOut?.();
    onAccountChange?.();
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
    </div>
  );
}
