type Props = { className?: string };

const SAND = '#F4D29A';
const SAND_DEEP = '#DDA85F';
const FOAM = '#FFFFFF';
const GRASS = '#2EBE63';
const GRASS_DEEP = '#15803D';
const TRUNK = '#A05A1E';
const LEAF = '#22C55E';
const LEAF_DEEP = '#15803D';

/**
 * The mainland — a wide beach + grass island you reach by finishing the course.
 * Drawn with an open crown so a trophy can be planted on top by the caller.
 */
export function Landmass({ className }: Props) {
  return (
    <svg
      viewBox="0 0 240 130"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* foam */}
      <ellipse cx="120" cy="110" rx="116" ry="18" fill={FOAM} opacity="0.6" />
      {/* wet sand + beach */}
      <ellipse cx="120" cy="104" rx="104" ry="16" fill={SAND_DEEP} />
      <ellipse cx="120" cy="98" rx="96" ry="16" fill={SAND} />
      {/* grass mound */}
      <path d="M34 98 Q120 36 206 98 Z" fill={GRASS} />
      <path
        d="M34 98 Q120 36 206 98"
        fill="none"
        stroke={GRASS_DEEP}
        strokeWidth="2.5"
        opacity="0.4"
      />
      {/* grass highlight */}
      <path
        d="M70 86 Q120 54 170 86"
        fill="none"
        stroke="#5BD587"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* left palm */}
      <g>
        <path d="M52 96 C 47 74 50 62 54 52" stroke={TRUNK} strokeWidth="5" strokeLinecap="round" />
        <path d="M54 50 C 40 42 28 44 20 52 C 36 47 47 49 55 55 Z" fill={LEAF} />
        <path d="M54 50 C 50 36 53 28 60 22 C 52 32 55 44 56 56 Z" fill={LEAF_DEEP} />
        <path d="M54 50 C 68 44 80 46 88 54 C 72 49 61 50 55 56 Z" fill={LEAF} />
      </g>
      {/* right palm */}
      <g>
        <path
          d="M192 96 C 197 76 194 64 190 56"
          stroke={TRUNK}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M190 54 C 204 47 214 49 220 57 C 206 52 196 53 189 59 Z" fill={LEAF_DEEP} />
        <path d="M190 54 C 186 40 189 32 196 27 C 188 37 190 48 191 60 Z" fill={LEAF} />
        <path d="M190 54 C 176 48 166 50 159 58 C 174 53 184 54 191 60 Z" fill={LEAF_DEEP} />
      </g>
    </svg>
  );
}
