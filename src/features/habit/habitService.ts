import { doc, arrayUnion, increment, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { xpForAttempt, LESSON_COMPLETION_BONUS } from '@/lib/xp';
import { nextStreak, todayLocalDate, daysBetween } from '@/lib/streak';
import { newMilestonesFor } from '@/lib/milestones';
import { newAchievementsFor } from '@/lib/achievements';
import { currentWeekKey } from '@/lib/weeklyXp';
import { coinsForAchievements } from '@/lib/coins';
import type { UserProfile } from '@/features/auth/AuthProvider';
import type { MilestoneId } from '@/lib/milestones';
import type { AchievementId } from '@/lib/achievements';

// ---------------------------------------------------------------------------
// Apply XP + streak update after a correct check
// ---------------------------------------------------------------------------

export type AttemptOutcomeResult = {
  isNewStreakDay: boolean;
  currentStreak: number;
  /** Achievements newly earned by this attempt (e.g. 'welcome-back'). */
  newAchievements: AchievementId[];
  /** True if a Streak Freeze was spent to keep the streak alive this check. */
  streakFreezeUsed: boolean;
};

export async function applyAttemptOutcome(
  uid: string,
  profile: UserProfile,
  attemptNumber: number,
  wasCorrect: boolean,
): Promise<{ ok: true; result: AttemptOutcomeResult } | { ok: false; error: string }> {
  try {
    const xp = xpForAttempt(attemptNumber, wasCorrect);
    const today = todayLocalDate();
    const userRef = doc(db, 'users', uid);
    const pubRef = doc(db, 'publicProfiles', uid);

    if (!wasCorrect) {
      return {
        ok: true,
        result: {
          isNewStreakDay: false,
          currentStreak: profile.currentStreak,
          newAchievements: [],
          streakFreezeUsed: false,
        },
      };
    }

    const streakResult = nextStreak({
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak,
      lastActiveDate: profile.lastActiveDate,
      todayLocalDate: today,
      freezesAvailable: profile.streakFreezes ?? 0,
    });

    // Gap is measured against the PREVIOUS active day, before we overwrite
    // lastActiveDate with today — so 'welcome-back' rewards spaced returns.
    const gapDays = streakResult.isNewStreakDay ? daysBetween(profile.lastActiveDate, today) : 0;
    const newAchievements = newAchievementsFor(profile.achievements, { gapDays });

    // Weekly XP: increment within the same ISO week, reset on a new week.
    const weekKey = currentWeekKey();
    const sameWeek = profile.weekKey === weekKey;

    // Mirror the public subset into publicProfiles in the same batch so the
    // social surfaces stay in sync. set(merge) self-creates if not yet backfilled.
    const batch = writeBatch(db);
    batch.update(userRef, {
      xp: increment(xp),
      stepsCompleted: increment(1),
      currentStreak: streakResult.currentStreak,
      bestStreak: streakResult.bestStreak,
      lastActiveDate: streakResult.lastActiveDate,
      activityDates: arrayUnion(today),
      weeklyXp: sameWeek ? increment(xp) : xp,
      weekKey,
      ...(streakResult.freezesConsumed > 0
        ? { streakFreezes: increment(-streakResult.freezesConsumed) }
        : {}),
      ...(newAchievements.length > 0
        ? {
            achievements: arrayUnion(...newAchievements),
            coins: increment(coinsForAchievements(newAchievements.length)),
          }
        : {}),
    });
    batch.set(
      pubRef,
      {
        xp: increment(xp),
        stepsCompleted: increment(1),
        currentStreak: streakResult.currentStreak,
        bestStreak: streakResult.bestStreak,
        activityDates: arrayUnion(today),
        weeklyXp: sameWeek ? increment(xp) : xp,
        weekKey,
        ...(newAchievements.length > 0 ? { achievements: arrayUnion(...newAchievements) } : {}),
      },
      { merge: true },
    );
    await batch.commit();

    return {
      ok: true,
      result: {
        isNewStreakDay: streakResult.isNewStreakDay,
        currentStreak: streakResult.currentStreak,
        newAchievements,
        streakFreezeUsed: streakResult.freezesConsumed > 0,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Increment stepsCompleted for concept/wrap slot advances (no XP, no streak)
// ---------------------------------------------------------------------------

export async function applySlotAdvance(uid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid), { stepsCompleted: increment(1) });
    batch.set(doc(db, 'publicProfiles', uid), { stepsCompleted: increment(1) }, { merge: true });
    await batch.commit();
  } catch (err) {
    console.error('applySlotAdvance failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Apply lesson completion bonus + milestones
// ---------------------------------------------------------------------------

export type LessonCompletionResult = {
  newMilestones: MilestoneId[];
  newCurrentStreak: number;
  isNewStreakDay: boolean;
  xpEarnedThisLesson: number;
  newLessonsCompleted: number;
  /** Achievements newly earned by completing this lesson. */
  newAchievements: AchievementId[];
};

/**
 * Optional signals about how the just-finished lesson went, used to award
 * mastery achievements. Omitting it (the original call shape) simply skips
 * those awards — no behavior change for existing callers.
 */
export type LessonCompletionSummary = {
  /** Every problem answered correctly on the first try. */
  allFirstTry?: boolean;
  /** At least one problem answered correctly after a wrong attempt. */
  hadComeback?: boolean;
  /** Total lessons in the course, for the 'course-cleared' achievement. */
  courseTotal?: number;
};

export async function applyLessonCompletion(
  uid: string,
  profile: UserProfile,
  xpEarnedThisAttempt: number,
  isNewStreakDay: boolean,
  summary?: LessonCompletionSummary,
): Promise<{ ok: true; result: LessonCompletionResult } | { ok: false; error: string }> {
  try {
    const userRef = doc(db, 'users', uid);
    const pubRef = doc(db, 'publicProfiles', uid);

    // Use current streak from the live profile (already updated by applyAttemptOutcome during lesson)
    const currentStreak = profile.currentStreak;
    const newMilestones = newMilestonesFor(currentStreak, profile.milestonesReached);

    const newLessonsCompleted = profile.lessonsCompleted + 1;
    // profile.xp already reflects per-check XP written during the lesson; add the
    // completion bonus. Conservative if the snapshot lags — achievements are
    // idempotent and simply award on the next completion (matches milestones).
    const projectedXp = profile.xp + LESSON_COMPLETION_BONUS;
    const newAchievements = newAchievementsFor(profile.achievements, {
      xp: projectedXp,
      lessonsCompleted: newLessonsCompleted,
      courseTotal: summary?.courseTotal,
      lessonAllFirstTry: summary?.allFirstTry,
      lessonHadComeback: summary?.hadComeback,
    });

    // Weekly XP: by completion the attempt writes have set weekKey to the
    // current week, so increment; if genuinely a fresh week (resume-then-finish
    // with no correct check today), start the bucket at the bonus.
    const weekKey = currentWeekKey();
    const sameWeek = profile.weekKey === weekKey;

    // Only add the completion bonus — per-check XP was already incremented by applyAttemptOutcome
    const batch = writeBatch(db);
    batch.update(userRef, {
      xp: increment(LESSON_COMPLETION_BONUS),
      lessonsCompleted: increment(1),
      weeklyXp: sameWeek ? increment(LESSON_COMPLETION_BONUS) : LESSON_COMPLETION_BONUS,
      weekKey,
      ...(newMilestones.length > 0 ? { milestonesReached: arrayUnion(...newMilestones) } : {}),
      ...(newAchievements.length > 0
        ? {
            achievements: arrayUnion(...newAchievements),
            coins: increment(coinsForAchievements(newAchievements.length)),
          }
        : {}),
    });
    batch.set(
      pubRef,
      {
        xp: increment(LESSON_COMPLETION_BONUS),
        lessonsCompleted: increment(1),
        weeklyXp: sameWeek ? increment(LESSON_COMPLETION_BONUS) : LESSON_COMPLETION_BONUS,
        weekKey,
        ...(newMilestones.length > 0 ? { milestonesReached: arrayUnion(...newMilestones) } : {}),
        ...(newAchievements.length > 0 ? { achievements: arrayUnion(...newAchievements) } : {}),
      },
      { merge: true },
    );
    await batch.commit();

    const xpEarnedThisLesson = xpEarnedThisAttempt + LESSON_COMPLETION_BONUS;

    return {
      ok: true,
      result: {
        newMilestones,
        newCurrentStreak: currentStreak,
        isNewStreakDay,
        xpEarnedThisLesson,
        newLessonsCompleted,
        newAchievements,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
