import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Coin3D — a CSS-3D fair coin. Click to flip.
 *
 * The flip is the signature: spring rotateY around two backface-hidden
 * faces. The chrome stays restrained — brand-violet two-tone (heads lighter
 * than tails so the flip reads even at small sizes), milled inner ring, soft
 * floor-shadow pinned outside the rotating layer.
 *
 * Decorative. Does not gate any answer state.
 */
type Coin3DProps = {
  initialSide?: 'H' | 'T';
  /** Tailwind sizing classes for the outer button (controls overall diameter). */
  className?: string;
};

export function Coin3D({ initialSide = 'H', className }: Coin3DProps) {
  const [flipped, setFlipped] = useState(false);
  const showingHeads = initialSide === 'H' ? !flipped : flipped;
  const otherSide: 'H' | 'T' = initialSide === 'H' ? 'T' : 'H';

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-label={`Coin showing ${showingHeads ? 'heads' : 'tails'}. Click to flip.`}
      className={cn(
        'group relative inline-flex items-center justify-center bg-transparent border-0 p-0',
        'cursor-pointer touch-manipulation select-none rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      style={{ perspective: '900px' }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{
          rotateY: { type: 'spring', stiffness: 90, damping: 14, mass: 0.8 },
          y: { type: 'spring', stiffness: 300, damping: 20 },
          scale: { type: 'spring', stiffness: 400, damping: 22 },
        }}
      >
        <CoinFace side={initialSide} back={false} />
        <CoinFace side={otherSide} back />
      </motion.div>

      {/* Floor shadow lives outside the rotating layer so it stays put. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2',
          'w-2/3 h-1.5 rounded-full bg-ink/20 blur-md',
          'transition-[width,opacity] duration-200 ease-out',
          'group-hover:w-3/4 group-hover:opacity-80',
        )}
      />
    </button>
  );
}

function CoinFace({ side, back }: { side: 'H' | 'T'; back: boolean }) {
  // Two-tone violet: heads is the lighter wash, tails is the standard primary.
  // The split is intentional — small enough to stay on-palette, large enough
  // that the flip is legible even from the corner of the eye.
  const fill = back
    ? 'radial-gradient(circle at 30% 28%, #8E76FF 0%, #6B4EFF 55%, #3A2A8C 100%)'
    : 'radial-gradient(circle at 30% 28%, #B7A7FF 0%, #8167FF 55%, #4F36AB 100%)';

  return (
    <div
      className="absolute inset-0 rounded-full flex items-center justify-center"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
        background: fill,
        // Layered: bottom inset = darker rim, top inset = highlight, outer = drop.
        boxShadow:
          'inset 0 -3px 6px rgba(0,0,0,0.28), inset 0 3px 5px rgba(255,255,255,0.38), 0 6px 14px rgba(33,28,48,0.22)',
      }}
    >
      {/* Milled ring */}
      <div
        aria-hidden
        className="absolute inset-[9%] rounded-full"
        style={{
          border: '1.5px solid rgba(255,255,255,0.32)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
        }}
      />
      {/* Stamped letter */}
      <span
        className="font-display font-bold text-white relative leading-none"
        style={{
          fontSize: '46%',
          textShadow: '0 1px 2px rgba(0,0,0,0.40), 0 0 10px rgba(255,255,255,0.18)',
          letterSpacing: '-0.02em',
        }}
      >
        {side}
      </span>
    </div>
  );
}
