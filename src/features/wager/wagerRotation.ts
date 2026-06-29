/**
 * Wager rotation — pure, client-side, deterministic.
 *
 * Picks ONE wager to be the "featured" one for any given moment, and exposes
 * which wagers have previously been featured. The schedule is anchored to a
 * fixed start date, advances one slot every `WAGER_WINDOW_DAYS` days, and
 * draws from a deterministically-shuffled bank — so every client computes the
 * same answer for the same moment without a server clock or a scheduled job.
 *
 * Why deterministic + client-side: we have no Cloud Functions (D-AS1
 * client-authoritative posture) so the schedule MUST be derivable from the
 * client-known bank + the wall clock. A shuffle seeded by the anchor date
 * gives "feels random" without losing reproducibility.
 *
 * The shuffle is stable across re-renders for the same bank: a tiny FNV-1a
 * hash seeds a Fisher-Yates shuffle on a copy of the input bank sorted by id.
 */

import type { Wager } from '@/features/wager/types';

/** Days between scheduled wager rotations. */
export const WAGER_WINDOW_DAYS = 3;

/**
 * The schedule's epoch. Window 0 starts at this instant; every subsequent
 * window of `WAGER_WINDOW_DAYS * 86400000` ms picks the next entry in the
 * shuffled bank. Set to 2026-06-27 (the day the first wager opened) so the
 * sequence numbers in our seed JSON match window indices for the first cohort.
 */
export const WAGER_EPOCH_MS = Date.UTC(2026, 5, 27);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------

/** Tiny stable string hash. Returns a 32-bit unsigned int. */
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic Mulberry32-style PRNG seeded by a 32-bit integer. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle in place using a supplied rng. Pure if the rng is. */
function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Stable bank ordering: sort by id (ascii), then shuffle with a seed derived
 * from the epoch. The shuffle is the same for all clients and across reloads;
 * sorting by id first makes the result independent of the order Firestore
 * returns docs in.
 */
function shuffledBank(bank: Wager[]): Wager[] {
  const sorted = [...bank].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rng = mulberry32(fnv1a32(`wager-rotation@${WAGER_EPOCH_MS}`));
  return shuffleInPlace(sorted, rng);
}

// ---------------------------------------------------------------------------
// Window math
// ---------------------------------------------------------------------------

/**
 * The current window index for `nowMs`. Window 0 spans
 * [WAGER_EPOCH_MS, WAGER_EPOCH_MS + WAGER_WINDOW_DAYS days). Pre-epoch
 * timestamps clamp to window 0 (the first wager is the "today" until time
 * actually catches up).
 */
export function currentWindowIndex(nowMs: number): number {
  const elapsedMs = nowMs - WAGER_EPOCH_MS;
  if (elapsedMs < 0) return 0;
  return Math.floor(elapsedMs / (WAGER_WINDOW_DAYS * ONE_DAY_MS));
}

// ---------------------------------------------------------------------------
// Public selectors
// ---------------------------------------------------------------------------

/**
 * The wager currently featured at `nowMs`, or `null` if the bank is empty.
 * Cycles deterministically through the shuffled bank: window k → bank[k % N].
 * Once `k >= N`, the cycle restarts from the top — wagers are reusable as
 * "featured" exactly once they fall off the visible past list. (For our scale
 * the bank will be replenished long before that wraps in practice.)
 */
export function featuredWager(bank: Wager[], nowMs: number): Wager | null {
  if (bank.length === 0) return null;
  const shuffled = shuffledBank(bank);
  const k = currentWindowIndex(nowMs);
  return shuffled[k % shuffled.length];
}

/**
 * Wagers that were featured BEFORE the current window, newest-first. Bounded
 * by `bank.length - 1` (each wager only appears once per cycle).
 */
export function pastFeaturedWagers(bank: Wager[], nowMs: number): Wager[] {
  if (bank.length === 0) return [];
  const shuffled = shuffledBank(bank);
  const k = currentWindowIndex(nowMs);
  // Walk window indices k-1, k-2, ..., back to max(0, k - (N-1)).
  const start = Math.max(0, k - (shuffled.length - 1));
  const out: Wager[] = [];
  for (let w = k - 1; w >= start; w--) {
    out.push(shuffled[w % shuffled.length]);
  }
  return out;
}

/**
 * Wager IDs that have NEVER been featured yet (i.e. live in the bank but
 * haven't surfaced for any past window). Useful for the operator to see what
 * is queued. Returns [] once every wager in the bank has been featured.
 */
export function upcomingWagers(bank: Wager[], nowMs: number): Wager[] {
  if (bank.length === 0) return [];
  const shuffled = shuffledBank(bank);
  const k = currentWindowIndex(nowMs);
  const seenCount = Math.min(k + 1, shuffled.length);
  return shuffled.slice(seenCount);
}

/**
 * Milliseconds until the next window flips. Returns 0 when `nowMs` is before
 * the epoch (the next window starts at the epoch).
 */
export function msUntilNextWindow(nowMs: number): number {
  const elapsedMs = nowMs - WAGER_EPOCH_MS;
  if (elapsedMs < 0) return -elapsedMs;
  const windowMs = WAGER_WINDOW_DAYS * ONE_DAY_MS;
  return windowMs - (elapsedMs % windowMs);
}
