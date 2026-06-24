/**
 * Social graph + discovery service.
 *
 * Edges live as subcollections under publicProfiles (see firestore.rules):
 *   - publicProfiles/{me}/following/{them}   — written by me (the list owner)
 *   - publicProfiles/{them}/followers/{me}   — written by me (doc id is my uid)
 *   - publicProfiles/{them}/kudos/{me}       — written by me (doc id is my uid)
 *
 * Counts come from `getCountFromServer` aggregation queries, so we never have to
 * let one user increment a counter on another user's document.
 *
 * Following and cheering are prosocial acts that satisfy the relatedness need
 * (Self-Determination Theory) and create study-buddy accountability — both
 * linked to sustained engagement. The first of each unlocks an achievement.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  startAt,
  endAt,
  limit,
  getCountFromServer,
  arrayUnion,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ERROR_COPY } from '@/lib/errors';
import { COINS_PER_ACHIEVEMENT } from '@/lib/coins';
import type { AchievementId } from '@/lib/achievements';
import { queueFollowNotification } from '@/features/notifications/notificationsService';

export type SocialUser = {
  uid: string;
  username: string;
  displayUsername: string;
  avatarUrl: string | null;
};

export type SocialActionResult =
  | { ok: true; newAchievement?: AchievementId }
  | { ok: false; error: string };

function edgePayload(user: SocialUser) {
  return {
    uid: user.uid,
    username: user.username,
    displayUsername: user.displayUsername,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: serverTimestamp(),
  };
}

function toSocialUser(id: string, data: Record<string, unknown>): SocialUser {
  return {
    uid: (data.uid as string) ?? id,
    username: (data.username as string) ?? '',
    displayUsername: (data.displayUsername as string) ?? (data.username as string) ?? 'Learner',
    avatarUrl: (data.avatarUrl as string | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Follow / unfollow
// ---------------------------------------------------------------------------

export async function follow(
  me: SocialUser,
  target: SocialUser,
  myAchievements?: string[],
): Promise<SocialActionResult> {
  if (me.uid === target.uid) return { ok: false, error: 'You cannot follow yourself.' };
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'publicProfiles', me.uid, 'following', target.uid), edgePayload(target));
    batch.set(doc(db, 'publicProfiles', target.uid, 'followers', me.uid), edgePayload(me));
    // Drop a "X started following you" notification in the target's inbox as
    // part of the same batch so the follow + notif land together.
    queueFollowNotification(batch, me, target.uid);

    const earnsFirst = !(myAchievements ?? []).includes('new-connection');
    if (earnsFirst) {
      const union = arrayUnion('new-connection');
      // Coins are private — only the users doc gets them.
      batch.set(
        doc(db, 'users', me.uid),
        { achievements: union, coins: increment(COINS_PER_ACHIEVEMENT) },
        { merge: true },
      );
      batch.set(doc(db, 'publicProfiles', me.uid), { achievements: union }, { merge: true });
    }

    await batch.commit();
    return { ok: true, newAchievement: earnsFirst ? 'new-connection' : undefined };
  } catch (err) {
    console.error('[follow] failed:', err);
    return { ok: false, error: ERROR_COPY.social.follow };
  }
}

export async function unfollow(meUid: string, targetUid: string): Promise<{ ok: boolean }> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'publicProfiles', meUid, 'following', targetUid));
    batch.delete(doc(db, 'publicProfiles', targetUid, 'followers', meUid));
    await batch.commit();
    return { ok: true };
  } catch (err) {
    console.warn('[unfollow] failed:', err);
    return { ok: false };
  }
}

export async function isFollowing(meUid: string, targetUid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'publicProfiles', meUid, 'following', targetUid));
    return snap.exists();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Lists + counts
// ---------------------------------------------------------------------------

export async function getFollowing(uid: string): Promise<SocialUser[]> {
  const snap = await getDocs(collection(db, 'publicProfiles', uid, 'following'));
  return snap.docs.map((d) => toSocialUser(d.id, d.data()));
}

export async function getFollowers(uid: string): Promise<SocialUser[]> {
  const snap = await getDocs(collection(db, 'publicProfiles', uid, 'followers'));
  return snap.docs.map((d) => toSocialUser(d.id, d.data()));
}

export async function getFollowCounts(
  uid: string,
): Promise<{ followers: number; following: number }> {
  try {
    const [followers, following] = await Promise.all([
      getCountFromServer(collection(db, 'publicProfiles', uid, 'followers')),
      getCountFromServer(collection(db, 'publicProfiles', uid, 'following')),
    ]);
    return { followers: followers.data().count, following: following.data().count };
  } catch (err) {
    console.warn('[getFollowCounts] failed:', err);
    return { followers: 0, following: 0 };
  }
}

// ---------------------------------------------------------------------------
// Username search (prefix match on the public projection)
// ---------------------------------------------------------------------------

export async function searchUsers(rawQuery: string, excludeUid?: string): Promise<SocialUser[]> {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  try {
    const qy = query(
      collection(db, 'publicProfiles'),
      orderBy('username'),
      startAt(q),
      endAt(q + '\uf8ff'),
      limit(10),
    );
    const snap = await getDocs(qy);
    return snap.docs
      .map((d) => toSocialUser(d.id, d.data()))
      .filter((u) => u.uid !== excludeUid);
  } catch (err) {
    console.warn('[searchUsers] failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Kudos / cheers
// ---------------------------------------------------------------------------

export async function sendKudos(
  me: SocialUser,
  targetUid: string,
  myAchievements?: string[],
): Promise<SocialActionResult> {
  if (me.uid === targetUid) return { ok: false, error: 'You cannot cheer yourself.' };
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'publicProfiles', targetUid, 'kudos', me.uid), {
      fromUid: me.uid,
      displayUsername: me.displayUsername,
      createdAt: serverTimestamp(),
    });

    const earnsFirst = !(myAchievements ?? []).includes('cheerleader');
    if (earnsFirst) {
      const union = arrayUnion('cheerleader');
      // Coins are private — only the users doc gets them.
      batch.set(
        doc(db, 'users', me.uid),
        { achievements: union, coins: increment(COINS_PER_ACHIEVEMENT) },
        { merge: true },
      );
      batch.set(doc(db, 'publicProfiles', me.uid), { achievements: union }, { merge: true });
    }

    await batch.commit();
    return { ok: true, newAchievement: earnsFirst ? 'cheerleader' : undefined };
  } catch (err) {
    console.error('[sendKudos] failed:', err);
    return { ok: false, error: ERROR_COPY.social.kudos };
  }
}

export async function removeKudos(meUid: string, targetUid: string): Promise<{ ok: boolean }> {
  try {
    await deleteDoc(doc(db, 'publicProfiles', targetUid, 'kudos', meUid));
    return { ok: true };
  } catch (err) {
    console.warn('[removeKudos] failed:', err);
    return { ok: false };
  }
}

export async function hasGivenKudos(meUid: string, targetUid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'publicProfiles', targetUid, 'kudos', meUid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getKudosCount(uid: string): Promise<number> {
  try {
    const snap = await getCountFromServer(collection(db, 'publicProfiles', uid, 'kudos'));
    return snap.data().count;
  } catch (err) {
    console.warn('[getKudosCount] failed:', err);
    return 0;
  }
}
