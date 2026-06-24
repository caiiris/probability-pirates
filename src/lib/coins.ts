/**
 * Coin economy constants + payout math — pure, no Firebase, no React.
 *
 * Coins are a COSMETIC + FORGIVENESS currency, deliberately not a "pay-to-win"
 * one. You earn them by doing the things that build durable learning (clearing
 * chapters, unlocking achievements) and spend them on identity (avatar styles)
 * and forgiveness (a streak freeze) — never to shortcut the learning itself.
 *
 * Why this matters: Self-Determination Theory and the over-justification effect
 * warn that extrinsic rewards which feel controlling (or which buy away the
 * effort) erode intrinsic motivation. Keeping coins to cosmetics + a streak
 * freeze keeps the reward informational and supportive rather than corrosive.
 */

/** Coins granted per non-streak achievement unlocked. */
export const COINS_PER_ACHIEVEMENT = 25;

/** Coins in a chapter-clear chest. */
export const CHEST_REWARD = 100;

/** Coins in the final course-completion trophy. */
export const TROPHY_REWARD = 250;

/** Price of one Streak Freeze (forgiveness item). */
export const STREAK_FREEZE_COST = 200;

/** How many Streak Freezes a user may stockpile at once. */
export const MAX_STREAK_FREEZES = 2;

/** Reward for a course-path checkpoint chest. */
export function chestReward(isFinal: boolean): number {
  return isFinal ? TROPHY_REWARD : CHEST_REWARD;
}

/** Coins owed for newly unlocking `count` achievements. */
export function coinsForAchievements(count: number): number {
  return Math.max(0, count) * COINS_PER_ACHIEVEMENT;
}
