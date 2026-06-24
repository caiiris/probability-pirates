/** Flat coin illustration — two sides, H and T. */
export function Coin({ side, className }: { side?: 'H' | 'T'; className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={side ? (side === 'H' ? 'Heads' : 'Tails') : 'Coin'}
      role="img"
    >
      <circle cx="28" cy="28" r="24" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="2" />
      <circle cx="28" cy="28" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {side && (
        <text
          x="28"
          y="34"
          textAnchor="middle"
          fontSize="16"
          fontWeight="600"
          fill="currentColor"
          fontFamily="system-ui, sans-serif"
        >
          {side}
        </text>
      )}
    </svg>
  );
}
