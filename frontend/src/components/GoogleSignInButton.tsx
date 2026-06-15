import { useEffect, useRef, useState } from "react";
import { getGoogleClientIdSync, resolveGoogleClientId } from "../lib/session";

const SCRIPT_ID = "google-gsi-script";
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google script failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

interface Props {
  onCredential: (credential: string) => void;
  disabled?: boolean;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export function GoogleSignInButton({ onCredential, disabled = false, text = "continue_with" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [clientId, setClientId] = useState(getGoogleClientIdSync);

  useEffect(() => {
    void resolveGoogleClientId().then(setClientId);
  }, []);

  useEffect(() => {
    if (!clientId || disabled) return;

    let cancelled = false;

    Promise.all([loadGoogleScript(), resolveGoogleClientId()])
      .then(([_, id]) => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id || !id) return;

        containerRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: id,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: containerRef.current.offsetWidth || 320,
          text,
          shape: "rectangular",
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, onCredential, text]);

  if (!clientId && !loadError) {
    return <p className="auth-google-hint">Loading sign-in…</p>;
  }

  if (!clientId) {
    return (
      <p className="auth-google-hint">
        Google sign-in is not configured yet. Use username and password below.
      </p>
    );
  }

  if (loadError) {
    return <p className="auth-google-hint auth-google-hint--err">Could not load Google sign-in.</p>;
  }

  return (
    <div className={`auth-google${disabled ? " auth-google--disabled" : ""}`}>
      <div ref={containerRef} className="auth-google__btn" aria-hidden={!ready} />
      {!ready && !loadError && <p className="auth-google-hint">Loading Google…</p>}
    </div>
  );
}
