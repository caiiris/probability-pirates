/** Card suit icons — hearts, diamonds, clubs, spades. */
export function CardSuit({ suit, className }: { suit: '♥' | '♦' | '♣' | '♠'; className?: string }) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={suitName(suit)}
      role="img"
    >
      <rect
        x="2"
        y="2"
        width="52"
        height="52"
        rx="8"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.2"
      />
      <text
        x="28"
        y="37"
        textAnchor="middle"
        fontSize="28"
        fill={isRed ? '#FB5E58' : '#211C30'}
        fontFamily="system-ui, sans-serif"
      >
        {suit}
      </text>
    </svg>
  );
}

function suitName(suit: string) {
  switch (suit) {
    case '♥':
      return 'Hearts';
    case '♦':
      return 'Diamonds';
    case '♣':
      return 'Clubs';
    case '♠':
      return 'Spades';
    default:
      return suit;
  }
}
