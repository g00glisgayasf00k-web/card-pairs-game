interface Props {
  gems: number;
  loggedIn: boolean;
  username: string | null;
  onMenu: () => void;
  onShop: () => void;
  onProfile: () => void;
}

export function HomeHeader({ gems, loggedIn, username, onMenu, onShop, onProfile }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 px-1">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Menu"
        className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-lg"
      >
        <span className="block h-[2px] w-5 rounded bg-home-gold" />
        <span className="block h-[2px] w-5 rounded bg-home-gold" />
        <span className="block h-[2px] w-5 rounded bg-home-gold" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center" aria-label="Royal Poker Match">
        <span className="text-lg leading-none text-home-gold" aria-hidden>
          ♔
        </span>
        <span className="text-center text-[11px] font-bold tracking-[0.18em] text-home-gold uppercase">
          Royal
        </span>
        <span className="text-center text-[17px] font-extrabold leading-tight tracking-wide text-home-gold uppercase">
          Poker Match
        </span>
      </div>

      <div className="flex items-center gap-2">
        {loggedIn && (
          <button
            type="button"
            onClick={onShop}
            aria-label={`${gems} gems`}
            className="flex items-center gap-1.5 rounded-full border border-home-blue bg-home-bg px-2.5 py-1.5"
          >
            <span aria-hidden>💎</span>
            <strong className="text-sm font-extrabold text-home-text">{gems.toLocaleString()}</strong>
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-home-green text-xs font-black text-home-text"
              aria-hidden
            >
              +
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onProfile}
          aria-label={loggedIn ? `Account: ${username ?? "player"}` : "Sign in"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-home-gold bg-home-bg text-lg text-home-text"
        >
          👤
        </button>
      </div>
    </header>
  );
}
