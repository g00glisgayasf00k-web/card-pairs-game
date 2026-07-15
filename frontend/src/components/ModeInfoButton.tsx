interface Props {
  onClick: () => void;
  label?: string;
  className?: string;
}

/** Clear rules control — gold disc with a bold mark so it reads against card art. */
export function ModeInfoButton({
  onClick,
  label = "How this mode works",
  className = "",
}: Props) {
  return (
    <button
      type="button"
      className={`mode-info-btn${className ? ` ${className}` : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
      title={label}
    >
      <span className="mode-info-btn__mark" aria-hidden>
        ?
      </span>
    </button>
  );
}
