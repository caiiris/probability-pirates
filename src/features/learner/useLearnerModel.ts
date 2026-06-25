/**
 * WP-7 — Thin React hook wrapping subscribeLearnerModel.
 *
 * Subscribes to the learner-model Firestore doc for the given uid, exposes
 * { model, loading }, and unsubscribes cleanly on uid change or unmount.
 *
 * When uid is null (unauthenticated / still loading auth), the hook is a
 * no-op: model stays null and loading is false immediately.
 */

import { useEffect, useState } from 'react';
import type { LearnerModel } from './learnerModel';
import { subscribeLearnerModel } from './learnerModelService';

export function useLearnerModel(uid: string | null): {
  model: LearnerModel | null;
  loading: boolean;
} {
  const [model, setModel] = useState<LearnerModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setModel(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsub = subscribeLearnerModel(uid, (m) => {
      setModel(m);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { model, loading };
}
