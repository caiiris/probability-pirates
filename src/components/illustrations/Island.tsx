type Props = {
  className?: string;
  /** show a little palm tree on the side */
  palm?: boolean;
};

const SAND = '#F4D29A';
const SAND_DEEP = '#DDA85F';
const SAND_LINE = '#C8924A';
const FOAM = '#FFFFFF';
const TRUNK = '#A05A1E';
const LEAF = '#22C55E';
const LEAF_DEEP = '#15803D';
const GRASS = '#2EBE63';

/** A chunky sandy island that a lesson marker sits on. Decorative. */
export function Island({ className, palm = false }: Props) {
  return (
    <svg
      viewBox="0 0 140 72"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* foam ring on the water */}
      <ellipse cx="70" cy="54" rx="64" ry="14" fill={FOAM} opacity="0.6" />
      {/* wet sand */}
      <ellipse cx="70" cy="51" rx="55" ry="12" fill={SAND_DEEP} />
      {/* sand mound */}
      <path d="M16 51 Q70 4 124 51 Z" fill={SAND} />
      <path d="M16 51 Q70 4 124 51" fill="none" stroke={SAND_LINE} strokeWidth="2" opacity="0.45" />

      {/* little grass tufts on the crown */}
      <path
        d="M60 22 q2 -7 4 0"
        stroke={GRASS}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M66 20 q2 -8 4 0"
        stroke={GRASS}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {palm ? (
        <g>
          <path
            d="M98 50 C 95 32 98 24 101 18"
            stroke={TRUNK}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M101 17 C 90 11 82 12 76 17 C 87 15 95 16 101 20 Z" fill={LEAF} />
          <path d="M101 17 C 112 11 120 12 126 17 C 115 15 107 16 101 20 Z" fill={LEAF_DEEP} />
          <path d="M101 16 C 98 7 101 3 106 1 C 101 7 103 13 102 19 Z" fill={LEAF} />
        </g>
      ) : null}
    </svg>
  );
}
