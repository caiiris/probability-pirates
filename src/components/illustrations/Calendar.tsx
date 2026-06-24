/**
 * Calendar illustration for the birthday-paradox lesson. A month grid with two
 * days marked in the accent color to hint at a shared date. Flat geometric line
 * art, consistent stroke, same family as the other illustrations.
 */
export function Calendar({ className }: { className?: string }) {
  const cells = Array.from({ length: 20 }, (_, i) => i);
  const marked = new Set([6, 13]);

  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Calendar with two days marked"
    >
      {/* Body */}
      <rect
        x="4"
        y="8"
        width="64"
        height="60"
        rx="6"
        fill="currentColor"
        opacity="0.06"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Header bar */}
      <path
        d="M4 18 a6 6 0 0 1 6 -6 h52 a6 6 0 0 1 6 6 v3 H4 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Binding rings */}
      <rect x="18" y="4" width="4" height="10" rx="2" fill="currentColor" />
      <rect x="50" y="4" width="4" height="10" rx="2" fill="currentColor" />
      {/* Day grid (5 cols x 4 rows) */}
      {cells.map((i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const cx = 12 + col * 12;
        const cy = 30 + row * 9;
        const isMarked = marked.has(i);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={isMarked ? 3.4 : 2}
            fill={isMarked ? '#22C55E' : 'currentColor'}
            opacity={isMarked ? 1 : 0.3}
          />
        );
      })}
    </svg>
  );
}
