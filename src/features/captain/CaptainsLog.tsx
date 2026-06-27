import { useState } from 'react';
import { X } from 'lucide-react';
import { CaptainMascot } from '@/components/illustrations/CaptainMascot';
import { todayLocalDate } from '@/lib/streak';
import { captainLine, dailyTipIndex } from './captainLines';

const DISMISS_KEY = 'captainsLog:dismissed';

/** Read today's dismissal flag from localStorage. Safe in private-browsing. */
function readDismissedToday(): boolean {
  try {
    return (
      typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === todayLocalDate()
    );
  } catch {
    return false;
  }
}

/**
 * A small, always-present card on Home where Captain Pascal shares one
 * learning-science tip a day. Keeps the guide visible outside the welcome /
 * all-caught-up / course-complete moments, and quietly teaches good study habits
 * (spacing, retrieval, learning from errors).
 *
 * Dismissible: the X stores today's date in localStorage, so once read, the tip
 * stays hidden until tomorrow's tip is ready. Never blocks new tips (the key is
 * the date, not a boolean flag).
 */
export function CaptainsLog({ className = '' }: { className?: string }) {
  const [dismissed, setDismissed] = useState<boolean>(readDismissedToday);
  if (dismissed) return null;

  const tip = captainLine('tip', { pick: dailyTipIndex() });

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, todayLocalDate());
    } catch {
      // localStorage unavailable (private mode); the in-memory dismiss still
      // hides it until the user reloads, which is the most we can offer.
    }
    setDismissed(true);
  }

  // Tone tuned 2026-06-26 per tester feedback ("shiny without payoff"):
  // dropped the full violet wash + primary-tinted border in favor of a neutral
  // hairline card, shrank the mascot slightly, and used the inner-card radius.
  // The violet `Captain's log` eyebrow stays — it's the brand signature and a
  // tiny dose of color is fine; what didn't work was the whole-card shine.
  return (
    <div
      className={`relative flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 pr-10 ${className}`}
    >
      <CaptainMascot className="h-10 w-10 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Captain&rsquo;s log
        </p>
        <p className="text-sm text-foreground/90">{tip}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss today's tip"
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
