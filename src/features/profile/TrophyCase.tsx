import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { MILESTONE_THRESHOLDS, MILESTONE_TITLES } from '@/lib/milestones';
import type { MilestoneId } from '@/lib/milestones';
import { Medallion, type Tone } from './Medallion';
import type { EmblemName } from './Emblem';
import { ACHIEVEMENT_VISUALS, streakTone } from './badgeVisuals';

type Props = {
  milestonesReached: string[] | undefined;
  currentStreak: number;
  achievements: string[] | undefined;
};

type TrophyItem = {
  key: string;
  emblem: EmblemName;
  tone: Tone;
  title: string;
  description: string;
  earned: boolean;
  /** day-count badge for streaks */
  badge?: number;
  /** short "how to earn" line for the detail dialog when locked */
  hint?: string;
};

export function TrophyCase({ milestonesReached, currentStreak, achievements }: Props) {
  const reachedStreaks = new Set(milestonesReached ?? []);
  const earnedAchievements = new Set(achievements ?? []);
  const [selected, setSelected] = useState<TrophyItem | null>(null);

  const streaks: TrophyItem[] = MILESTONE_THRESHOLDS.map((t) => {
    const id = `streak-${t}` as MilestoneId;
    const earned = reachedStreaks.has(id);
    return {
      key: id,
      emblem: 'flame',
      tone: streakTone(t),
      title: MILESTONE_TITLES[id],
      description: `Keep a ${t}-day learning streak.`,
      earned,
      badge: t,
      hint: earned ? undefined : `${Math.max(0, t - currentStreak)} more days to go`,
    };
  });

  const achs: TrophyItem[] = ACHIEVEMENTS.map((a) => {
    const v = ACHIEVEMENT_VISUALS[a.id];
    return {
      key: a.id,
      emblem: v.emblem,
      tone: v.tone,
      title: a.title,
      description: a.description,
      earned: earnedAchievements.has(a.id),
    };
  });

  const streakCount = streaks.filter((s) => s.earned).length;
  const achCount = achs.filter((a) => a.earned).length;

  return (
    <div className="space-y-6">
      <Shelf
        title="Streaks"
        earned={streakCount}
        total={streaks.length}
        items={streaks}
        onSelect={setSelected}
      />
      <Shelf
        title="Achievements"
        earned={achCount}
        total={achs.length}
        items={achs}
        onSelect={setSelected}
      />

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xs">
          {selected ? (
            <>
              <DialogHeader className="items-center">
                <Medallion
                  emblem={selected.emblem}
                  tone={selected.tone}
                  earned={selected.earned}
                  badge={selected.badge}
                  size={88}
                />
                <DialogTitle className="mt-3 text-center font-display">
                  {selected.title}
                </DialogTitle>
              </DialogHeader>
              <p className="text-center text-sm text-muted-foreground">{selected.description}</p>
              <p
                className={`text-center text-xs font-semibold ${
                  selected.earned ? 'text-[color:var(--success)]' : 'text-muted-foreground'
                }`}
              >
                {selected.earned ? 'Earned' : (selected.hint ?? 'Locked')}
              </p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Shelf({
  title,
  earned,
  total,
  items,
  onSelect,
}: {
  title: string;
  earned: number;
  total: number;
  items: TrophyItem[];
  onSelect: (item: TrophyItem) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <span className="num text-[11px] font-semibold text-muted-foreground">
          {earned}/{total}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item)}
            className="flex flex-col items-center gap-1.5 rounded-xl pb-1 pt-2 text-center focus-visible:outline-none"
            aria-label={`${item.title}${item.earned ? ', earned' : ', locked'}. ${item.description}`}
          >
            <Medallion
              emblem={item.emblem}
              tone={item.tone}
              earned={item.earned}
              badge={item.badge}
              size={58}
            />
            <span
              className={`text-[11px] font-semibold leading-tight ${
                item.earned ? 'text-foreground' : 'text-muted-foreground/70'
              }`}
            >
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
