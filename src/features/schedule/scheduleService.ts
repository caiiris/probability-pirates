import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { eventTypeOf, type EventType } from './eventTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudyEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  /** Closed enum, see ./eventTypes. Legacy events without this field are
   *  normalized to 'study' at read time via eventTypeOf(). */
  eventType: EventType;
  /** Optional 24-hour "HH:MM" — useful for tests and timed sessions. */
  time?: string;
  lessonId?: string;
  notes?: string;
  completed: boolean;
};

type NewStudyEvent = Omit<StudyEvent, 'id' | 'completed'>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventsRef(uid: string) {
  return collection(db, 'users', uid, 'studyEvents');
}

function eventRef(uid: string, eventId: string) {
  return doc(db, 'users', uid, 'studyEvents', eventId);
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function addStudyEvent(uid: string, event: NewStudyEvent): Promise<string> {
  const ref = await addDoc(eventsRef(uid), {
    ...event,
    completed: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStudyEvent(
  uid: string,
  eventId: string,
  updates: Partial<Omit<StudyEvent, 'id'>>,
): Promise<void> {
  await updateDoc(eventRef(uid, eventId), updates);
}

export async function deleteStudyEvent(uid: string, eventId: string): Promise<void> {
  await deleteDoc(eventRef(uid, eventId));
}

export async function toggleStudyEvent(
  uid: string,
  eventId: string,
  completed: boolean,
): Promise<void> {
  await updateDoc(eventRef(uid, eventId), { completed });
}

// ---------------------------------------------------------------------------
// Real-time listener for a month range
// ---------------------------------------------------------------------------

/**
 * Subscribes to all study events in the given ISO month (YYYY-MM).
 * Also fetches one week before and after for calendar edge days.
 * Returns an unsubscribe function.
 */
export function subscribeToMonthEvents(
  uid: string,
  yearMonth: string, // "YYYY-MM"
  onData: (events: StudyEvent[]) => void,
): () => void {
  const [y, m] = yearMonth.split('-').map(Number);
  // Cover from last week of previous month to first week of next month
  const start = new Date(y, m - 2, 22); // a bit before the month start
  const end = new Date(y, m, 8); // a bit after the month end

  const startStr = toDateString(start);
  const endStr = toDateString(end);

  const q = query(
    eventsRef(uid),
    where('date', '>=', startStr),
    where('date', '<=', endStr),
    orderBy('date'),
  );

  return onSnapshot(
    q,
    (snap) => {
      const events: StudyEvent[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title as string,
          date: data.date as string,
          eventType: eventTypeOf(data.eventType),
          time: (data.time as string | undefined) || undefined,
          lessonId: data.lessonId as string | undefined,
          notes: data.notes as string | undefined,
          completed: data.completed as boolean,
        };
      });
      onData(events);
    },
    (err) => {
      // Surface as "no events" rather than leaving consumers stuck in `loading`
      // forever on a permission/index/transient failure.
      console.warn('[scheduleService] subscribeToMonthEvents error:', err);
      onData([]);
    },
  );
}

/**
 * Subscribes to a single day's events (YYYY-MM-DD). Used by the home-screen
 * reminder, which only ever cares about "today" — scoping the query to one day
 * is the cheapest read and means past days fall out automatically as the date
 * rolls over. Returns an unsubscribe function.
 */
export function subscribeToDayEvents(
  uid: string,
  dateStr: string,
  onData: (events: StudyEvent[]) => void,
): () => void {
  const q = query(eventsRef(uid), where('date', '==', dateStr));

  return onSnapshot(
    q,
    (snap) => {
      const events: StudyEvent[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title as string,
          date: data.date as string,
          eventType: eventTypeOf(data.eventType),
          time: (data.time as string | undefined) || undefined,
          lessonId: data.lessonId as string | undefined,
          notes: data.notes as string | undefined,
          completed: data.completed as boolean,
        };
      });
      onData(events);
    },
    (err) => {
      console.warn('[scheduleService] subscribeToDayEvents error:', err);
      onData([]);
    },
  );
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
