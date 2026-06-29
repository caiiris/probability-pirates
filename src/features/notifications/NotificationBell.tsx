import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DefaultAvatar } from '@/features/profile/DefaultAvatar';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  markAllNotificationsRead,
  useRecentNotifications,
  useUnreadCount,
  type Notification,
} from './notificationsService';

/**
 * Bell button in the header. Shows a dot when there are unread notifications;
 * opens a small panel listing the most recent ones (newest first). Opening the
 * panel marks everything read so the dot clears on view.
 *
 * Click-outside and Escape close the panel; the trigger keeps focus visible.
 */
export function NotificationBell({ uid }: { uid: string }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const wrapRef = useRef<HTMLDivElement>(null);
  const unread = useUnreadCount(uid);
  const list = useRecentNotifications(uid);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Mark all read once the panel is open and the list has loaded. Fire once
  // per open by tracking the open transition.
  const markedForOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      markedForOpenRef.current = false;
      return;
    }
    if (markedForOpenRef.current) return;
    if (list.status !== 'ready') return;
    markedForOpenRef.current = true;
    markAllNotificationsRead(uid, list.items);
  }, [open, list, uid]);

  if (!uid) return null;

  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* On mobile a tiny floating dropdown anchored to a 32px bell button
              feels orphaned; expand to a full-width top sheet that drops below
              the header. Desktop keeps the small anchored panel. */}
          {isMobile && (
            <div
              className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[1px]"
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
          )}
          <div
            role="dialog"
            aria-label="Notifications"
            className={
              isMobile
                ? // Anchored just under the sticky header; mx-2 = matches header
                  // edge padding. max-h reserves room for the bottom nav.
                  'fixed inset-x-2 top-[3.75rem] z-50 max-h-[calc(100dvh-9rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-pop'
                : 'absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-pop'
            }
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="font-display text-sm font-bold tracking-tight">Notifications</p>
            </div>

            {list.status === 'loading' && (
              <ul className="divide-y divide-border/60">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-40 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {list.status === 'error' && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                Couldn't load notifications. Try again later.
              </div>
            )}

            {list.status === 'ready' && list.items.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"
                  aria-hidden="true"
                >
                  <Bell className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-foreground">All quiet on deck.</p>
                <p className="max-w-[18rem] text-xs text-muted-foreground">
                  We&rsquo;ll ping you here when someone follows you or your wager scores
                  land.
                </p>
              </div>
            )}

            {list.status === 'ready' && list.items.length > 0 && (
              <ul className="max-h-[60vh] overflow-y-auto">
                {list.items.map((n) => (
                  <li key={n.id}>
                    <NotificationRow n={n} onNavigate={() => setOpen(false)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationRow({ n, onNavigate }: { n: Notification; onNavigate: () => void }) {
  return (
    <Link
      to={`/u/${n.fromUsername}`}
      onClick={onNavigate}
      className={`flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 transition-colors hover:bg-muted/50 ${
        n.read ? '' : 'bg-primary/5'
      }`}
    >
      <DefaultAvatar username={n.fromDisplayUsername || n.fromUsername} size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{n.fromDisplayUsername}</span> started following you.
        </p>
        <p className="text-[11px] text-muted-foreground">{formatRelative(n.createdAt)}</p>
      </div>
      {!n.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
      )}
    </Link>
  );
}

/** Compact relative time: 5m, 3h, 2d, then a real date. */
function formatRelative(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}
