/**
 * Branded gamification icons. Filled and self-colored (streak amber, brand
 * violet) so they read as small objects, not outline glyphs — and so they
 * replace the bare emoji (🔥 ⚡) the chrome used to use. Sized via className.
 */

/** Streak flame — amber, with a lighter inner core. */
export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Streak"
    >
      <path
        d="M12.5 2.2c.2 3 2.3 4.1 3.6 6 1 1.4 1.6 3 1.6 4.8a5.7 5.7 0 1 1-11.4 0c0-1.9.8-3.5 2-4.9.2 1.3 1 2.1 2 2.3-1-2.6.3-5.7 2.2-8.2z"
        fill="var(--streak)"
      />
      <path
        d="M12.2 12.4c.2 1.4 1.3 1.9 1.9 3 .4.7.6 1.4.6 2.2a2.7 2.7 0 1 1-5.4 0c0-1 .4-1.8 1.1-2.5.1.7.6 1.1 1.1 1.2-.6-1.3.1-2.6.7-3.9z"
        fill="#FFD27A"
      />
    </svg>
  );
}

/** XP bolt — brand violet, with a soft highlight edge. */
export function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="XP"
    >
      <path
        d="M13.6 2 5 13.2a.7.7 0 0 0 .56 1.12H10l-1.2 7.1a.5.5 0 0 0 .9.38L19 10.5a.7.7 0 0 0-.56-1.12H13.8L15 2.6a.5.5 0 0 0-.9-.38z"
        fill="var(--primary)"
      />
      <path
        d="M13.6 2 5 13.2a.7.7 0 0 0 .56 1.12H8.2L14.1 2.2z"
        fill="#FFFFFF"
        fillOpacity="0.28"
      />
    </svg>
  );
}
