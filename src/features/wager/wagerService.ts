/**
 * Captain's Wager — service layer (WP-CW-D, C-W5).
 *
 * Mirrors the hook shape of notificationsService.ts: onSnapshot + useEffect,
 * { data, loading } return shapes, auth-null short-circuit.
 *
 * GATING: useWagerAnswer and useWagerSubmissions do not subscribe until the
 * current user has their own submission for the wager. This matches the
 * Firestore rules (exists()-based gate) and avoids a wasted listener.
 *
 * XP WRITE PATH: submitWager writes xp / weeklyXp / weekKey directly to the
 * user doc (same allowlisted fields as awardPracticeXp in habitService.ts) via
 * the transaction. We do NOT call grantPracticeXp — wager XP must not compete
 * with the practice daily cap (D100). See R-W6: if wager and practice XP need
 * to be user-visible-distinguishable, add wagerXp / weeklyWagerXp fields.
 */

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { computeWagerScore } from '@/features/wager/scoring';
import { wagerXpForScore } from '@/features/wager/wagerXp';
import { currentWeekKey } from '@/lib/weeklyXp';
import type {
  Wager,
  WagerAnswer,
  WagerFlavor,
  WagerScoring,
  WagerStatus,
  WagerSubmission,
  WagerStats,
  WagerUnit,
} from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Infinity sentinel
// ---------------------------------------------------------------------------

/**
 * Firestore cannot store Infinity. computeWagerScore returns Infinity for
 * non-positive guesses in 'log' scoring (undefined in log space). We encode
 * these as 9999 at the storage boundary. This value is safely above any
 * real-world logError (max realistic ≈ 5 for a 10^5× miss) and ranks as the
 * worst performer in percentileBeaten comparisons, which is correct behaviour.
 * The WagerSubmission.logError returned by submitWager also uses this sentinel
 * for consistency with what is persisted.
 */
const INFINITY_SENTINEL = 9999;

// ---------------------------------------------------------------------------
// Internal data mappers
// ---------------------------------------------------------------------------

