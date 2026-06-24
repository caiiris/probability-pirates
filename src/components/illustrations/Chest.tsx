type Props = {
  open?: boolean;
  className?: string;
};

const GOLD = '#E89A2B';
const GOLD_DEEP = '#B45309';
const GOLD_LIGHT = '#FCD988';

/**
 * A treasure chest that swings open. Gold (amber ramp) so it reads as "reward"
 * regardless of the chapter accent. The lid hinges on its back-left corner.
 */
export function Chest({ open = false, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="57" rx="21" ry="3.4" fill="#211C30" opacity="0.12" />

      {/* spilling treasure — only when open */}
      <g
        style={{
          opacity: open ? 1 : 0,
          transition: 'opacity .3s ease .12s',
        }}
      >
        <circle cx="22" cy="21" r="3.4" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.4" />
        <circle cx="42" cy="19" r="3.4" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.4" />
        <circle cx="32" cy="14" r="3.8" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.4" />
        <rect
          x="28.5"
          y="23.5"
          width="6.5"
          height="6.5"
          rx="1.4"
          transform="rotate(18 32 27)"
          fill="currentColor"
        />
      </g>

      {/* body */}
      <rect x="12" y="31" width="40" height="23" rx="5" fill={GOLD} />
      <rect x="12" y="31" width="40" height="6" fill={GOLD_DEEP} opacity="0.55" />
      <rect x="17" y="37" width="4" height="17" fill={GOLD_DEEP} opacity="0.6" />
      <rect x="43" y="37" width="4" height="17" fill={GOLD_DEEP} opacity="0.6" />

      {/* lock */}
      <rect x="27.5" y="35.5" width="9" height="10" rx="2" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.2" />
      <circle cx="32" cy="39.5" r="1.4" fill={GOLD_DEEP} />
      <rect x="31.2" y="40" width="1.6" height="3.6" rx="0.8" fill={GOLD_DEEP} />

      {/* lid — hinges on its back-left corner at (12,31) */}
      <g
        style={{
          transformOrigin: '12px 31px',
          transform: open ? 'rotate(-38deg)' : 'rotate(0deg)',
          transition: 'transform .4s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <path
          d="M12 31 v-5 a20 13 0 0 1 40 0 v5 z"
          fill={GOLD}
        />
        <path
          d="M12 31 v-5 a20 13 0 0 1 40 0 v5"
          fill="none"
          stroke={GOLD_DEEP}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <rect x="12" y="27.5" width="40" height="3.5" fill={GOLD_LIGHT} />
      </g>
    </svg>
  );
}
