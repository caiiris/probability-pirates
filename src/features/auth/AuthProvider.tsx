import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ensurePublicProfile } from '@/features/social/publicProfile';

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
  activityDates?: string[];
  /** Earned achievement ids (src/lib/achievements.ts). Optional for back-compat
   *  with profiles created before achievements shipped. */
  achievements?: string[];
  /** Weekly leaderboard bucket — XP earned within `weekKey` (src/lib/weeklyXp.ts). */
  weeklyXp?: number;
  weekKey?: string | null;
  /** Cosmetic/forgiveness currency balance (src/lib/coins.ts). */
  coins?: number;
  /** Checkpoint chest ids already claimed, so each pays out once. */
  claimedChests?: string[];
  /** Owned Streak Freezes; each can cover one missed day. */
  streakFreezes?: number;
  /** Equipped avatar style id (public, shown to others). Defaults to 'classic'. */
  avatarStyle?: string;
  /** Avatar style ids the user owns (private). Always includes 'classic'. */
  ownedAvatarStyles?: string[];
  /** Equipped profile flair id (public, shown to others). Defaults to 'none'. */
  profileFlair?: string;
  /** Profile flair ids the user owns (private). Always includes 'none'. */
  ownedFlair?: string[];
};

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  // Google sign-in succeeded but the user hasn't claimed a Pascal username yet.
  // <RequireAuth> redirects this state to /setup-username. Treat the user as
  // signed in to Firebase Auth but NOT yet a full Pascal account — no profile,
  // no lessons, no XP writes.
  | { status: 'needs_username'; user: User }
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
    // Track active profile listener so we can tear it down when the user changes
    let unsubProfile: (() => void) | null = null;
    // The uid the current `state`/listener belongs to. Used to detect a genuine
    // account switch (vs. a same-user token refresh, which also fires
    // onAuthStateChanged) so we only blow away cached profile data when the
    // identity actually changes.
    let activeUid: string | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      const nextUid = firebaseUser?.uid ?? null;
      const userChanged = nextUid !== activeUid;

      // Always tear down the previous profile listener before starting a new one
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        activeUid = null;
        setState({ status: 'unauthenticated' });
        return;
      }

      // On a real account switch, immediately drop the previous user's profile
      // so their XP / achievements / streak can never bleed onto the new
      // account's screen during the window before the new snapshot lands (or if
      // that snapshot errors). Without this, signing in as B while A's profile
      // is cached in state would render A's progress under B's session.
      if (userChanged) {
        activeUid = nextUid;
        setState({ status: 'authenticated', user: firebaseUser, profile: null });
      }

      // Authenticated: subscribe to the user's profile doc.
      // For Google sign-in the profile doc may not exist yet — we treat that
      // case as `needs_username` (RequireAuth routes them to /setup-username).
      // For email signup the doc is written transactionally in registerUser,
      // so we only branch on `needs_username` when the provider is Google.
      // This avoids a flicker during email signup's brief auth-then-create
      // window.
      const isGoogleUser = firebaseUser.providerData.some((p) => p.providerId === 'google.com');
      const userRef = doc(db, 'users', firebaseUser.uid);
      unsubProfile = onSnapshot(
        userRef,
        (snap) => {
          if (!snap.exists() && isGoogleUser) {
            setState({ status: 'needs_username', user: firebaseUser });
            return;
          }
          const profile = snap.exists() ? (snap.data() as UserProfile) : null;
          setState({ status: 'authenticated', user: firebaseUser, profile });
          // Backfill/repair the public projection for accounts that predate it.
          // One-shot per session, best-effort (never blocks auth).
          if (profile) {
            void ensurePublicProfile(firebaseUser.uid, profile);
          }
        },
        (err) => {
          // Never leave the previous user's profile on screen if the read fails.
          // Surface the current user with no profile rather than stale data.
          console.error('[AuthProvider] profile snapshot error:', err);
          setState({ status: 'authenticated', user: firebaseUser, profile: null });
        },
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
