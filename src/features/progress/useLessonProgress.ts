import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LessonProgress } from './progressService';

type State =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; data: LessonProgress }
  | { status: 'error'; error: string };

/**
 * Subscribes to a single lesson's progress doc for the current user.
 * Returns 'empty' when the doc doesn't exist yet (lesson not started).
 */
export function useLessonProgress(uid: string, lessonId: string): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!uid || !lessonId) {
      setState({ status: 'empty' });
      return;
    }

    setState({ status: 'loading' });
    const ref = doc(db, 'users', uid, 'lessonProgress', lessonId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState({ status: 'empty' });
        } else {
          setState({ status: 'ready', data: snap.data() as LessonProgress });
        }
      },
      (err) => {
        setState({ status: 'error', error: err.message });
      },
    );

    return unsub;
  }, [uid, lessonId]);

  return state;
}
