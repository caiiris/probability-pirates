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
 * Decoration modes (cumulative trim, busy → bare):
 *
 *  - default — the full treasure-map sea: sun, clouds, gulls, flying dice,
 *    sailing ships, wave bands. Used by the home course path.
 *  - `calm` — drops the flying dice for small identity banners (profile,
 *    friends) where the full sky reads as clutter.
 *  - `shipsOnly` — drops everything in the sky (sun, clouds, gulls, dice) and
 *    the wave bands too, leaving just the sea gradient and the sailing fleet.
 *    Used by the auth banner where the chrome should be quiet.
 *
 * Container chrome:
 *
 *  - default — rounded card with border, shadow, and an explicit sea gradient.
 *    Used for the small standalone banners (Profile, Friends, Store, Auth)
 *    that sit on a non-blue page bg and need a visible card boundary.
 *  - `seamless` — drops the border, shadow, rounded corners, and explicit
 *    background so the scene blends directly into the surrounding page bg.
 *    Used by the Home course path where the page itself already paints the
 *    same gradient and a card boundary would read as a redundant frame.
 */
type Props = {
  children: ReactNode;
  calm?: boolean;
  shipsOnly?: boolean;
  seamless?: boolean;
};
export function OceanScene({
  children,
  calm = false,
  shipsOnly = false,
  seamless = false,
}: Props) {
  // Seamless mode: inherit the parent's gradient (no own background, no card
  // chrome). All the decorative absolute-positioned elements below stay
  // anchored to this relative container regardless of mode.
  const containerClass = seamless
    ? 'relative overflow-hidden'
    : 'relative overflow-hidden rounded-3xl border border-[color:var(--info)]/15 shadow-soft';
  const containerStyle: React.CSSProperties | undefined = seamless
    ? undefined
    : {
        // Unified sky→sea gradient — matches the HomePage page-bg gradient
        // so the OceanScene card and the page background read as one continuous
        // ocean (no visible seam between them). Slightly lighter than the
        // earlier "deep ocean" version so the bottom doesn't compete with
        // legibility of lesson nodes/labels.
        background:
          'linear-gradient(180deg, #EAF5FF 0%, #CCE6FB 30%, #9DCDF0 65%, #74B5E0 100%)',
      };
  return (
    <div className={containerClass} style={containerStyle}>
      {/* sun */}
      {!shipsOnly && (
        <div
          className="pointer-events-none absolute right-6 top-6 h-12 w-12 rounded-full"
          style={{ background: '#FCD988', boxShadow: '0 0 0 8px rgb(252 217 136 / 0.3)' }}
          aria-hidden="true"
        />
      )}

      {/* Drifting clouds — bigger and spread down the whole sea (was three
          clouds clustered at the top, all small). Top three keep absolute-pixel
          positioning so they anchor near the sky; the lower three use percent
          offsets so they distribute through the tall scroll area. Clouds are
          pointer-events-none and aria-hidden — fine for them to drift behind
          lesson nodes and chapter banners; they're clouds. */}
      {!shipsOnly && (
        <>
          <Cloud className="absolute left-6 top-10 w-28 opacity-90" duration={26} drift={40} />
          <Cloud
            className="absolute right-10 top-24 w-20 opacity-85"
            duration={32}
            drift={-30}
            delay={4}
          />
          <Cloud
            className="absolute left-1/4 top-44 w-24 opacity-80"
            duration={38}
            drift={50}
            delay={8}
          />
          {/* Lower clouds — use pixel offsets (not percentages) so they sit a
              short distance below the top sky band rather than spreading
              proportionally through a very tall page. */}
          <Cloud
            className="absolute right-[8%] w-32 opacity-70"
            style={{ top: 220 }}
            duration={44}
            drift={-45}
            delay={2}
          />
          <Cloud
            className="absolute left-[10%] w-28 opacity-65"
            style={{ top: 360 }}
            duration={36}
            drift={55}
            delay={6}
          />
          <Cloud
            className="absolute right-[20%] w-36 opacity-60"
            style={{ top: 520 }}
            duration={50}
            drift={-40}
            delay={1}
          />
        </>
      )}

      {/* seagulls */}
      {!shipsOnly && <Gulls className="absolute left-1/2 top-16 -translate-x-1/2" />}

      {/* flying dice up in the sky band (above the first banner), spread out and
          clear of the sun (top-right) and gulls (top-center). Dice further down
          the voyage live in the path itself (see CoursePath) so they stay
          visible at any width rather than hiding in the margins. Dropped in
          `calm` mode (identity banners) and `shipsOnly` mode (auth) to declutter. */}
      {!calm && !shipsOnly && (
        <>
          <SkyDie
            className="absolute left-[13%]"
            style={{ top: 10 }}
            accent="amber"
            pips={5}
            size={28}
            delay={0}
          />
          <SkyDie
            className="absolute left-[45%]"
            style={{ top: 40 }}
            accent="violet"
            pips={3}
            size={23}
            delay={0.9}
          />
          <SkyDie
            className="absolute left-[78%]"
            style={{ top: 12 }}
            accent="teal"
            pips={2}
            size={22}
            delay={1.6}
          />
        </>
      )}

      {/* pirate fleet — auth banner keeps ships low in the water so the centered
          logo/wordmark stays clear; course path spreads them down the voyage. */}
      {(shipsOnly ? SHIPS_AUTH : SHIPS).map((s, i) => (
        <Ship key={i} {...s} />
      ))}

      {/* foam wave bands — also dropped in shipsOnly so the auth banner reads
          as a quiet sea, not a full kinetic scene. Opacity bumped since the
          unified lighter page gradient (D109) gave white waves much less
          contrast to play with than the deeper-bottom OceanScene card. */}
      {!shipsOnly && (
        <>
          <WaveBand
            className="absolute left-0 right-0"
            style={{ top: '38%' }}
            color="#FFFFFF"
            opacity={0.75}
            duration={18}
          />
          <WaveBand
            className="absolute left-0 right-0"
            style={{ top: '64%' }}
            color="#FFFFFF"
            opacity={0.65}
            duration={22}
            reverse
          />
          <WaveBand
            className="absolute left-0 right-0"
            style={{ top: '86%' }}
            color="#FFFFFF"
            opacity={0.55}
            duration={26}
          />
        </>
      )}

      {/* Content slot. Course path needs top padding to clear sky art; the auth
          banner (`shipsOnly`) centers its logo + wordmark in the sea instead. */}
      <div
        className={
          shipsOnly
            ? 'relative z-10 flex min-h-44 flex-col items-center justify-center px-4 py-6'
            : 'relative z-10 px-2 pt-24 pb-8'
        }
      >
        {children}
      </div>
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

// Inset values shrunk (was 6/5/9) so the ships hug the page edges further
// from the path — they're ambient decor, shouldn't pull attention from the
// route. Sizes bumped (was 54/46/58) so they read at the larger distance.
const SHIPS: ShipConfig[] = [
  { top: '34%', side: 'left', inset: 2, size: 64, duration: 22, delay: 0 },
  { top: '58%', side: 'right', inset: 2, size: 56, duration: 26, delay: 3 },
  { top: '82%', side: 'left', inset: 4, size: 68, duration: 24, delay: 1.5 },
];

/** Lower, smaller fleet for the compact auth banner — stays out of the centered logo. */
const SHIPS_AUTH: ShipConfig[] = [
  { top: '68%', side: 'left', inset: 4, size: 44, duration: 22, delay: 0 },
  { top: '74%', side: 'right', inset: 4, size: 40, duration: 26, delay: 2 },
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
  style,
  duration,
  drift,
  delay = 0,
}: {
  className?: string;
  style?: React.CSSProperties;
  duration: number;
  drift: number;
  delay?: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 64 28"
      className={className}
      style={style}
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
      <svg
        viewBox="0 0 60 20"
        className="w-16 text-[color:var(--ink-soft)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
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
