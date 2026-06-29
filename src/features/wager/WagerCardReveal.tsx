/**
 * WagerCardReveal — the post-submit reveal screen (WP-CW-G).
 *
 * Composition (top to bottom, per spec §6):
 *   1. True-answer hero card (elevated — D55)
 *   2. User result card (score chip, error distance)
 *   3. WagerHistogram + "you beat X%" pill
 *   4. Captain Pascal teach-back card
 *   5. Personal calibration sparkline
 *
 * This component receives pre-fetched data from WagerCardPage; it is
 * purely presentational (no hooks, no Firebase calls).
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CaptainMascot } from '@/components/illustrations/CaptainMascot';
import { binSubmissions, percentileBeaten } from '@/features/wager/binning';
import { WagerHistogram } from '@/features/wager/WagerHistogram';
import { WagerSparkline } from '@/features/wager/WagerSparkline';
import { lessonById } from '@/content/index';
import type { Wager, WagerAnswer, WagerStats, WagerSubmission } from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  wager: Wager;
  /** Guaranteed score > 0 (placeholder-state gated out by the caller). */
  submission: WagerSubmission;
  answer: WagerAnswer;
  submissions: WagerSubmission[];
  stats: WagerStats | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUnitValue(num: number, unit: Wager['unit']): string {
  if (unit === 'percent') return `${num}%`;
  if (unit === 'fraction') return num.toPrecision(3).replace(/\.?0+$/, '');
  // count: plain number, no compact (exact answer deserves full digits)
  return num.toLocaleString();
}

function scoreChipClass(score: number): string {
  if (score >= 80)
    return 'bg-[color:var(--green-soft)] text-[color:var(--green-deep)]';
  if (score >= 50)
    return 'bg-[color:var(--amber-soft)] text-[color:var(--amber-deep)]';
  return 'bg-[color:var(--coral-soft)] text-[color:var(--coral-deep)]';
}

function errorDescription(submission: WagerSubmission, wager: Wager): string {
  if (wager.scoring === 'log') {
    const err = isFinite(submission.logError) ? submission.logError : 9999;
    return `Within ${err.toFixed(1)} orders of magnitude`;
  }
  // In 'abs' scoring, `logError` already stores |guess − trueAnswer|, so it IS
  // the distance to report. (Re-deriving from `guess` here would be wrong — we
  // don't have trueAnswer on the submission.)
  return `Off by ${formatUnitValue(submission.logError, wager.unit)}`;
}

// ---------------------------------------------------------------------------
// Sub-sections
// ---------------------------------------------------------------------------

