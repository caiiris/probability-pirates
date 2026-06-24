/**
 * Lightweight in-app notifications.
 *
 * Notifications live under `users/{uid}/notifications/{notifId}` (owner-only
 * read, see firestore.rules). The originating action (currently: a follow)
 * client-writes a doc into the recipient's subcollection as part of its own
 * batch, so we get an inbox without Cloud Functions. The shape is locked down
 * in the rules.
 *
 * Today the only event is `follow`; the schema and UI are intentionally open to
 * more types (achievements earned, kudos received, etc.) without rule changes
 * beyond extending the closed-set `type` allowlist.
 */

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type FieldValue,
  type WriteBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SocialUser } from '@/features/social/socialService';

export type NotificationType = 'follow';

export type Notification = {
  id: string;
  type: NotificationType;
  fromUid: string;
  fromUsername: string;
  fromDisplayUsername: string;
  /** Milliseconds since epoch (resolved on the client from the server clock). */
  createdAt: number;
  read: boolean;
};

/**
 * Queue a follow notification into the *target*'s inbox as part of the caller's
 * existing batch. The doc id is `follow_${fromUid}` so re-following someone
 * after an unfollow refreshes the same notification instead of stacking
 * duplicates. No-op if you somehow try to notify yourself.
 */
export function queueFollowNotification(
  batch: WriteBatch,
  me: SocialUser,
  targetUid: string,
): void {
  if (!me.uid || me.uid === targetUid) return;
  const ref = doc(db, 'users', targetUid, 'notifications', `follow_${me.uid}`);
  const payload: {
    type: NotificationType;
    fromUid: string;
    fromUsername: string;
    fromDisplayUsername: string;
    createdAt: FieldValue;
    read: boolean;
  } = {
    type: 'follow',
    fromUid: me.uid,
    fromUsername: me.username,
    fromDisplayUsername: me.displayUsername,
    createdAt: serverTimestamp(),
    read: false,
  };
  batch.set(ref, payload);
}

type ListState =
  | { status: 'loading' }
  | { status: 'ready'; items: Notification[] }
  | { status: 'error' };

/** Subscribe to the most recent N notifications, newest first. */
export function useRecentNotifications(uid: string, max = 20): ListState {
  const [state, setState] = useState<ListState>({ status: 'loading' });

  useEffect(() => {
    if (!uid) {
      setState({ status: 'ready', items: [] });
      return;
    }
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: Notification[] = snap.docs.map((d) => {
          const data = d.data();
          // `createdAt` is a Firestore Timestamp once the server stamps it; a
          // pending local write shows as null briefly, so default to "now".
          const ts = data.createdAt;
          const ms = ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now();
          return {
            id: d.id,
            type: (data.type as NotificationType) ?? 'follow',
            fromUid: (data.fromUid as string) ?? '',
            fromUsername: (data.fromUsername as string) ?? '',
            fromDisplayUsername: (data.fromDisplayUsername as string) ?? '',
            createdAt: ms,
            read: !!data.read,
          };
        });
        setState({ status: 'ready', items });
      },
      (err) => {
        console.warn('[notifications] subscribe failed', err);
        setState({ status: 'error' });
      },
    );
  }, [uid, max]);

  return state;
}

/** Subscribe to the unread count (header dot/badge). Capped query for cost. */
export function useUnreadCount(uid: string, cap = 20): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) {
      setCount(0);
      return;
    }
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      where('read', '==', false),
      limit(cap),
    );
    return onSnapshot(
      q,
      (snap) => setCount(snap.size),
      (err) => {
        console.warn('[notifications] unread subscribe failed', err);
        setCount(0);
      },
    );
  }, [uid, cap]);

  return count;
}

/** Mark a single notification read. Owner-only via rules. */
export async function markNotificationRead(uid: string, notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read: true });
  } catch (err) {
    console.warn('[notifications] mark read failed', err);
  }
}

/** Mark every unread notification read (used on opening the inbox). */
export async function markAllNotificationsRead(uid: string, items: Notification[]): Promise<void> {
  const unread = items.filter((n) => !n.read);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const n of unread) {
      batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn('[notifications] mark-all-read failed', err);
  }
}
