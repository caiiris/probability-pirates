import type { ReactNode } from 'react';
import { Chest } from '@/components/illustrations/Chest';
import { OceanScene } from '@/features/course/OceanScene';
import { FlairBadge } from '@/features/economy/FlairBadge';
import { StrengthsPanel } from '@/features/learner/StrengthsPanel';
import type { LearnerModel } from '@/features/learner/learnerModel';
import { DefaultAvatar } from './DefaultAvatar';
import { RankPanel } from './LevelBadge';
import { StatsGrid } from './StatsGrid';
import { TrophyCase } from './TrophyCase';
import { ActivityGrid } from './ActivityGrid';

type Props = {
  displayUsername: string;
  bio: string;
  emptyBioText: string;
  xp: number;
  lessonsCompleted: number;
  stepsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  courseCompleted: number;
  courseTotal: number;
  activityDates: string[] | undefined;
  milestonesReached: string[] | undefined;
  achievements: string[] | undefined;
  /** Equipped avatar style id (cosmetic). */
  avatarStyleId?: string;
  /** Equipped profile flair id (cosmetic badge under the name). */
  flairId?: string;
  /** Rendered under the bio (e.g. Edit profile, or Follow + Cheer). */
  actions?: ReactNode;
  /** Rendered under the actions (e.g. follower/following counts). */
  counts?: ReactNode;
  /** WP-7 — learner model for the compact strengths/growth panel. */
  learnerModel?: LearnerModel | null;
  /** WP-7 — true while the learner model is loading. */
  learnerModelLoading?: boolean;
};

/**
 * Presentational profile body shared by the owner's `/profile` and the public
 * `/u/:username`. Renders the same identity + stats + activity + trophy
 * sections; pages supply their own action/count slots and surrounding chrome.
 */
export function ProfileBody({
  displayUsername,
  bio,
  emptyBioText,
  xp,
  lessonsCompleted,
  stepsCompleted,
  currentStreak,
  bestStreak,
  courseCompleted,
  courseTotal,
  activityDates,
  milestonesReached,
  achievements,
  avatarStyleId,
  flairId,
  actions,
  counts,
  learnerModel,
  learnerModelLoading = false,
}: Props) {
  return (
    <>
      {/* Avatar + identity — the captain's portrait, set on the sea */}
      <OceanScene calm>
        <div className="flex flex-col items-center gap-3 py-3 text-center">
          <div className="rounded-full bg-card/70 p-1 shadow-soft backdrop-blur-sm">
            <DefaultAvatar
              username={displayUsername}
              size={92}
              className="md:!w-28 md:!h-28"
              styleId={avatarStyleId}
            />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight truncate max-w-xs">
              {displayUsername}
            </h1>
            {flairId ? (
              <div className="mt-2 flex justify-center">
                <FlairBadge flairId={flairId} />
              </div>
            ) : null}
            {bio ? (
              <p className="text-sm text-[color:var(--ink)]/75 mt-1 max-w-xs">{bio}</p>
            ) : (
              <p className="text-sm text-[color:var(--ink)]/45 mt-1 italic">{emptyBioText}</p>
            )}
          </div>
          {actions}
          {counts}
        </div>
      </OceanScene>

      {/* Rank — what XP buys you: levels + a pirate rank. Sits quietly next to
          the identity banner; the disc carries enough weight on its own. */}
      <Section title="Rank">
        <RankPanel xp={xp} />
      </Section>

      {/* Stats — supporting; recedes so the page has hierarchy instead of four
          cards of equal weight. */}
      <Section title="Stats">
        <StatsGrid
          xp={xp}
          lessonsCompleted={lessonsCompleted}
          stepsCompleted={stepsCompleted}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          courseCompleted={courseCompleted}
          courseTotal={courseTotal}
        />
      </Section>

      {/* Activity grid — also supporting. */}
      <Section title="Activity">
        <ActivityGrid activityDates={activityDates} />
      </Section>

      {/* Strengths — compact read of Engine A practiced + Engine B introduced. */}
      <Section title="Strengths">
        <StrengthsPanel
          model={learnerModel ?? null}
          loading={learnerModelLoading}
          compact
        />
      </Section>

      {/* Trophies — the page's hero collection. Elevation + chest icon carry
          the weight; no tinted background so it stays clean. */}
      <Section elevated title="Treasure shelf" icon={<Chest open className="h-6 w-6" />}>
        <TrophyCase
          milestonesReached={milestonesReached}
          currentStreak={currentStreak}
          achievements={achievements}
        />
      </Section>
    </>
  );
}

/**
 * A titled section. `elevated` is opt-in: only the page's hero collection wears
 * a real shadow, so the page reads as one prominent block + a few supporting
 * ones, instead of four equally-weighted cards stacked.
 */
function Section({
  title,
  icon,
  tint,
  elevated = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  tint?: string;
  elevated?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${elevated ? 'shadow-soft' : 'border-border/70'}`}
      style={{ background: tint ?? 'var(--card)' }}
    >
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
