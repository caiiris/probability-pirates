type Props = { className?: string };

const RING = '#211C30';
const FACE = '#FBF4E4';
const NORTH = '#FB5E58';
const SOUTH = '#FFFFFF';
const NEEDLE_EDGE = '#211C30';
const GOLD = '#E89A2B';

/** A nautical compass rose. Decorative map flourish. */
export function CompassRose({ className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" fill={FACE} stroke={RING} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.7" />

      {/* tick marks */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x1 = 32 + Math.cos(a) * 27;
        const y1 = 32 + Math.sin(a) * 27;
        const x2 = 32 + Math.cos(a) * 23;
        const y2 = 32 + Math.sin(a) * 23;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={RING} strokeWidth="1.5" />;
      })}

      {/* E/W needle */}
      <path d="M32 32 L54 32 L32 36 Z" fill={SOUTH} stroke={NEEDLE_EDGE} strokeWidth="1" />
      <path d="M32 32 L10 32 L32 36 Z" fill={SOUTH} stroke={NEEDLE_EDGE} strokeWidth="1" />
      {/* N/S needle */}
      <path d="M32 32 L36 32 L32 8 Z" fill={NORTH} stroke={NEEDLE_EDGE} strokeWidth="1" />
      <path d="M32 32 L28 32 L32 56 Z" fill={SOUTH} stroke={NEEDLE_EDGE} strokeWidth="1" />

      <circle cx="32" cy="32" r="3" fill={GOLD} stroke={RING} strokeWidth="1.5" />
    </svg>
  );
}
