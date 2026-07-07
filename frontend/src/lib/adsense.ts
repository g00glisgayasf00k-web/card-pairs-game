const AD_CLIENT = "ca-pub-5778254002496678";
const SCRIPT_ID = "adsbygoogle-loader";

/** Load AdSense on menu screens only — never during active gameplay. */
export function ensureAdSenseLoaded() {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

/** Hide any auto-placed ad overlays while the player is in a level. */
export function setGameplayAdSuppression(active: boolean) {
  document.body.classList.toggle("ads-suppressed", active);
}
