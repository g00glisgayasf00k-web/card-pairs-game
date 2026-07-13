interface Props {
  onClick: () => void;
  label?: string;
  className?: string;
}

/** Compact (i) control — opens mode rules without crowding the screen. */
export function ModeInfoButton({
  onClick,
  label = "How this mode works",
  className = "",
}: Props) {
  return (
    <button
      type="button"
      className={`mode-info-btn${className ? ` ${className}` : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <span aria-hidden>i</span>
    </button>
  );
}
