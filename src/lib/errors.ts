/**
 * Centralized user-facing error copy.
 *
 * One home for every error string a learner can see, so the voice stays warm,
 * specific, and actionable instead of leaking developer strings or raw Firebase
 * codes into the UI. Follows docs/ui-directive.md: sentence case, no em dashes,
 * no filler, and no exclamation marks on failure states.
 *
 * Taxonomy: how an error should be surfaced. The kind is guidance for the call
 * site, which still picks the actual treatment (inline field error, toast, or
 * full-page boundary):
 *   - validation: the learner can fix it by changing input -> inline near the field
 *   - auth:       a credential or sign-in problem          -> inline on the auth form
 *   - permission: not allowed (rules / ownership)          -> toast
 *   - transient:  network / rate limit / retriable         -> toast, invite a retry
 *   - system:     unexpected, our fault                    -> toast, or full-page boundary
 */
export type ErrorKind = 'validation' | 'auth' | 'permission' | 'transient' | 'system';

// ---------------------------------------------------------------------------
// Auth error shape (the taxonomy's natural home; re-exported from userService)
// ---------------------------------------------------------------------------

export type AuthErrorCode =
  | 'username-taken'
  | 'email-in-use'
  | 'invalid-credentials'
  | 'username-not-found'
  | 'popup-closed'
  | 'account-exists-different-credential'
  | 'unknown';

export type AuthError = { code: AuthErrorCode; message: string };
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

// ---------------------------------------------------------------------------
// Copy catalog, grouped by domain
// ---------------------------------------------------------------------------

export const ERROR_COPY = {
  auth: {
    emailInUse: 'That email is already registered. Try signing in instead.',
    usernameTaken: 'That username is taken. Try another one.',
    usernameInvalid: 'Usernames are 3 to 20 characters: letters, numbers, and underscores only.',
    // Stays deliberately vague: never reveal whether the identifier exists (D50).
    invalidCredentials: 'That login does not match our records. Check your details and try again.',
    tooManyRequests: 'Too many tries just now. Wait a moment, then try again.',
    network: 'We cannot reach the network. Check your connection and try again.',
    // Operator-facing: shown when email/password sign-in is not enabled in Firebase.
    emailAuthDisabled: 'Email sign-in is not turned on yet. Enable it in the Firebase console under Authentication.',
    // Operator-facing: shown when Firestore rules block the write.
    permissionDenied: 'We could not reach your account data. Please try again in a moment.',
    signinCancelled: 'Sign-in was cancelled.',
    popupBlocked: 'Your browser blocked the sign-in popup. Allow popups for this site, then try again.',
    accountExistsDifferentCredential:
      'An account already uses this email. Sign in with your email and password instead.',
    notSignedIn: 'You are not signed in. Sign in and try again.',
    unknown: 'Something slipped on our end. Give it another try.',
  },
  profile: {
    save: 'We could not save your profile just now. Try again in a moment.',
  },
  progress: {
    saveAnswer: 'We could not save your answer. Check your connection.',
    saveProgress: 'We could not save your progress. Check your connection.',
    saveCompletion: 'We could not save your completion. Tap Continue to retry.',
    xpPartial: 'Your XP did not fully save, but your lesson completion is recorded.',
    profileUnavailable: 'Your profile is unavailable, so XP and streak may not update.',
    completionProfileUnavailable: 'Your profile is unavailable, so completion XP may not update.',
    lessonNotReady: 'This lesson is not ready yet.',
  },
  economy: {
    purchase: 'That purchase did not go through. Try again.',
    equip: 'We could not equip that. Try again.',
    chest: 'We could not open that chest. Try again.',
  },
  schedule: {
    save: 'We could not save that event. Try again.',
    update: 'We could not update that event. Try again.',
    delete: 'We could not delete that event. Try again.',
    timeFormat: 'Enter the time as HH:MM, like 14:30.',
  },
  email: {
    resendVerification: 'We could not send the email. Try again in a moment.',
  },
  social: {
    follow: 'We could not follow them. Try again.',
    unfollow: 'We could not unfollow them. Try again.',
    kudos: 'We could not send kudos. Try again.',
  },
  system: {
    boundaryTitle: 'Something slipped',
    boundaryBody: 'An unexpected error popped up, but your progress is saved.',
  },
} as const;

// ---------------------------------------------------------------------------
// Firebase auth code -> friendly, typed error
//
// Keeps the raw `auth/*` code out of the UI (it stays in console.error for
// debugging) and maps it to the one warm string a learner should see.
// ---------------------------------------------------------------------------

export function authErrorFromFirebaseCode(rawCode: string | undefined): AuthError {
  switch (rawCode) {
    case 'auth/email-already-in-use':
      return { code: 'email-in-use', message: ERROR_COPY.auth.emailInUse };
    case 'auth/operation-not-allowed':
      return { code: 'unknown', message: ERROR_COPY.auth.emailAuthDisabled };
    case 'auth/too-many-requests':
      return { code: 'unknown', message: ERROR_COPY.auth.tooManyRequests };
    case 'auth/network-request-failed':
      return { code: 'unknown', message: ERROR_COPY.auth.network };
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return { code: 'popup-closed', message: ERROR_COPY.auth.signinCancelled };
    case 'auth/account-exists-with-different-credential':
      return {
        code: 'account-exists-different-credential',
        message: ERROR_COPY.auth.accountExistsDifferentCredential,
      };
    case 'auth/popup-blocked':
      return { code: 'unknown', message: ERROR_COPY.auth.popupBlocked };
    default:
      return { code: 'unknown', message: ERROR_COPY.auth.unknown };
  }
}
