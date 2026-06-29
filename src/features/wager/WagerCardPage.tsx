/**
 * WagerCardPage — route handler for /wager/:id (WP-CW-F + WP-CW-G).
 *
 * Pre-submit branch: renders WagerCardPreSubmit.
 * Post-submit branch: renders WagerCardReveal (WP-CW-G).
 *
 * Self-heal guard: if the submission is still in placeholder state
 * (score=0, logError=0 — step 4 of the two-step submit flow hasn't patched
 * yet, or a transient failure occurred), we show ScorePatchPendingState
 * rather than rendering the reveal with a fake score of 0.
 */

import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  useWagerById,
  useUserSubmission,
  useWagerAnswer,
  useWagerSubmissions,
  useWagerStats,
} from '@/features/wager/wagerService';
import { WagerCardPreSubmit } from '@/features/wager/WagerCardPreSubmit';
import { WagerCardReveal } from '@/features/wager/WagerCardReveal';
import type { Wager, WagerSubmission } from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export default function WagerCardPage() {
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : null;

  const { wager, loading: wagerLoading } = useWagerById(id ?? '');
  const { submission, loading: submissionLoading } = useUserSubmission(
    uid,
    id ?? '',
    wager?.scoring,
  );

  if (!id) {
    return <WagerNotFound />;
  }

  if (wagerLoading || submissionLoading) {
    return <WagerPageSkeleton />;
  }

  if (!wager) {
    return <WagerNotFound />;
  }

  if (!submission) {
    return <WagerCardPreSubmit wager={wager} uid={uid} />;
  }

  return <WagerRevealBranch uid={uid} wager={wager} submission={submission} />;
}

/**
 * Separated so the reveal-data hooks only mount after a submission is
 * confirmed (avoids wasted listeners on the pre-submit path).
 */
function WagerRevealBranch({
  uid,
  wager,
  submission,
}: {
  uid: string | null;
  wager: Wager;
  submission: WagerSubmission;
}) {
  const { answer, loading: answerLoading, error: answerError } = useWagerAnswer(uid, wager.id);
  const {
    submissions,
    loading: submissionsLoading,
    error: submissionsError,
  } = useWagerSubmissions(uid, wager.id);
  const { stats } = useWagerStats(uid);

  // Placeholder state: step 4 of the two-step submit flow hasn't patched yet.
  // Show a loading state rather than rendering the reveal with a fake score=0.
  if (submission.score === 0 && submission.logError === 0) {
    return <ScorePatchPendingState wager={wager} />;
  }

  if (answerLoading || submissionsLoading) {
    return <WagerPageSkeleton />;
  }

  // Surface BOTH underlying errors so we can tell which hook is failing.
  // The prior single-error UI made it impossible to distinguish between an
  // answer-doc denial and a submissions-list denial (different rule paths).
  if (answerError || submissionsError) {
    const both = [answerError, submissionsError].filter(Boolean).join(' \u2014 ');
    return <RevealErrorState error={both} />;
  }

  if (!answer || !submissions) {
    return <RevealUnavailableState />;
  }

  return (
    <WagerCardReveal
      wager={wager}
      submission={submission}
      answer={answer}
      submissions={submissions}
      stats={stats}
    />
  );
}

// ---------------------------------------------------------------------------
// Inline sub-components (not exported)
// ---------------------------------------------------------------------------

function WagerPageSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-6 w-24 rounded" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  );
}

function WagerNotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-xl font-semibold">Wager not found</h1>
      <p className="text-sm text-muted-foreground">
        This wager doesn&apos;t exist or hasn&apos;t opened yet.
      </p>
      <Link to="/wager" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        All wagers
      </Link>
    </div>
  );
}

/** Shown while the score-patch transaction (step 4 of the two-step submit
 *  flow) is still in flight or pending self-heal. */
function ScorePatchPendingState({ wager }: { wager: Wager }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
      <Skeleton className="h-6 w-24 rounded mx-auto" />
      <p className="text-base font-semibold">Calculating your score…</p>
      <p className="text-sm text-muted-foreground">
        Wager #{wager.sequence} submitted. Hang tight while we fetch the answer.
      </p>
    </div>
  );
}

/** Defensive fallback: answer or submissions doc unexpectedly unavailable
 *  after submission was confirmed. Should rarely (if ever) appear now that the
 *  gated-hook race is patched; left in place as a true safety net. */
function RevealUnavailableState() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
      <p className="text-base font-semibold">Reveal unavailable</p>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t load the reveal right now. Try refreshing.
      </p>
      <Link to="/wager" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        All wagers
      </Link>
    </div>
  );
}

/** Shown when one of the reveal queries returns an actual error (e.g. rules
 *  denial, network). Shows the underlying message so diagnosis is one screen
 *  away — not a console-only warn. */
function RevealErrorState({ error }: { error: string }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-4">
      <div className="rounded-2xl border border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/40 p-5 space-y-2">
        <p className="text-sm font-semibold text-[color:var(--coral-deep)]">
          Could not load the reveal.
        </p>
        <p className="font-mono text-xs text-[color:var(--coral-deep)]/80 break-words">
          {error}
        </p>
        <p className="text-xs text-muted-foreground">
          Try refreshing. If this persists, share the message above so we can investigate.
        </p>
      </div>
      <div className="flex justify-center">
        <Link to="/wager" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          All wagers
        </Link>
      </div>
    </div>
  );
}
