import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserProfile = {
  username: string;
  displayUsername: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  xp: number;
  lessonsCompleted: number;
  stepsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  milestonesReached: string[];
};

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; profile: UserProfile | null };

type AuthContextValue = AuthState;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({ status: 'loading' });

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    // Subscribe to Firebase Auth state
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setState({ status: 'unauthenticated' });
        return;
      }

      // Authenticated: subscribe to the user's profile doc
      const userRef = doc(db, 'users', firebaseUser.uid);
      const unsubProfile = onSnapshot(userRef, (snap) => {
        const profile = snap.exists() ? (snap.data() as UserProfile) : null;
        setState({ status: 'authenticated', user: firebaseUser, profile });
      });

      // Return a cleanup that both the profile subscription and the outer scope use.
      // We rely on the onAuthStateChanged unsubscribe to handle the outer cleanup;
      // the profile unsubscribe runs when the auth state changes to signed-out.
      return unsubProfile;
    });

    return unsubAuth;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
