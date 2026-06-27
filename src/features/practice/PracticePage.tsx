/**
 * PracticePage — top-level route for /practice.
 *
 * Layout: a slim page header (`Practice` heading + the active topic's adaptive
 * rating, named **Bounty** for the pirate-theme) → topic chips → the solve
 * loop. The Bounty chip replaces the older two-tile stats bar (level tile was
 * redundant with the global header level bar; the rating tile was demoted to a
 * compact chip and the explanatory sub-description was cut).
 *
 * State lift: `usePracticeState` is owned by this page (not by PracticeSession)
 * so the rating can live next to the page title. PracticeSession receives
 * `rating` + `recordResult` as props and reports per-answer rating deltas via
 * `onRatingDelta` so the chip can flash a +N / −N indicator.
 *
 * Switching topic restarts the loop (key prop on PracticeSession resets state).
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dumbbell, TrendingUp, TrendingDown, BarChart3, ChevronDown } from 'lucide-react';
import { TOPICS } from '@/content/skills';
import type { Topic } from '@/content/skills';
import { useAuth } from '@/features/auth/AuthProvider';
import { TopicPicker } from '@/features/practice/TopicPicker';
import { PracticeSession } from '@/features/practice/PracticeSession';
import { usePracticeState } from '@/features/practice/usePracticeState';
import { ALL_TEMPLATES } from '@/features/practice/templates/index';
import { difficultyLabel } from '@/features/practice/practiceDifficulty';
import { mulberry32 } from '@/lib/simulations';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type DifficultyBand = 'Easy' | 'Medium' | 'Hard' | 'Extreme';
type ProgressCell = { attempted: number; correct: number };
type TopicProgress = Record<Topic, Record<DifficultyBand, ProgressCell>>;

const DIFFICULTY_BANDS: DifficultyBand[] = ['Easy', 'Medium', 'Hard', 'Extreme'];
const PROGRESS_STORAGE_PREFIX = 'pascal.practiceProgress.v1';

const TOPIC_LABELS: Record<Topic, string> = {
  counting: 'Counting',
  'permutations-combinations': 'Permutations & Combinations',
  'inclusion-exclusion': 'Inclusion-Exclusion',
  'long-run': 'Long-run',
  complement: 'Complement',
  conditional: 'Conditional',
  distributions: 'Distributions',
};

function emptyProgress(): TopicProgress {
  return TOPICS.reduce((topics, topic) => {
    topics[topic] = DIFFICULTY_BANDS.reduce(
      (bands, band) => {
        bands[band] = { attempted: 0, correct: 0 };
        return bands;
      },
      {} as Record<DifficultyBand, ProgressCell>,
    );
    return topics;
  }, {} as TopicProgress);
}

function bankCounts(): Record<Topic, Record<DifficultyBand, number>> {
  const counts = TOPICS.reduce((topics, topic) => {
    topics[topic] = DIFFICULTY_BANDS.reduce(
      (bands, band) => {
        bands[band] = 0;
        return bands;
      },
      {} as Record<DifficultyBand, number>,
    );
    return topics;
  }, {} as Record<Topic, Record<DifficultyBand, number>>);

  ALL_TEMPLATES.forEach((template, index) => {
    const params = template.sample(mulberry32(0xba00 + index * 97));
    const band = difficultyLabel(template.rate(params)) as DifficultyBand;
    counts[template.topic][band] += 1;
  });

  return counts;
}

const BANK_COUNTS = bankCounts();

function progressStorageKey(uid: string | null): string {
  return `${PROGRESS_STORAGE_PREFIX}:${uid ?? 'guest'}`;
}

function readStoredProgress(uid: string | null): TopicProgress {
  const base = emptyProgress();
  if (typeof window === 'undefined') return base;

  try {
    const raw = window.localStorage.getItem(progressStorageKey(uid));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<TopicProgress>;
    for (const topic of TOPICS) {
      for (const band of DIFFICULTY_BANDS) {
        const cell = parsed[topic]?.[band];
        if (
          cell &&
          Number.isFinite(cell.attempted) &&
          Number.isFinite(cell.correct)
        ) {
          base[topic][band] = {
            attempted: Math.max(0, Math.floor(cell.attempted)),
            correct: Math.max(0, Math.floor(cell.correct)),
          };
        }
      }
    }
  } catch {
    return base;
  }

  return base;
}

function writeStoredProgress(uid: string | null, progress: TopicProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(progressStorageKey(uid), JSON.stringify(progress));
  } catch {
    // Non-critical: progress popup falls back to in-memory counts.
  }
}

function isTopic(value: string | null): value is Topic {
  return value !== null && (TOPICS as readonly string[]).includes(value);
}

export function PracticePage() {
  // A `?topic=` deep link (e.g. from a "Watch out for" misconception card on the
  // Progress page) preselects that category. When present, we also disable the
  // TopicPicker's model-based auto-suggestion so the requested topic sticks.
  const [searchParams] = useSearchParams();
  const requestedTopic = searchParams.get('topic');
  const deepLinkTopic = isTopic(requestedTopic) ? requestedTopic : null;

  // Default to the deep-linked topic, else the first topic; TopicPicker
  // overrides the default once the learner model loads (unless autoSuggest off).
  const [topic, setTopic] = useState<Topic>(deepLinkTopic ?? TOPICS[0]);

  const authState = useAuth();
  const uid = authState.status === 'authenticated' ? authState.user.uid : null;

  // Per-topic adaptive state lives here so the rating can render in the page
  // header. PracticeSession receives the rating + recordResult as props.
  const { rating, recentTemplateIds, recordResult } = usePracticeState(uid, topic);

  // The most recent rating change, for the +/- delta chip beside the bounty.
  // Reset whenever the topic switches (the new topic has its own rating).
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);
  const [progress, setProgress] = useState<TopicProgress>(() => readStoredProgress(uid));

  useEffect(() => {
    setRatingDelta(null);
  }, [topic]);

  useEffect(() => {
    setProgress(readStoredProgress(uid));
  }, [uid]);

  function handleAnswered(event: { topic: Topic; difficulty: number; wasCorrect: boolean }) {
    const band = difficultyLabel(event.difficulty) as DifficultyBand;
    setProgress((prev) => {
      const next = {
        ...prev,
        [event.topic]: {
          ...prev[event.topic],
          [band]: {
            attempted: prev[event.topic][band].attempted + 1,
            correct: prev[event.topic][band].correct + (event.wasCorrect ? 1 : 0),
          },
        },
      };
      writeStoredProgress(uid, next);
      return next;
    });
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <header className="shrink-0 border-b px-4 py-4 flex items-center gap-3 bg-card">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Dumbbell className="h-4 w-4" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight">Practice</h1>
        <ProgressDialog progress={progress} selectedTopic={topic} />
        <BountyChip rating={rating} delta={ratingDelta} />
      </header>

      <TopicPicker
        selectedTopic={topic}
        onSelect={setTopic}
        uid={uid}
        autoSuggest={deepLinkTopic === null}
      />

      <div className="flex-1 flex flex-col min-h-0">
        {/*
         * key={topic} forces PracticeSession to remount when the topic changes,
         * resetting all local state (instance, currentAnswer, solutionRevealed,
         * useSlotState). This is the correct behaviour: switching topic restarts
         * the loop in the new topic.
         */}
        <PracticeSession
          key={topic}
          topic={topic}
          uid={uid}
          rating={rating}
          recentTemplateIds={recentTemplateIds}
          recordResult={recordResult}
          onRatingDelta={setRatingDelta}
          onAnswered={handleAnswered}
        />
      </div>
    </div>
  );
}

