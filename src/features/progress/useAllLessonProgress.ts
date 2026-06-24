import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LessonProgress } from './progressService';

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: Map<string, LessonProgress> }
  | { status: 'error'; error: string };

/**
 * Subscribes to the full lessonProgress sub-collection for the current user.
 * Used by Home (hero card, lesson cards) and Profile (course progress stat).
 */
export function useAllLessonProgress(uid: string): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!uid) {
      setState({ status: 'ready', data: new Map() });
      return;
    }

    const col = collection(db, 'users', uid, 'lessonProgress');

    const unsub = onSnapshot(
      col,
      (snap) => {
        const map = new Map<string, LessonProgress>();
        snap.forEach((d) => map.set(d.id, d.data() as LessonProgress));
        setState({ status: 'ready', data: map });
      },
      (err) => {
        setState({ status: 'error', error: err.message });
      },
    );

    return unsub;
  }, [uid]);

  return state;
}
