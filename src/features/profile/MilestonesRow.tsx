import { Trophy, Lock } from 'lucide-react';
import { MILESTONE_TITLES, MILESTONE_THRESHOLDS } from '@/lib/milestones';
import type { MilestoneId } from '@/lib/milestones';
import { FlameIcon } from '@/components/icons/StatIcons';

type Props = {
  milestonesReached: string[] | undefined;
  currentStreak: number;
};

export function MilestonesRow({ milestonesReached, currentStreak }: Props) {
  const reached = new Set(milestonesReached ?? []);

  const nextUnearned = MILESTONE_THRESHOLDS.find((t) => !reached.has(`streak-${t}`));

  return (
    <div className="space-y-3">
      {/* Next target banner */}
      {nextUnearned && (
        <div className="flex items-center gap-3 rounded-xl border bg-primary/5 border-primary/20 px-4 py-3">
          <Trophy className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">
              Next: {MILESTONE_TITLES[`streak-${nextUnearned}` as MilestoneId]}
            </p>
            <p className="text-xs text-muted-foreground">
              {nextUnearned - currentStreak > 0
                ? `${nextUnearned - currentStreak} more day${nextUnearned - currentStreak !== 1 ? 's' : ''} to go`
                : 'Keep your streak today!'}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-primary/70 shrink-0 num">
            {currentStreak} / {nextUnearned}
            <FlameIcon className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* All milestones grid */}
      <div className="grid grid-cols-3 gap-3">
        {MILESTONE_THRESHOLDS.map((threshold) => {
          const id = `streak-${threshold}` as MilestoneId;
          const isEarned = reached.has(id);
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors
                ${
                  isEarned
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-muted/40 border-border text-muted-foreground'
                }`}
              aria-label={`${MILESTONE_TITLES[id]}${isEarned ? ', earned' : ', locked'}`}
            >
              {isEarned ? (
                <Trophy className="w-7 h-7 text-amber-500" aria-hidden="true" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground/50" aria-hidden="true" />
              )}
              <span className="text-xs font-semibold text-center leading-snug">
                {MILESTONE_TITLES[id]}
              </span>
              <span
                className={`text-[10px] font-medium ${isEarned ? 'text-amber-600' : 'text-muted-foreground/60'}`}
              >
                {threshold}-day streak
              </span>
            </div>
          );
        })}
      </div>

      {reached.size === 0 && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Keep your daily streak to unlock trophies.
        </p>
      )}
    </div>
  );
}
