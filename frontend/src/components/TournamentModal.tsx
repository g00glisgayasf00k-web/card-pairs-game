import { useEffect, useState } from "react";
import { HOME_ASSETS } from "./home/homeAssets";
import {
  fetchTournamentStandings,
  type TournamentStandingRow,
} from "../lib/api";
import { formatChallenge } from "../lib/levels";
import { loadProgress, saveProgress } from "../lib/progress";
import {
  TOURNAMENT_TIERS,
  isTournamentUnlocked,
  payoutAmounts,
  pickTournamentBoard,
  unlockLabel,
  type TournamentBoardPick,
  type TournamentTier,
} from "../lib/tournamentTiers";

interface Props {
  onClose: () => void;
  onBalanceChange?: () => void;
  onOpenShop?: () => void;
  onPlayTournament: (board: TournamentBoardPick) => void;
}

export function TournamentModal({
  onClose,
  onBalanceChange,
  onOpenShop,
  onPlayTournament,
}: Props) {
  const [tick, setTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmTier, setConfirmTier] = useState<TournamentTier | null>(null);
  const [briefing, setBriefing] = useState<TournamentBoardPick | null>(null);
  const [standings, setStandings] = useState<Record<string, TournamentStandingRow[]>>({});

  void tick;
  const gems = loadProgress()?.credits ?? 0;
  const a = HOME_ASSETS;
  const green = a.cards.green;

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      TOURNAMENT_TIERS.map(async (tier) => {
        try {
          const r = await fetchTournamentStandings(tier.id, 5);
          return [tier.id, r.standings] as const;
        } catch {
          return [tier.id, [] as TournamentStandingRow[]] as const;
        }
      })
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, TournamentStandingRow[]> = {};
      for (const [id, rows] of pairs) next[id] = rows;
      setStandings(next);
    });
    return () => {
      cancelled = true;
    };
  }, [tick]);

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
    setConfirmTier(null);
    setBriefing(pickTournamentBoard(tier));
    setBusyId(null);
    refresh();
    onBalanceChange?.();
  };

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
                <p>Fewest hands wins. If tied, closest to the point goal.</p>
              </div>
            </div>

            <div className="tn-kit__body">
              <p className="tn-kit__hint">
                Each cup uses a random board from its Solo range. Top 3 take the payouts shown.
              </p>
              {error && <p className="tn-kit__error">{error}</p>}

              {TOURNAMENT_TIERS.map((tier) => {
                const unlocked = isTournamentUnlocked(tier);
                const payouts = payoutAmounts(tier.rewardPool);
                const canAfford = gems >= tier.entryGems;
                const rows = standings[tier.id] ?? [];
                return (
                  <article
                    key={tier.id}
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
                        <span className="tn-cup__name">{tier.name}</span>
                        <span className="tn-cup__unlock">
                          {unlocked
                            ? "Unlocked"
                            : `Locked · clear Solo ${unlockLabel(tier)}`}
                        </span>
                      </div>
                      <div className="tn-cup__pool">
                        <span className="tn-cup__pool-label">Pool</span>
                        <span className="tn-cup__pool-val">
                          <img src={a.header.gems} alt="" />
                          {tier.rewardPool.toLocaleString()}
                        </span>
                      </div>
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

                    {rows.length > 0 && (
                      <ol className="tn-cup__standings">
                        {rows.map((r) => (
                          <li key={r.id}>
                            <span>#{r.place ?? "—"} {r.username}</span>
                            <strong>
                              {r.hands}h · {r.score.toLocaleString()}pts
                            </strong>
                          </li>
                        ))}
                      </ol>
                    )}

                    <div className="tn-cup__actions">
                      {unlocked ? (
                        <button
                          type="button"
                          className="tn-kit__cta"
                          disabled={busyId === tier.id || !canAfford}
                          onClick={() => {
                            setError(null);
                            setConfirmTier(tier);
                          }}
                        >
                          Enter · {tier.entryGems}
                          <img src={a.header.gems} alt="" width={14} height={14} />
                        </button>
                      ) : (
                        <button type="button" className="tn-kit__ghost" disabled>
                          Locked
                        </button>
                      )}
                      {unlocked && !canAfford && (
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
              Entry fee <strong>{confirmTier.entryGems}</strong> gems. You&apos;ll get a random
              board from this cup&apos;s Solo range. Win with the fewest hands — if tied, closest
              to the point goal ranks higher.
            </p>
            <div className="tn-confirm__actions">
              <button
                type="button"
                className="tn-kit__cta"
                disabled={busyId === confirmTier.id}
                onClick={() => enterTournament(confirmTier)}
              >
                <img src={a.header.gems} alt="" width={14} height={14} />
                Pay {confirmTier.entryGems}
              </button>
              <button type="button" className="tn-kit__ghost" onClick={() => setConfirmTier(null)}>
                Cancel
              </button>
            </div>
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
            <p className="tn-brief__lead">Your tournament board is ready. Hit these goals:</p>
            <div className="tn-brief__goals">
              <div className="tn-brief__goal">
                <span>Point goal</span>
                <strong>{briefing.cfg.targetPoints.toLocaleString()}</strong>
              </div>
              <div className="tn-brief__goal">
                <span>Move budget</span>
                <strong>{briefing.cfg.moveLimit}</strong>
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
              Ranking: fewest hands first, then closest to the point goal.
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
    </>
  );
}
