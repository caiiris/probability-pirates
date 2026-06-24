import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { Wordmark } from '@/components/Brandmark';
import { FlameIcon, BoltIcon } from '@/components/icons/StatIcons';
import { CoinChip } from '@/features/economy/CoinChip';
import { DefaultAvatar } from '@/features/profile/DefaultAvatar';
import { LevelBadge } from '@/features/profile/LevelBadge';
import { levelFromXp } from '@/lib/levels';

/**
 * The persistent app bar shown on every chromed (non-immersive) route. It keeps
 * the habit-loop signals — streak, XP, level, and the coin wallet — in view
 * everywhere, and makes the store reachable from any page via the coin chip. The
 * avatar is the user's actual identity mark (not a generic icon) and links to the
 * profile, where the full rank + progress-to-next-level lives.
 *
 * Layout: three zones — brand (mobile) on the left, the centered level-progress
 * bar in the middle, and the habit-loop stat cluster (streak, XP on desktop,
 * coins, avatar) on the right. The center bar's rank/remaining labels collapse on
 * narrow screens; on mobile the raw XP pill is dropped to avoid crowding.
 */
export function AppHeader() {
  const auth = useAuth();
  const isMobile = useIsMobile();
  const profile = auth.status === 'authenticated' ? auth.profile : null;

  const streak = profile?.currentStreak ?? 0;
  const xp = profile?.xp ?? 0;
  const coins = profile?.coins ?? 0;
  const name = profile?.displayUsername ?? '';

  const level = levelFromXp(xp);

  const avatar = (
    <Link
      to="/profile"
      aria-label="Your profile"
      className="rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {name ? (
        <DefaultAvatar username={name} size={32} styleId={profile?.avatarStyle} />
      ) : (
        <span className="block h-8 w-8 rounded-full bg-muted" />
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
      {/* Left: brand on mobile only (desktop has it in the sidebar). Fixed width
          so the center bar never slides under it. */}
      {isMobile ? (
        <div className="shrink-0">
          <Wordmark markSize={20} />
        </div>
      ) : null}

      {/* Center: the level progress bar fills the *leftover* space between the
          brand and the stat cluster, so it scales down as the window narrows
          instead of overlapping them. Links to the profile for full rank detail. */}
      <div className="flex min-w-0 flex-1 justify-center">
        <Link
          to="/profile"
          aria-label={`Level ${level.level}, ${level.rank.name} — ${level.xpToNext} XP to level ${level.level + 1}`}
          className="flex w-full min-w-0 max-w-[440px] items-center gap-2.5 rounded-full px-1 py-0.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LevelBadge xp={xp} size={30} />
          <div className="min-w-0 flex-1">
            {/* Labels (rank + remaining) only where there's room. */}
            <div className="mb-1 hidden items-baseline justify-between gap-2 sm:flex">
              <span className="truncate text-xs font-semibold leading-none">
                {level.rank.name}
              </span>
              <span className="num shrink-0 text-[10px] font-medium leading-none text-muted-foreground">
                {level.xpToNext} XP to Lv {level.level + 1}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max(3, Math.round(level.progress * 100))}%`,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${level.tone.base} 55%, white), ${level.tone.base})`,
                }}
              />
            </div>
          </div>
        </Link>
      </div>

      {/* Right: habit-loop stat cluster. Fixed width — the center bar yields to it. */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        <MiniStat
          icon={<FlameIcon className="h-4 w-4" />}
          value={streak}
          dim={streak === 0}
          label={`${streak} day streak`}
        />
        {!isMobile ? (
          <MiniStat
            icon={<BoltIcon className="h-4 w-4" />}
            value={xp.toLocaleString()}
            label={`${xp} XP`}
          />
        ) : null}
        <Link
          to="/store"
          aria-label={`${coins} coins — open store`}
          className="rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CoinChip coins={coins} />
        </Link>
        {avatar}
      </div>
    </header>
  );
}

function MiniStat({
  icon,
  value,
  label,
  dim = false,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  dim?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 shadow-soft ${
        dim ? 'opacity-60' : ''
      }`}
      aria-label={label}
    >
      {icon}
      <span className="num text-sm font-bold leading-none text-foreground">{value}</span>
    </span>
  );
}
