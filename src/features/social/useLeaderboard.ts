import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { effectiveWeeklyXp } from '@/lib/weeklyXp';
import { getFollowing } from './socialService';
import type { PublicProfile } from './publicProfile';

export type LeaderboardEntry = {
  uid: string;
  username: string;
  displayUsername: string;
  avatarUrl: string | null;
  weeklyXp: number;
  isMe: boolean;
  rank: number;
};

type State =
  | { status: 'loading' }
  | { status: 'ready'; entries: LeaderboardEntry[]; friendCount: number };

async function loadPublic(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db, 'publicProfiles', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<PublicProfile, 'uid'>) };
}

/**
 * Friends-scoped weekly leaderboard: you plus everyone you follow, ranked by
 * XP earned this ISO week (stale buckets count as 0). Friends-only + weekly
 * reset keeps comparison supportive rather than demoralizing.
 */
export function useLeaderboard(myUid: string): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!myUid) return;
    let active = true;
    setState({ status: 'loading' });

    (async () => {
      const following = await getFollowing(myUid);
      const uids = [myUid, ...following.map((f) => f.uid)];
      const profiles = await Promise.all(uids.map(loadPublic));
      if (!active) return;

      const entries = profiles
        .filter((p): p is PublicProfile => p !== null)
        .map((p) => ({
          uid: p.uid,
          username: p.username,
          displayUsername: p.displayUsername,
          avatarUrl: p.avatarUrl,
          weeklyXp: effectiveWeeklyXp(p.weeklyXp, p.weekKey),
          isMe: p.uid === myUid,
        }))
        .sort((a, b) => b.weeklyXp - a.weeklyXp)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      setState({ status: 'ready', entries, friendCount: following.length });
    })();

    return () => {
      active = false;
    };
  }, [myUid]);

  return state;
}