function toTimestampMs(val: unknown): number {
  if (
    val !== null &&
    typeof val === 'object' &&
    'toMillis' in val &&
    typeof (val as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

function docToWager(id: string, data: Record<string, unknown>): Wager {
  return {
    id,
    sequence: data.sequence as number,
    openAt: toTimestampMs(data.openAt),
    prompt: data.prompt as string,
    unit: data.unit as WagerUnit,
    tags: (data.tags ?? []) as string[],
    flavor: data.flavor as WagerFlavor,
    scoring: data.scoring as WagerScoring,
    relatedLessonId: data.relatedLessonId as string | undefined,
    status: data.status as WagerStatus,
    createdBy: 'system',
  };
}

function docToWagerSubmission(data: Record<string, unknown>): WagerSubmission {
  return {
    uid: data.uid as string,
    guess: data.guess as number,
    logError: data.logError as number,
    score: data.score as number,
    submittedAt: toTimestampMs(data.submittedAt),
  };
}

function docToWagerAnswer(data: Record<string, unknown>): WagerAnswer {
  return {
    trueAnswer: data.trueAnswer as number,
    source: data.source as string,
    sourceUrl: data.sourceUrl as string | undefined,
    revealHeadline: data.revealHeadline as string,
    revealExplanation: data.revealExplanation as string,
    revealWorked: data.revealWorked as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Pure stats-update helper — exported for testability
// ---------------------------------------------------------------------------

/**
 * Compute updated WagerStats after recording a new submission.
 *
 * @param old   The current stats doc, or null if this is the user's first wager.
 * @param wagerId  The wager id for the new submission.
 * @param score    0-100 score from computeWagerScore.
 * @param effectiveLogError  logError for this submission (may be INFINITY_SENTINEL).
 */
export function computeUpdatedStats(
  old: WagerStats | null,
  wagerId: string,
  score: number,
  effectiveLogError: number,
): WagerStats {
  const n = (old?.totalSubmitted ?? 0) + 1;
  const prevN = n - 1;
  const prevAvgScore = old?.averageScore ?? 0;
  const prevAvgLogError = old?.averageLogError ?? 0;
  const prevLast10 = old?.last10Scores ?? [];

  return {
    totalSubmitted: n,
    averageScore: (prevAvgScore * prevN + score) / n,
    averageLogError: (prevAvgLogError * prevN + effectiveLogError) / n,
    lastWagerId: wagerId,
    last10Scores: [...prevLast10, score].slice(-10),
  };
}

// ---------------------------------------------------------------------------
// Retrying snapshot subscriber
//
// Why: the reveal-screen gated hooks (useWagerAnswer, useWagerSubmissions) hit
// permission-denied on the FIRST snapshot eval immediately after submitWager
// returns. The placeholder write has acked and submitWager's own getDoc of
// /private/answer succeeded just milliseconds earlier (the score-patch landed)
// — yet a brand-new listener on the same path sees a stale rule snapshot and
// the rule's exists() returns false. Within a few seconds the rule engine
// catches up and the listener would succeed; without retry, the user is
// stranded on "Could not load the reveal" until they manually refresh.
//
// Strategy: on a permission-denied error, tear the listener down and retry
// with exponential backoff (500/1000/2000/4000/8000 ms — up to ~15.5s total).
// After 5 retries, surface the error so we don't loop forever on a legitimate
// rules denial. Other error codes (network, unavailable) fall through to
// onFinalError immediately — the Firestore SDK's own reconnect handles those.
// ---------------------------------------------------------------------------

const PERM_DENIED_BACKOFFS_MS = [500, 1000, 2000, 4000, 8000];

function subscribeWithRetry(input: {
  /** Used in error messages and console warns to identify which hook is retrying. */
  label: string;
  /** Opens a Firestore listener. Receives an error callback that this helper
   *  routes through its retry logic. Returns the unsubscribe fn. */
  open: (onErr: (err: unknown) => void) => () => void;
  /** Called when retries are exhausted or a non-permission-denied error fires. */
  onFinalError: (message: string) => void;
}): () => void {
  const { label, open, onFinalError } = input;
  let unsubscribe: () => void = () => {};
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let disposed = false;

  function handleErr(err: unknown): void {
    if (disposed) return;
    const code = (err as { code?: string })?.code ?? 'unknown';
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    if (code === 'permission-denied' && attempt < PERM_DENIED_BACKOFFS_MS.length) {
      const wait = PERM_DENIED_BACKOFFS_MS[attempt];
      attempt += 1;
      console.warn(
        `[wager] ${label} permission-denied; retry ${attempt}/${PERM_DENIED_BACKOFFS_MS.length} in ${wait}ms`,
      );
      try {
        unsubscribe();
      } catch {
        // The SDK can throw if we unsubscribe an already-errored listener.
      }
      retryTimer = setTimeout(() => {
        if (disposed) return;
        retryTimer = null;
        unsubscribe = open(handleErr);
      }, wait);
      return;
    }
    console.warn(`[wager] ${label} failed (no more retries)`, err);
    onFinalError(`${label} [${code}]: ${message}`);
  }

  unsubscribe = open(handleErr);

  return () => {
    disposed = true;
    if (retryTimer) clearTimeout(retryTimer);
    try {
      unsubscribe();
    } catch {
      // already torn down or errored
    }
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Realtime list of live wagers, newest first (by sequence). */
export function useLiveWagers(): {
  wagers: Wager[];
  loading: boolean;
  error: string | null;
} {
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'wagers'),
      where('status', '==', 'live'),
      orderBy('sequence', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        setWagers(snap.docs.map((d) => docToWager(d.id, d.data() as Record<string, unknown>)));
        setError(null);
        setLoading(false);
      },
      (err) => {
        // Surface the error: prior behaviour silently rendered empty, which is
        // indistinguishable from "no live wagers" and has masked real failures
        // (missing Firestore index, rules denial, network) multiple times.
        const message =
          err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        console.warn('[wager] useLiveWagers failed', err);
        setError(message);
        setLoading(false);
      },
    );
  }, []);

  return { wagers, loading, error };
}

/** Subscribe to a single wager by id. Null while loading or if not found. */
export function useWagerById(id: string): { wager: Wager | null; loading: boolean } {
  const [wager, setWager] = useState<Wager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'wagers', id);
    return onSnapshot(
      ref,
      (snap) => {
        setWager(
          snap.exists() ? docToWager(snap.id, snap.data() as Record<string, unknown>) : null,
        );
        setLoading(false);
      },
      (err) => {
        console.warn('[wager] useWagerById failed', err);
        setLoading(false);
      },
    );
  }, [id]);

  return { wager, loading };
}

