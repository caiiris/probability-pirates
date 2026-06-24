import { useState, useEffect } from 'react';
import { subscribeToMonthEvents } from './scheduleService';
import type { StudyEvent } from './scheduleService';

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: StudyEvent[] };

/**
 * Real-time subscription to study events for the given YYYY-MM month.
 * Re-subscribes automatically when uid or yearMonth changes.
 */
export function useStudyEvents(uid: string, yearMonth: string): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!uid) {
      setState({ status: 'ready', data: [] });
      return;
    }
    setState({ status: 'loading' });
    const unsub = subscribeToMonthEvents(uid, yearMonth, (events) => {
      setState({ status: 'ready', data: events });
    });
    return unsub;
  }, [uid, yearMonth]);

  return state;
}
