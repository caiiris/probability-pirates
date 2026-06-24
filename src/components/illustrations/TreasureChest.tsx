type Props = {
  open?: boolean;
  className?: string;
};

const WOOD = '#8A4B22';
const WOOD_DEEP = '#5E3214';
const GOLD = '#E89A2B';
const GOLD_DEEP = '#B45309';
const GOLD_LIGHT = '#FCD988';
const RUBY = '#E5484D';
const EMERALD = '#30A46C';
const SAPPHIRE = '#3E63DD';
const AMETHYST = '#8E4EC6';

/**
 * The grand, lavish treasure chest that caps the whole voyage — a wide wooden
 * coffer banded in gold with a jeweled lock, brimming with coins and gems and
 * wrapped in a warm glow. The lid swings back to reveal the spilling hoard.
 * Bigger and more ornate than the per-chapter `Chest`. Decorative.
 */
export function TreasureChest({ open = false, className }: Props) {
  return (
    <svg
      viewBox="0 0 96 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="tc-glow" cx="50%" cy="44%" r="55%">
          <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity={open ? 0.95 : 0.45} />
          <stop offset="60%" stopColor={GOLD_LIGHT} stopOpacity={open ? 0.3 : 0.12} />
          <stop offset="100%" stopColor={GOLD_LIGHT} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* warm treasure glow */}
      <ellipse cx="48" cy="40" rx="48" ry="40" fill="url(#tc-glow)" />

      {/* ground shadow */}
      <ellipse cx="48" cy="74" rx="32" ry="4.6" fill="#211C30" opacity="0.14" />

      {/* spilling hoard — drawn behind the body so it pokes out of the top */}
      <g style={{ opacity: open ? 1 : 0, transition: 'opacity .3s ease .16s' }}>
        {/* gold coins */}
        <circle cx="33" cy="40" r="4.2" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.3" />
        <circle cx="63" cy="40" r="4.2" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.3" />
        <circle cx="40" cy="34" r="4" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.3" />
        <circle cx="56" cy="34" r="4" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.3" />
        <circle cx="48" cy="37" r="4.2" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1.3" />
        {/* gems */}
        <rect
          x="44.5"
          y="20"
          width="7"
          height="7"
          rx="1.4"
          transform="rotate(45 48 23.5)"
          fill={RUBY}
          stroke="#fff"
          strokeWidth="0.8"
        />
        <rect
          x="35.5"
          y="26"
          width="6"
          height="6"
          rx="1.2"
          transform="rotate(45 38.5 29)"
          fill={EMERALD}
          stroke="#fff"
          strokeWidth="0.7"
        />
        <rect
          x="55"
          y="26"
          width="6"
          height="6"
          rx="1.2"
          transform="rotate(45 58 29)"
          fill={SAPPHIRE}
          stroke="#fff"
          strokeWidth="0.7"
        />
        <rect
          x="46"
          y="30"
          width="5"
          height="5"
          rx="1"
          transform="rotate(45 48.5 32.5)"
          fill={AMETHYST}
          stroke="#fff"
          strokeWidth="0.7"
        />
        {/* sparkle on the ruby */}
        <circle cx="46.4" cy="22" r="0.9" fill="#fff" />
      </g>

      {/* body */}
      <rect x="16" y="40" width="64" height="30" rx="5" fill={WOOD} />
      <rect x="16" y="40" width="64" height="7" fill={WOOD_DEEP} opacity="0.4" />
      {/* gold bottom band */}
      <rect x="16" y="61" width="64" height="9" rx="4" fill={GOLD} />
      <rect x="16" y="61" width="64" height="3" fill={GOLD_LIGHT} opacity="0.75" />
      {/* vertical gold straps */}
      <rect x="29" y="40" width="5" height="30" fill={GOLD} opacity="0.95" />
      <rect x="62" y="40" width="5" height="30" fill={GOLD} opacity="0.95" />
      {/* jeweled lock */}
      <rect
        x="42"
        y="46"
        width="12"
        height="15"
        rx="2.5"
        fill={GOLD_LIGHT}
        stroke={GOLD_DEEP}
        strokeWidth="1.4"
      />
      <circle cx="48" cy="53" r="3.1" fill={RUBY} stroke={GOLD_DEEP} strokeWidth="1" />
      <rect x="47" y="54.5" width="2" height="4" rx="1" fill={GOLD_DEEP} />

      {/* lid — hinges on the back-left corner at (16,40) */}
      <g
        style={{
          transformOrigin: '16px 40px',
          transform: open ? 'rotate(-40deg)' : 'rotate(0deg)',
          transition: 'transform .45s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <path d="M16 40 v-7 a32 17 0 0 1 64 0 v7 z" fill={WOOD} />
        <path
          d="M16 40 v-7 a32 17 0 0 1 64 0 v7"
          fill="none"
          stroke={GOLD_DEEP}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* gold trim band along the lid base */}
        <rect x="16" y="36" width="64" height="4" fill={GOLD} />
        {/* gold straps continue onto the lid */}
        <rect x="29" y="29" width="5" height="11" fill={GOLD} opacity="0.95" />
        <rect x="62" y="29" width="5" height="11" fill={GOLD} opacity="0.95" />
        {/* center stud */}
        <circle cx="48" cy="29" r="2.6" fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth="1" />
      </g>
    </svg>
  );
}
