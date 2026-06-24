import { levelFromXp } from '@/lib/levels';

/**
 * A tactile level disc: the level number on a rank-colored coin with a chunky
 * bottom edge, matching the lesson-node / medallion language. Decorative number
 * only — the accessible label carries level + rank.
 */
export function LevelBadge({ xp, size = 40 }: { xp: number; size?: number }) {
  const info = levelFromXp(xp);
  const depth = Math.max(2, Math.round(size * 0.08));

  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold leading-none text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: info.tone.base,
        boxShadow: `0 ${depth}px 0 ${info.tone.deep}`,
      }}
      aria-label={`Level ${info.level}, ${info.rank.name}`}
      title={`Level ${info.level} · ${info.rank.name}`}
    >
      {info.level}
    </span>
  );
}

/**
 * The full rank readout for the profile: level disc + rank name + a
 * progress-to-next-level bar. XP is the source; everything else is derived.
 */
export function RankPanel({ xp }: { xp: number }) {
  const info = levelFromXp(xp);

  return (
    <div className="flex items-center gap-4">
      <LevelBadge xp={xp} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-lg font-bold leading-none tracking-tight">
            {info.rank.name}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            Lv {info.level}
          </p>
        </div>

        {/* Progress to next level — soft → saturated gradient so it doesn't read
            as a harsh flat block. */}
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.max(2, Math.round(info.progress * 100))}%`,
              background: `linear-gradient(90deg, color-mix(in srgb, ${info.tone.base} 55%, white), ${info.tone.base})`,
            }}
          />
        </div>
        <p className="num mt-1.5 text-xs text-muted-foreground">
          {info.xpIntoLevel.toLocaleString()} / {info.xpForLevel.toLocaleString()} XP
          <span className="text-muted-foreground/70">
            {' '}· {info.xpToNext.toLocaleString()} to Level {info.level + 1}
          </span>
        </p>
      </div>
    </div>
  );
}