/** The current user's submission for a wager. Null when uid is null or not yet submitted.
 *
 * When `scoring` is provided and the stored submission is in placeholder state
 * (score === 0 && logError === 0), the hook automatically calls
 * `ensureSubmissionScored` to self-heal a failed score-patch from a prior
 * `submitWager` call. The `healingRef` guard prevents concurrent / infinite retries.
 */
export function useUserSubmission(
  uid: string | null,
  wagerId: string,
  scoring?: WagerScoring,
): { submission: WagerSubmission | null; loading: boolean } {
  const [submission, setSubmission] = useState<WagerSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  // Prevents concurrent or repeated self-heal attempts across snapshot fires.
  const healingRef = useRef(false);

  useEffect(() => {
    if (!uid) {
      setSubmission(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'wagers', wagerId, 'submissions', uid);
    return onSnapshot(
      ref,
      (snap) => {
        const sub = snap.exists()
          ? docToWagerSubmission(snap.data() as Record<string, unknown>)
          : null;
        setSubmission(sub);
        setLoading(false);

        // Self-heal: if scoring is provided and the submission is still in
        // placeholder state (both score AND logError are 0), the step-4 score-patch
        // from submitWager failed. Fire ensureSubmissionScored to retry it.
        // After the patch lands, the snapshot re-fires with a non-zero logError,
        // breaking the trigger condition and preventing a loop.
        if (
          sub !== null &&
          sub.score === 0 &&
          sub.logError === 0 &&
          scoring !== undefined &&
          !healingRef.current
        ) {
          healingRef.current = true;
          ensureSubmissionScored({ uid, wagerId, scoring })
            .catch((err) => {
              console.warn('[wager] ensureSubmissionScored failed', err);
            })
            .finally(() => {
              healingRef.current = false;
            });
        }
      },
      (err) => {
        console.warn('[wager] useUserSubmission failed', err);
        setLoading(false);
      },
    );
  }, [uid, wagerId, scoring]);

  return { submission, loading };
}

/**
 * All submissions for a wager — gated: returns null until the current user
 * has submitted (avoids both a wasted listener and a rules rejection). Once
 * the user has submitted, subscribes to the full submissions collection.
 *
 * Callers: `null` means "not submitted yet"; `[]` means "submitted but no
 * docs returned" (shouldn't happen in practice once the user has submitted,
 * but is structurally possible if the doc was deleted out-of-band).
 */
export function useWagerSubmissions(
  uid: string | null,
  wagerId: string,
): { submissions: WagerSubmission[] | null; loading: boolean; error: string | null } {
  const { submission, loading: subLoading } = useUserSubmission(uid, wagerId);
  const hasSubmitted = !subLoading && submission !== null;

  const [submissions, setSubmissions] = useState<WagerSubmission[] | null>(null);
  // `snapped` flips true after the first onSnapshot fire (success or error).
  // `loading` is derived from this so we stay in the loading state for the
  // render where `hasSubmitted` just flipped true but the effect hasn't yet
  // re-subscribed. Without it, parents see `loading: false, submissions: null`
  // for a frame and bail to "Reveal unavailable".
  const [snapped, setSnapped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSubmitted) {
      setSubmissions(null);
      setSnapped(false);
      setError(null);
      return;
    }
    setSnapped(false);
    setError(null);
    return subscribeWithRetry({
      label: 'useWagerSubmissions LIST',
      open: (onErr) =>
        onSnapshot(
          collection(db, 'wagers', wagerId, 'submissions'),
          (snap) => {
            setSubmissions(
              snap.docs.map((d) => docToWagerSubmission(d.data() as Record<string, unknown>)),
            );
            setSnapped(true);
          },
          onErr,
        ),
      onFinalError: (message) => {
        setError(message);
        setSnapped(true);
      },
    });
  }, [hasSubmitted, wagerId]);

  return {
    submissions,
    loading: subLoading || (hasSubmitted && !snapped),
    error,
  };
}

