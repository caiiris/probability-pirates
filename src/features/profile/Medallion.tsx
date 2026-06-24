import { motion } from 'framer-motion';
import { ACCENTS, type AccentName } from '@/lib/theme';
import { Emblem, type EmblemName } from './Emblem';

export type Tone = AccentName | 'bronze' | 'silver' | 'gold';

type Swatch = { base: string; deep: string; soft: string };

const METALS: Record<'bronze' | 'silver' | 'gold', Swatch> = {
  bronze: { base: '#CB7B3D', deep: '#8A4B22', soft: '#F4E2D0' },
  silver: { base: '#AEB6C6', deep: '#7C8494', soft: '#EEF0F5' },
  gold: { base: '#F2A93B', deep: '#B45309', soft: '#FCEFD4' },
};

export function toneSwatch(tone: Tone): Swatch {
  if (tone in METALS) return METALS[tone as keyof typeof METALS];
  const a = ACCENTS[tone as AccentName];
  return { base: a.base, deep: a.deep, soft: a.soft };
}

type Props = {
  emblem: EmblemName;
  tone: Tone;
  earned: boolean;
  /** small number badge (e.g. streak day count) */
  badge?: number;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
};

/** A collectible "treasure medallion": coin disc + unique emblem, with a tactile
 *  bottom edge. Earned ones are full color with a shine; locked ones are a quiet
 *  ghost so there's something to chase. */
export function Medallion({ emblem, tone, earned, badge, size = 64, onClick, ariaLabel }: Props) {
  const s = toneSwatch(tone);
  const depth = Math.round(size * 0.07);

  const disc: React.CSSProperties = earned
    ? { background: s.base, boxShadow: `0 ${depth}px 0 ${s.deep}` }
    : { background: 'var(--fill)', boxShadow: `0 ${depth}px 0 var(--line-strong)` };

  const Comp = onClick ? motion.button : motion.div;

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, ...disc }}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { y: depth, scale: 0.96 } : undefined}
      transition={{ duration: 0.16 }}
    >
      {/* inner ring */}
      <span
        className="absolute inset-1 rounded-full"
        style={{
          boxShadow: earned ? `inset 0 0 0 2px ${s.soft}66` : 'inset 0 0 0 2px rgb(0 0 0 / 0.04)',
        }}
        aria-hidden="true"
      />
      {/* shine */}
      {earned ? (
        <span
          className="pointer-events-none absolute left-2 top-1.5 h-3 w-4 rounded-full bg-white/45 blur-[1px]"
          aria-hidden="true"
        />
      ) : null}

      <span
        className="relative grid place-items-center"
        style={{
          width: size * 0.52,
          height: size * 0.52,
          color: earned ? '#ffffff' : '#A8A4B5',
        }}
      >
        <Emblem name={emblem} className="h-full w-full" />
      </span>

      {badge !== undefined ? (
        <span
          className="absolute -bottom-1 -right-1 grid min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-card"
          style={{ background: earned ? s.deep : 'var(--ink-soft)' }}
        >
          {badge}
        </span>
      ) : null}
    </Comp>
  );
}
