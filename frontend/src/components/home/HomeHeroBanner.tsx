import { HOME_ASSETS } from "./homeAssets";

export function HomeHeroBanner() {
  return (
    <section
      className="home-mode-card relative flex min-h-[120px] items-center gap-3 overflow-hidden"
      aria-label="How do you want to play?"
      style={{
        backgroundImage: `url(${HOME_ASSETS.hero.panelBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow:
          "0 0 40px rgba(201, 162, 58, 0.25), inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -4px 10px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="home-mode-card__body relative z-[2] flex min-h-[96px] min-w-0 flex-1 items-center">
        <div className="relative h-[96px] w-[140px] shrink-0" aria-hidden>
          <img
            src={HOME_ASSETS.hero.particlesGold}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-70"
          />
          <img
            src={HOME_ASSETS.hero.cardsHand}
            alt=""
            className="absolute top-0 left-0 h-[88px] w-auto object-contain"
          />
          <img
            src={HOME_ASSETS.hero.chipsStack}
            alt=""
            className="absolute right-0 bottom-0 h-[70px] w-auto object-contain"
          />
        </div>
        <h1 className="min-w-0 flex-1 text-[22px] font-extrabold leading-tight tracking-wide uppercase">
          <span className="block text-home-text">How do you</span>
          <span className="block text-home-gold">Want to play?</span>
        </h1>
      </div>
    </section>
  );
}
