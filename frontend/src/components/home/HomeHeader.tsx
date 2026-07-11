import { HOME_ASSETS } from "./homeAssets";

interface Props {
  gems: number;
  loggedIn: boolean;
  username: string | null;
  onShop: () => void;
  onProfile: () => void;
}

export function HomeHeader({ gems, loggedIn, username, onShop, onProfile }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 px-1">
      <div className="flex min-w-0 flex-col items-start" aria-label="Royal Poker Match">
        <img src={HOME_ASSETS.header.crown} alt="" width={48} height={32} />
        <span className="text-[11px] font-bold tracking-[0.18em] text-home-gold uppercase">
          Royal
        </span>
        <span className="bg-gradient-to-b from-home-gold-highlight to-home-gold-deep bg-clip-text text-[17px] font-extrabold leading-tight tracking-wide text-transparent uppercase">
          Poker Match
        </span>
      </div>

      <div className="flex items-center gap-2">
        {loggedIn && (
          <button
            type="button"
            onClick={onShop}
            aria-label={`${gems} gems`}
            className="flex items-center gap-1.5 rounded-full border border-home-border bg-home-bg px-2.5 py-1.5"
          >
            <img src={HOME_ASSETS.header.gems} alt="" width={16} height={16} />
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
          className="flex h-10 w-10 items-center justify-center rounded-full border border-home-gold bg-home-bg"
        >
          <img src={HOME_ASSETS.header.profile} alt="" width={22} height={22} />
        </button>
      </div>
    </header>
  );
}
