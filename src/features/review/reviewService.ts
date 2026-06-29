/**
 * Spaced-review Firestore service — best-effort read-modify-write of
 * `users/{uid}/reviewSchedule/state`. Never throws (errors are logged and the
 * gate fails open), mirroring `learnerModelService`.
 */

import { doc, getDoc, runTransaction, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SKILLS } from '@/content/skills';
import type { SkillId, Topic } from '@/content/skills';
import { TEMPLATES } from '@/features/practice/practiceEngine';
import {
  emptyReviewSchedule,
  seedSkills,
  recordResultInSchedule,
  markSatisfied,
} from './reviewSchedule';
import type { ReviewSchedule } from './reviewSchedule';

function stateRef(uid: string) {
  return doc(db, 'users', uid, 'reviewSchedule', 'state');
}

/**
 * Skills whose topic has at least one practice template, so a warm-up item can
 * actually be generated for them. A due skill outside this set is dropped from
 * the gate (SR2). Computed once at module load from the static registry.
 */
const topicsWithTemplates: ReadonlySet<Topic> = new Set(TEMPLATES.map((t) => t.topic));
export const REVIEWABLE_SKILLS: ReadonlySet<SkillId> = new Set(
  (Object.keys(SKILLS) as SkillId[]).filter((skill) => topicsWithTemplates.has(SKILLS[skill].topic)),
);

async function read(uid: string): Promise<ReviewSchedule> {
  const snap = await getDoc(stateRef(uid));
  return snap.exists() ? (snap.data() as ReviewSchedule) : emptyReviewSchedule(Date.now());
}

/** Get the current schedule, or null on any error (gate fails open). */
export async function getReviewSchedule(uid: string): Promise<ReviewSchedule | null> {
  try {
    return await read(uid);
  } catch (err) {
    console.warn('[reviewService] getReviewSchedule failed:', err);
    return null;
  }
}

/**
 * Run a read-modify-write of the schedule doc inside a transaction so the
 * three writers (lesson-complete seed, warm-up result, gate-satisfied) can't
 * drop each other's updates when they fire close together. Best-effort.
 */
async function mutateSchedule(
  uid: string,
  mutate: (prev: ReviewSchedule, now: number) => ReviewSchedule,
): Promise<void> {
  const ref = stateRef(uid);
  await runTransaction(db, async (tx) => {
    const now = Date.now();
    const snap = await tx.get(ref);
    const prev = snap.exists() ? (snap.data() as ReviewSchedule) : emptyReviewSchedule(now);
    tx.set(ref, mutate(prev, now));
  });
}

/** Seed a set of just-learned skills into the schedule. Best-effort. */
export async function seedReviewSkills(uid: string, skills: readonly SkillId[]): Promise<void> {
  if (!uid || skills.length === 0) return;
  try {
    await mutateSchedule(uid, (prev, now) => seedSkills(prev, skills, now));
  } catch (err) {
    console.warn('[reviewService] seedReviewSkills failed:', err);
  }
}

/** Record one warm-up review outcome for a skill. Best-effort. */
export async function recordReviewResult(
  uid: string,
  skill: SkillId,
  correct: boolean,
): Promise<void> {
  if (!uid) return;
  try {
    await mutateSchedule(uid, (prev, now) => recordResultInSchedule(prev, skill, correct, now));
  } catch (err) {
    console.warn('[reviewService] recordReviewResult failed:', err);
  }
}

/** Mark the warm-up gate satisfied for the given local day. Best-effort. */
export async function markWarmupSatisfied(uid: string, todayLocalDate: string): Promise<void> {
  if (!uid) return;
  try {
    await mutateSchedule(uid, (prev, now) => markSatisfied(prev, todayLocalDate, now));
  } catch (err) {
    console.warn('[reviewService] markWarmupSatisfied failed:', err);
  }
}

/**
 * Subscribe to the schedule doc. Calls `cb(null)` when missing or on error.
 * Returns the unsubscribe function.
 */
export function subscribeReviewSchedule(
  uid: string,
  cb: (s: ReviewSchedule | null) => void,
): () => void {
  return onSnapshot(
    stateRef(uid),
    (snap) => cb(snap.exists() ? (snap.data() as ReviewSchedule) : null),
    (err) => {
      console.warn('[reviewService] subscribeReviewSchedule error:', err);
      cb(null);
    },
  );
}