function ProgressDialog({
  progress,
  selectedTopic,
}: {
  progress: TopicProgress;
  selectedTopic: Topic;
}) {
  const [openTopics, setOpenTopics] = useState<Set<Topic>>(() => new Set([selectedTopic]));

  function toggleTopic(topic: Topic) {
    setOpenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="ml-auto gap-1.5" />}>
        <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
        Progress
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Practice progress</DialogTitle>
          <DialogDescription>
            Mastery by topic and difficulty. Bars fill as you get problems right.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {TOPICS.map((topic) => {
            const isOpen = openTopics.has(topic);
            const totals = topicTotals(progress, topic);
            return (
            <section key={topic} className="rounded-xl border bg-card">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                aria-expanded={isOpen}
                onClick={() => toggleTopic(topic)}
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{TOPIC_LABELS[topic]}</h3>
                  <p className="text-xs text-muted-foreground">
                    {/* Subtext mirrors the bar metric: how many problems
                        mastered out of the bank (correct / loaded). */}
                    {totals.loaded === 0
                      ? 'N/A'
                      : `${totals.correct} correct of ${totals.loaded}`}
                  </p>
                </div>
                <span className="num rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {/* Chip is accuracy on tries (correct / attempted): "got 2
                      right out of the 3 you tried." Complements the
                      mastery-out-of-bank story the bar + subtext tell. */}
                  {totals.loaded === 0
                    ? 'N/A'
                    : totals.attempted === 0
                      ? '0 tried'
                      : `${totals.correct}/${totals.attempted}`}
                </span>
              </button>

              {isOpen && <div className="space-y-2 border-t px-4 py-3">
                {DIFFICULTY_BANDS.map((band) => {
                  const cell = progress[topic][band];
                  const available = BANK_COUNTS[topic][band];
                  // Bar fill is mastery (correct/available), not exposure
                  // (attempted/available). Tried-but-wrong doesn't fill it;
                  // you have to get a problem right for the bar to move.
                  const width = available > 0 ? Math.min(100, (cell.correct / available) * 100) : 0;
                  return (
                    <div key={band} className="grid grid-cols-[4.75rem_1fr_12rem] items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{band}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            available > 0 ? 'bg-primary' : 'bg-muted-foreground/20'
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="num text-right text-xs text-muted-foreground">
                        {/* Accuracy on what was actually attempted; N/A until a
                            first try in this band. */}
                        {cell.attempted === 0
                          ? 'N/A'
                          : `${cell.correct} correct out of ${cell.attempted}`}
                      </span>
                    </div>
                  );
                })}
              </div>}
            </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function topicTotals(progress: TopicProgress, topic: Topic) {
  return DIFFICULTY_BANDS.reduce(
    (total, band) => {
      total.attempted += progress[topic][band].attempted;
      total.correct += progress[topic][band].correct;
      total.loaded += BANK_COUNTS[topic][band];
      return total;
    },
    { attempted: 0, correct: 0, loaded: 0 },
  );
}

/**
 * Compact rating display in the page header. Numeric bounty + a small trend
 * chip showing the most recent delta. Quiet by default; the delta colors in
 * (green up / coral down) for a couple of seconds of feedback after each
 * graded answer.
 */
function BountyChip({ rating, delta }: { rating: number; delta: number | null }) {
  const rounded = Math.round(rating);
  const showDelta = delta !== null && Math.abs(delta) >= 0.5;
  const up = (delta ?? 0) > 0;
  const deltaRounded = Math.abs(Math.round(delta as number));

  return (
    <span
      className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1"
      aria-label={`Bounty rating ${rounded}${
        showDelta ? `, ${up ? 'up' : 'down'} ${deltaRounded}` : ''
      }`}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Bounty
      </span>
      <span className="num text-sm font-bold leading-none text-foreground">{rounded}</span>
      {showDelta && (
        <span
          className={`num inline-flex items-center gap-0.5 text-xs font-semibold ${
            up ? 'text-[color:var(--green-deep)]' : 'text-[color:var(--coral-deep)]'
          }`}
        >
          {up ? (
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
          )}
          {up ? '+' : '\u2212'}
          {deltaRounded}
        </span>
      )}
    </span>
  );
}
