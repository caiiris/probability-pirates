/**
 * Achievement catalog + award logic — pure, no Firebase, no React.
 *
 * Companion to `milestones.ts` (streak trophies). Where milestones reward
 * *persistence* (showing up N days in a row), achievements reward the learning
 * behaviors that research says actually build durable knowledge:
 *
 *   - 'flawless'       successful retrieval (no wrong attempts) strengthens memory
 *   - 'bounce-back'    learning from errors / desirable difficulties (Bjork)
 *   - 'welcome-back'   distributed practice / spacing effect; also softens the
 *                      all-or-nothing shame of a broken streak
 *   - 'xp-*'           clear, attainable goals (Goal-Setting Theory, Locke & Latham)
 *   - 'course-cleared' mastery goal completion
 *
 * Copy stays informational, not controlling (Self-Determination Theory: rewards
 * that signal competence support intrinsic motivation; rewards that feel like
 * bribes undermine it).
 *
 * Like `newMilestonesFor`, `newAchievementsFor` is idempotent: it only returns
 * ids the learner has not already earned, so it is safe to call repeatedly and
 * to write with `arrayUnion`.
 */

export type AchievementId =
  | 'flawless'
  | 'bounce-back'
  | 'welcome-back'
  | 'xp-100'
  | 'xp-500'
  | 'xp-1000'
  | 'course-cleared'
  | 'new-connection'
  | 'cheerleader';

export type AchievementCategory = 'mastery' | 'persistence' | 'progress' | 'social';

export type AchievementDef = {
  id: AchievementId;
  title: string;
  /** User-facing, principle-flavored. Shown under the trophy in the case. */
  description: string;
  /** lucide-react icon name; mapped to a component in the UI layer so this
   *  module stays free of React imports (mirrors milestones.ts purity). */
  icon: string;
  category: AchievementCategory;
};

/** Display order in the trophy case. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Finished a lesson with no wrong answers.',
    icon: 'Sparkles',
    category: 'mastery',
  },
  {
    id: 'bounce-back',
    title: 'Bounce Back',
    description: 'Nailed it after a wrong answer — that is where learning sticks.',
    icon: 'RefreshCw',
    category: 'mastery',
  },
  {
    id: 'welcome-back',
    title: 'Welcome Back',
    description: 'Returned after a few days off. Spacing practice helps it last.',
    icon: 'CalendarCheck',
    category: 'persistence',
  },
  {
    id: 'xp-100',
    title: 'Warmed Up',
    description: 'Earned your first 100 XP.',
    icon: 'Zap',
    category: 'progress',
  },
  {
    id: 'xp-500',
    title: 'In the Groove',
    description: 'Reached 500 XP.',
    icon: 'Star',
    category: 'progress',
  },
  {
    id: 'xp-1000',
    title: 'Scholar',
    description: 'Reached 1,000 XP.',
    icon: 'GraduationCap',
    category: 'progress',
  },
  {
    id: 'course-cleared',
    title: 'Course Cleared',
    description: 'Completed every lesson in the course.',
    icon: 'Crown',
    category: 'progress',
  },
  {
    id: 'new-connection',
    title: 'New Connection',
    description: 'Followed your first fellow learner.',
    icon: 'UserPlus',
    category: 'social',
  },
  {
    id: 'cheerleader',
    title: 'Cheerleader',
    description: 'Cheered on a friend. Encouragement helps everyone keep going.',
    icon: 'Heart',
    category: 'social',
  },
];

export const ACHIEVEMENT_BY_ID: Record<AchievementId, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
) as Record<AchievementId, AchievementDef>;

/**
 * Signals available when evaluating achievements. All optional so callers can
 * pass only what they know at a given hook:
 *   - applyAttemptOutcome knows `gapDays` (days since last active)
 *   - applyLessonCompletion knows `xp`, `lessonsCompleted`, `courseTotal`,
 *     `lessonAllFirstTry`, `lessonHadComeback`
 */
export type AchievementContext = {
  xp?: number;
  lessonsCompleted?: number;
  courseTotal?: number;
  /** Days elapsed since the previous active day (before today's activity). */
  gapDays?: number;
  /** True if every problem this lesson was answered correctly on the first try. */
  lessonAllFirstTry?: boolean;
  /** True if at least one problem was answered correctly after a wrong attempt. */
  lessonHadComeback?: boolean;
};

const WELCOME_BACK_GAP_DAYS = 3;

/**
 * Returns the achievement ids that should be newly awarded given the current
 * signals and the set already earned. Idempotent.
 */
export function newAchievementsFor(
  alreadyEarned: string[] | undefined,
  ctx: AchievementContext,
): AchievementId[] {
  const earned = new Set(alreadyEarned ?? []);
  const out: AchievementId[] = [];

  const award = (id: AchievementId, when: boolean) => {
    if (when && !earned.has(id)) out.push(id);
  };

  if (ctx.xp !== undefined) {
    award('xp-100', ctx.xp >= 100);
    award('xp-500', ctx.xp >= 500);
    award('xp-1000', ctx.xp >= 1000);
  }

  if (ctx.courseTotal !== undefined && ctx.lessonsCompleted !== undefined) {
    award('course-cleared', ctx.courseTotal > 0 && ctx.lessonsCompleted >= ctx.courseTotal);
  }

  award('flawless', ctx.lessonAllFirstTry === true);
  award('bounce-back', ctx.lessonHadComeback === true);
  award('welcome-back', (ctx.gapDays ?? 0) >= WELCOME_BACK_GAP_DAYS);

  return out;
}
