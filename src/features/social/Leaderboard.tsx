import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { DefaultAvatar } from '@/features/profile/DefaultAvatar';
import { CompassRose } from '@/components/illustrations/CompassRose';
import { track } from '@/lib/analytics';
import { useLeaderboard } from './useLeaderboard';

// Gold / silver / bronze for the podium; everyone else gets a plain rank chip.
const MEDAL_COLORS: Record<number, { base: string; deep: string }> = {
  1: { base: '#F2A93B', deep: '#B45309' },
  2: { base: '#AFB6C4', deep: '#7C8494' },
  3: { base: '#CB7B3D', deep: '#8A4B22' },
};

function RankBadge({ rank }: { rank: number }) {
  const medal = MEDAL_COLORS[rank];
  if (medal) {
    return (
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
        style={{ background: medal.base, boxShadow: `0 2.5px 0 ${medal.deep}` }}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

export function Leaderboard({ myUid }: { myUid: string }) {
  const state = useLeaderboard(myUid);

  useEffect(() => {
    if (state.status === 'ready') {
      track('leaderboard_view', { friend_count: state.friendCount });
    }
  }, [state]);

  if (state.status === 'loading') {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state.friendCount === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--info)]/25 bg-[color:var(--info)]/5 px-4 py-3 text-sm text-muted-foreground">
          <CompassRose className="w-10 shrink-0" />
          <span>
            Follow other learners to start the leaderboard. XP resets every
            Monday, so everyone gets a fresh start.
          </span>
        </div>
      )}

      {/* Rows are a quiet vertical list; only the learner's own row carries the
          shadow + tint so the eye lands there first instead of skimming a
          stack of identical cards. */}
      <ol className="space-y-1.5">
        {state.entries.map((e) => {
          const row = (
            <div
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors
                ${
                  e.isMe
                    ? 'bg-primary-soft border-primary/30 shadow-soft'
                    : 'bg-card border-border/70 hover:bg-muted/40'
                }`}
            >
              <RankBadge rank={e.rank} />
              <DefaultAvatar username={e.displayUsername} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {e.displayUsername}
                  {e.isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{e.username}</p>
              </div>
              <span className="num text-sm font-semibold shrink-0">
                {e.weeklyXp.toLocaleString()} <span className="text-xs text-muted-foreground">XP</span>
              </span>
            </div>
          );
          return (
            <li key={e.uid}>
              {e.isMe ? row : <Link to={`/u/${e.username}`}>{row}</Link>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
