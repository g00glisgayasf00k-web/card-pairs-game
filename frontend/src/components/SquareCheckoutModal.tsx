import { useEffect, useRef, useState } from "react";
import { chargeGemPack, type PaymentConfig, type PaymentPack } from "../lib/payments";

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => {
        card: () => Promise<SquareCard>;
      };
    };
  }
}

interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: (details: SquareVerificationDetails) => Promise<SquareTokenResult>;
  destroy?: () => Promise<void>;
}

interface SquareVerificationDetails {
  amount: string;
  currencyCode: string;
  intent: "CHARGE";
}

interface SquareTokenResult {
  status: string;
  token?: string;
  errors?: { message: string }[];
}

function squareScriptUrl(environment: string): string {
  return environment === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";
}

function loadSquareSdk(environment: string): Promise<void> {
  const src = squareScriptUrl(environment);
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing && window.Square) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Square payments"));
    document.head.appendChild(script);
  });
}

interface Props {
  pack: PaymentPack;
  config: PaymentConfig;
  onClose: () => void;
  onSuccess: (credits: number, gemsAdded: number) => void;
}

export function SquareCheckoutModal({ pack, config, onClose, onSuccess }: Props) {
  const cardRef = useRef<SquareCard | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadSquareSdk(config.environment);
        if (cancelled || !window.Square) return;
        const payments = window.Square.payments(config.application_id, config.location_id);
        const card = await payments.card();
        await card.attach("#square-card-container");
        if (cancelled) {
          await card.destroy?.();
          return;
        }
        cardRef.current = card;
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not initialize Square checkout");
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
      void cardRef.current?.destroy?.();
      cardRef.current = null;
    };
  }, [config.application_id, config.location_id, config.environment]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const tokenResult = await cardRef.current.tokenize({
        amount: String(pack.price_cents),
        currencyCode: pack.currency,
        intent: "CHARGE",
      });
      if (tokenResult.status !== "OK" || !tokenResult.token) {
        const msg = tokenResult.errors?.[0]?.message ?? "Card could not be verified";
        throw new Error(msg);
      }
      const result = await chargeGemPack(pack.id, tokenResult.token);
      onSuccess(result.credits, result.gems_added);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay scores-overlay square-checkout-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal square-checkout"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="square-checkout-title"
      >
        <h2 id="square-checkout-title">Buy {pack.label}</h2>
        <p className="square-checkout__summary">
          +{pack.gems.toLocaleString()} gems · {pack.price_label}
        </p>
        <p className="square-checkout__note">Secure checkout powered by Square</p>

        <form onSubmit={handlePay}>
          <div id="square-card-container" className="square-checkout__card" aria-label="Card details" />
          {error && <p className="square-checkout__error">{error}</p>}
          <div className="square-checkout__actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={!ready || busy}>
              {busy ? "Processing…" : `Pay ${pack.price_label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
