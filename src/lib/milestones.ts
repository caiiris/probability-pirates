export const MILESTONE_THRESHOLDS = [3, 7, 14, 30, 60, 100] as const;

export type MilestoneId =
  | 'streak-3'
  | 'streak-7'
  | 'streak-14'
  | 'streak-30'
  | 'streak-60'
  | 'streak-100';

export const MILESTONE_TITLES: Record<MilestoneId, string> = {
  'streak-3': 'Warming up',
  'streak-7': 'On a roll',
  'streak-14': 'Locked in',
  'streak-30': 'Genuine habit',
  'streak-60': 'Probability lifer',
  'streak-100': 'Inevitable',
};

/**
 * Returns the milestone ids that should be newly awarded given a streak count
 * and the set already reached. Idempotent: safe to call multiple times.
 */
export function newMilestonesFor(
  streak: number,
  alreadyReached: string[] | undefined,
): MilestoneId[] {
  const reached = alreadyReached ?? [];
  return MILESTONE_THRESHOLDS.filter((t) => streak >= t && !reached.includes(`streak-${t}`)).map(
    (t) => `streak-${t}` as MilestoneId,
  );
}
