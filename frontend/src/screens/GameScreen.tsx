import { useCallback, useRef, useState } from "react";
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
import { GameBoard, type GameBoardHandle } from "../components/GameBoard";
import { SpecialArt } from "../components/SpecialArt";

interface Props {
  username: string | null;
  onMenu: () => void;
}

type Phase = "playing" | "leveling_up" | "campaign_complete";

interface FloatScore {
  id: number;
  text: string;
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

export function GameScreen({ username, onMenu }: Props) {
  const [level, setLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  const [levelHands, setLevelHands] = useState(0);
  const [handsCleared, setHandsCleared] = useState(0);
  const [bestHand, setBestHand] = useState<HandLabel>("pair");
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [showScores, setShowScores] = useState(false);
  const [showSpecials, setShowSpecials] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  const [floatScores, setFloatScores] = useState<FloatScore[]>([]);
  const floatId = useRef(0);
  const levelScoreRef = useRef(0);
  const levelHandsRef = useRef(0);
  const totalScoreRef = useRef(0);
  const handsClearedRef = useRef(0);
  const bestHandRef = useRef<HandLabel>("pair");

  const boardRef = useRef<GameBoardHandle>(null);

  const cfg = getLevelConfig(level);
  const combo = comboMultiplier(streak);
  const comboMsg = comboLabel(streak);
  const levelProgress = Math.min(1, levelScore / cfg.targetPoints);
  const handsProgress = Math.min(1, levelHands / cfg.minHands);
  const nextCfg = getLevelConfig(level + 1);
  const pointsMet = levelScore >= cfg.targetPoints;
  const handsMet = levelHands >= cfg.minHands;

  const tryAdvanceLevel = useCallback(
    (score: number, hands: number) => {
      if (!levelRequirementsMet(score, hands, cfg)) return false;
      setTimeout(() => {
        setPhase(level >= MAX_LEVEL ? "campaign_complete" : "leveling_up");
      }, 100);
      return true;
    },
    [cfg, level]
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

      setStreak(newStreak);
      setHandsCleared((h) => {
        const next = h + 1;
        handsClearedRef.current = next;
        return next;
      });
      setLevelHands(nextHands);
      setLevelScore(nextScore);
      setBestHand((b) => {
        const next =
          HAND_RANK_ORDER[result.hand] > HAND_RANK_ORDER[b] ? result.hand : b;
        bestHandRef.current = next;
        return next;
      });
      setTotalScore((ts) => {
        const next = ts + comboPts;
        totalScoreRef.current = next;
        return next;
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
      setTotalScore((ts) => {
        const next = ts + pts;
        totalScoreRef.current = next;
        return next;
      });
      setLevelScore(nextScore);
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

  const advanceLevel = () => {
    levelScoreRef.current = 0;
    levelHandsRef.current = 0;
    setLevel((l) => l + 1);
    setLevelScore(0);
    setLevelHands(0);
    setStreak(0);
    setPhase("playing");
    setBoardKey((k) => k + 1);
  };

  return (
    <div className="game-screen">
      <div className="mobile-shell">
        {/* ── TOP HUD ── */}
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

        {/* ── BOARD STAGE ── */}
        <main className="board-stage">
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
              comboMultiplier={combo}
              onHand={handleHand}
              onActivation={handleActivation}
            />
          </div>
        </main>

        {/* ── BOTTOM ACTION BAR ── */}
        <nav className="action-bar">
          <button
            type="button"
            className="action-btn action-btn--shuffle"
            onClick={() => boardRef.current?.shuffle()}
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

      {/* ── Level-up overlay ── */}
      {phase === "leveling_up" && level < MAX_LEVEL && (
        <div className="modal-overlay levelup-overlay">
          <div className="modal levelup-modal">
            <div className="levelup-badge">LEVEL UP!</div>
            <h2>Level {level + 1}</h2>
            <p className="levelup-label">{nextCfg.label}</p>
            <div className="levelup-perks">
              <div className="perk">
                <span className="perk-icon">💰</span>
                <span>{nextCfg.targetPoints.toLocaleString()} pts</span>
              </div>
              <div className="perk">
                <span className="perk-icon">🃏</span>
                <span>{nextCfg.minHands} hands to clear</span>
              </div>
              <div className="perk">
                <span className="perk-icon">⭐</span>
                <span>Earn 💣 ⭐ 🃏 on big hands</span>
              </div>
            </div>
            <button type="button" className="btn" onClick={advanceLevel}>
              Deal next level →
            </button>
          </div>
        </div>
      )}

      {/* ── Campaign complete (beat level 100) ── */}
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
            <button
              type="button"
              className="btn"
              onClick={() => {
                submitScore({
                  points: totalScoreRef.current,
                  hands_cleared: handsClearedRef.current,
                  best_hand: bestHandRef.current,
                  username,
                }).catch(() => {});
                handleExit();
              }}
            >
              Finish →
            </button>
          </div>
        </div>
      )}

      {/* ── Hand scores reference ── */}
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

      {/* ── Power-ups guide ── */}
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
