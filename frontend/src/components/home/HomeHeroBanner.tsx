/** Hero art using only design-system colors */
function HeroCardsArt() {
  return (
    <div className="relative h-[88px] w-[120px] shrink-0" aria-hidden>
      <div className="absolute left-0 top-3 h-[68px] w-[46px] -rotate-[14deg] rounded-md border border-home-text bg-home-text px-1 py-1 text-[10px] font-extrabold text-home-bg shadow-md">
        A♠
      </div>
      <div className="absolute left-7 top-1 z-10 h-[68px] w-[46px] rotate-[2deg] rounded-md border border-home-text bg-home-text px-1 py-1 text-[10px] font-extrabold text-home-purple shadow-md">
        K♥
      </div>
      <div className="absolute left-14 top-3 z-20 h-[68px] w-[46px] rotate-[16deg] rounded-md border border-home-text bg-home-text px-1 py-1 text-[10px] font-extrabold text-home-bg shadow-md">
        Q♣
      </div>
      <div className="absolute bottom-0 left-[58px] h-7 w-7 rounded-full border-2 border-dashed border-home-muted bg-home-blue" />
      <div className="absolute bottom-1 left-[72px] z-10 h-7 w-7 rounded-full border-2 border-dashed border-home-muted bg-home-purple" />
      <div className="absolute bottom-0 left-[86px] z-20 h-8 w-8 rounded-full border-2 border-home-gold bg-home-gold" />
    </div>
  );
}

/** Hero with glass highlight matching premium card language */
export function HomeHeroBanner() {
  return (
    <section
      className="home-mode-card home-hero-premium relative flex items-center gap-3 overflow-hidden"
      aria-label="How do you want to play?"
      style={{
        background: "linear-gradient(135deg, #0E2F28, #04110F)",
        boxShadow:
          "0 0 40px rgba(201, 162, 58, 0.25), inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -4px 10px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <HeroCardsArt />
      <h1 className="home-mode-card__body min-w-0 flex-1 text-[22px] font-extrabold leading-tight tracking-wide uppercase">
        <span className="block text-home-text">How do you</span>
        <span className="block text-home-gold">Want to play?</span>
      </h1>
    </section>
  );
}
