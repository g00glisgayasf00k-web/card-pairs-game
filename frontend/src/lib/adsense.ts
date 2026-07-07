const AD_CLIENT = "ca-pub-5778254002496678";
const SCRIPT_ID = "adsbygoogle-loader";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let loadPromise: Promise<void> | null = null;

/** Load the AdSense script once — only call from the free-gem video flow. */
export function ensureAdSenseLoaded(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (document.getElementById(SCRIPT_ID)) return Promise.resolve();

  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => {
        loadPromise = null;
        reject(new Error("AdSense failed to load"));
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

/** Mount a display ad inside the gem video reward overlay. */
export async function mountGemRewardAd(host: HTMLElement): Promise<void> {
  clearGemRewardAd(host);
  await ensureAdSenseLoaded();

  const ins = document.createElement("ins");
  ins.className = "adsbygoogle royal-shop-ad__unit";
  ins.style.display = "block";
  ins.setAttribute("data-ad-client", AD_CLIENT);
  ins.setAttribute("data-ad-format", "auto");
  ins.setAttribute("data-full-width-responsive", "true");
  host.appendChild(ins);

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    /* ad blockers / unapproved units — overlay still shows progress */
  }
}

export function clearGemRewardAd(host: HTMLElement): void {
  host.replaceChildren();
}
