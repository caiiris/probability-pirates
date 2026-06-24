import { useAnimationControls, motion } from 'framer-motion';
import { ACCENTS, type AccentName } from '@/lib/theme';

/**
 * A magical decorative d6 that comes in two flavours of the same creature:
 *  - `flying` (default): little wings, a sparkle, floats up in the sky.
 *  - `swimming`: fins + a forked tail and rising bubbles, wiggles through the
 *    sea — a "fish die" for the watery part of the map.
 * Both share the colored glow aura. It drifts on its own; tapping makes it
 * tumble. Purely decorative (aria-hidden, not focusable).
 */

type Variant = 'flying' | 'swimming';

type Props = {
  accent: AccentName;
  /** which pip face (1–6) to show */
  pips?: number;
  size?: number;
  /** stagger the drift so a flock doesn't move in lockstep */
  delay?: number;
  /** sky creature (wings) vs sea creature (fins + tail) */
  variant?: Variant;
};

const PIP_LAYOUT: Record<number, Array<[number, number]>> = {
  1: [[12, 12]],
  2: [[7, 7], [17, 17]],
  3: [[7, 7], [12, 12], [17, 17]],
  4: [[7, 7], [17, 7], [7, 17], [17, 17]],
  5: [[7, 7], [17, 7], [12, 12], [7, 17], [17, 17]],
  6: [[7, 6], [17, 6], [7, 12], [17, 12], [7, 18], [17, 18]],
};

export function FlyingDie({ accent, pips = 5, size = 34, delay = 0, variant = 'flying' }: Props) {
  const controls = useAnimationControls();
  const c = ACCENTS[accent];
  const dots = PIP_LAYOUT[pips] ?? PIP_LAYOUT[5];
  const swimming = variant === 'swimming';

  function tumble() {
    controls.start({
      rotate: [0, 360],
      scale: [1, 1.3, 1],
      transition: { duration: 0.7, ease: 'easeOut' },
    });
  }

  // Sky creatures bob straight up; sea creatures wiggle side-to-side like a fish.
  const drift = swimming
    ? { x: [0, 5, 0, -5, 0], y: [0, -2, 0, 2, 0], rotate: [-5, 0, 5, 0, -5] }
    : { y: [0, -7, 0], x: [0, 3, 0] };

  return (
    <motion.div
      aria-hidden="true"
      onPointerDown={tumble}
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size, lineHeight: 0 }}
      animate={drift}
      transition={{ duration: swimming ? 5 : 4, repeat: Infinity, ease: 'easeInOut', delay }}
      whileHover={{ scale: 1.15 }}
    >
      {/* glow aura */}
      <span
        className="absolute inset-0 rounded-full blur-md"
        style={{ background: c.base, opacity: 0.35, transform: 'scale(1.1)' }}
      />

      {swimming ? (
        /* rising bubbles */
        <>
          <motion.span
            className="absolute rounded-full border border-white/70"
            style={{ width: size * 0.16, height: size * 0.16, right: size * 0.04, top: size * 0.1 }}
            animate={{ y: [2, -size * 0.55], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: delay + 0.2 }}
          />
          <motion.span
            className="absolute rounded-full border border-white/70"
            style={{ width: size * 0.11, height: size * 0.11, right: size * 0.16, top: size * 0.18 }}
            animate={{ y: [2, -size * 0.45], opacity: [0, 0.8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: delay + 1.1 }}
          />
        </>
      ) : (
        /* twinkle */
        <motion.span
          className="absolute -right-1 -top-1 text-white"
          style={{ width: size * 0.4, height: size * 0.4 }}
          animate={{ scale: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4], rotate: [0, 30, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.3 }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ filter: `drop-shadow(0 0 2px ${c.base})` }}>
            <path d="M12 2c.6 4.7 1.5 5.6 6 6-4.5.4-5.4 1.3-6 6-.6-4.7-1.5-5.6-6-6 4.5-.4 5.4-1.3 6-6Z" />
          </svg>
        </motion.span>
      )}

      <motion.svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        animate={controls}
        className="relative"
        style={{ display: 'block', filter: 'drop-shadow(0 3px 4px rgb(33 28 48 / 0.25))' }}
      >
        {swimming ? (
          /* fins + forked tail: a die-fish */
          <>
            <path d="M5 12 L -3 6 L -0.5 12 L -3 18 Z" fill={c.base} opacity="0.9" />
            <path d="M9 4.5 L 12 0.5 L 14.5 4.5 Z" fill={c.base} opacity="0.8" />
            <path d="M9 19.5 L 12 23.5 L 14.5 19.5 Z" fill={c.base} opacity="0.8" />
          </>
        ) : (
          /* wings */
          <>
            <path d="M3 12 C -2 8 -1 16 4 15 Z" fill="#FFFFFF" opacity="0.9" />
            <path d="M21 12 C 26 8 25 16 20 15 Z" fill="#FFFFFF" opacity="0.9" />
          </>
        )}
        {/* die body */}
        <rect x="4" y="4" width="16" height="16" rx="4.5" fill="#FFFFFF" stroke={c.deep} strokeWidth="1.4" />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.5" fill={c.base} />
        ))}
      </motion.svg>
    </motion.div>
  );
}

/** A die that swims like a fish — for the watery stretches of the map. */
export function FishDie(props: Omit<Props, 'variant'>) {
  return <FlyingDie {...props} variant="swimming" />;
}
