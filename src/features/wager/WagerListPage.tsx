/**
 * WagerListPage — route handler for /wager (WP-CW-E + 3-day rotation update).
 *
 * Layout:
 *   - Header (title + small countdown to the next rotation)
 *   - "Today's wager" featured card (elevated; from wagerRotation.featuredWager)
 *   - Collapsible "Past wagers" dropdown (from wagerRotation.pastFeaturedWagers)
 *
 * Per-row hook calls (`useUserSubmission`) are legal because each row is its
 * own component (<WagerRow>) — hooks are called unconditionally inside each
 * row's render cycle, not in a loop in the parent.
 *
 * Time source: we read `Date.now()` once per render. The cadence is 3 days, so
 * tabs left open across a rollover will show the prior featured wager until
 * the next render. A `setTimeout(msUntilNextWindow)` re-render hook would
 * cover that, but the wins don't justify the extra wiring for our scale.
 */

import { useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Chest } from '@/components/illustrations/Chest';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLiveWagers, useUserSubmission } from '@/features/wager/wagerService';
import {
  WAGER_WINDOW_DAYS,
  featuredWager,
  msUntilNextWindow,
  pastFeaturedWagers,
} from '@/features/wager/wagerRotation';
import type { Wager, WagerSubmission } from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Status chip
// ---------------------------------------------------------------------------

function StatusChip({
  submission,
  loading,
}: {
  submission: WagerSubmission | null;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-7 w-16 rounded-full" />;
  }
  if (submission !== null) {
    return (
      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
        Score <span className="font-mono">{submission.score}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
      Submit
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// WagerRow — wrapper component so useUserSubmission is called unconditionally
// inside a single component instance, not inside a map callback.
// ---------------------------------------------------------------------------

export function WagerRow({ wager, uid }: { wager: Wager; uid: string | null }) {
  const { submission, loading } = useUserSubmission(uid, wager.id);

  return (
    <li>
      <Link
        to={`/wager/${wager.id}`}
        className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50 group"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {wager.flavor}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground truncate leading-snug group-hover:text-primary transition-colors">
            {wager.prompt}
          </p>
        </div>
        <div className="shrink-0">
          <StatusChip submission={submission} loading={loading} />
        </div>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Featured ("today's wager") card
// ---------------------------------------------------------------------------

/**
 * Wraps the featured card with an auto-redirect: once you've submitted today's
 * wager, hitting `/wager` jumps straight to your results (the reveal) — so
 * clicking back into the tab lands on your answer, not the prompt again. The
 * reveal's "All wagers" link points to `/wager?view=list`, which sets
 * `redirectWhenAnswered=false` so the list (and past wagers) stays reachable
 * without bouncing straight back.
 */
function FeaturedSection({
  wager,
  uid,
  redirectWhenAnswered,
}: {
  wager: Wager;
  uid: string | null;
  redirectWhenAnswered: boolean;
}) {
  const { submission, loading } = useUserSubmission(uid, wager.id);
  if (redirectWhenAnswered && !loading && submission !== null) {
    return <Navigate to={`/wager/${wager.id}`} replace />;
  }
  return <FeaturedCard wager={wager} submission={submission} loading={loading} />;
}

function FeaturedCard({
  wager,
  submission,
  loading,
}: {
  wager: Wager;
  submission: WagerSubmission | null;
  loading: boolean;
}) {
  return (
    <Link
      to={`/wager/${wager.id}`}
      className="block rounded-2xl border border-border bg-card shadow-soft p-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Today's wager
        </span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
          {wager.flavor}
        </span>
      </div>
      <p className="text-base font-medium leading-snug mb-4">{wager.prompt}</p>
      <div className="flex items-center justify-end">
        <StatusChip submission={submission} loading={loading} />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Past-wagers dropdown
// ---------------------------------------------------------------------------

function PastWagersDropdown({ wagers, uid }: { wagers: Wager[]; uid: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="past-wagers-list"
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-sm font-semibold">
          Past wagers
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
            ({wagers.length})
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul
          id="past-wagers-list"
          className="divide-y divide-border/60 border-t border-border"
        >
          {wagers.map((w) => (
            <WagerRow key={w.id} wager={w} uid={uid} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton + helpers
// ---------------------------------------------------------------------------

function FeaturedSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-end">
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

/** "Next bottle in 2 days" — coarse, rounded. */
function nextRotationLabel(nowMs: number): string {
  const ms = msUntilNextWindow(nowMs);
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 1) return 'Next bottle washes ashore tomorrow.';
  return `Next bottle in ${days} day${days === 1 ? '' : 's'}.`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WagerListPage(): JSX.Element {
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : null;
  const { wagers, loading, error } = useLiveWagers();

  // `?view=list` (from the reveal's "All wagers" link) suppresses the
  // answered→reveal auto-redirect so the list stays reachable.
  const [searchParams] = useSearchParams();
  const listView = searchParams.get('view') === 'list';

  const nowMs = Date.now();
  const featured = useMemo(() => featuredWager(wagers, nowMs), [wagers, nowMs]);
  const past = useMemo(() => pastFeaturedWagers(wagers, nowMs), [wagers, nowMs]);

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">Captain's Wager</h1>
          <p className="text-sm text-muted-foreground">
            A new bottle washes ashore every {WAGER_WINDOW_DAYS} days.{' '}
            {!loading && !error && wagers.length > 0 && nextRotationLabel(nowMs)}
          </p>
        </div>

        {loading ? (
          <FeaturedSkeleton />
        ) : error !== null ? (
          <div className="rounded-2xl border border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/40 p-5 space-y-2">
            <p className="text-sm font-semibold text-[color:var(--coral-deep)]">
              Could not load wagers.
            </p>
            <p className="font-mono text-xs text-[color:var(--coral-deep)]/80 break-words">
              {error}
            </p>
            <p className="text-xs text-muted-foreground">
              Try refreshing the page. If this persists, share the message above so we can investigate.
            </p>
          </div>
        ) : featured === null ? (
          <EmptyState
            icon={<Chest className="w-12" />}
            title="The sea is empty for now."
            description="The next bottle hasn't washed ashore yet. Captain Pascal is rummaging through the chart room — check back soon."
          />
        ) : (
          <FeaturedSection wager={featured} uid={uid} redirectWhenAnswered={!listView} />
        )}

        {past.length > 0 && <PastWagersDropdown wagers={past} uid={uid} />}
      </div>
    </div>
  );
}
