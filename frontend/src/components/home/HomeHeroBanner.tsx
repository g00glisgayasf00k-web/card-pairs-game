const ROYAL_FLUSH: { rank: string; tilt: number }[] = [
  { rank: "10", tilt: -22 },
  { rank: "J", tilt: -11 },
  { rank: "Q", tilt: 0 },
  { rank: "K", tilt: 11 },
  { rank: "A", tilt: 22 },
];

export function HomeHeroBanner() {
  return (
    <section className="home-hero-banner" aria-label="Make poker hands to clear the board">
      <div className="home-hero-banner__art" aria-hidden>
        <div className="home-hero-flush">
          {ROYAL_FLUSH.map((card, i) => (
            <span
              key={card.rank}
              className="home-hero-flush__card"
              style={{
                ["--tilt" as string]: `${card.tilt}deg`,
                ["--i" as string]: String(i),
              }}
            >
              <span className="home-hero-flush__corner">
                <span className="home-hero-flush__rank">{card.rank}</span>
                <span className="home-hero-flush__suit">♠</span>
              </span>
              <span className="home-hero-flush__pip">♠</span>
            </span>
          ))}
        </div>
      </div>
      <h1 className="home-hero-banner__ask">
        <span className="home-hero-banner__ask-line">Swipe five.</span>
        <span className="home-hero-banner__ask-line home-hero-banner__ask-line--gold">
          Make the hand.
        </span>
      </h1>
    </section>
  );
}
