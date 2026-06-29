import type { WagerScoring } from '@/features/wager/types';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Score formula from spec §5. Symmetric: sign of error doesn't matter.
 *
 * 'log' branch:
 *   logError = |log10(guess) − log10(trueAnswer)|
 *   score    = max(0, round(100 × max(0, 1 − logError)))
 *   guess ≤ 0 → { logError: Infinity, score: 0 } (undefined in log scale)
 *
 * 'abs' branch (for prompts where trueAnswer is near zero):
 *   logError = |guess − trueAnswer|
 *   score    = max(0, round(100 × max(0, 1 − (logError / max(trueAnswer, 0.01)) × 0.5)))
 *   The 0.01 floor prevents division-by-zero; the 0.5 slope means a guess
 *   offset by exactly 2 × trueAnswer scores 0.
 */
export function computeWagerScore(
  guess: number,
  trueAnswer: number,
  scoring: WagerScoring,
): { logError: number; score: number } {
  if (scoring === 'log') {
    if (guess <= 0) {
      return { logError: Infinity, score: 0 };
    }
    const logError = Math.abs(Math.log10(guess) - Math.log10(trueAnswer));
    const score = clamp(Math.round(100 * Math.max(0, 1 - logError)), 0, 100);
    return { logError, score };
  }

  // 'abs' branch
  const logError = Math.abs(guess - trueAnswer);
  const score = clamp(
    Math.round(100 * Math.max(0, 1 - (logError / Math.max(trueAnswer, 0.01)) * 0.5)),
    0,
    100,
  );
  return { logError, score };
}
