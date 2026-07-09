const API_BASE = import.meta.env.VITE_API_URL ?? "";

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export interface PaymentPack {
  id: string;
  gems: number;
  label: string;
  price_cents: number;
  currency: string;
  price_label: string;
}

export interface PaymentConfig {
  enabled: boolean;
  provider: string;
  application_id: string;
  location_id: string;
  environment: string;
  packs: PaymentPack[];
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const res = await fetch(`${API_BASE}/api/payments/config`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as PaymentConfig;
}

export async function chargeGemPack(packId: string, sourceId: string) {
  const res = await fetch(`${API_BASE}/api/payments/charge`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ pack_id: packId, source_id: sourceId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as {
    paid: boolean;
    pack_id: string;
    gems_added: number;
    credits: number;
    payment_id: string;
  };
}
