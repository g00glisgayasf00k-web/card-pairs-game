import { useState } from "react";

const MOCK_FRIENDS = [
  { name: "AceHigh", status: "online" as const, level: 42 },
  { name: "FeltFox", status: "online" as const, level: 31 },
  { name: "RiverRat", status: "away" as const, level: 55 },
  { name: "ChipStack", status: "offline" as const, level: 18 },
];

const WAGERS = [0, 10, 25, 50] as const;

interface Props {
  onClose: () => void;
  onPlaySolo: () => void;
}

export function ChallengeFriendModal({ onClose, onPlaySolo }: Props) {
  const [friend, setFriend] = useState(MOCK_FRIENDS[0]!.name);
  const [wager, setWager] = useState<(typeof WAGERS)[number]>(0);
  const [sent, setSent] = useState(false);

  return (
    <div className="modal-overlay scores-overlay home-menu-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="challenge-title"
      >
        {!sent ? (
          <>
            <h2 id="challenge-title">Challenge a friend</h2>
            <p className="play-mode-modal__lead">
              Same seeded board and goals. Best stars win — fewest moves breaks ties.
            </p>

            <h3 className="play-mode-modal__section">Friends</h3>
            <ul className="challenge-friend-list">
              {MOCK_FRIENDS.map((f) => (
                <li key={f.name}>
                  <button
                    type="button"
                    className={`challenge-friend${friend === f.name ? " challenge-friend--selected" : ""}`}
                    onClick={() => setFriend(f.name)}
                  >
                    <span className="challenge-friend__name">{f.name}</span>
                    <span className={`challenge-friend__status challenge-friend__status--${f.status}`}>
                      {f.status}
                    </span>
                    <span className="challenge-friend__level">Lv {f.level}</span>
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="play-mode-modal__section">Setup</h3>
            <div className="play-mode-setup">
              <div className="play-mode-setup__card">
                <span className="play-mode-setup__label">Board</span>
                <strong>Your current level seed</strong>
                <span className="play-mode-setup__hint">Mirrored cards &amp; goals</span>
              </div>
              <div className="play-mode-setup__card">
                <span className="play-mode-setup__label">Win by</span>
                <strong>Stars → moves → score</strong>
                <span className="play-mode-setup__hint">Assists marked on result</span>
              </div>
            </div>

            <h3 className="play-mode-modal__section">Gem wager (optional)</h3>
            <div className="play-mode-wagers">
              {WAGERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`play-mode-wager${wager === g ? " play-mode-wager--on" : ""}`}
                  onClick={() => setWager(g)}
                >
                  {g === 0 ? "None" : `${g} 💎`}
                </button>
              ))}
            </div>

            <p className="play-mode-modal__note">
              Friend invites are in preview — you&apos;ll get a practice run on the campaign table for now.
            </p>

            <div className="play-mode-modal__actions">
              <button type="button" className="btn btn-primary" onClick={() => setSent(true)}>
                Send challenge to {friend}
              </button>
              <button type="button" className="btn scores-close" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="challenge-title">Challenge ready</h2>
            <p className="play-mode-modal__lead">
              Challenge queued for <strong>{friend}</strong>
              {wager > 0 ? ` · ${wager} gem wager` : ""}.
            </p>
            <div className="play-mode-sent">
              <p>
                Live friend matching is coming next. Practice the same style of run in Solo while we finish
                invites.
              </p>
            </div>
            <div className="play-mode-modal__actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onPlaySolo();
                }}
              >
                Practice in Solo
              </button>
              <button type="button" className="btn scores-close" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
