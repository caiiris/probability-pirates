/**
 * usePracticeState — per-topic adaptive state hook (WP-6b).
 *
 * Reads and writes `users/{uid}/practiceState/{topicId}` per contract C8:
 *   { rating, attempts, correct, lastSeenTemplateIds[], updatedAt }
 *
 * Exposes: { rating, recentTemplateIds, recordResult(wasCorrect, difficulty, templateId) }
 *
 * Design:
 * - Optimistic local state: recordResult updates React state immediately, then
 *   persists to Firestore in the background (never blocks the UI).
 * - Elo update uses the same formula / ELO_K constant from learnerModel.ts
 *   (imported, NOT re-implemented).
 * - lastSeenTemplateIds is trimmed to the last 3 entries.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_RATING, ELO_K } from '@/features/learner/learnerModel';
import type { Topic } from '@/content/skills';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the Firestore doc at users/{uid}/practiceState/{topicId} (C8). */
export type PracticeStateDoc = {
  rating: number;
  attempts: number;
  correct: number;
  lastSeenTemplateIds: string[];
  updatedAt: number;
};

export type PracticeStateResult = {
  /** Current per-topic Elo rating (defaults to DEFAULT_RATING while loading). */
  rating: number;
  /** Last 3 templateIds served in this topic (for anti-repeat logic). */
  recentTemplateIds: string[];
  /**
   * Call after each graded answer.
   * Applies the Elo update in local state immediately and persists to Firestore
   * in the background (fire-and-forget, never throws).
   */
  recordResult: (wasCorrect: boolean, difficulty: number, templateId: string) => void;
};

// ─── Elo helper (same formula as applyPracticeAttempt in learnerModel.ts) ────

/**
 * Apply one Bounty/Elo update and return the new rating.
 * Formula: r' = r + K * (actual - expected), where expected = 1/(1+10^((d-r)/400)).
 * No delayed-retrieval bonus here — that bonus applies to per-skill model updates
 * (Engine A); topic-level rating uses the simpler form.
 *
 * Product rule: below-level problems cannot reduce Bounty. Learners may use
 * easier practice to warm up without risking a visible rating loss.
 */
export function applyElo(
  currentRating: number,
  difficulty: number,
  wasCorrect: boolean,
): number {
  const actual = wasCorrect ? 1 : 0;
  const expected = 1 / (1 + Math.pow(10, (difficulty - currentRating) / 400));
  const nextRating = currentRating + ELO_K * (actual - expected);
  return difficulty < currentRating ? Math.max(currentRating, nextRating) : nextRating;
}

/**
 * Append templateId to the list and keep only the last 3 entries.
 * Pure function; original list is not mutated.
 */
export function trimRecentTemplateIds(list: string[], templateId: string): string[] {
  return [...list, templateId].slice(-3);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Reads/writes practice state for a single (uid, topic) pair.
 * On mount it fetches the current doc once (no real-time listener — the doc
 * is user-owned and only written by this device). Subsequent updates are
 * applied optimistically to local state, then written in the background.
 */
export function usePracticeState(
  uid: string | null | undefined,
  topic: Topic,
): PracticeStateResult {
  const [state, setState] = useState<PracticeStateDoc>({
    rating: DEFAULT_RATING,
    attempts: 0,
    correct: 0,
    lastSeenTemplateIds: [],
    updatedAt: Date.now(),
  });

  // Keep a ref to the latest state for the async write without stale-closure issues.
  const stateRef = useRef(state);
  stateRef.current = state;

  // True once the learner has answered at least once this (uid, topic) session.
  // Guards against a slow initial fetch resolving AFTER an optimistic update and
  // clobbering it with the pre-answer snapshot.
  const dirtyRef = useRef(false);

  // Fetch the doc once on (uid, topic) mount.
  useEffect(() => {
    if (!uid) return;
    // New (uid, topic) → fresh optimistic baseline; allow the fetch to hydrate.
    dirtyRef.current = false;
    const ref = doc(db, 'users', uid, 'practiceState', topic);
    getDoc(ref)
      .then((snap) => {
        // Don't overwrite an answer the learner already recorded while we waited.
        if (dirtyRef.current) return;
        if (snap.exists()) {
          const data = snap.data() as PracticeStateDoc;
          setState({ ...data, lastSeenTemplateIds: data.lastSeenTemplateIds ?? [] });
        }
      })
      .catch((err) => {
        console.warn('[usePracticeState] initial fetch failed:', err);
      });
  }, [uid, topic]);

  const recordResult = useCallback(
    (wasCorrect: boolean, difficulty: number, templateId: string) => {
      dirtyRef.current = true;
      const prev = stateRef.current;
      const newRating = applyElo(prev.rating, difficulty, wasCorrect);
      const newState: PracticeStateDoc = {
        rating: newRating,
        attempts: prev.attempts + 1,
        correct: prev.correct + (wasCorrect ? 1 : 0),
        lastSeenTemplateIds: trimRecentTemplateIds(prev.lastSeenTemplateIds, templateId),
        updatedAt: Date.now(),
      };

      // Optimistic: update local state immediately.
      setState(newState);

      // Background persist — never throw, never block UI.
      if (uid) {
        const ref = doc(db, 'users', uid, 'practiceState', topic);
        setDoc(ref, newState).catch((err) => {
          console.warn('[usePracticeState] persist failed:', err);
        });
      }
    },
    [uid, topic],
  );

  return {
    rating: state.rating,
    recentTemplateIds: state.lastSeenTemplateIds,
    recordResult,
  };
}