/**
 * The wager's answer doc — gated by the same pattern as useWagerSubmissions:
 * returns null until the current user has submitted.
 */
export function useWagerAnswer(
  uid: string | null,
  wagerId: string,
): { answer: WagerAnswer | null; loading: boolean; error: string | null } {
  const { submission, loading: subLoading } = useUserSubmission(uid, wagerId);
  const hasSubmitted = !subLoading && submission !== null;

  const [answer, setAnswer] = useState<WagerAnswer | null>(null);
  // See useWagerSubmissions for the `snapped` rationale — same race fix.
  const [snapped, setSnapped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSubmitted) {
      setAnswer(null);
      setSnapped(false);
      setError(null);
      return;
    }
    setSnapped(false);
    setError(null);
    return subscribeWithRetry({
      label: 'useWagerAnswer GET',
      open: (onErr) =>
        onSnapshot(
          doc(db, 'wagers', wagerId, 'private', 'answer'),
          (snap) => {
            setAnswer(
              snap.exists() ? docToWagerAnswer(snap.data() as Record<string, unknown>) : null,
            );
            setSnapped(true);
          },
          onErr,
        ),
      onFinalError: (message) => {
        setError(message);
        setSnapped(true);
      },
    });
  }, [hasSubmitted, wagerId]);

  return {
    answer,
    loading: subLoading || (hasSubmitted && !snapped),
    error,
  };
}

/**
 * Denormalized wager summary for the current user. Null when uid is null or
 * when the user has never submitted a wager (cold state — no doc exists yet).
 */
export function useWagerStats(uid: string | null): { stats: WagerStats | null; loading: boolean } {
  const [stats, setStats] = useState<WagerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setStats(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', uid, 'wagerStats', 'summary');
    return onSnapshot(
      ref,
      (snap) => {
        setStats(snap.exists() ? (snap.data() as WagerStats) : null);
        setLoading(false);
      },
      (err) => {
        console.warn('[wager] useWagerStats failed', err);
        setLoading(false);
      },
    );
  }, [uid]);

  return { stats, loading };
}

// ---------------------------------------------------------------------------
// submitWager
// ---------------------------------------------------------------------------

/**
 * Submit a wager using a two-step flow:
 *
 *   Step 1 — Placeholder create:
 *     Write { uid, guess, logError: 0, score: 0, submittedAt } via setDoc.
 *     After this commits, the Firestore rules' exists() check on
 *     /wagers/{id}/submissions/{uid} passes, unlocking the answer doc.
 *
 *   Step 2 — Read the answer doc (gated):
 *     Now readable because step 1 committed.
 *
 *   Step 3 — Compute the real score:
 *     computeWagerScore(guess, trueAnswer, scoring). Infinity encoded as 9999.
 *
 *   Step 4 — Score-patch + stats + XP (atomic transaction):
 *     txn.update(submissionRef, { logError, score })
 *     txn.set(statsRef, updatedStats)
 *     txn.update(userRef, { xp, weeklyXp, weekKey })
 *
 * If step 4 fails (network), the submission persists at score: 0 / logError: 0.
 * useUserSubmission detects this placeholder state and calls ensureSubmissionScored
 * to self-heal. Stats are only updated after the real score is known (step 4 or
 * ensureSubmissionScored) — the placeholder is transient and must not pollute stats.
 *
 * Resolves with the final WagerSubmission (real score, not placeholder).
 * Rejects with { code: 'AlreadySubmitted' } on a duplicate.
 */
