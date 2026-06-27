/**
 * Friendly difficulty label for a per-problem Elo (~700–2000).
 *
 * Kept as a standalone util so the per-problem badge in PracticeSession can
 * import it without pulling in any React/UI module. The bucket boundaries are
 * intentionally coarse; they're for the learner, not for analytics.
 */
export function difficultyLabel(elo: number): string {
  if (elo < 950) return 'Easy';
  if (elo < 1250) return 'Medium';
  if (elo < 1500) return 'Hard';
  return 'Extreme';
}
