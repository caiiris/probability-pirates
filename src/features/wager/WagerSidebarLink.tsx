/**
 * WagerSidebarLink — sidebar nav item for /wager with an optional unread dot
 * (WP-CW-E). Matches the NavItem style in AppShell.tsx.
 *
 * Unread-dot rule: the dot lights up iff the signed-in user has NOT submitted
 * the wager that is currently featured per the 3-day rotation (see
 * wagerRotation.featuredWager). Past featured wagers are intentionally
 * ignored — submitting them is "catching up", not the call-to-action.
 *
 * WagerDotChecker is an inner component so useUserSubmission is always called
 * unconditionally inside a mounted component — never conditionally inside the
 * parent.
 */

import { Link, useLocation } from 'react-router-dom';
import { Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLiveWagers, useUserSubmission } from '@/features/wager/wagerService';
import { featuredWager } from '@/features/wager/wagerRotation';

// ---------------------------------------------------------------------------
// Presentational nav item (no hooks)
// ---------------------------------------------------------------------------

function WagerNavItem({ active, hasUnread }: { active: boolean; hasUnread: boolean }) {
  return (
    <Link
      to="/wager"
      aria-current={active ? 'page' : undefined}
      className="group flex items-center gap-3 px-3 py-1.5"
    >
      <motion.span
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.15 }}
        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
          active
            ? 'bg-primary/12 text-primary'
            : 'text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
        }`}
      >
        <Anchor
          className="h-5 w-5"
          strokeWidth={active ? 2.6 : 2}
          aria-hidden="true"
        />
        {hasUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-[color:var(--sidebar)]"
            aria-label="Unsubmitted wager"
          />
        )}
      </motion.span>
      <span
        className={`text-sm transition-colors ${
          active
            ? 'font-semibold text-primary'
            : 'font-medium text-muted-foreground group-hover:text-foreground'
        }`}
      >
        Wager
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Inner component — only mounted when uid and wagerId are both valid strings.
// Calling useUserSubmission here is unconditional within this component's
// lifecycle, satisfying the rules of hooks.
// ---------------------------------------------------------------------------

function WagerDotChecker({
  uid,
  wagerId,
  active,
}: {
  uid: string;
  wagerId: string;
  active: boolean;
}) {
  const { submission, loading } = useUserSubmission(uid, wagerId);
  const hasUnread = !loading && submission === null;
  return <WagerNavItem active={active} hasUnread={hasUnread} />;
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function WagerSidebarLink(): JSX.Element {
  const { pathname } = useLocation();
  const active = pathname === '/wager' || pathname.startsWith('/wager/');

  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : null;

  const { wagers, loading: wagersLoading } = useLiveWagers();
  const featuredId = featuredWager(wagers, Date.now())?.id;

  // Mount WagerDotChecker only when we have a valid (non-empty) wagerId and a
  // signed-in uid. This prevents passing an empty string to useUserSubmission,
  // which would form an invalid Firestore path.
  if (!wagersLoading && featuredId && uid) {
    return <WagerDotChecker uid={uid} wagerId={featuredId} active={active} />;
  }

  return <WagerNavItem active={active} hasUnread={false} />;
}
