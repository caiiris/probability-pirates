import { describe, it, expect } from 'vitest';
import { nextRecommendedLesson, courseProgress, dailyGoalDone } from './recommendations';
import type { Lesson } from '@/content/types';
import type { LessonProgress } from '@/features/progress/progressService';

// Test fixtures default to a single concept slot so the lesson reads as
// "real, authored content." Coming-soon stubs use `slots: []` to model the
// locked-preview state.
const makeLesson = (id: string, number: number, comingSoon?: boolean): Lesson => ({
  id,
  number,
  title: `Lesson ${number}`,
  blurb: '',
  estimatedMinutes: 4,
  comingSoon,
  slots: comingSoon
    ? []
    : [{ id: 'c', kind: 'concept', prompt: 'p', illustration: { kind: 'die' } }],
});

const makeProgress = (state: LessonProgress['state']): LessonProgress => ({
  state,
  slotIndex: 0,
  attemptId: 'abc',
  selectedVariantIds: {},
  xpEarnedThisAttempt: 0,
  completedAt: null,
  updatedAt: null,
});

const lessons = [makeLesson('l1', 1), makeLesson('l2', 2, true)];

describe('nextRecommendedLesson', () => {
  it('returns first real lesson when no progress', () => {
    const result = nextRecommendedLesson(lessons, new Map());
    expect(result?.id).toBe('l1');
  });

  it('returns in-progress lesson', () => {
    const map = new Map([['l1', makeProgress('in_progress')]]);
    expect(nextRecommendedLesson(lessons, map)?.id).toBe('l1');
  });

  it('returns null when all real lessons are completed', () => {
    const map = new Map([['l1', makeProgress('completed')]]);
    expect(nextRecommendedLesson(lessons, map)).toBeNull();
  });
});

describe('courseProgress', () => {
  it('counts the full planned course as the total (live + locked stubs)', () => {
    // fixture: l1 is real, l2 is comingSoon → total still reflects both, so
    // the user sees their share of the planned curriculum (D91).
    const { completed, total } = courseProgress(lessons, new Map());
    expect(completed).toBe(0);
    expect(total).toBe(2);
  });

  it('after completing the one real lesson, returns 1/2 (not 1/1)', () => {
    const map = new Map([['l1', makeProgress('completed')]]);
    const { completed, total } = courseProgress(lessons, map);
    expect(completed).toBe(1);
    expect(total).toBe(2);
  });

  it('ignores stale progress on lessons that are blank stubs (no slots)', () => {
    // A lesson with empty slots is a locked roadmap stub. Stale progress on
    // such a lesson — e.g. left over from a branch where it was authored
    // — must not contribute to the completed count.
    const staleStubProgress = new Map([['l2', makeProgress('completed')]]);
    const { completed } = courseProgress(lessons, staleStubProgress);
    expect(completed).toBe(0);
  });
});

describe('dailyGoalDone', () => {
  it('returns false for empty map', () => {
    expect(dailyGoalDone(new Map(), '2026-06-23')).toBe(false);
  });

  it('returns true when a lesson was completed today', () => {
    const prog: LessonProgress = {
      ...makeProgress('completed'),
      completedAt: {
        seconds: Math.floor(new Date('2026-06-23T12:00:00').getTime() / 1000),
        nanoseconds: 0,
      },
    };
    const map = new Map([['l1', prog]]);
    expect(dailyGoalDone(map, '2026-06-23')).toBe(true);
  });
});
