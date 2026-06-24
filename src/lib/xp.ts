/**
 * XP rules per spec-habit-loop.
 * First-try correct: 10. Second-try: 5. Third+: 2. Wrong: 0.
 */
export function xpForAttempt(attemptNumber: number, wasCorrect: boolean): number {
  if (!wasCorrect) return 0;
  if (attemptNumber === 1) return 10;
  if (attemptNumber === 2) return 5;
  return 2;
}

export const LESSON_COMPLETION_BONUS = 50;
