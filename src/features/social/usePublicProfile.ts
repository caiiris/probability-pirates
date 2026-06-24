import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicProfile } from './publicProfile';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'ready'; profile: PublicProfile };

/**
 * Loads a public profile by username. Resolves username -> uid via the public
 * `usernames` sentinel, then subscribes live to `publicProfiles/{uid}` so
 * follow/kudos/XP changes reflect without a reload.
 */
export function usePublicProfile(username: string | undefined): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!username) {
      setState({ status: 'not-found' });
      return;
    }
    setState({ status: 'loading' });
    let unsub: (() => void) | null = null;
    let active = true;

    (async () => {
      const nameSnap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      if (!active) return;
      if (!nameSnap.exists()) {
        setState({ status: 'not-found' });
        return;
      }
      const uid = nameSnap.data().uid as string;
      unsub = onSnapshot(
        doc(db, 'publicProfiles', uid),
        (snap) => {
          if (!active) return;
          if (!snap.exists()) {
            setState({ status: 'not-found' });
            return;
          }
          setState({
            status: 'ready',
            profile: { uid, ...(snap.data() as Omit<PublicProfile, 'uid'>) },
          });
        },
        () => active && setState({ status: 'not-found' }),
      );
    })();

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [username]);

  return state;
}
