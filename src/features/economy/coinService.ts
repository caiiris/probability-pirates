/**
 * Coin wallet writes. Coins live on the private `users/{uid}` doc (not the public
 * projection) — a wallet is the owner's business.
 */

import { doc, runTransaction, increment, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ERROR_COPY } from '@/lib/errors';
import { STREAK_FREEZE_COST, MAX_STREAK_FREEZES, TROPHY_REWARD } from '@/lib/coins';
import { DEFAULT_AVATAR_STYLE, getAvatarStyle, isAvatarStyle } from './avatarStyles';
import { DEFAULT_FLAIR, getFlair, isFlair } from './profileFlair';

export type ClaimChestResult =
  | { ok: true; awarded: number; alreadyClaimed: boolean }
  | { ok: false; error: string };

/**
 * Claim a checkpoint chest. Idempotent per `chestId`: a transaction re-checks the
 * server-side `claimedChests` so a chest pays out exactly once even across
 * devices or rapid taps. Returns `alreadyClaimed: true` (and awards 0) if the
 * chest was already opened.
 */
export async function claimChest(
  uid: string,
  chestId: string,
  reward: number,
): Promise<ClaimChestResult> {
  if (!uid || !chestId) return { ok: false, error: 'Missing uid or chest.' };
  // Clamp to the maximum legitimate chest payout so a tampered caller can't mint
  // arbitrary coins through this path. Real rewards (CHEST_REWARD / TROPHY_REWARD)
  // pass through unchanged.
  const safeReward = Math.min(Math.max(0, Math.round(reward)), TROPHY_REWARD);
  try {
    const userRef = doc(db, 'users', uid);
    const awarded = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      const claimed: string[] = (snap.data()?.claimedChests as string[]) ?? [];
      if (claimed.includes(chestId)) return 0;
      tx.update(userRef, {
        coins: increment(safeReward),
        claimedChests: arrayUnion(chestId),
      });
      return safeReward;
    });
    return { ok: true, awarded, alreadyClaimed: awarded === 0 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : ERROR_COPY.economy.chest };
  }
}

export type BuyStreakFreezeResult =
  | { ok: true }
  | { ok: false; reason: 'insufficient' | 'at-max' | 'error'; error?: string };

/**
 * Buy one Streak Freeze for {@link STREAK_FREEZE_COST} coins. A transaction
 * re-reads the balance and current count so we never overspend or exceed
 * {@link MAX_STREAK_FREEZES}, even with rapid taps.
 */
export async function buyStreakFreeze(uid: string): Promise<BuyStreakFreezeResult> {
  if (!uid) return { ok: false, reason: 'error', error: 'Missing uid.' };
  try {
    const userRef = doc(db, 'users', uid);
    const outcome = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      const coins: number = (snap.data()?.coins as number) ?? 0;
      const owned: number = (snap.data()?.streakFreezes as number) ?? 0;
      if (owned >= MAX_STREAK_FREEZES) return 'at-max' as const;
      if (coins < STREAK_FREEZE_COST) return 'insufficient' as const;
      tx.update(userRef, {
        coins: increment(-STREAK_FREEZE_COST),
        streakFreezes: increment(1),
      });
      return 'ok' as const;
    });
    return outcome === 'ok' ? { ok: true } : { ok: false, reason: outcome };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      error: err instanceof Error ? err.message : ERROR_COPY.economy.purchase,
    };
  }
}

export type BuyAvatarStyleResult =
  | { ok: true }
  | { ok: false; reason: 'owned' | 'insufficient' | 'error'; error?: string };

/**
 * Buy an avatar style for `price` coins. A transaction re-reads coins and the
 * owned list so a style is bought once and never overspends.
 */
export async function buyAvatarStyle(
  uid: string,
  styleId: string,
  price: number,
): Promise<BuyAvatarStyleResult> {
  if (!uid || !styleId) return { ok: false, reason: 'error', error: 'Missing uid or style.' };
  // Price is authoritative from the catalog, not the caller. Reject unknown or
  // free styles, and a caller-supplied price that doesn't match the catalog.
  if (!isAvatarStyle(styleId)) return { ok: false, reason: 'error', error: 'Unknown style.' };
  const canonicalPrice = getAvatarStyle(styleId).price;
  if (canonicalPrice <= 0 || price !== canonicalPrice) {
    return { ok: false, reason: 'error', error: 'Price mismatch.' };
  }
  try {
    const userRef = doc(db, 'users', uid);
    const outcome = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      const coins: number = (snap.data()?.coins as number) ?? 0;
      const owned: string[] = (snap.data()?.ownedAvatarStyles as string[]) ?? [
        DEFAULT_AVATAR_STYLE,
      ];
      if (owned.includes(styleId)) return 'owned' as const;
      if (coins < canonicalPrice) return 'insufficient' as const;
      tx.update(userRef, {
        coins: increment(-canonicalPrice),
        ownedAvatarStyles: arrayUnion(styleId),
      });
      return 'ok' as const;
    });
    return outcome === 'ok' ? { ok: true } : { ok: false, reason: outcome };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      error: err instanceof Error ? err.message : ERROR_COPY.economy.purchase,
    };
  }
}

/**
 * Equip an avatar style. Cosmetic + public, so it mirrors to publicProfiles in
 * the same batch (set/merge self-creates if the projection lags).
 */
export async function equipAvatarStyle(uid: string, styleId: string): Promise<{ ok: boolean }> {
  if (!uid || !styleId) return { ok: false };
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid), { avatarStyle: styleId });
    batch.set(doc(db, 'publicProfiles', uid), { avatarStyle: styleId }, { merge: true });
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export type BuyFlairResult =
  | { ok: true }
  | { ok: false; reason: 'owned' | 'insufficient' | 'error'; error?: string };

/** Buy a profile flair for `price` coins (idempotent, no overspend). */
export async function buyProfileFlair(
  uid: string,
  flairId: string,
  price: number,
): Promise<BuyFlairResult> {
  if (!uid || !flairId) return { ok: false, reason: 'error', error: 'Missing uid or flair.' };
  // Price is authoritative from the catalog, not the caller.
  if (!isFlair(flairId)) return { ok: false, reason: 'error', error: 'Unknown flair.' };
  const canonicalPrice = getFlair(flairId).price;
  if (canonicalPrice <= 0 || price !== canonicalPrice) {
    return { ok: false, reason: 'error', error: 'Price mismatch.' };
  }
  try {
    const userRef = doc(db, 'users', uid);
    const outcome = await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      const coins: number = (snap.data()?.coins as number) ?? 0;
      const owned: string[] = (snap.data()?.ownedFlair as string[]) ?? [DEFAULT_FLAIR];
      if (owned.includes(flairId)) return 'owned' as const;
      if (coins < canonicalPrice) return 'insufficient' as const;
      tx.update(userRef, {
        coins: increment(-canonicalPrice),
        ownedFlair: arrayUnion(flairId),
      });
      return 'ok' as const;
    });
    return outcome === 'ok' ? { ok: true } : { ok: false, reason: outcome };
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      error: err instanceof Error ? err.message : ERROR_COPY.economy.purchase,
    };
  }
}

/** Equip a profile flair (cosmetic + public, mirrored to publicProfiles). */
export async function equipProfileFlair(uid: string, flairId: string): Promise<{ ok: boolean }> {
  if (!uid || !flairId) return { ok: false };
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid), { profileFlair: flairId });
    batch.set(doc(db, 'publicProfiles', uid), { profileFlair: flairId }, { merge: true });
    await batch.commit();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