export async function submitWager(input: {
  uid: string;
  wagerId: string;
  guess: number;
  scoring: WagerScoring;
}): Promise<WagerSubmission> {
  const { uid, wagerId, guess, scoring } = input;

  const submissionRef = doc(db, 'wagers', wagerId, 'submissions', uid);
  const answerRef = doc(db, 'wagers', wagerId, 'private', 'answer');
  const statsRef = doc(db, 'users', uid, 'wagerStats', 'summary');
  const userRef = doc(db, 'users', uid);

  // Duplicate guard — checked before the create to give a clean error code.
  // Not fully atomic (two-tab race is theoretically possible), but acceptable
  // for a single-user single-device submit path.
  const existingSnap = await getDoc(submissionRef);
  if (existingSnap.exists()) {
    const err = new Error('AlreadySubmitted');
    (err as Error & { code: string }).code = 'AlreadySubmitted';
    throw err;
  }

  // Step 1: write placeholder. Satisfies the rules create gate so that step 2
  // (the gated answer read) can proceed. Stats are NOT updated here.
  // On failure: preserve the original Firebase error message so the UI (and
  // logs) can surface a useful diagnosis instead of a generic wrapper. The
  // earlier wrap-in-PermissionDenied masked rule failures we needed to see.
  try {
    await setDoc(submissionRef, {
      uid,
      guess,
      logError: 0,
      score: 0,
      submittedAt: serverTimestamp(),
    });
  } catch (err) {
    const origMessage = err instanceof Error ? err.message : String(err);
    const origCode = (err as { code?: string })?.code;
    const wrapped = new Error(
      `Wager submission write failed${origCode ? ` (${origCode})` : ''}: ${origMessage}`,
    );
    (wrapped as Error & { code: string; cause: unknown }).code = origCode ?? 'SubmissionWriteFailed';
    (wrapped as Error & { code: string; cause: unknown }).cause = err;
    throw wrapped;
  }

  // Step 2: read the answer doc — now accessible because the submission exists.
  const answerSnap = await getDoc(answerRef);
  if (!answerSnap.exists()) {
    // Missing answer doc is an admin data error; return placeholder for now.
    // Self-heal will retry when the answer doc is added.
    console.warn('[wager] answer doc not found for wagerId', wagerId);
    return { uid, guess, logError: 0, score: 0, submittedAt: Date.now() };
  }
  const { trueAnswer } = docToWagerAnswer(answerSnap.data() as Record<string, unknown>);

  // Step 3: compute the real score.
  const { logError: rawLogError, score } = computeWagerScore(guess, trueAnswer, scoring);
  // Encode Infinity (non-positive guess in 'log' scoring) as INFINITY_SENTINEL for storage.
  const effectiveLogError = Number.isFinite(rawLogError) ? rawLogError : INFINITY_SENTINEL;

  // Step 4: atomically patch the submission, update stats, and grant XP.
  // On failure, we log and swallow — the placeholder stays at score: 0 / logError: 0
  // and useUserSubmission will call ensureSubmissionScored to self-heal.
  try {
    await runTransaction(db, async (txn) => {
      const [statsSnap, userSnap] = await Promise.all([
        txn.get(statsRef),
        txn.get(userRef),
      ]);

      const oldStats = statsSnap.exists() ? (statsSnap.data() as WagerStats) : null;
      const updatedStats = computeUpdatedStats(oldStats, wagerId, score, effectiveLogError);

      const storedWeekKey = userSnap.exists()
        ? ((userSnap.data() as Record<string, unknown>).weekKey as string | null | undefined)
        : null;
      const weekKey = currentWeekKey();
      const sameWeek = storedWeekKey === weekKey;
      const xpGrant = wagerXpForScore(score);

      txn.update(submissionRef, { logError: effectiveLogError, score });
      txn.set(statsRef, updatedStats);
      txn.update(userRef, {
        xp: increment(xpGrant),
        weeklyXp: sameWeek ? increment(xpGrant) : xpGrant,
        weekKey,
      });
    });
  } catch (err) {
    console.warn('[wager] score-patch transaction failed; self-heal will retry', err);
  }

  return {
    uid,
    guess,
    logError: effectiveLogError,
    score,
    submittedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// ensureSubmissionScored
// ---------------------------------------------------------------------------

/**
 * Idempotent self-healer: if the user's submission for this wager is in
 * placeholder state (score === 0 && logError === 0), reads the answer doc,
 * computes the real score, and applies the score-patch + stats + XP transaction.
 *
 * No-op if:
 *   - The submission does not exist.
 *   - score !== 0 or logError !== 0 (already scored, including the Infinity
 *     sentinel case where logError === 9999 and score === 0).
 *   - The answer doc is missing.
 *
 * Called automatically by useUserSubmission when it observes a placeholder.
 * Can also be called directly for testing.
 */
export async function ensureSubmissionScored(input: {
  uid: string;
  wagerId: string;
  scoring: WagerScoring;
}): Promise<void> {
  const { uid, wagerId, scoring } = input;

  const submissionRef = doc(db, 'wagers', wagerId, 'submissions', uid);
  const answerRef = doc(db, 'wagers', wagerId, 'private', 'answer');
  const statsRef = doc(db, 'users', uid, 'wagerStats', 'summary');
  const userRef = doc(db, 'users', uid);

  const submissionSnap = await getDoc(submissionRef);
  if (!submissionSnap.exists()) return;

  const sub = docToWagerSubmission(submissionSnap.data() as Record<string, unknown>);
  // Guard: only heal the placeholder state. A non-zero score or logError means
  // the submission is already scored (including the Infinity/9999 sentinel).
  if (sub.score !== 0 || sub.logError !== 0) return;

  const answerSnap = await getDoc(answerRef);
  if (!answerSnap.exists()) return;

  const { trueAnswer } = docToWagerAnswer(answerSnap.data() as Record<string, unknown>);
  const { logError: rawLogError, score } = computeWagerScore(sub.guess, trueAnswer, scoring);
  const effectiveLogError = Number.isFinite(rawLogError) ? rawLogError : INFINITY_SENTINEL;

  try {
    await runTransaction(db, async (txn) => {
      const [statsSnap, userSnap] = await Promise.all([
        txn.get(statsRef),
        txn.get(userRef),
      ]);

      const oldStats = statsSnap.exists() ? (statsSnap.data() as WagerStats) : null;
      const updatedStats = computeUpdatedStats(oldStats, wagerId, score, effectiveLogError);

      const storedWeekKey = userSnap.exists()
        ? ((userSnap.data() as Record<string, unknown>).weekKey as string | null | undefined)
        : null;
      const weekKey = currentWeekKey();
      const sameWeek = storedWeekKey === weekKey;
      const xpGrant = wagerXpForScore(score);

      txn.update(submissionRef, { logError: effectiveLogError, score });
      txn.set(statsRef, updatedStats);
      txn.update(userRef, {
        xp: increment(xpGrant),
        weeklyXp: sameWeek ? increment(xpGrant) : xpGrant,
        weekKey,
      });
    });
  } catch (err) {
    // A rules rejection here typically means a concurrent call already patched
    // the score. Log but don't rethrow — the patch succeeded via the other call.
    console.warn('[wager] ensureSubmissionScored transaction failed', err);
  }
}
