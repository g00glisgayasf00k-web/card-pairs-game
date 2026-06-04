import { useCallback, useEffect, useRef, useState } from "react";
import { submitScore } from "../lib/api";
import {
  HAND_DISPLAY,
  HAND_RANK_ORDER,
  HAND_SCORE_LIST,
  SPECIALS_EARN_BY_HAND,
  SPECIALS_GUIDE,
  type FullHandResult,
  type HandLabel,
} from "../lib/pokerHands";
import { comboLabel, comboMultiplier, getLevelConfig, levelRequirementsMet, MAX_LEVEL } from "../lib/levels";
import {
  clearProgress,
  defaultProgress,
  loadProgress,
  saveProgress,
} from "../lib/progress";
import { GameBoard, type GameBoardHandle } from "../components/GameBoard";
import { SpecialArt } from "../components/SpecialArt";

interface Props {
  username: string | null;
  onMenu: () => void;
}

type Phase = "playing" | "round_complete" | "campaign_complete";

interface FloatScore {
  id: number;
  text: string;
}

interface RunState {
  level: number;
  totalScore: number;
  levelScore: number;
  levelHands: number;
  handsCleared: number;
  bestHand: HandLabel;
  streak: number;
}

const HAND_BADGE: Record<HandLabel, string> = {
  pair: "2",
  two_pair: "2×2",
  three_of_a_kind: "3",
  straight: "5↔",
  flush: "♠",
  full_house: "🏠",
  four_of_a_kind: "4",
  straight_flush: "⚡",
  royal_flush: "👑",
};

const ROUND_COMPLETE_MS = 2200;

function initRunState(): RunState {
  const saved = loadProgress();
  if (saved) {
    return {
      level: saved.level,
      totalScore: saved.totalScore,
      levelScore: saved.levelScore,
      levelHands: saved.levelHands,
      handsCleared: saved.handsCleared,
      bestHand: saved.bestHand,
      streak: saved.streak,
    };
  }
  return defaultProgress();
}

