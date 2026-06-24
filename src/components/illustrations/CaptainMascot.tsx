import { ACCENTS } from '@/lib/theme';

type Props = { className?: string };

const FACE = '#F4C99B';
const FACE_SHADE = '#E2A876';
const INK = '#2A2440';
const GOLD = '#F2B23E';

/**
 * Captain Pascal — the app's guide. A friendly navigator in a tricorne hat whose
 * emblem is a tiny Pascal's Triangle (3 gold dots), tying the mathematician
 * (Blaise Pascal) to the pirate world. Flat, on-palette (brand violet hat).
 */
export function CaptainMascot({ className }: Props) {
  const hat = ACCENTS.violet.deep;
  const hatLight = ACCENTS.violet.base;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Captain Pascal"
    >
      {/* face */}
      <circle cx="32" cy="38" r="16" fill={FACE} />
      <path d="M20 48 a16 16 0 0 0 24 0 a16 16 0 0 1 -24 0 Z" fill={FACE_SHADE} opacity="0.5" />

      {/* eyes + smile */}
      <circle cx="26" cy="37" r="2.3" fill={INK} />
      <circle cx="38" cy="37" r="2.3" fill={INK} />
      <path d="M26 44 q6 5 12 0" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* rosy cheeks */}
      <circle cx="22.5" cy="42" r="2.4" fill="#F08E6E" opacity="0.45" />
      <circle cx="41.5" cy="42" r="2.4" fill="#F08E6E" opacity="0.45" />

      {/* tricorne hat */}
      <path
        d="M12 26 C 13 13, 24 9, 32 9 C 40 9, 51 13, 52 26 C 44 21, 20 21, 12 26 Z"
        fill={hat}
      />
      <path d="M10 26 q22 -9 44 0 q-22 7 -44 0 Z" fill={hatLight} />
      <ellipse cx="32" cy="26" rx="22" ry="3.6" fill={hat} opacity="0.35" />

      {/* Pascal's-triangle emblem (1 over 2) */}
      <circle cx="32" cy="15.5" r="1.7" fill={GOLD} />
      <circle cx="28.5" cy="20" r="1.7" fill={GOLD} />
      <circle cx="35.5" cy="20" r="1.7" fill={GOLD} />
    </svg>
  );
}
