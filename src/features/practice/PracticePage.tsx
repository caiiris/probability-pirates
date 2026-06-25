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
import { Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';
import { TOPICS } from '@/content/skills';
import type { Topic } from '@/content/skills';
import { useAuth } from '@/features/auth/AuthProvider';
import { TopicPicker } from '@/features/practice/TopicPicker';
import { PracticeSession } from '@/features/practice/PracticeSession';
import { usePracticeState } from '@/features/practice/usePracticeState';

export function PracticePage() {
  // Default to the first topic; TopicPicker overrides this once the learner
  // model loads (via its internal subscribeLearnerModel effect).
  const [topic, setTopic] = useState<Topic>(TOPICS[0]);

  const authState = useAuth();
  const uid = authState.status === 'authenticated' ? authState.user.uid : null;

  // Per-topic adaptive state lives here so the rating can render in the page
  // header. PracticeSession receives the rating + recordResult as props.
  const { rating, recentTemplateIds, recordResult } = usePracticeState(uid, topic);

  // The most recent rating change, for the +/- delta chip beside the bounty.
  // Reset whenever the topic switches (the new topic has its own rating).
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);
  useEffect(() => {
    setRatingDelta(null);
  }, [topic]);

  return (
    <div className="flex flex-col min-h-full bg-white">
      <header className="shrink-0 border-b px-4 py-4 flex items-center gap-3 bg-card">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Dumbbell className="h-4 w-4" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight">Practice</h1>
        <BountyChip rating={rating} delta={ratingDelta} />
      </header>

      <TopicPicker selectedTopic={topic} onSelect={setTopic} uid={uid} />

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
        />
      </div>
    </div>
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
