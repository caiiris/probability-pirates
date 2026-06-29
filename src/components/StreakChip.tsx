/**
 * StreakChip — header-bar streak counter that scales its visual intensity with
 * streak length. Replaces the generic MiniStat for streaks so the difference
 * between a 3-day and a 30-day streak is felt at a glance, not just read.
 *
 * Three tiers (chosen for the natural "first week / first month / serious"
 * thresholds the habit loop already targets):
 *
 *   mild   (1–6 days)  — quiet card, regular flame icon
 *   warm   (7–29 days) — amber-tinted card + slightly larger icon
 *   roaring (30+)      — amber border + soft glow + flame flicker animation
 *
 * Returns null when streak is 0 (no chip in the header at all — matches the
 * existing AppHeader contract).
 */

import { FlameIcon } from '@/components/icons/StatIcons';

type Tier = 'mild' | 'warm' | 'roaring';

function tierFor(streak: number): Tier {
  if (streak >= 30) return 'roaring';
  if (streak >= 7) return 'warm';
  return 'mild';
}

const CHIP_STYLES: Record<Tier, string> = {
  mild: 'border-border bg-card',
  warm: 'border-[color:var(--amber-base)]/30 bg-[color:var(--amber-soft)]/60',
  roaring:
    'border-[color:var(--amber-base)]/50 bg-[color:var(--amber-soft)]/80 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
};

const ICON_SIZES: Record<Tier, string> = {
  mild: 'h-4 w-4',
  warm: 'h-[18px] w-[18px]',
  roaring: 'h-5 w-5 streak-flicker',
};

const NUMBER_COLORS: Record<Tier, string> = {
  mild: 'text-foreground',
  warm: 'text-[color:var(--amber-deep)]',
  roaring: 'text-[color:var(--amber-deep)]',
};

export function StreakChip({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  const tier = tierFor(streak);

  return (
    <span
      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 shadow-soft ${CHIP_STYLES[tier]}`}
      aria-label={`${streak} day streak`}
      title={`${streak} day streak`}
    >
      <FlameIcon className={ICON_SIZES[tier]} />
      <span className={`text-sm font-bold leading-none ${NUMBER_COLORS[tier]}`}>{streak}</span>
    </span>
  );
}
