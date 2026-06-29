/**
 * XP reward formula for a Captain's Wager submission (spec §5, C-W3).
 *
 * 5 base (participation) + 5 if score >= 50 + 10 if score >= 80 → total 5, 10, or 20.
 *
 * Wager XP is intentionally small so it doesn't compete with the practice
 * daily cap (D100). See R-W6 for the open question about adding a separate
 * wagerXp / weeklyWagerXp field if these need to be user-visible-distinguishable.
 */
export function wagerXpForScore(score: number): number {
  let xp = 5;
  if (score >= 50) xp += 5;
  if (score >= 80) xp += 10;
  return xp;
}