function TrueAnswerCard({ answer, wager }: { answer: WagerAnswer; wager: Wager }) {
  return (
    <Card className="shadow-[var(--shadow-soft)] border-0 ring-1 ring-[color:var(--line)]">
      <CardContent className="pt-6 pb-6 space-y-4">
        <h2 className="text-center font-display text-lg font-bold leading-snug text-foreground">
          {wager.prompt}
        </h2>

        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-display font-bold text-[color:var(--violet-base)] num tracking-tight">
            {formatUnitValue(answer.trueAnswer, wager.unit)}
          </span>
          <p className="text-xs text-muted-foreground">{answer.source}</p>
        </div>

        {answer.revealWorked && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors select-none">
              How did we get this number?
            </summary>
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed pl-2 border-l-2 border-[color:var(--line)]">
              {answer.revealWorked}
            </p>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function UserResultCard({
  submission,
  wager,
}: {
  submission: WagerSubmission;
  wager: Wager;
}) {
  const chipClass = scoreChipClass(submission.score);

  return (
    <div className="rounded-xl border bg-card px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            Your guess
          </p>
          <p className="text-2xl font-semibold num text-foreground">
            {formatUnitValue(submission.guess, wager.unit)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            Your score
          </p>
          <span
            className={`inline-block px-3 py-1 rounded-full text-2xl font-bold num ${chipClass}`}
          >
            {submission.score}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{errorDescription(submission, wager)}</p>
    </div>
  );
}

function TeachBackCard({ answer, wager }: { answer: WagerAnswer; wager: Wager }) {
  const relatedLesson = wager.relatedLessonId ? lessonById.get(wager.relatedLessonId) : undefined;

  return (
    <div className="rounded-xl border bg-card px-5 py-5 space-y-3">
      <div className="flex items-center gap-3">
        <CaptainMascot className="h-12 w-12 shrink-0" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--violet-base)]">
          Captain Pascal
        </p>
      </div>

      <h3 className="font-display text-lg font-semibold leading-snug">
        {answer.revealHeadline}
      </h3>

      <p className="text-sm text-foreground/80 leading-relaxed">{answer.revealExplanation}</p>

      {wager.relatedLessonId && (
        <Link
          to={`/lesson/${wager.relatedLessonId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--violet-base)] hover:underline"
        >
          {relatedLesson
            ? `Practice this in ${relatedLesson.title} →`
            : 'Practice this in the related lesson →'}
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WagerCardReveal({
  wager,
  submission,
  answer,
  submissions,
  stats,
}: Props): JSX.Element {
  const bins = useMemo(
    () => binSubmissions(submissions, answer.trueAnswer, wager.scoring),
    [submissions, answer.trueAnswer, wager.scoring],
  );

  const n = submissions.length;

  // Percentile needs at least one OTHER wagerer to compare against — with N=1
  // you'd be "beating 0% of the field," which reads as a slight rather than
  // "you're the only one." Pill is suppressed at N<2 and replaced by a
  // first-mover caption below.
  const pct = useMemo(
    () =>
      n >= 2
        ? percentileBeaten(
            submissions.map((s) => ({ logError: s.logError })),
            submission.logError,
          )
        : null,
    [submissions, submission.logError, n],
  );

  const last10 = stats?.last10Scores ?? [];

  return (
    <div className="flex flex-col min-h-full bg-background">
      <header className="shrink-0 border-b px-4 py-4 flex items-center justify-between gap-3 bg-card">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Wager #{wager.sequence} — Reveal
        </span>
        {/* `?view=list` suppresses the answered→reveal auto-redirect so this
            link reaches the list instead of bouncing straight back here. */}
        <Link
          to="/wager?view=list"
          className="text-xs font-medium text-[color:var(--violet-base)] hover:underline"
        >
          All wagers
        </Link>
      </header>

      <div className="flex-1 px-4 py-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* 1. True answer hero */}
          <TrueAnswerCard answer={answer} wager={wager} />

          {/* 2. User result */}
          <UserResultCard submission={submission} wager={wager} />

          {/* 3. Distribution histogram */}
          <section aria-label="Submission distribution">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              How everyone wagered
            </h2>
            <WagerHistogram
              bins={bins}
              userGuess={submission.guess}
              trueAnswer={answer.trueAnswer}
              scoring={wager.scoring}
              unit={wager.unit}
              n={n}
              className="w-full rounded-xl overflow-hidden"
            />

            {/* Below the chart: a percentile pill when there's at least one
                other wagerer to compare to, or a friendly "first to wager"
                line otherwise. Both branches also surface the sample size so
                you can read the chart with calibrated trust (a 3-person
                distribution carries less signal than a 300-person one). */}
            {pct !== null ? (
              <p className="mt-2 text-center text-sm text-muted-foreground">
                <span className="inline-block px-3 py-1 rounded-full bg-[color:var(--violet-soft)] text-[color:var(--violet-deep)] text-xs font-semibold">
                  You beat {Math.round(pct * 100)}% of {n} wagerer{n === 1 ? '' : 's'}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                You&rsquo;re the first to wager on this one.
              </p>
            )}
          </section>

          {/* 4. Captain Pascal teach-back */}
          <TeachBackCard answer={answer} wager={wager} />

          {/*
           * 5. Personal calibration sparkline — only rendered once there are
           *    enough data points for a trend to mean anything. A single dot
           *    on a dashed line reads as a UI bug rather than a chart, and
           *    two dots is a line segment, not a trend. Suppress until N>=3
           *    so the section earns its own headline + chart real estate.
           */}
          {last10.length >= 3 && (
            <section aria-label="Your calibration">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Your calibration
              </h2>
              <p className="text-xs text-muted-foreground mb-2">
                Your last {last10.length} wager{last10.length === 1 ? '' : 's'}
              </p>
              <WagerSparkline scores={last10} className="w-full max-w-xs" />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
