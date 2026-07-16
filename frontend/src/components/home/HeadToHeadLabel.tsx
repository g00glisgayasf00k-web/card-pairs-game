/** Gold “Head to Head” mode tag — replaces the old Multiplayer label PNG. */
export function HeadToHeadLabel({ className = "" }: { className?: string }) {
  return (
    <span className={`h2h-label${className ? ` ${className}` : ""}`}>
      Head to Head
    </span>
  );
}
