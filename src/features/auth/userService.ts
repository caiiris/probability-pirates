import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type AuthErrorCode =
  | 'username-taken'
  | 'email-in-use'
  | 'invalid-credentials'
  | 'username-not-found'
  | 'unknown';

export type AuthError = { code: AuthErrorCode; message: string };
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

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

  // Fast pre-check — catches most races without burning an auth account
  const usernameRef = doc(db, 'usernames', lowercased);
  const existingUsername = await getDoc(usernameRef);
  if (existingUsername.exists()) {
    return { ok: false, error: { code: 'username-taken', message: 'Username is already taken.' } };
  }

  // Create the Firebase Auth user
  let firebaseUser;
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseUser = credential.user;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/email-already-in-use') {
      return { ok: false, error: { code: 'email-in-use', message: 'An account with this email already exists.' } };
    }
    return { ok: false, error: { code: 'unknown', message: 'Something went wrong. Please try again.' } };
  }

  // Firestore transaction: re-check username sentinel, then write both docs atomically
  try {
    await runTransaction(db, async (tx) => {
      const usernameSnap = await tx.get(usernameRef);
      if (usernameSnap.exists()) {
        throw new Error('username-taken');
      }

      const userRef = doc(db, 'users', firebaseUser.uid);

      tx.set(usernameRef, {
        uid: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });

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
    if (message === 'username-taken') {
      return { ok: false, error: { code: 'username-taken', message: 'Username is already taken.' } };
    }
    return { ok: false, error: { code: 'unknown', message: 'Something went wrong. Please try again.' } };
  }

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
    message: 'Email/username or password is incorrect.',
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
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, updates, { merge: true });
    return { ok: true };
  } catch {
    return { ok: false, error: { code: 'unknown', message: 'Could not save profile. Please try again.' } };
  }
}
