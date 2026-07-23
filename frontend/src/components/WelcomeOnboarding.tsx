import { useEffect, useState } from "react";
import { AuthPanel } from "./AuthPanel";
import { HeadToHeadLabel, HOME_ASSETS } from "./home";
import {
  hasSeenWelcomeOnboarding,
  markWelcomeOnboardingSeen,
} from "../lib/welcomeOnboarding";

type Step = "welcome" | "play" | "modes" | "auth";

interface Props {
  onAuthSuccess: () => void;
}

const STEPS: Step[] = ["welcome", "play", "modes", "auth"];

export function WelcomeOnboarding({ onAuthSuccess }: Props) {
  const [step, setStep] = useState<Step>(() =>
    hasSeenWelcomeOnboarding() ? "auth" : "welcome"
  );
  const stepIndex = STEPS.indexOf(step);
  const isAuth = step === "auth";

  useEffect(() => {
    if (isAuth) markWelcomeOnboardingSeen();
  }, [isAuth]);

  const goNext = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]!);
  };

  const goBack = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]!);
  };

  const skipToAuth = () => {
    markWelcomeOnboardingSeen();
    setStep("auth");
  };

  return (
    <div className="welcome-onboard" data-step={step}>
      <div className="welcome-onboard__glow" aria-hidden />

      <header className="welcome-onboard__brand">
        <img src={HOME_ASSETS.header.logo} alt="Royal Poker Match" />
      </header>

      {!isAuth && (
        <div className="welcome-onboard__dots" role="tablist" aria-label="Intro steps">
          {STEPS.filter((s) => s !== "auth").map((s, i) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={step === s}
              className={`welcome-onboard__dot${step === s ? " welcome-onboard__dot--on" : ""}`}
              onClick={() => setStep(s)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="welcome-onboard__stage" key={step}>
        {step === "welcome" && (
          <section className="welcome-slide welcome-slide--intro" aria-labelledby="welcome-title">
            <div className="welcome-landscape">
              <img
                src={HOME_ASSETS.hero.onboardingLandscape}
                alt="Royal Poker Match — swipe five cards into poker hands"
              />
            </div>
            <h1 id="welcome-title">Swipe. Score. Win.</h1>
            <p className="welcome-slide__lead">
              Swipe five cards into real poker hands, clear the goals, and win cup prizes.
            </p>
            <div className="welcome-chips">
              <span>Solo Player</span>
              <span>Head to Head</span>
              <span>Free to Play</span>
            </div>
          </section>
        )}

        {step === "play" && (
          <section className="welcome-slide" aria-labelledby="play-title">
            <div className="welcome-slide__art welcome-slide__art--banner">
              <img src={HOME_ASSETS.hero.banner} alt="" />
            </div>
            <h1 id="play-title">Swipe five. Score big.</h1>
            <ul className="welcome-slide__bullets">
              <li>
                <span className="welcome-slide__num">1</span>
                Swipe <strong>five adjacent</strong> cards on the board.
              </li>
              <li>
                <span className="welcome-slide__num">2</span>
                Make poker hands — pair through royal flush.
              </li>
              <li>
                <span className="welcome-slide__num">3</span>
                Hit the point target and finish milestone goals.
              </li>
            </ul>
          </section>
        )}

        {step === "modes" && (
          <section className="welcome-slide" aria-labelledby="modes-title">
            <h1 id="modes-title">Three ways to play</h1>
            <p className="welcome-slide__lead">Pick your table once you&apos;re in.</p>
            <div className="welcome-modes">
              <article className="welcome-mode welcome-mode--purple">
                <img className="welcome-mode__glow" src={HOME_ASSETS.cards.purple.glow} alt="" />
                <div className="welcome-mode__body">
                  <img className="welcome-mode__label" src={HOME_ASSETS.cards.purple.label} alt="Solo" />
                  <strong>Enter table</strong>
                  <span>500 campaign levels, stars &amp; energy</span>
                </div>
                <span className="welcome-mode__icon-wrap">
                  <img src={HOME_ASSETS.cards.purple.circle} alt="" aria-hidden />
                  <img className="welcome-mode__icon" src={HOME_ASSETS.cards.purple.icon} alt="" />
                </span>
              </article>
              <article className="welcome-mode welcome-mode--blue">
                <img className="welcome-mode__glow" src={HOME_ASSETS.cards.blue.glow} alt="" />
                <div className="welcome-mode__body">
                  <HeadToHeadLabel className="welcome-mode__label" />
                  <strong>Head to Head</strong>
                  <span>Quick Play races &amp; friend challenges</span>
                </div>
                <span className="welcome-mode__icon-wrap">
                  <img src={HOME_ASSETS.cards.blue.circle} alt="" aria-hidden />
                  <img className="welcome-mode__icon" src={HOME_ASSETS.cards.blue.icon} alt="" />
                </span>
              </article>
              <article className="welcome-mode welcome-mode--green">
                <img className="welcome-mode__glow" src={HOME_ASSETS.cards.green.glow} alt="" />
                <div className="welcome-mode__body">
                  <img className="welcome-mode__label" src={HOME_ASSETS.cards.green.label} alt="Tournament" />
                  <strong>Enter a cup</strong>
                  <span>Daily, Weekly &amp; Monthly · Low / Medium / High stakes</span>
                </div>
                <span className="welcome-mode__icon-wrap">
                  <img src={HOME_ASSETS.cards.green.circle} alt="" aria-hidden />
                  <img className="welcome-mode__icon" src={HOME_ASSETS.cards.green.icon} alt="" />
                </span>
              </article>
            </div>
          </section>
        )}

        {step === "auth" && (
          <section className="welcome-slide welcome-slide--auth" aria-labelledby="auth-title">
            <h1 id="auth-title">Create your seat</h1>
            <p className="welcome-slide__lead">
              Free account — progress, gems, and Rating sync to the cloud.
            </p>
            <div className="welcome-auth">
              <AuthPanel
                variant="home"
                onSuccess={() => {
                  markWelcomeOnboardingSeen();
                  onAuthSuccess();
                }}
              />
            </div>
            <button type="button" className="welcome-onboard__replay" onClick={() => setStep("welcome")}>
              Replay intro
            </button>
          </section>
        )}
      </div>

      <footer className="welcome-onboard__footer">
        {!isAuth ? (
          <>
            <div className="welcome-onboard__nav">
              {stepIndex > 0 ? (
                <button type="button" className="welcome-onboard__ghost" onClick={goBack}>
                  Back
                </button>
              ) : (
                <button type="button" className="welcome-onboard__ghost" onClick={skipToAuth}>
                  Skip
                </button>
              )}
              <button type="button" className="welcome-onboard__cta" onClick={goNext}>
                {step === "modes" ? "Create account" : "Next"}
              </button>
            </div>
          </>
        ) : (
          <p className="welcome-onboard__hint">Already have an account? Use Sign in above.</p>
        )}
      </footer>
    </div>
  );
}
