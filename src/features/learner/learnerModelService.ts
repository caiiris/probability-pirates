/**
 * WP-5 — Learner model Firestore service.
 *
 * Best-effort read-modify-write of users/{uid}/learnerModel/state.
 * Never throws — errors are logged with console.warn.
 *
 * Depends on the `db` singleton from @/lib/firebase and the pure math from
 * ./learnerModel.
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  emptyModel,
  applyPracticeAttempt,
  applyLessonExposure,
} from './learnerModel';
import type { LearnerModel, MisconceptionSource } from './learnerModel';
import type { SkillId } from '@/content/skills';
import type { MisconceptionKey } from '@/content/misconceptions';

// ─── Firestore path helper ────────────────────────────────────────────────────

function stateRef(uid: string) {
  return doc(db, 'users', uid, 'learnerModel', 'state');
}

// ─── recordPracticeAttempt (Engine A) ────────────────────────────────────────

/**
 * Read the current learner-model state, apply one practice attempt (Engine A —
 * moves Elo), and write the result back. Best-effort; never throws.
 */
export async function recordPracticeAttempt(
  uid: string,
  input: {
    skills: SkillId[];
    wasCorrect: boolean;
    difficulty?: number;
    /** Legacy back-compat field — treated as source 'trap'. */
    misconceptionKey?: MisconceptionKey | null;
    /** Preferred C-MC3 field. If present, overrides misconceptionKey. */
    misconceptionSignal?: { key: MisconceptionKey; source: MisconceptionSource } | null;
  },
): Promise<void> {
  try {
    const ref = stateRef(uid);
    const snap = await getDoc(ref);
    const now = Date.now();
    const current: LearnerModel = snap.exists()
      ? (snap.data() as LearnerModel)
      : emptyModel(now);
    const updated = applyPracticeAttempt(current, { ...input, now });
    await setDoc(ref, updated);
  } catch (err) {
    console.warn('[learnerModelService] recordPracticeAttempt failed:', err);
  }
}

// ─── recordLessonExposure (Engine B) ─────────────────────────────────────────

/**
 * Read the current learner-model state, apply one lesson first-attempt outcome
 * (Engine B — exposure/struggle/misconception, NEVER moves Elo), and write it
 * back. Best-effort; never throws.
 */
export async function recordLessonExposure(
  uid: string,
  input: {
    skills: SkillId[];
    firstTryCorrect: boolean;
    misconceptionKey?: MisconceptionKey | null;
  },
): Promise<void> {
  try {
    const ref = stateRef(uid);
    const snap = await getDoc(ref);
    const now = Date.now();
    const current: LearnerModel = snap.exists()
      ? (snap.data() as LearnerModel)
      : emptyModel(now);
    const updated = applyLessonExposure(current, { ...input, now });
    await setDoc(ref, updated);
  } catch (err) {
    console.warn('[learnerModelService] recordLessonExposure failed:', err);
  }
}

// ─── subscribeLearnerModel ────────────────────────────────────────────────────

/**
 * Subscribe to real-time updates of the learner-model state doc.
 * Calls `cb(null)` when the doc does not exist or on error.
 * Returns the unsubscribe function.
 */
export function subscribeLearnerModel(
  uid: string,
  cb: (m: LearnerModel | null) => void,
): () => void {
  const ref = stateRef(uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        cb(snap.data() as LearnerModel);
      } else {
        cb(null);
      }
    },
    (err) => {
      console.warn('[learnerModelService] subscribeLearnerModel error:', err);
      cb(null);
    },
  );
}
