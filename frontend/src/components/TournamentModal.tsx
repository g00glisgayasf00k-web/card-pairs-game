import { useEffect, useState } from "react";
import { ModeInfoButton } from "./ModeInfoButton";
import { HOME_ASSETS } from "./home/homeAssets";
import {
  fetchTournamentHistory,
  fetchTournamentStandings,
  type TournamentPastPeriod,
  type TournamentStandingRow,
} from "../lib/api";
import { formatChallenge } from "../lib/levels";
import { nativeAdsAvailable, showRewardedTournamentAd } from "../lib/nativeAds";
import { loadProgress, saveProgress } from "../lib/progress";
import { VIDEO_AD_DURATION_MS } from "../lib/treasuryAds";
import {
  maxTournamentFreeAds,
  recordTournamentFreeAd,
  tournamentFreeAdPeriodLabel,
  tournamentFreeAdsRemaining,
} from "../lib/tournamentAds";
import {
  TOURNAMENT_PERIODS,
  TOURNAMENT_TIERS,
  formatTournamentPeriodLabel,
  formatTournamentResetCountdown,
  isTournamentUnlocked,
  payoutAmounts,
  pickTournamentBoard,
  tiersForPeriod,
  tournamentPeriodEndsAt,
  tournamentPeriodKey,
  tournamentPeriodTitle,
  tournamentResetLabel,
  unlockLabel,
  type TournamentBoardPick,
  type TournamentReset,
  type TournamentStake,
  type TournamentTier,
} from "../lib/tournamentTiers";
import { tournamentGoalRange, tournamentHandLimit } from "../lib/scoreRaceMission";

function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatStandingScore(r: TournamentStandingRow): string {
  const pts = `${r.score.toLocaleString()} pts`;
  if (r.duration_ms == null || r.duration_ms <= 0) return pts;
  return `${pts} · ${formatDurationMs(r.duration_ms)}`;
}

interface Props {
  onClose: () => void;
  onBalanceChange?: () => void;
  onOpenShop?: () => void;
  onPlayTournament: (board: TournamentBoardPick) => void;
}

type CupBoardTab = "live" | "past";