export function GameScreen({ username, onMenu }: Props) {
  const [run, setRun] = useState<RunState>(initRunState);
  const { level, totalScore, levelScore, levelHands, handsCleared, bestHand, streak } = run;

  const [phase, setPhase] = useState<Phase>("playing");
  const [completedLevel, setCompletedLevel] = useState<number | null>(null);
  const [completedStats, setCompletedStats] = useState<{ score: number; hands: number } | null>(
    null
  );
  const [showScores, setShowScores] = useState(false);
  const [showSpecials, setShowSpecials] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  const [floatScores, setFloatScores] = useState<FloatScore[]>([]);
  const floatId = useRef(0);
  const levelScoreRef = useRef(levelScore);
  const levelHandsRef = useRef(levelHands);
  const totalScoreRef = useRef(totalScore);
  const handsClearedRef = useRef(handsCleared);
  const bestHandRef = useRef(bestHand);
  const advancingRef = useRef(false);

  const boardRef = useRef<GameBoardHandle>(null);

  levelScoreRef.current = levelScore;
  levelHandsRef.current = levelHands;
  totalScoreRef.current = totalScore;
  handsClearedRef.current = handsCleared;
  bestHandRef.current = bestHand;

  const cfg = getLevelConfig(level);
  const combo = comboMultiplier(streak);
  const comboMsg = comboLabel(streak);
  const levelProgress = Math.min(1, levelScore / cfg.targetPoints);
  const handsProgress = Math.min(1, levelHands / cfg.minHands);
  const nextCfg = getLevelConfig(level + 1);
  const pointsMet = levelScore >= cfg.targetPoints;
  const handsMet = levelHands >= cfg.minHands;
  const completedCfg = completedLevel ? getLevelConfig(completedLevel) : null;

  const persistRun = useCallback((next: RunState) => {
    saveProgress({
      level: next.level,
      totalScore: next.totalScore,
      levelScore: next.levelScore,
      levelHands: next.levelHands,
      handsCleared: next.handsCleared,
      bestHand: next.bestHand,
      streak: next.streak,
    });
  }, []);

  useEffect(() => {
    persistRun(run);
  }, [run, persistRun]);

  const advanceLevel = useCallback(() => {
    advancingRef.current = false;
    setCompletedLevel(null);
    setCompletedStats(null);
    setRun((prev) => {
      const next: RunState = {
        ...prev,
        level: prev.level + 1,
        levelScore: 0,
        levelHands: 0,
        streak: 0,
      };
      levelScoreRef.current = 0;
      levelHandsRef.current = 0;
      return next;
    });
    setPhase("playing");
    setBoardKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (phase !== "round_complete") return;
    const id = window.setTimeout(advanceLevel, ROUND_COMPLETE_MS);
    return () => window.clearTimeout(id);
  }, [phase, advanceLevel]);

  const tryAdvanceLevel = useCallback(
    (score: number, hands: number) => {
      if (phase !== "playing" || advancingRef.current) return false;
      if (!levelRequirementsMet(score, hands, cfg)) return false;

      advancingRef.current = true;
      setCompletedLevel(level);
      setCompletedStats({ score, hands });

      if (level >= MAX_LEVEL) {
        setPhase("campaign_complete");
      } else {
        setPhase("round_complete");
      }
      return true;
    },
    [cfg, level, phase]
  );

  const spawnFloat = useCallback((text: string) => {
    const id = ++floatId.current;
    setFloatScores((prev) => [...prev, { id, text }]);
    window.setTimeout(() => {
      setFloatScores((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  }, []);

  const handleHand = useCallback(
    (result: FullHandResult) => {
      const newStreak = streak + 1;
      const comboPts = Math.round(result.totalPoints * comboMultiplier(newStreak));
      const nextHands = levelHandsRef.current + 1;
      const nextScore = levelScoreRef.current + comboPts;
      levelHandsRef.current = nextHands;
      levelScoreRef.current = nextScore;

      setRun((prev) => {
        const nextBest =
          HAND_RANK_ORDER[result.hand] > HAND_RANK_ORDER[prev.bestHand]
            ? result.hand
            : prev.bestHand;
        bestHandRef.current = nextBest;
        handsClearedRef.current = prev.handsCleared + 1;
        totalScoreRef.current = prev.totalScore + comboPts;
        return {
          ...prev,
          streak: newStreak,
          handsCleared: prev.handsCleared + 1,
          levelHands: nextHands,
          levelScore: nextScore,
          bestHand: nextBest,
          totalScore: prev.totalScore + comboPts,
        };
      });
      tryAdvanceLevel(nextScore, nextHands);
      spawnFloat(`+${comboPts.toLocaleString()}`);
    },
    [streak, tryAdvanceLevel, spawnFloat]
  );

  const handleActivation = useCallback(
    (pts: number) => {
      const nextScore = levelScoreRef.current + pts;
      levelScoreRef.current = nextScore;
      setRun((prev) => {
        totalScoreRef.current = prev.totalScore + pts;
        return {
          ...prev,
          levelScore: nextScore,
          totalScore: prev.totalScore + pts,
        };
      });
      tryAdvanceLevel(nextScore, levelHandsRef.current);
      spawnFloat(`+${pts.toLocaleString()}`);
    },
    [tryAdvanceLevel, spawnFloat]
  );

  const handleExit = () => {
    if (totalScoreRef.current > 0) {
      submitScore({
        points: totalScoreRef.current,
        hands_cleared: handsClearedRef.current,
        best_hand: bestHandRef.current,
        username,
      }).catch(() => {});
    }
    onMenu();
  };

  const finishCampaign = () => {
    submitScore({
      points: totalScoreRef.current,
      hands_cleared: handsClearedRef.current,
      best_hand: bestHandRef.current,
      username,
    }).catch(() => {});
    clearProgress();
    onMenu();
  };

  const boardLocked = phase !== "playing";

  return (
    <div className="game-screen">
      <div className="mobile-shell">
        <header className="game-hud">
          <div className="game-hud__row">
            <div className="level-badge" title={cfg.label}>
              <span className="level-badge__icon">⭐</span>
              <span className="level-badge__num">{level}/{MAX_LEVEL}</span>
            </div>

            <div className="score-chip" title="Total score">
              <span className="score-chip__icon">💰</span>
              <span className="score-chip__value">{totalScore.toLocaleString()}</span>
            </div>

            <div className="rank-chip" title={cfg.label}>
              <span className="rank-chip__label">{cfg.label}</span>
            </div>
          </div>

          <div className="xp-track">
            <div
              className={`xp-fill${pointsMet ? " xp-fill--done" : ""}`}
              style={{ width: `${levelProgress * 100}%` }}
            />
            <span className="xp-label">
              💰 {levelScore.toLocaleString()} / {cfg.targetPoints.toLocaleString()}
            </span>
          </div>

          <div className="hands-track">
            <div
              className={`hands-fill${handsMet ? " hands-fill--done" : ""}`}
              style={{ width: `${handsProgress * 100}%` }}
            />
            <span className="hands-label">
              🃏 {levelHands} / {cfg.minHands} hands
            </span>
          </div>

          <div className="stat-chips">
            <div className="stat-chip" title="Total hands this run">
              <span className="stat-chip__icon">🎯</span>
              <span className="stat-chip__val">{handsCleared}</span>
            </div>
            <div className="stat-chip" title={`Best: ${HAND_DISPLAY[bestHand]}`}>
              <span className="stat-chip__icon">{HAND_BADGE[bestHand]}</span>
            </div>
            {comboMsg && (
              <div className="stat-chip stat-chip--combo" key={streak}>
                <span className="stat-chip__icon">🔥</span>
                <span className="stat-chip__val">×{combo}</span>
              </div>
            )}
            {username && (
              <div className="stat-chip stat-chip--user" title={username}>
                <span className="stat-chip__icon">👤</span>
              </div>
            )}
          </div>
        </header>

        <main className={`board-stage${boardLocked ? " board-stage--locked" : ""}`}>
          <div className="board-stage__glow" aria-hidden />
          <div className="board-stage__frame">
            {floatScores.map((f) => (
              <div key={f.id} className="float-score">
                {f.text}
              </div>
            ))}
            <GameBoard
              ref={boardRef}
              key={boardKey}
              embedded
              locked={boardLocked}
              comboMultiplier={combo}
              onHand={handleHand}
              onActivation={handleActivation}
            />
          </div>
        </main>

        <nav className="action-bar">
          <button
            type="button"
            className="action-btn action-btn--shuffle"
            onClick={() => boardRef.current?.shuffle()}
            disabled={boardLocked}
            title="Shuffle the board"
          >
            <span className="action-btn__icon">🔀</span>
            <span className="action-btn__label">Shuffle</span>
          </button>
          <button
            type="button"
            className="action-btn action-btn--specials"
            onClick={() => setShowSpecials(true)}
            title="How bomb, star, and joker power-ups work"
          >
            <span className="action-btn__icon">✨</span>
            <span className="action-btn__label">Powers</span>
          </button>
          <button
            type="button"
            className="action-btn action-btn--scores"
            onClick={() => setShowScores(true)}
            title="Points awarded for each poker hand"
          >
            <span className="action-btn__icon">📋</span>
            <span className="action-btn__label">Payouts</span>
          </button>
          <button
            type="button"
            className="action-btn action-btn--menu"
            onClick={handleExit}
          >
            <span className="action-btn__icon">✕</span>
            <span className="action-btn__label">Exit</span>
          </button>
        </nav>
      </div>

      {phase === "round_complete" && completedLevel !== null && completedCfg && (
        <div className="modal-overlay levelup-overlay round-complete-overlay">
          <div className="modal levelup-modal round-complete-modal">
            <div className="levelup-badge round-complete-badge">ROUND COMPLETE!</div>
            <h2>Level {completedLevel} cleared</h2>
            <p className="levelup-label">{completedCfg.label}</p>
            <div className="levelup-perks">
              <div className="perk">
                <span className="perk-icon">💰</span>
                <span>{completedStats?.score.toLocaleString() ?? 0} pts this round</span>
              </div>
              <div className="perk">
                <span className="perk-icon">🃏</span>
                <span>{completedStats?.hands ?? 0} hands cleared</span>
              </div>
              <div className="perk">
                <span className="perk-icon">⭐</span>
                <span>Up next: {nextCfg.label}</span>
              </div>
            </div>
            <p className="round-complete-hint">Starting level {level + 1}…</p>
            <button type="button" className="btn ghost" onClick={advanceLevel}>
              Continue now →
            </button>
          </div>
        </div>
      )}

      {phase === "campaign_complete" && (
        <div className="modal-overlay levelup-overlay">
          <div className="modal levelup-modal">
            <div className="levelup-badge">YOU WIN!</div>
            <h2>All {MAX_LEVEL} levels cleared</h2>
            <p className="levelup-label">Ultimate champion</p>
            <div className="levelup-perks">
              <div className="perk">
                <span className="perk-icon">💰</span>
                <span>{totalScore.toLocaleString()} total pts</span>
              </div>
              <div className="perk">
                <span className="perk-icon">🃏</span>
                <span>{handsCleared} hands cleared</span>
              </div>
              <div className="perk">
                <span className="perk-icon">👑</span>
                <span>Best: {HAND_DISPLAY[bestHand]}</span>
              </div>
            </div>
            <button type="button" className="btn" onClick={finishCampaign}>
              Finish →
            </button>
          </div>
        </div>
      )}

      {showScores && (
        <div
          className="modal-overlay scores-overlay"
          onClick={() => setShowScores(false)}
          role="presentation"
        >
          <div
            className="modal scores-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="scores-title"
          >
            <h2 id="scores-title">Hand payouts</h2>
            <p className="scores-note">Base points per hand — combo streaks multiply 🔥</p>
            <ul className="scores-list">
              {HAND_SCORE_LIST.map(({ hand, points }) => (
                <li key={hand} className="scores-row">
                  <span className="scores-hand">{HAND_DISPLAY[hand]}</span>
                  <span className="scores-pts">{points.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn scores-close"
              onClick={() => setShowScores(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSpecials && (
        <div
          className="modal-overlay scores-overlay"
          onClick={() => setShowSpecials(false)}
          role="presentation"
        >
          <div
            className="modal scores-modal specials-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="specials-title"
          >
            <h2 id="specials-title">Power-ups</h2>
            <p className="scores-note">Earned by clearing big hands — spawn where you started the swipe</p>
            <ul className="specials-list">
              {SPECIALS_GUIDE.map((sp) => (
                <li key={sp.name} className="specials-card">
                  <div className="specials-card__head">
                    <SpecialArt type={sp.type} className="special-art--guide" />
                    <span className="specials-card__name">{sp.name}</span>
                  </div>
                  <p className="specials-card__earn">{sp.earn}</p>
                  <p className="specials-card__effect">{sp.effect}</p>
                </li>
              ))}
            </ul>
            <h3 className="specials-subtitle">Rewards by hand</h3>
            <ul className="scores-list">
              {SPECIALS_EARN_BY_HAND.map(({ hand, types }) => (
                <li key={hand} className="scores-row">
                  <span className="scores-hand">{HAND_DISPLAY[hand]}</span>
                  <span className="specials-icons">
                    {types.map((t, i) => (
                      <SpecialArt key={`${hand}-${i}`} type={t} className="special-art--tiny" />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn scores-close"
              onClick={() => setShowSpecials(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
