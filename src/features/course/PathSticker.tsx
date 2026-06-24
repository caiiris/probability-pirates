import { useAnimationControls, motion } from 'framer-motion';
import { ACCENTS, type AccentName } from '@/lib/theme';

/**
 * Purely decorative doodles that live in the empty gaps beside the course path.
 * They do nothing functional — tap to make them bounce, that's the whole point.
 *
 * Accessibility: these carry no meaning, so the wrapper is aria-hidden and not
 * keyboard-focusable. We don't want screen-reader / keyboard users wading through
 * a row of buttons that lead nowhere.
 */

export type StickerKind = 'sparkle' | 'star' | 'comet' | 'clover' | 'die';

const SHAPES: Record<StickerKind, React.ReactNode> = {
  sparkle: (
    <path d="M12 2c.6 4.7 1.5 5.6 6 6-4.5.4-5.4 1.3-6 6-.6-4.7-1.5-5.6-6-6 4.5-.4 5.4-1.3 6-6Z" />
  ),
  star: (
    <path d="M12 3l2.5 5 5.5.7-4 3.8 1 5.5L12 15.9 7.5 18 8.5 12.5l-4-3.8 5.5-.7L12 3Z" />
  ),
  comet: (
    <g>
      <circle cx="15" cy="9" r="4" />
      <path
        d="M11 13L4 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
  ),
  clover: (
    <g>
      <circle cx="9" cy="9" r="3.8" />
      <circle cx="15" cy="9" r="3.8" />
      <circle cx="9" cy="15" r="3.8" />
      <circle cx="15" cy="15" r="3.8" />
    </g>
  ),
  die: (
    <g>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="9" cy="9" r="1.5" fill="#fff" />
      <circle cx="15" cy="9" r="1.5" fill="#fff" />
      <circle cx="9" cy="15" r="1.5" fill="#fff" />
      <circle cx="15" cy="15" r="1.5" fill="#fff" />
    </g>
  ),
};

type Props = {
  kind: StickerKind;
  accent: AccentName;
  /** size in px; defaults to a small 26 */
  size?: number;
  /** stagger the idle float so a row of stickers doesn't bob in lockstep */
  delay?: number;
};

export function PathSticker({ kind, accent, size = 26, delay = 0 }: Props) {
  const controls = useAnimationControls();
  const color = ACCENTS[accent].base;

  function boing() {
    controls.start({
      rotate: [0, -14, 12, -7, 6, 0],
      scale: [1, 1.28, 1.05, 1.18, 1],
      transition: { duration: 0.6, ease: 'easeOut' },
    });
  }

  return (
    <motion.div
      aria-hidden="true"
      onPointerDown={boing}
      className="cursor-pointer select-none"
      style={{ width: size, height: size, color, lineHeight: 0 }}
      // gentle idle float so the doodles feel alive without demanding attention
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay }}
      whileHover={{ scale: 1.12, rotate: -6 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        animate={controls}
        style={{ display: 'block' }}
      >
        {SHAPES[kind]}
      </motion.svg>
    </motion.div>
  );
}
