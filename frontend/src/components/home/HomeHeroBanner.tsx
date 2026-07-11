import { HOME_ASSETS } from "./homeAssets";

export function HomeHeroBanner() {
  return (
    <section className="home-hero-banner" aria-label="Choose your game mode">
      <img
        className="home-hero-banner__img"
        src={HOME_ASSETS.hero.banner}
        alt="Choose your game mode"
        width={1024}
        height={512}
        decoding="async"
      />
    </section>
  );
}
