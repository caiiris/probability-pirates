import { GraduationCap, NotebookPen, BookOpen, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Pascal study-event taxonomy.
 *
 * Why a closed enum, not a free-text "tag" field: tests are the high-stakes
 * case the user cares about most. Letting them stand out visually (color,
 * icon, calendar dot) is a UX win the page is built around — that requires
 * a predictable set the renderer can switch on.
 *
 * Adding a new type means: append here, add metadata below, and extend the
 * Firestore rules validation in firebase/firestore.rules.
 */
export type EventType = 'study' | 'test' | 'homework' | 'other';

export const EVENT_TYPES: EventType[] = ['study', 'test', 'homework', 'other'];

export const DEFAULT_EVENT_TYPE: EventType = 'study';

type EventTypeMeta = {
  label: string;
  icon: LucideIcon;
  /** Tailwind class fragments scoped per surface. Bg + text-color combos that
   *  exist in the design tokens (see src/index.css). */
  badgeClass: string;
  /** Hex/CSS var fed to the calendar dot. */
  dotColor: string;
};

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  study: {
    label: 'Study',
    icon: BookOpen,
    badgeClass: 'bg-primary/10 text-primary',
    dotColor: 'var(--primary)',
  },
  test: {
    label: 'Test',
    icon: GraduationCap,
    badgeClass: 'bg-destructive/10 text-destructive',
    dotColor: 'var(--destructive)',
  },
  homework: {
    label: 'Homework',
    icon: NotebookPen,
    // amber-600/amber-100-ish; defined inline so we don't need a new token
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    dotColor: '#d97706',
  },
  other: {
    label: 'Other',
    icon: Calendar,
    badgeClass: 'bg-muted text-muted-foreground',
    dotColor: 'var(--muted-foreground)',
  },
};

/** Defensive accessor — handles legacy events missing the field. */
export function eventTypeOf(value: unknown): EventType {
  return EVENT_TYPES.includes(value as EventType) ? (value as EventType) : DEFAULT_EVENT_TYPE;
}

/** Validate an "HH:MM" 24-hour time string. Empty/undefined returns true. */
export function isValidTime(value: string | undefined): boolean {
  if (!value) return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Format "HH:MM" as a friendly 12-hour display (e.g. "2:30 PM"). */
export function formatTime(value: string | undefined): string {
  if (!value || !isValidTime(value)) return '';
  const [hStr, mStr] = value.split(':');
  const h = Number(hStr);
  const m = mStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}
