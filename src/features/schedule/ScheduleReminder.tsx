import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { ERROR_COPY } from '@/lib/errors';
import { subscribeToDayEvents, toggleStudyEvent } from './scheduleService';
import type { StudyEvent } from './scheduleService';
import { EVENT_TYPE_META, formatTime } from './eventTypes';
import {
  pendingToday,
  wasDismissedToday,
  markDismissedToday,
  localDateString,
} from './reminderRules';

/**
 * Home-screen popup that nudges the learner about today's unfinished schedule
 * events. Pops at most once per day per user (dismissal persisted in
 * localStorage). Marking everything done — or dismissing — closes it. Past days
 * are never surfaced: the query is scoped to today, so yesterday's items drop
 * out on their own.
 */
export function ScheduleReminder({ uid }: { uid: string }) {
  const today = localDateString();
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [open, setOpen] = useState(false);
  // Guard so the auto-open + analytics fire only once per mount, even as the
  // realtime list updates (e.g. when the user checks items off).
  const announced = useRef(false);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToDayEvents(uid, today, setEvents);
    return unsub;
  }, [uid, today]);

  const pending = pendingToday(events, today);

  useEffect(() => {
    if (announced.current) return;
    if (pending.length === 0) return;
    if (wasDismissedToday(uid, today)) return;
    announced.current = true;
    setOpen(true);
    track('schedule_reminder_shown', { pending_count: pending.length });
  }, [pending.length, uid, today]);

  function dismiss() {
    markDismissedToday(uid, today);
    setOpen(false);
  }

  async function markDone(event: StudyEvent) {
    try {
      await toggleStudyEvent(uid, event.id, true);
      // If that was the last one, acknowledge and close.
      if (pending.length <= 1) {
        markDismissedToday(uid, today);
        setOpen(false);
        toast.success('All done for today. Nice work!');
      }
    } catch {
      toast.error(ERROR_COPY.schedule.update);
    }
  }

  if (pending.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-1 grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center">
            {pending.length === 1 ? 'You have a task today' : `${pending.length} tasks today`}
          </DialogTitle>
          <DialogDescription className="text-center">
            Still on your plan for today. Check them off as you go.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-1">
          {pending.map((event) => {
            const meta = EVENT_TYPE_META[event.eventType];
            const TypeIcon = meta.icon;
            return (
              <li
                key={event.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5"
                style={{ boxShadow: `inset 3px 0 0 ${meta.dotColor}` }}
              >
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
                >
                  <TypeIcon className="h-3 w-3" aria-hidden="true" />
                  {meta.label}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-snug">{event.title}</span>
                  {event.time && (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatTime(event.time)}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => markDone(event)}
                  aria-label={`Mark "${event.title}" done`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-muted-foreground/40 text-muted-foreground transition-colors hover:border-[color:var(--success)] hover:text-[color:var(--success)]"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </li>
            );
          })}
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={dismiss}>
            Later
          </Button>
          <Link to="/schedule" onClick={dismiss} className={cn(buttonVariants(), 'flex-1')}>
            Open schedule
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