export function TournamentModal({
  onClose,
  onBalanceChange,
  onOpenShop,
  onPlayTournament,
}: Props) {
  const [tick, setTick] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmTier, setConfirmTier] = useState<TournamentTier | null>(null);
  const [briefing, setBriefing] = useState<TournamentBoardPick | null>(null);
  const [standings, setStandings] = useState<Record<string, TournamentStandingRow[]>>({});
  const [periodEnds, setPeriodEnds] = useState<Record<string, string>>({});
  const [periodKeys, setPeriodKeys] = useState<Record<string, string>>({});
  const [cupTab, setCupTab] = useState<Record<string, CupBoardTab>>({});
  const [history, setHistory] = useState<Record<string, TournamentPastPeriod[]>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({});
  const [webAdTier, setWebAdTier] = useState<TournamentTier | null>(null);
  const [webAdProgress, setWebAdProgress] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [stakeByPeriod, setStakeByPeriod] = useState<Record<TournamentReset, TournamentStake>>({
    daily: "medium",
    weekly: "medium",
    monthly: "medium",
  });

  void tick;
  const gems = loadProgress()?.credits ?? 0;
  const a = HOME_ASSETS;
  const green = a.cards.green;

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      TOURNAMENT_TIERS.map(async (tier) => {
        try {
          const r = await fetchTournamentStandings(tier.id, 5);
          return [tier.id, r.standings, r.period_ends_at, r.period_key] as const;
        } catch {
          return [tier.id, [] as TournamentStandingRow[], "", ""] as const;
        }
      })
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, TournamentStandingRow[]> = {};
      const ends: Record<string, string> = {};
      const keys: Record<string, string> = {};
      for (const [id, rows, endAt, pk] of pairs) {
        next[id] = rows;
        if (endAt) ends[id] = endAt;
        if (pk) keys[id] = pk;
      }
      setStandings(next);
      setPeriodEnds(ends);
      setPeriodKeys(keys);
    });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const periodKeyFor = (tier: TournamentTier) =>
    periodKeys[tier.id] || tournamentPeriodKey(tier.reset, new Date(nowMs));

  const freeAdsLeft = (tier: TournamentTier) =>
    tournamentFreeAdsRemaining(tier.id, periodKeyFor(tier));

  const loadHistory = async (tierId: string) => {
    if (historyLoading[tierId]) return;
    setHistoryLoading((prev) => ({ ...prev, [tierId]: true }));
    try {
      const r = await fetchTournamentHistory(tierId, 8, 3);
      setHistory((prev) => ({ ...prev, [tierId]: r.periods }));
    } catch {
      setHistory((prev) => ({ ...prev, [tierId]: prev[tierId] ?? [] }));
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [tierId]: false }));
    }
  };

  const setBoardTab = (tierId: string, tab: CupBoardTab) => {
    setCupTab((prev) => ({ ...prev, [tierId]: tab }));
    if (tab === "past" && history[tierId] === undefined) {
      void loadHistory(tierId);
    }
  };

  const resetCountdown = (tier: TournamentTier) => {
    const fromApi = periodEnds[tier.id];
    const endsAt = fromApi
      ? new Date(fromApi)
      : tournamentPeriodEndsAt(tier.reset, new Date(nowMs));
    return formatTournamentResetCountdown(endsAt, new Date(nowMs));
  };

  const startBriefing = (tier: TournamentTier) => {
    setConfirmTier(null);
    setBriefing(pickTournamentBoard(tier));
    refresh();
    onBalanceChange?.();
  };

  const enterTournament = (tier: TournamentTier) => {
    setError(null);
    if (!isTournamentUnlocked(tier)) {
      setError(`Clear level ${unlockLabel(tier)} in Solo to unlock.`);
      return;
    }
    const saved = loadProgress();
    if (!saved) {
      setError("Sign in and start Solo first.");
      return;
    }
    if (saved.credits < tier.entryGems) {
      setError(`Need ${tier.entryGems} gems — you have ${saved.credits}.`);
      return;
    }
    setBusyId(tier.id);
    saveProgress({
      ...saved,
      credits: saved.credits - tier.entryGems,
    });
    setBusyId(null);
    startBriefing(tier);
  };

  const finishFreeAdEntry = (tier: TournamentTier) => {
    if (!recordTournamentFreeAd(tier.id, periodKeyFor(tier))) {
      setError("No free ad entries left for this cup.");
      setBusyId(null);
      return;
    }
    setBusyId(null);
    startBriefing(tier);
  };

  const enterTournamentWithAd = async (tier: TournamentTier) => {
    setError(null);
    if (!isTournamentUnlocked(tier)) {
      setError(`Clear level ${unlockLabel(tier)} in Solo to unlock.`);
      return;
    }
    if (freeAdsLeft(tier) <= 0) {
      setError(`No free entries left ${tournamentFreeAdPeriodLabel(tier.reset)}.`);
      return;
    }
    setBusyId(tier.id);
    if (nativeAdsAvailable()) {
      try {
        const rewarded = await showRewardedTournamentAd();
        if (rewarded) {
          finishFreeAdEntry(tier);
        } else {
          setError("Ad didn’t finish — try again or pay with gems.");
          setBusyId(null);
        }
      } catch {
        setError("Ad failed to load — try again or pay with gems.");
        setBusyId(null);
      }
      return;
    }
    setWebAdProgress(0);
    setWebAdTier(tier);
  };

  useEffect(() => {
    if (!webAdTier) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / VIDEO_AD_DURATION_MS);
      setWebAdProgress(progress);
      if (progress >= 1) {
        window.clearInterval(id);
        const tier = webAdTier;
        setWebAdTier(null);
        setWebAdProgress(0);
        finishFreeAdEntry(tier);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [webAdTier]);

  return (
    <>
      <div className="tn-kit-overlay" onClick={onClose} role="presentation">
        <div
          className="tn-kit"
          style={{ backgroundImage: `url(${a.background.main})` }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="tournament-title"
        >
          <div className="tn-kit__veil" aria-hidden />
          <div className="tn-kit__inner">
            <div className="tn-kit__top">
              <div className="tn-kit__brand">
                <img className="tn-kit__brand-label" src={green.label} alt="Tournament" />
                <span className="tn-kit__gems">
                  <img src={a.header.gems} alt="" />
                  {gems.toLocaleString()}
                </span>
              </div>
              <button type="button" className="tn-kit__close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="tn-kit__hero" style={{ backgroundImage: `url(${a.hero.panelBg})` }}>
              <span
                className="tn-kit__hero-particles"
                style={{ backgroundImage: `url(${a.hero.particlesGold})` }}
                aria-hidden
              />
              <img className="tn-kit__hero-cards" src={a.hero.cardsHand} alt="" />
              <img className="tn-kit__hero-chips" src={a.hero.chipsStack} alt="" />
              <div className="tn-kit__hero-copy">
                <h2 id="tournament-title">Tournament</h2>
                <p>Daily · Weekly · Monthly — pick Low, Medium, or High stakes</p>
              </div>
            </div>

            <div className="tn-kit__body">
              {error && <p className="tn-kit__error">{error}</p>}

              {TOURNAMENT_PERIODS.map((period) => {
                const periodTiers = tiersForPeriod(period);
                const stake = stakeByPeriod[period];
                const tier =
                  periodTiers.find((t) => t.stake === stake) ?? periodTiers[1] ?? periodTiers[0]!;
                const unlocked = isTournamentUnlocked(tier);
                const payouts = payoutAmounts(tier.rewardPool);
                const canAfford = gems >= tier.entryGems;
                const adsLeft = freeAdsLeft(tier);
                const adsMax = maxTournamentFreeAds(tier.id);
                const canEnter = canAfford || adsLeft > 0;
                const rows = standings[tier.id] ?? [];
                return (
                  <article
                    key={period}
                    className={`tn-cup${unlocked ? "" : " tn-cup--locked"}`}
                    style={{ backgroundImage: `url(${green.base})` }}
                  >
                    <span
                      className="tn-cup__glow"
                      style={{ backgroundImage: `url(${green.glow})` }}
                      aria-hidden
                    />
                    <div className="tn-cup__row">
                      <span className="tn-cup__icon-wrap" aria-hidden>
                        <span
                          className="tn-cup__ring"
                          style={{ backgroundImage: `url(${green.circle})` }}
                        />
                        <img className="tn-cup__icon" src={green.icon} alt="" />
                      </span>
                      <div className="tn-cup__copy">
                        <span className="tn-cup__name-row">
                          <span className="tn-cup__name">{tournamentPeriodTitle(period)}</span>
                          <ModeInfoButton
                            className="tn-cup__info"
                            onClick={() => setShowRules(true)}
                            label={`${tournamentPeriodTitle(period)} rules`}
                          />
                        </span>
                        <span className="tn-cup__unlock">
                          {unlocked
                            ? "Unlocked"
                            : `Locked · clear Solo ${unlockLabel(tier)}`}
                        </span>
                        <span className="tn-cup__reset">
                          {tournamentResetLabel(tier.reset)} · {tournamentHandLimit(tier.id)} hands ·{" "}
                          {(() => {
                            const [lo, hi] = tournamentGoalRange(tier.id);
                            return lo === hi ? `${lo} goals` : `${lo}–${hi} goals`;
                          })()}{" "}
                          · resets in {resetCountdown(tier)}
                        </span>
                        {unlocked && (
                          <span className="tn-cup__free">
                            Free ad entries · {adsLeft}/{adsMax}{" "}
                            {tournamentFreeAdPeriodLabel(tier.reset)}
                          </span>
                        )}
                      </div>
                      <div className="tn-cup__pool">
                        <span className="tn-cup__pool-label">Pool</span>
                        <span className="tn-cup__pool-val">
                          <img src={a.header.gems} alt="" />
                          {tier.rewardPool.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="tn-cup__stakes" role="group" aria-label={`${tournamentPeriodTitle(period)} stakes`}>
                      {periodTiers.map((t) => {
                        const on = t.stake === stake;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`tn-cup__stake${on ? " tn-cup__stake--on" : ""}`}
                            onClick={() =>
                              setStakeByPeriod((prev) => ({ ...prev, [period]: t.stake }))
                            }
                          >
                            <span>{t.stakeName}</span>
                            <strong>
                              {t.entryGems}
                              <img src={a.header.gems} alt="" width={12} height={12} />
                            </strong>
                          </button>
                        );
                      })}
                    </div>

                    <ul className="tn-cup__payouts">
                      {payouts.map((p) => (
                        <li key={p.place}>
                          <span>{p.label}</span>
                          <strong>
                            <img src={a.header.gems} alt="" />
                            {p.gems.toLocaleString()}
                          </strong>
                        </li>
                      ))}
                    </ul>

                    <div className="tn-cup__tabs" role="tablist" aria-label={`${tier.name} board`}>
                      {(["live", "past"] as const).map((tab) => {
                        const active = (cupTab[tier.id] ?? "live") === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`tn-cup__tab${active ? " tn-cup__tab--on" : ""}`}
                            onClick={() => setBoardTab(tier.id, tab)}
                          >
                            {tab === "live" ? "Live" : "Past results"}
                          </button>
                        );
                      })}
                    </div>

                    {(cupTab[tier.id] ?? "live") === "live" ? (
                      rows.length > 0 ? (
                        <ol className="tn-cup__standings">
                          {rows.map((r) => (
                            <li key={r.id}>
                            <span>
                              #{r.place ?? "—"} {r.username}
                            </span>
                            <strong>{formatStandingScore(r)}</strong>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="tn-cup__empty">No scores yet this period.</p>
                      )
                    ) : historyLoading[tier.id] ? (
                      <p className="tn-cup__empty">Loading past results…</p>
                    ) : (history[tier.id] ?? []).length === 0 ? (
                      <p className="tn-cup__empty">No past periods yet — check back after the next reset.</p>
                    ) : (
                      <div className="tn-cup__history">
                        {(history[tier.id] ?? []).map((periodRow) => (
                          <div key={periodRow.period_key} className="tn-cup__history-block">
                            <span className="tn-cup__history-label">
                              {formatTournamentPeriodLabel(periodRow.period_key, tier.reset)}
                            </span>
                            <ol className="tn-cup__standings">
                              {periodRow.standings.map((r) => (
                                <li key={`${periodRow.period_key}-${r.id}`}>
                            <span>
                              #{r.place ?? "—"} {r.username}
                            </span>
                            <strong>{formatStandingScore(r)}</strong>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="tn-cup__actions">
                      {unlocked ? (
                        <button
                          type="button"
                          className="tn-kit__cta"
                          disabled={busyId === tier.id || !canEnter}
                          onClick={() => {
                            setError(null);
                            setConfirmTier(tier);
                          }}
                        >
                          Enter {tier.stakeName} · {tier.entryGems}
                          <img src={a.header.gems} alt="" width={14} height={14} />
                        </button>
                      ) : (
                        <button type="button" className="tn-kit__ghost" disabled>
                          Locked
                        </button>
                      )}
                      {unlocked && !canAfford && adsLeft <= 0 && (
                        <button type="button" className="tn-kit__ghost" onClick={() => onOpenShop?.()}>
                          Get gems
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="tn-kit__footer">
              <button type="button" className="tn-kit__ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmTier && (
        <div className="tn-confirm-overlay" role="presentation">
          <div
            className="tn-confirm"
            role="dialog"
            aria-labelledby="tournament-enter-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tournament-enter-title">Enter {confirmTier.name}?</h2>
            <p>
              Pay <strong>{confirmTier.entryGems}</strong> gems, or watch a short video for a free
              entry ({freeAdsLeft(confirmTier)}/{maxTournamentFreeAds(confirmTier.id)} left{" "}
              {tournamentFreeAdPeriodLabel(confirmTier.reset)}). You&apos;ll get a random board from
              this cup&apos;s Solo range.
            </p>
            <div className="tn-confirm__actions">
              <button
                type="button"
                className="tn-kit__cta"
                disabled={
                  busyId === confirmTier.id || gems < confirmTier.entryGems || Boolean(webAdTier)
                }
                onClick={() => enterTournament(confirmTier)}
              >
                <img src={a.header.gems} alt="" width={14} height={14} />
                Pay {confirmTier.entryGems}
              </button>
              <button
                type="button"
                className="tn-kit__cta tn-kit__cta--free"
                disabled={
                  busyId === confirmTier.id || freeAdsLeft(confirmTier) <= 0 || Boolean(webAdTier)
                }
                onClick={() => void enterTournamentWithAd(confirmTier)}
              >
                {busyId === confirmTier.id && !webAdTier ? "Loading…" : "▶ Watch ad · Free"}
              </button>
              <button
                type="button"
                className="tn-kit__ghost"
                disabled={Boolean(webAdTier)}
                onClick={() => setConfirmTier(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {webAdTier && (
        <div className="tn-confirm-overlay tn-ad-overlay" role="status" aria-live="polite">
          <div className="tn-ad" onClick={(e) => e.stopPropagation()}>
            <span className="tn-ad__badge">Sponsored</span>
            <div className="tn-ad__screen">
              <span className="tn-ad__play" aria-hidden>
                ▶
              </span>
              <p className="tn-ad__title">Free tournament entry</p>
              <p className="tn-ad__tagline">Watch to enter {webAdTier.name}</p>
            </div>
            <div className="tn-ad__progress" aria-hidden>
              <span className="tn-ad__progress-fill" style={{ width: `${webAdProgress * 100}%` }} />
            </div>
            <p className="tn-ad__hint">
              {webAdProgress >= 1 ? "Entry unlocked" : "Watching… reward in a moment"}
            </p>
            {webAdProgress < 0.35 && (
              <button
                type="button"
                className="tn-kit__ghost"
                onClick={() => {
                  setWebAdTier(null);
                  setWebAdProgress(0);
                  setBusyId(null);
                }}
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}

      {briefing && (
        <div className="tn-confirm-overlay" role="presentation">
          <div
            className="tn-confirm tn-confirm--briefing"
            role="dialog"
            aria-labelledby="tournament-brief-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tournament-brief-title">{briefing.tierName}</h2>
            <p className="tn-brief__lead">
              Play <strong>{briefing.cfg.moveLimit} hands</strong>. Finish a goal for a random{" "}
              <strong>×2–×10</strong> bonus on that hand. Highest score wins — time breaks ties.
            </p>
            <div className="tn-brief__goals">
              <div className="tn-brief__goal">
                <span>Hands</span>
                <strong>{briefing.cfg.moveLimit}</strong>
              </div>
              <div className="tn-brief__goal">
                <span>Goals</span>
                <strong>{briefing.cfg.challenges.length}</strong>
              </div>
            </div>
            {briefing.cfg.challenges.length > 0 && (
              <ul className="tn-brief__challenges">
                {briefing.cfg.challenges.map((c, i) => (
                  <li key={`${c.hand}-${i}`}>{formatChallenge(c)}</li>
                ))}
              </ul>
            )}
            <p className="tn-brief__note">
              Only the finishing hand gets the random multiplier — other hands score normally.
            </p>
            <div className="tn-confirm__actions">
              <button
                type="button"
                className="tn-kit__cta"
                onClick={() => {
                  const board = briefing;
                  setBriefing(null);
                  onClose();
                  onPlayTournament(board);
                }}
              >
                Play now
              </button>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="tn-confirm-overlay" role="presentation" onClick={() => setShowRules(false)}>
          <div
            className="tn-confirm tn-confirm--rules"
            role="dialog"
            aria-labelledby="tn-rules-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tn-rules-title">Tournament rules</h2>
            <p>
              Same scoring as Quick Play: highest score wins; tied scores → fastest finish. The hand
              that completes a goal pays a random <strong>×2–×10</strong> bonus (shown on screen);
              normal hands stay at base rates.
            </p>
            <p>
              <strong>Daily</strong> — shorter races, resets every UK midnight.
              <br />
              <strong>Weekly</strong> — mid races, resets Monday UK midnight.
              <br />
              <strong>Monthly</strong> — longer races, resets on the 1st UK midnight.
            </p>
            <p>
              Each cup has <strong>Low / Medium / High</strong> stakes (entry gems + prize pool).
              Higher stakes use tougher goal counts. Enter with gems or a free video (limits reset
              with each cup). Top 3 earn prize gems when the period ends.
            </p>
            <div className="tn-confirm__actions">
              <button type="button" className="tn-kit__cta" onClick={() => setShowRules(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
