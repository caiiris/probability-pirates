type Props = { className?: string; style?: React.CSSProperties };

const HULL = '#8A4B22';
const HULL_DEEP = '#5E3214';
const SAIL = '#FBF4E4';
const SAIL_SHADE = '#ECDFC4';
const MAST = '#6B3F1D';

/** A little cartoon galleon, bobbing on the sea. Decorative. */
export function PirateShip({ className, style }: Props) {
  return (
    <svg
      viewBox="0 0 96 80"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* mast */}
      <rect x="46" y="10" width="3.5" height="46" rx="1.5" fill={MAST} />

      {/* pirate flag */}
      <path d="M49.5 11 h17 l-4 4 l4 4 h-17 z" fill="#211C30" />
      <circle cx="56" cy="15" r="1.6" fill="#FBF4E4" />

      {/* main sail, billowing */}
      <path d="M46 18 C 22 22 22 44 46 48 Z" fill={SAIL} />
      <path d="M46 18 C 34 24 34 42 46 48" stroke={SAIL_SHADE} strokeWidth="1.5" fill="none" />
      {/* foresail */}
      <path d="M49.5 20 C 70 24 70 42 49.5 46 Z" fill={SAIL} />
      <path d="M49.5 20 C 60 26 60 40 49.5 46" stroke={SAIL_SHADE} strokeWidth="1.5" fill="none" />

      {/* hull */}
      <path d="M16 52 h64 l-7 16 a6 6 0 0 1 -5 3 H28 a6 6 0 0 1 -5 -3 Z" fill={HULL} />
      <rect x="16" y="52" width="64" height="6" rx="3" fill={HULL_DEEP} />
      {/* portholes */}
      <circle cx="34" cy="62" r="2.2" fill={SAIL} />
      <circle cx="48" cy="62" r="2.2" fill={SAIL} />
      <circle cx="62" cy="62" r="2.2" fill={SAIL} />
    </svg>
  );
}
