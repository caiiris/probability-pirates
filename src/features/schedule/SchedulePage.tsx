import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  BookOpen,
  Check,
  Clock,
  CalendarDays,
  ChevronRight as ChevronRightSm,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ERROR_COPY } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLessons } from '@/features/flags/useLessons';
import type { Lesson } from '@/content/types';
import { useStudyEvents } from './useStudyEvents';
import { addStudyEvent, deleteStudyEvent, toggleStudyEvent } from './scheduleService';
import type { StudyEvent } from './scheduleService';
import {
  EVENT_TYPES,
  EVENT_TYPE_META,
  DEFAULT_EVENT_TYPE,
  isValidTime,
  formatTime,
  type EventType,
} from './eventTypes';
import { track } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayString(): string {
  return toDateString(new Date());
}

function yearMonthOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** All calendar cells for a given month (may include leading/trailing days from adjacent months). */
function calendarCells(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const lastDay = new Date(year, month + 1, 0);

  const cells: Date[] = [];
  for (let i = startOffset; i > 0; i--) {
    cells.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  // Pad to a complete 6-row grid
  while (cells.length % 7 !== 0) {
    cells.push(new Date(year, month + 1, cells.length - lastDay.getDate() - startOffset + 1));
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Month Calendar
// ---------------------------------------------------------------------------

function MonthCalendar({
  year,
  month,
  selected,
  eventsByDate,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  selected: string;
  eventsByDate: Map<string, StudyEvent[]>;
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const cells = calendarCells(year, month);
  const today = todayString();

  // Wall-calendar frame: deep red title band, white body, Sundays in red — the
  // classic kitchen-calendar treatment, restrained enough for a study app. The
  // frame visually anchors the page (since the rest of Schedule sits on plain
  // white) and the red-Sunday convention is an instant "calendar" cue.
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--coral-deep)]/25 bg-card shadow-soft">
      {/* Red title band */}
      <div
        className="flex items-center justify-between px-3 py-2 text-white"
        style={{ background: 'var(--coral-deep)' }}
      >
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className="grid h-7 w-7 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          className="grid h-7 w-7 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers — Sunday in red, weekdays muted. */}
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/40 text-center">
        {DAY_ABBR.map((d, i) => (
          <div
            key={d}
            className={`py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
              i === 0 ? 'text-[color:var(--coral-deep)]' : 'text-muted-foreground'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 p-1.5 gap-y-1">
        {cells.map((cell, i) => {
          const dateStr = toDateString(cell);
          const inMonth = cell.getMonth() === month;
          const isToday = dateStr === today;
          const isSelected = dateStr === selected;
          const isSunday = cell.getDay() === 0;
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const hasEvents = dayEvents.length > 0;
          // Unique pending event types for this day, in their declared order
          // so the dot row reads consistently across the calendar.
          const pendingTypes = EVENT_TYPES.filter((t) =>
            dayEvents.some((e) => !e.completed && e.eventType === t),
          );
          const hasCompleted = dayEvents.some((e) => e.completed);

          // Text color: selected = white, today's ring keeps default ink, Sunday
          // in-month is red (wall-calendar tradition), out-of-month is faded.
          const textColor = isSelected
            ? 'text-primary-foreground'
            : !inMonth
              ? 'text-muted-foreground/40'
              : isSunday
                ? 'text-[color:var(--coral-deep)]'
                : 'text-foreground';

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(dateStr)}
              aria-label={`${dateStr}${hasEvents ? ', has events' : ''}`}
              aria-pressed={isSelected}
              className={`
                relative flex flex-col items-center justify-start pt-1.5 pb-2 rounded-lg
                text-sm font-medium transition-colors select-none touch-manipulation
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${textColor}
                ${
                  isSelected
                    ? 'bg-primary'
                    : isToday
                      ? 'ring-2 ring-[color:var(--coral-deep)]/70'
                      : 'hover:bg-muted'
                }
              `}
            >
              <span>{cell.getDate()}</span>
              {hasEvents && (
                <span className="flex gap-0.5 mt-0.5">
                  {pendingTypes.map((t) => (
                    <span
                      key={t}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isSelected ? 'currentColor' : EVENT_TYPE_META[t].dotColor,
                        opacity: isSelected ? 0.85 : 1,
                      }}
                    />
                  ))}
                  {hasCompleted && pendingTypes.length === 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/60' : 'bg-[color:var(--success)]'}`}
                    />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event list for a selected day
// ---------------------------------------------------------------------------

function DayEventList({
  uid,
  date,
  events,
  onAdd,
  onOpenDetail,
}: {
  uid: string;
  date: string;
  events: StudyEvent[];
  onAdd: () => void;
  onOpenDetail: (event: StudyEvent) => void;
}) {
  const [d, m, y] = (() => {
    const dt = new Date(date + 'T00:00');
    return [dt.getDate(), MONTH_NAMES[dt.getMonth()], dt.getFullYear()];
  })();

  async function handleToggle(event: StudyEvent) {
    try {
      await toggleStudyEvent(uid, event.id, !event.completed);
    } catch {
      toast.error(ERROR_COPY.schedule.update);
    }
  }

  async function handleDelete(eventId: string) {
    try {
      await deleteStudyEvent(uid, eventId);
    } catch {
      toast.error(ERROR_COPY.schedule.delete);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {DAY_ABBR[new Date(date + 'T00:00').getDay()]}, {m} {d}, {y}
        </h3>
        <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-9 w-9" strokeWidth={1.5} />}
          title="Nothing planned for this day"
          description="Chart a test, homework, or study session to map out your week."
          action={
            <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add an event
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {events.map((event) => {
            const meta = EVENT_TYPE_META[event.eventType];
            const TypeIcon = meta.icon;
            return (
              <li
                key={event.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors
                  ${event.completed ? 'bg-muted/40 border-border/60' : 'bg-card border-border'}`}
                // Subtle left-edge accent in the event-type color. Tests in
                // particular need to read at a glance vs casual study sessions.
                style={
                  event.completed ? undefined : { boxShadow: `inset 3px 0 0 ${meta.dotColor}` }
                }
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggle(event)}
                  aria-label={event.completed ? 'Mark incomplete' : 'Mark complete'}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
                    ${
                      event.completed
                        ? 'border-[color:var(--success)] bg-[color:var(--success)] text-white'
                        : 'border-muted-foreground/40 hover:border-primary'
                    }`}
                >
                  {event.completed && <Check className="w-3 h-3" />}
                </button>

                {/* Content — tap to open full details */}
                <button
                  type="button"
                  onClick={() => onOpenDetail(event)}
                  aria-label={`View details for "${event.title}"`}
                  className="flex-1 min-w-0 text-left group"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.badgeClass}`}
                    >
                      <TypeIcon className="w-3 h-3" aria-hidden="true" />
                      {meta.label}
                    </span>
                    {event.time && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {formatTime(event.time)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm font-medium leading-snug mt-1 group-hover:text-primary transition-colors ${event.completed ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {event.title}
                  </p>
                  {/* At-a-glance hints; full lesson title + notes live in the detail dialog */}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {event.lessonId && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <BookOpen className="w-3 h-3" aria-hidden="true" />
                        Lesson linked
                      </span>
                    )}
                    {event.notes && (
                      <span className="text-xs text-muted-foreground truncate max-w-[12rem]">
                        {event.notes}
                      </span>
                    )}
                  </div>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(event.id)}
                  aria-label={`Delete "${event.title}"`}
                  className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Event Dialog
// ---------------------------------------------------------------------------

function AddEventDialog({
  open,
  defaultDate,
  uid,
  onOpenChange,
}: {
  open: boolean;
  defaultDate: string;
  uid: string;
  onOpenChange: (v: boolean) => void;
}) {
  const lessons = useLessons();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [eventType, setEventType] = useState<EventType>(DEFAULT_EVENT_TYPE);
  const [time, setTime] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the dialog opens (or the day it was opened for
  // changes). The dialog is opened programmatically via the parent's `open`
  // prop, so Radix's onOpenChange does not fire on open — an effect is the
  // only reliable reset hook here.
  useEffect(() => {
    if (open) {
      setTitle('');
      setDate(defaultDate);
      setEventType(DEFAULT_EVENT_TYPE);
      setTime('');
      setLessonId('');
      setNotes('');
    }
  }, [open, defaultDate]);

  async function handleSave() {
    if (!title.trim()) return;
    if (!isValidTime(time)) {
      toast.error(ERROR_COPY.schedule.timeFormat);
      return;
    }
    setSaving(true);
    try {
      await addStudyEvent(uid, {
        title: title.trim(),
        date,
        eventType,
        ...(time ? { time } : {}),
        ...(lessonId ? { lessonId } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      // Days-out is computed from local-tz midnight to local-tz midnight to
      // keep the metric stable across timezones for a given user.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(date + 'T00:00');
      const daysOut = Math.round((eventDate.getTime() - today.getTime()) / 86_400_000);
      track('study_event_added', {
        event_type: eventType,
        has_lesson: !!lessonId,
        has_time: !!time,
        days_out: daysOut,
      });
      toast.success(`${EVENT_TYPE_META[eventType].label} added.`);
      onOpenChange(false);
    } catch {
      toast.error(ERROR_COPY.schedule.save);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type chips — first choice the user makes; drives placeholder copy */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Type</span>
            <div className="grid grid-cols-4 gap-1.5">
              {EVENT_TYPES.map((t) => {
                const meta = EVENT_TYPE_META[t];
                const Icon = meta.icon;
                const active = eventType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors
                      ${
                        active
                          ? `${meta.badgeClass} border-current`
                          : 'border-border text-muted-foreground hover:bg-muted/60'
                      }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="event-title">
              Title
            </label>
            <Input
              id="event-title"
              placeholder={titlePlaceholder(eventType)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="event-date">
                Date
              </label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="event-time">
                Time <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="event-lesson">
              Link to lesson <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <select
              id="event-lesson"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">None</option>
              {lessons
                .filter((l) => !l.comingSoon)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    Lesson {l.number}: {l.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="event-notes">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="event-notes"
              placeholder="Any extra context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function titlePlaceholder(type: EventType): string {
  switch (type) {
    case 'test':
      return 'e.g. AP Statistics midterm';
    case 'homework':
      return 'e.g. Chapter 4 problem set';
    case 'study':
      return 'e.g. Review probability basics';
    case 'other':
      return "What's on your mind?";
  }
}

// ---------------------------------------------------------------------------
// Event detail dialog
// ---------------------------------------------------------------------------

function formatLongDate(dateStr: string): string {
  const dt = new Date(dateStr + 'T00:00');
  return `${DAY_ABBR[dt.getDay()]}, ${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

function EventDetailDialog({
  event,
  uid,
  lessons,
  onOpenChange,
}: {
  event: StudyEvent | null;
  uid: string;
  lessons: Lesson[];
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  if (!event) return null;

  const meta = EVENT_TYPE_META[event.eventType];
  const TypeIcon = meta.icon;
  const linkedLesson = event.lessonId ? lessons.find((l) => l.id === event.lessonId) : undefined;

  async function handleToggle() {
    if (!event) return;
    setBusy(true);
    try {
      await toggleStudyEvent(uid, event.id, !event.completed);
      toast.success(event.completed ? 'Marked as not done.' : 'Nice — marked done!');
      onOpenChange(false);
    } catch {
      toast.error(ERROR_COPY.schedule.update);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setBusy(true);
    try {
      await deleteStudyEvent(uid, event.id);
      toast.success('Event deleted.');
      onOpenChange(false);
    } catch {
      toast.error(ERROR_COPY.schedule.delete);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <span
            className={`inline-flex w-fit items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.badgeClass}`}
          >
            <TypeIcon className="w-3 h-3" aria-hidden="true" />
            {meta.label}
          </span>
          <DialogTitle className={event.completed ? 'line-through text-muted-foreground' : ''}>
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* When */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {formatLongDate(event.date)}
              {event.time ? ` · ${formatTime(event.time)}` : ''}
            </span>
            {event.completed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--success)]">
                <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />
                Done
              </span>
            )}
          </div>

          {/* Linked lesson */}
          {event.lessonId && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Linked lesson
              </span>
              {linkedLesson ? (
                <Link
                  to={`/lesson/${linkedLesson.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0 truncate">
                    Lesson {linkedLesson.number}: {linkedLesson.title}
                  </span>
                  <ChevronRightSm className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : (
                <p className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                  This lesson is no longer available.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </span>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {event.notes}
              </p>
            </div>
          )}

          {!event.lessonId && !event.notes && (
            <p className="text-sm text-muted-foreground italic">No extra details added.</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={busy} className="gap-1.5">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button onClick={handleToggle} disabled={busy} className="gap-1.5">
            {event.completed ? (
              'Mark not done'
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={3} />
                Mark done
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Upcoming events sidebar strip
// ---------------------------------------------------------------------------

function UpcomingStrip({ events }: { events: StudyEvent[] }) {
  const today = todayString();
  const upcoming = events.filter((e) => !e.completed && e.date >= today).slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Upcoming
      </h3>
      <ul className="space-y-1.5">
        {upcoming.map((e) => {
          const dt = new Date(e.date + 'T00:00');
          const label = `${MONTH_NAMES[dt.getMonth()].slice(0, 3)} ${dt.getDate()}`;
          const meta = EVENT_TYPE_META[e.eventType];
          const Icon = meta.icon;
          return (
            <li key={e.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span
                className="grid place-items-center w-7 h-7 rounded-md shrink-0"
                style={{
                  backgroundColor: `color-mix(in srgb, ${meta.dotColor} 14%, transparent)`,
                  color: meta.dotColor,
                }}
                aria-hidden="true"
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-semibold text-muted-foreground w-12 shrink-0">
                {label}
              </span>
              <span className="text-sm truncate flex-1">{e.title}</span>
              {e.time && (
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {formatTime(e.time)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SchedulePage
// ---------------------------------------------------------------------------

/** Shaped placeholder while the month's events load — mirrors the calendar +
 *  day-list layout so the page doesn't jump or flash a false "nothing planned". */
function ScheduleSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-64 rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

export function SchedulePage() {
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : '';

  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  const yearMonth = yearMonthOf(viewDate);

  const [selectedDate, setSelectedDate] = useState(todayString());
  const [addOpen, setAddOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<StudyEvent | null>(null);

  const lessons = useLessons();
  const eventsState = useStudyEvents(uid, yearMonth);
  const events = eventsState.status === 'ready' ? eventsState.data : [];

  // Index events by date for calendar dots
  const eventsByDate = new Map<string, StudyEvent[]>();
  for (const ev of events) {
    const existing = eventsByDate.get(ev.date) ?? [];
    eventsByDate.set(ev.date, [...existing, ev]);
  }

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const loading = eventsState.status === 'loading';

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight">Schedule</h1>
          {uid && (
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>

        {loading ? (
          <ScheduleSkeleton />
        ) : (
          <>
            {/* Calendar */}
            <MonthCalendar
              year={viewDate.getFullYear()}
              month={viewDate.getMonth()}
              selected={selectedDate}
              eventsByDate={eventsByDate}
              onSelect={setSelectedDate}
              onPrev={prevMonth}
              onNext={nextMonth}
            />

            {/* Day events */}
            <DayEventList
              uid={uid}
              date={selectedDate}
              events={selectedEvents}
              onAdd={() => setAddOpen(true)}
              onOpenDetail={setDetailEvent}
            />

            {/* Upcoming strip */}
            <UpcomingStrip events={events} />
          </>
        )}

        {/* Add dialog */}
        <AddEventDialog
          open={addOpen}
          defaultDate={selectedDate}
          uid={uid}
          onOpenChange={setAddOpen}
        />

        {/* Detail dialog */}
        <EventDetailDialog
          event={detailEvent}
          uid={uid}
          lessons={lessons}
          onOpenChange={(open) => !open && setDetailEvent(null)}
        />
      </div>
    </div>
  );
}
