import { useEffect, useState } from 'react';
import { todayLocalDate } from '@/lib/streak';
import type { SkillId } from '@/content/skills';
import { subscribeReviewSchedule, REVIEWABLE_SKILLS } from './reviewService';
import { dueSkills, isSatisfiedToday } from './reviewSchedule';
import type { ReviewSchedule } from './reviewSchedule';

export type DueReviewsState =
  | { status: 'loading' }
  | {
      status: 'ready';
      /** Reviewable skills due now, most-overdue first. */
      due: SkillId[];
      /** Whether the warm-up gate was already satisfied today (skip or complete). */
      satisfiedToday: boolean;
      schedule: ReviewSchedule | null;
    };

/**
 * Live spaced-review status for the current user. Subscribes to the schedule
 * doc and derives the due-now reviewable skills (filtered to skills whose topic
 * has a practice template) plus whether the once-a-day warm-up was already
 * satisfied. Fails open: a missing/errored schedule resolves to `due: []`.
 */
export function useDueReviews(uid: string | null | undefined): DueReviewsState {
  const [state, setState] = useState<DueReviewsState>({ status: 'loading' });

  useEffect(() => {
    if (!uid) {
      setState({ status: 'ready', due: [], satisfiedToday: false, schedule: null });
      return;
    }
    const unsub = subscribeReviewSchedule(uid, (schedule) => {
      const now = Date.now();
      const today = todayLocalDate();
      if (!schedule) {
        setState({ status: 'ready', due: [], satisfiedToday: false, schedule: null });
        return;
      }
      setState({
        status: 'ready',
        due: dueSkills(schedule, now, REVIEWABLE_SKILLS),
        satisfiedToday: isSatisfiedToday(schedule, today),
        schedule,
      });
    });
    return unsub;
  }, [uid]);

  return state;
}
