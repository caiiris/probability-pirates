/**
 * usePracticeXp — daily-capped XP for practice answers (WP-6c).
 *
 * Reads/writes `users/{uid}/practiceXp/today` (PracticeXpState from practiceXp.ts).
 * Exposes `award(wasCorrect): { granted, capReached }`.
 *
 * On granted > 0:
 *   - increments users/{uid}.xp + weeklyXp via awardPracticeXp in habitService
 *   - fields written: xp, weeklyXp, weekKey ONLY (never currentStreak,
 *     lastActiveDate, lessonsCompleted, stepsCompleted — per spec-practice.md)
 *
 * UI is never blocked: all Firestore writes are fire-and-forget.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { grantPracticeXp } from '@/lib/practiceXp';
import type { PracticeXpState, PracticeXpOpts } from '@/lib/practiceXp';
import { todayLocalDate } from '@/lib/streak';
import { awardPracticeXp } from '@/features/habit/habitService';
import { useAuth } from '@/features/auth/AuthProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PracticeXpAward = {
  /** XP actually granted (0 when cap is reached). */
  granted: number;
  /** True when the daily cap blocked some or all of the award. */
  capReached: boolean;
};

export type PracticeXpHookResult = {
  /**
   * Call once per graded answer.
   * Applies difficulty/try scaling (opts) and the daily cap, persists
   * practiceXp/today, and increments xp/weeklyXp in the background (never throws
   * to UI). Returns the grant result synchronously from optimistic local state.
   */
  award: (wasCorrect: boolean, opts?: PracticeXpOpts) => PracticeXpAward;
  /** Whether the cap was reached on the most recent award call (for UI display). */
  capReached: boolean;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePracticeXp(uid: string | null | undefined): PracticeXpHookResult {
  const [xpState, setXpState] = useState<PracticeXpState | undefined>(undefined);
  const [capReached, setCapReached] = useState(false);

  // Ref so the award callback always sees the latest state without going stale.
  const xpStateRef = useRef<PracticeXpState | undefined>(xpState);
  xpStateRef.current = xpState;

  // Read the profile's weekKey to decide whether to reset weeklyXp or increment.
  const authState = useAuth();
  const profileWeekKey =
    authState.status === 'authenticated' ? (authState.profile?.weekKey ?? null) : null;
  const profileWeekKeyRef = useRef<string | null | undefined>(profileWeekKey);
  profileWeekKeyRef.current = profileWeekKey;

  // Fetch today's practiceXp doc once on (uid) mount — no real-time listener needed.
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'practiceXp', 'today');
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as PracticeXpState;
          // Only restore if the doc is for today; a stale date means the cap resets.
          if (data.date === todayLocalDate()) {
            setXpState(data);
          }
        }
      })
      .catch((err) => {
        console.warn('[usePracticeXp] initial fetch failed:', err);
      });
  }, [uid]);

  const award = useCallback(
    (wasCorrect: boolean, opts: PracticeXpOpts = {}): PracticeXpAward => {
      const grant = grantPracticeXp(xpStateRef.current, todayLocalDate(), wasCorrect, opts);

      // Optimistic: update local state immediately so the next call sees the new cap.
      setXpState(grant.state);
      setCapReached(grant.capReached);

      if (uid) {
        // Persist practiceXp/today in the background.
        const xpRef = doc(db, 'users', uid, 'practiceXp', 'today');
        setDoc(xpRef, grant.state).catch((err) => {
          console.warn('[usePracticeXp] practiceXp/today persist failed:', err);
        });

        // Only write to users/{uid} when there is actual XP to add.
        if (grant.granted > 0) {
          awardPracticeXp(uid, grant.granted, profileWeekKeyRef.current).catch((err) => {
            console.warn('[usePracticeXp] awardPracticeXp failed:', err);
          });
        }
      }

      return { granted: grant.granted, capReached: grant.capReached };
    },
    [uid],
  );

  return { award, capReached };
}
