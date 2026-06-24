import {
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LessonState = 'in_progress' | 'completed';

export type LessonProgress = {
  state: LessonState;
  slotIndex: number;
  attemptId: string;
  selectedVariantIds: Record<string, string>;
  xpEarnedThisAttempt: number;
  completedAt: null | { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number } | null;
};

export type AttemptPayload =
  | { collected: string[] }
  | { numerator: number; denominator: number }
  | { selected: string[] }
  | { selectedCells: Array<[number, number]> }
  | { optionId: string }
  | { trials: number }
  | { games: number };

function progressRef(uid: string, lessonId: string) {
  return doc(db, 'users', uid, 'lessonProgress', lessonId);
}

function attemptsCol(uid: string) {
  return collection(db, 'users', uid, 'stepAttempts');
}

function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (e.g. old Safari)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Read / create
// ---------------------------------------------------------------------------

export async function getOrCreateProgress(
  uid: string,
  lessonId: string,
): Promise<LessonProgress> {
  const ref = progressRef(uid, lessonId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as LessonProgress;
  }

  const fresh: Omit<LessonProgress, 'completedAt' | 'updatedAt'> & {
    completedAt: null;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    state: 'in_progress',
    slotIndex: 0,
    attemptId: randomUUID(),
    selectedVariantIds: {},
    xpEarnedThisAttempt: 0,
    completedAt: null,
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, fresh);
  // Return a plain version — serverTimestamp resolves async on the server
  return { ...fresh, updatedAt: null };
}

// ---------------------------------------------------------------------------
// Record which variant was chosen for a slot (first visit)
// ---------------------------------------------------------------------------

export async function recordVariantSelection(
  uid: string,
  lessonId: string,
  slotId: string,
  variantId: string,
): Promise<void> {
  const ref = progressRef(uid, lessonId);
  await updateDoc(ref, {
    [`selectedVariantIds.${slotId}`]: variantId,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Record a check attempt (correct or wrong)
// ---------------------------------------------------------------------------

export async function recordAttempt(params: {
  uid: string;
  lessonId: string;
  slotId: string;
  variantId: string;
  attemptNumber: number;
  wasCorrect: boolean;
  xpAwarded: number;
  answerPayload: AttemptPayload;
  nextSlotIndex?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    uid, lessonId, slotId, variantId,
    attemptNumber, wasCorrect, xpAwarded,
    answerPayload, nextSlotIndex,
  } = params;

  try {
    const batch = writeBatch(db);

    // Append-only attempt doc
    const attemptRef = doc(attemptsCol(uid));
    batch.set(attemptRef, {
      lessonId,
      slotId,
      variantId,
      attemptNumber,
      wasCorrect,
      xpAwarded,
      answerPayload,
      createdAt: serverTimestamp(),
    });

    // Update progress doc
    const progRef = progressRef(uid, lessonId);
    const progUpdate: Record<string, unknown> = {
      xpEarnedThisAttempt: increment(xpAwarded), // accumulate all XP earned across checks this attempt
      updatedAt: serverTimestamp(),
    };
    if (wasCorrect && nextSlotIndex !== undefined) {
      progUpdate.slotIndex = nextSlotIndex;
    }
    batch.update(progRef, progUpdate);

    await batch.commit();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Advance slot index (called by lesson player after correct answer)
// ---------------------------------------------------------------------------

export async function advanceSlot(
  uid: string,
  lessonId: string,
  nextSlotIndex: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // Read current value first so we only move the index forward (monotonic)
    const snap = await getDoc(progressRef(uid, lessonId));
    const currentIndex: number = snap.exists() ? (snap.data().slotIndex ?? 0) : 0;
    if (nextSlotIndex <= currentIndex) return { ok: true }; // already at or past this index
    await updateDoc(progressRef(uid, lessonId), {
      slotIndex: nextSlotIndex,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Mark lesson completed
// ---------------------------------------------------------------------------

export async function markLessonCompleted(
  uid: string,
  lessonId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await updateDoc(progressRef(uid, lessonId), {
      state: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Start a replay (resets to slot 0 with a new attemptId)
// ---------------------------------------------------------------------------

export async function startReplay(
  uid: string,
  lessonId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const snap = await getDoc(progressRef(uid, lessonId));
    if (!snap.exists() || snap.data().state !== 'completed') {
      return { ok: false, error: 'Lesson is not completed — cannot replay.' };
    }
    await updateDoc(progressRef(uid, lessonId), {
      state: 'in_progress',
      slotIndex: 0,
      attemptId: randomUUID(),
      selectedVariantIds: {},
      xpEarnedThisAttempt: 0,
      completedAt: null,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Prune stale progress (D91)
// ---------------------------------------------------------------------------

/**
 * Delete the user's `lessonProgress` docs for a given list of lesson ids.
 * Called from a one-shot effect on Home with the ids of lessons that exist
 * in the user's progress but are now blank stubs in the catalog (e.g. a
 * lesson that was authored on a branch, then re-locked when the catalog
 * shifted). Without this, a stale progress doc keeps living in Firestore and
 * — until D91's visual guard in `LessonNode` was added — would render the
 * lesson with a green completed-check next to a "Coming soon" meta.
 *
 * Best-effort, idempotent: never throws (errors logged), no-op when there's
 * nothing to prune. Uses a single batched write so all deletes commit
 * atomically (or none do).
 */
export async function pruneStaleProgress(
  uid: string,
  staleLessonIds: string[],
): Promise<void> {
  if (!uid || staleLessonIds.length === 0) return;
  try {
    if (staleLessonIds.length === 1) {
      await deleteDoc(progressRef(uid, staleLessonIds[0]));
      return;
    }
    const batch = writeBatch(db);
    for (const lessonId of staleLessonIds) {
      batch.delete(progressRef(uid, lessonId));
    }
    await batch.commit();
  } catch (err) {
    console.warn('[pruneStaleProgress] failed:', err);
  }
}
