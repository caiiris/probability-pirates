import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CaptainPascal } from '@/features/captain/CaptainPascal';
import { CaptainMascot } from '@/components/illustrations/CaptainMascot';
import type { Lesson } from '@/content/types';
import type { LessonProgress } from '@/features/progress/progressService';
import { MOTION } from '@/lib/motion';
import { todayLocalDate } from '@/lib/streak';

/**
 * Dismissals are tracked per *Captain-speaking* variant per local day. So if the
 * learner reads the welcome on Monday and X's it, they still get a fresh
 * all-caught-up nudge later that day (or the welcome again on Tuesday if the
 * state somehow resurfaces). One day, one acknowledgement per message.
 */
type DismissibleVariant = 'welcome' | 'allCaught';
const DISMISS_KEY_PREFIX = 'heroCard:dismissed:';

function isDismissedToday(variant: DismissibleVariant): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(DISMISS_KEY_PREFIX + variant) === todayLocalDate()
    );
  } catch {
    return false;
  }
}

function markDismissedToday(variant: DismissibleVariant): void {
  try {
    window.localStorage.setItem(DISMISS_KEY_PREFIX + variant, todayLocalDate());
  } catch {
    // localStorage unavailable (private mode): the in-memory dismiss hides it
    // until reload, which is the most we can offer.
  }
}

type Props = {
  lessons: Lesson[];
  progressMap: Map<string, LessonProgress>;
  uid: string;
  displayUsername: string;
  isNewUser: boolean;
};

export function HeroCard({ lessons, progressMap, displayUsername, isNewUser }: Props) {
  const navigate = useNavigate();

  const realLessons = lessons.filter((l) => !l.comingSoon);

  // Determine hero state
  const inProgress = realLessons.find((l) => progressMap.get(l.id)?.state === 'in_progress');
  // "All caught up" means the whole planned course is done — not just the
  // currently-authored lessons. Otherwise the celebration would fire after
  // one lesson on a path full of locked roadmap stubs (D91).
  const allCompleted =
    lessons.length > 0 && lessons.every((l) => progressMap.get(l.id)?.state === 'completed');
  const nextUnstarted = realLessons.find((l) => !progressMap.has(l.id));
  // The first lesson a brand-new learner starts: follow the catalog rather than
  // a hardcoded id, so it tracks whatever the first playable lesson is.
  const firstLesson = nextUnstarted ?? realLessons[0];

  // Per-variant daily dismissal: Welcome and AllCaughtUp speak in the captain's
  // voice and can be acknowledged + closed; Resume and StartHero are purely
  // functional next-action cards, so they stay.
  const [dismissedWelcome, setDismissedWelcome] = useState(() => isDismissedToday('welcome'));
  const [dismissedAllCaught, setDismissedAllCaught] = useState(() => isDismissedToday('allCaught'));

  function dismiss(variant: DismissibleVariant) {
    markDismissedToday(variant);
    if (variant === 'welcome') setDismissedWelcome(true);
    else setDismissedAllCaught(true);
  }

  const showWelcome = isNewUser && firstLesson && !dismissedWelcome;
  const showAllCaught = allCompleted && !dismissedAllCaught;

  // If the dismissable variants are dismissed and no functional state applies,
  // render nothing so the page collapses cleanly without an empty hero shell.
  if (!showWelcome && !inProgress && !showAllCaught && !nextUnstarted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...MOTION.slide, delay: 0.05 }}
    >
      <Card className="border-primary/15 bg-[color:var(--primary-soft)] rounded-2xl shadow-soft">
        <CardContent className="p-5">
          {showWelcome && firstLesson ? (
            <WelcomeHero
              displayUsername={displayUsername}
              onStart={() => navigate(`/lesson/${firstLesson.id}`)}
              onDismiss={() => dismiss('welcome')}
            />
          ) : inProgress ? (
            <ResumeHero
              lesson={inProgress}
              progress={progressMap.get(inProgress.id)!}
              onResume={() => navigate(`/lesson/${inProgress.id}`)}
            />
          ) : showAllCaught ? (
            <AllCaughtUpHero
              lesson={realLessons[realLessons.length - 1]}
              onReview={(l) => navigate(`/lesson/${l.id}?mode=review`)}
              onDismiss={() => dismiss('allCaught')}
            />
          ) : nextUnstarted ? (
            <StartHero
              lesson={nextUnstarted}
              onStart={() => navigate(`/lesson/${nextUnstarted.id}`)}
            />
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Quiet X in the top-right corner; used by the Captain-speaking hero variants. */
function DismissButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sub-states
// ---------------------------------------------------------------------------

function WelcomeHero({
  displayUsername,
  onStart,
  onDismiss,
}: {
  displayUsername: string;
  onStart: () => void;
  onDismiss: () => void;
}) {
  // Intentionally NOT using the shared compact CaptainPascal here: that layout
  // crams mascot + eyebrow + a long welcome line into one row, which wraps the
  // tagline awkwardly on common widths. The welcome is a one-time first
  // impression — worth a deliberate centered "headline + tagline" structure
  // instead of a row that almost-but-not-quite fits.
  return (
    <div className="relative flex flex-col items-center text-center gap-4 px-2">
      <CaptainMascot className="h-14 w-14" aria-hidden="true" />
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Captain Pascal
        </p>
        <p className="font-display text-xl font-bold tracking-tight leading-snug">
          Welcome aboard, {displayUsername}.
        </p>
        <p className="mx-auto max-w-sm text-sm text-foreground/75 text-balance">
          Probability is a strange sea. Let&rsquo;s sail it together.
        </p>
      </div>
      <Button onClick={onStart} className="w-full max-w-xs">
        Start your first lesson
      </Button>
      <DismissButton onClick={onDismiss} label="Dismiss welcome" />
    </div>
  );
}

function ResumeHero({
  lesson,
  progress,
  onResume,
}: {
  lesson: Lesson;
  progress: LessonProgress;
  onResume: () => void;
}) {
  const slotLabel = `Step ${progress.slotIndex + 1}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">In progress</p>
        <p className="font-semibold">
          Lesson {lesson.number}: {lesson.title}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">{slotLabel}</p>
      </div>
      <Button onClick={onResume} className="shrink-0">
        Continue
      </Button>
    </div>
  );
}

function StartHero({ lesson, onStart }: { lesson: Lesson; onStart: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Up next</p>
        <p className="font-semibold">
          Lesson {lesson.number}: {lesson.title}
        </p>
      </div>
      <Button onClick={onStart} className="shrink-0">
        Start
      </Button>
    </div>
  );
}

function AllCaughtUpHero({
  lesson,
  onReview,
  onDismiss,
}: {
  lesson: Lesson;
  onReview: (l: Lesson) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="relative flex flex-col gap-4 pr-8">
      <CaptainPascal context="allCaught" compact />
      <Button variant="outline" onClick={() => onReview(lesson)} className="w-full">
        Review a lesson
      </Button>
      <DismissButton onClick={onDismiss} label="Dismiss today's check-in" />
    </div>
  );
}
