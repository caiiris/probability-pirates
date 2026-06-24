import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { track } from '@/lib/analytics';
import { publicProfileSeed } from '@/features/social/publicProfile';
import { ERROR_COPY, authErrorFromFirebaseCode } from '@/lib/errors';
import type { AuthError, AuthResult } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Error types (taxonomy + copy live in src/lib/errors.ts; re-exported here so
// existing `@/features/auth/userService` imports keep working)
// ---------------------------------------------------------------------------

export type { AuthErrorCode, AuthError, AuthResult } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function registerUser(params: {
  email: string;
  username: string;
  password: string;
}): Promise<AuthResult> {
  const { email, username, password } = params;
  const lowercased = username.toLowerCase();
  const usernameRef = doc(db, 'usernames', lowercased);

  // Create the Firebase Auth user first (Auth and Firestore calls run in parallel below)
  let firebaseUser;
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = credential.user;
  } catch (err) {
    const code = (err as { code?: string }).code;
    console.error('[registerUser] Auth error:', code, err);
    return { ok: false, error: authErrorFromFirebaseCode(code) };
  }

  // Firestore transaction: re-check username sentinel, then write both docs atomically
  try {
    await runTransaction(db, async (tx) => {
      const usernameSnap = await tx.get(usernameRef);
      if (usernameSnap.exists()) {
        throw new Error('username-taken');
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      const publicRef = doc(db, 'publicProfiles', firebaseUser.uid);

      tx.set(usernameRef, {
        uid: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });

      // PII-free public projection (no email), seeded alongside the private doc.
      tx.set(publicRef, publicProfileSeed({ username: lowercased, displayUsername: username }));

      tx.set(userRef, {
        username: lowercased,
        displayUsername: username,
        email,
        bio: '',
        avatarUrl: null,
        xp: 0,
        lessonsCompleted: 0,
        stepsCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        milestonesReached: [],
        activityDates: [],
        achievements: [],
        coins: 0,
        claimedChests: [],
        streakFreezes: 0,
        avatarStyle: 'classic',
        ownedAvatarStyles: ['classic'],
        profileFlair: 'none',
        ownedFlair: ['none'],
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    // Roll back the Firebase Auth account so no orphan is left behind
    try {
      await deleteUser(firebaseUser);
    } catch (deleteErr) {
      // Log but don't surface — the user-facing error is still username-taken
      console.error('Failed to clean up orphan auth user:', deleteErr);
    }

    const message = err instanceof Error ? err.message : '';
    const code = (err as { code?: string }).code ?? '';
    console.error('[registerUser] Firestore transaction error:', code, err);
    if (message === 'username-taken') {
      return { ok: false, error: { code: 'username-taken', message: ERROR_COPY.auth.usernameTaken } };
    }
    if (code === 'permission-denied' || code.includes('permission')) {
      return { ok: false, error: { code: 'unknown', message: ERROR_COPY.auth.permissionDenied } };
    }
    return { ok: false, error: { code: 'unknown', message: ERROR_COPY.auth.unknown } };
  }

  // Fire-and-forget verification email — failures are logged but don't block signup
  sendEmailVerification(firebaseUser).catch((err) =>
    console.warn('[registerUser] Could not send verification email:', err),
  );

  track('sign_up', { method: 'email_password' });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export async function signIn(params: {
  identifier: string;
  password: string;
}): Promise<AuthResult> {
  const { identifier, password } = params;
  const GENERIC_ERROR: AuthError = {
    code: 'invalid-credentials',
    message: ERROR_COPY.auth.invalidCredentials,
  };

  let email = identifier;

  // If identifier doesn't look like an email, resolve it via the username sentinel
  if (!identifier.includes('@')) {
    const usernameRef = doc(db, 'usernames', identifier.toLowerCase());
    const usernameSnap = await getDoc(usernameRef);
    if (!usernameSnap.exists()) {
      return { ok: false, error: GENERIC_ERROR };
    }
    const uid = usernameSnap.data().uid as string;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { ok: false, error: GENERIC_ERROR };
    }
    email = userSnap.data().email as string;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    track('login', { method: 'email_password' });
    return { ok: true };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// ---------------------------------------------------------------------------
// Profile update (extended by spec-profile)
// ---------------------------------------------------------------------------

import { setDoc } from 'firebase/firestore';

export async function updateProfile(
  uid: string,
  updates: { bio?: string; avatarUrl?: string | null },
): Promise<AuthResult> {
  try {
    // bio/avatar are public-safe, so mirror the same merge into the projection.
    await Promise.all([
      setDoc(doc(db, 'users', uid), updates, { merge: true }),
      setDoc(doc(db, 'publicProfiles', uid), updates, { merge: true }),
    ]);
    return { ok: true };
  } catch {
    return { ok: false, error: { code: 'unknown', message: ERROR_COPY.profile.save } };
  }
}

// ---------------------------------------------------------------------------
// Google sign-in
//
// Google does not give us a username, so the flow is two-phase:
//   1. signInWithGoogle()  → returns ok once Firebase Auth holds the credential.
//                            Returning user (profile doc exists) → fires `login`
//                            and the AuthProvider snapshot lands them on /.
//                            First-time user (no profile doc) → AuthProvider
//                            detects the gap and flips state to `needs_username`,
//                            which RequireAuth routes to /setup-username.
//   2. claimUsername()     → invoked by <UsernameSetupPage> on submit. Runs the
//                            same transactional sentinel write as registerUser
//                            (and reuses the same Firestore rules). Fires
//                            `sign_up` on success so the GA funnel reflects
//                            "Google new user finished onboarding", not just
//                            "Google clicked Sign in."
// ---------------------------------------------------------------------------

export type GoogleSignInResult =
  | { ok: true; isFirstTime: boolean }
  | { ok: false; error: AuthError };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    const provider = new GoogleAuthProvider();
    // `prompt: 'select_account'` makes the chooser show every time, even when
    // only one Google session exists. Better UX on shared/family devices.
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(auth, provider);
    const firebaseUser = credential.user;

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    const isFirstTime = !userSnap.exists();

    if (!isFirstTime) {
      track('login', { method: 'google' });
    }
    // First-time users get `sign_up` fired from claimUsername, not here —
    // signup isn't complete until they have a username.

    return { ok: true, isFirstTime };
  } catch (err) {
    const code = (err as { code?: string }).code;
    console.error('[signInWithGoogle]', code, err);
    return { ok: false, error: authErrorFromFirebaseCode(code) };
  }
}

// ---------------------------------------------------------------------------
// Claim a username for an already-authenticated user (Google first-time path)
// ---------------------------------------------------------------------------

export async function claimUsername(params: { username: string }): Promise<AuthResult> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    return { ok: false, error: { code: 'unknown', message: ERROR_COPY.auth.notSignedIn } };
  }

  const { username } = params;
  const lowercased = username.toLowerCase();
  const usernameRef = doc(db, 'usernames', lowercased);

  try {
    await runTransaction(db, async (tx) => {
      const usernameSnap = await tx.get(usernameRef);
      if (usernameSnap.exists()) {
        throw new Error('username-taken');
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      const publicRef = doc(db, 'publicProfiles', firebaseUser.uid);

      tx.set(usernameRef, {
        uid: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });

      // PII-free public projection (no email), seeded alongside the private doc.
      tx.set(publicRef, publicProfileSeed({ username: lowercased, displayUsername: username }));

      tx.set(userRef, {
        username: lowercased,
        displayUsername: username,
        email: firebaseUser.email ?? '',
        bio: '',
        avatarUrl: null,
        xp: 0,
        lessonsCompleted: 0,
        stepsCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        milestonesReached: [],
        activityDates: [],
        achievements: [],
        coins: 0,
        claimedChests: [],
        streakFreezes: 0,
        avatarStyle: 'classic',
        ownedAvatarStyles: ['classic'],
        profileFlair: 'none',
        ownedFlair: ['none'],
        createdAt: serverTimestamp(),
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const code = (err as { code?: string }).code ?? '';
    console.error('[claimUsername]', code, err);
    if (message === 'username-taken') {
      return { ok: false, error: { code: 'username-taken', message: ERROR_COPY.auth.usernameTaken } };
    }
    if (code === 'permission-denied' || code.includes('permission')) {
      return { ok: false, error: { code: 'unknown', message: ERROR_COPY.auth.permissionDenied } };
    }
    return { ok: false, error: { code: 'unknown', message: ERROR_COPY.auth.unknown } };
  }

  track('sign_up', { method: 'google' });
  return { ok: true };
}
