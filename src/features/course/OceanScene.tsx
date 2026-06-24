import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PirateShip } from '@/components/illustrations/PirateShip';
import { FlyingDie } from '@/features/course/FlyingDie';
import type { AccentName } from '@/lib/theme';

/**
 * A treasure-map sea that the course path sails across. Soft enough that dark
 * node labels stay readable; all the ambient motion (waves, clouds, gulls, ship)
 * is decorative and reduced-motion-safe via the global MotionConfig.
 */
/**
 * `calm` trims the busiest decoration (the flying dice) for the small identity
 * banners (profile, friends) where the full sky reads as clutter. The course
 * path keeps the full scene.
 */
export function OceanScene({ children, calm = false }: { children: ReactNode; calm?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-[color:var(--info)]/15 shadow-soft"
      style={{
        background:
          'linear-gradient(180deg, #EAF5FF 0%, #CFE9FF 26%, #B3DDFF 60%, #9ED2FB 100%)',
      }}
    >
      {/* sun */}
      <div
        className="pointer-events-none absolute right-6 top-6 h-12 w-12 rounded-full"
        style={{ background: '#FCD988', boxShadow: '0 0 0 8px rgb(252 217 136 / 0.3)' }}
        aria-hidden="true"
      />

      {/* drifting clouds */}
      <Cloud className="absolute left-6 top-10 w-20 opacity-90" duration={26} drift={40} />
      <Cloud className="absolute right-10 top-24 w-14 opacity-80" duration={32} drift={-30} delay={4} />
      <Cloud className="absolute left-1/4 top-44 w-16 opacity-75" duration={38} drift={50} delay={8} />

      {/* seagulls */}
      <Gulls className="absolute left-1/2 top-16 -translate-x-1/2" />

      {/* flying dice up in the sky band (above the first banner), spread out and
          clear of the sun (top-right) and gulls (top-center). Dice further down
          the voyage live in the path itself (see CoursePath) so they stay
          visible at any width rather than hiding in the margins. Dropped in
          `calm` mode (identity banners) to declutter the small card. */}
      {!calm && (
        <>
          <SkyDie className="absolute left-[13%]" style={{ top: 10 }} accent="amber" pips={5} size={28} delay={0} />
          <SkyDie className="absolute left-[45%]" style={{ top: 40 }} accent="violet" pips={3} size={23} delay={0.9} />
          <SkyDie className="absolute left-[78%]" style={{ top: 12 }} accent="teal" pips={2} size={22} delay={1.6} />
        </>
      )}

      {/* pirate fleet sailing the sea: kept to the side margins (behind the path)
          so the ships sit on open water and never sail across the lesson islands.
          Distributed down the voyage so the longer course still feels populated. */}
      {SHIPS.map((s, i) => (
        <Ship key={i} {...s} />
      ))}

      {/* foam wave bands */}
      <WaveBand className="absolute left-0 right-0" style={{ top: '38%' }} color="#FFFFFF" opacity={0.4} duration={18} />
      <WaveBand className="absolute left-0 right-0" style={{ top: '64%' }} color="#FFFFFF" opacity={0.32} duration={22} reverse />
      <WaveBand className="absolute left-0 right-0" style={{ top: '86%' }} color="#FFFFFF" opacity={0.28} duration={26} />

      {/* the path itself — extra top room keeps the first chapter banner clear
          of the sky decorations (sun, clouds, gulls, flying dice) above it */}
      <div className="relative z-10 px-2 pt-24 pb-8">{children}</div>
    </div>
  );
}

// A few galleons spread down the voyage. `top` is a fraction of the (tall)
// scene height so ships fan out across the whole sea rather than clustering;
// all stay below the fixed sky band up top. `side`/`inset` pin them to the
// margins. Sizes/timings vary so the fleet never moves in lockstep.
type ShipConfig = {
  top: string;
  side: 'left' | 'right';
  inset: number;
  size: number;
  duration: number;
  delay: number;
};

const SHIPS: ShipConfig[] = [
  { top: '34%', side: 'left', inset: 6, size: 54, duration: 22, delay: 0 },
  { top: '58%', side: 'right', inset: 5, size: 46, duration: 26, delay: 3 },
  { top: '82%', side: 'left', inset: 9, size: 58, duration: 24, delay: 1.5 },
];

function Ship({ top, side, inset, size, duration, delay }: ShipConfig) {
  // Right-side ships face left (mirrored) so they look like they're sailing
  // toward the route rather than away from it.
  const flip = side === 'right';
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ top, width: size, [side]: `${inset}%` }}
      aria-hidden="true"
      // Gentle figure-eight: horizontal sway runs at twice the rate of the
      // vertical loop, tracing a sideways "8" as the ship sails in place.
      animate={{
        x: [0, 7, 0, -7, 0, 7, 0, -7, 0],
        y: [0, -10, -15, -10, 0, 10, 15, 10, 0],
        rotate: [-3, 0, 3, 0, -3, 0, 3, 0, -3],
      }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <PirateShip className="w-full" style={flip ? { transform: 'scaleX(-1)' } : undefined} />
    </motion.div>
  );
}

function SkyDie({
  className,
  style,
  accent,
  pips,
  size,
  delay,
}: {
  className?: string;
  style?: React.CSSProperties;
  accent: AccentName;
  pips: number;
  size: number;
  delay: number;
}) {
  return (
    <div className={className} style={style} aria-hidden="true">
      <FlyingDie accent={accent} pips={pips} size={size} delay={delay} />
    </div>
  );
}

function Cloud({
  className,
  duration,
  drift,
  delay = 0,
}: {
  className?: string;
  duration: number;
  drift: number;
  delay?: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 64 28"
      className={className}
      fill="#FFFFFF"
      aria-hidden="true"
      animate={{ x: [0, drift, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <ellipse cx="20" cy="18" rx="14" ry="9" />
      <ellipse cx="34" cy="14" rx="13" ry="11" />
      <ellipse cx="46" cy="19" rx="13" ry="8" />
      <rect x="14" y="18" width="38" height="8" rx="4" />
    </motion.svg>
  );
}

function Gulls({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      aria-hidden="true"
      animate={{ x: [-20, 20, -20], y: [0, -4, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 60 20" className="w-16 text-[color:var(--ink-soft)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 10 Q9 4 14 10 Q19 4 24 10" />
        <path d="M34 13 Q38 8 42 13 Q46 8 50 13" opacity="0.7" />
      </svg>
    </motion.div>
  );
}

function WaveBand({
  className,
  style,
  color,
  opacity,
  duration,
  reverse = false,
}: {
  className?: string;
  style?: React.CSSProperties;
  color: string;
  opacity: number;
  duration: number;
  reverse?: boolean;
}) {
  return (
    <div className={className} style={style} aria-hidden="true">
      <motion.svg
        viewBox="0 0 240 12"
        preserveAspectRatio="none"
        className="w-[200%] h-3"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ opacity }}
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        <path d="M0 6 Q 15 0 30 6 T 60 6 T 90 6 T 120 6 T 150 6 T 180 6 T 210 6 T 240 6" />
      </motion.svg>
    </div>
  );
}
