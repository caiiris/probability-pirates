/**
 * Google OAuth on mobile must use redirect, not popup.
 *
 * `signInWithPopup` is unreliable on iOS Safari, iPadOS, and most in-app
 * browsers: the "popup" becomes a redirect, sessionStorage state is lost, and
 * Firebase throws "Unable to process request because this application is
 * missing the initial state." Desktop keeps popup for a smoother one-tab flow.
 */

/** True when OAuth should use `signInWithRedirect` instead of popup. */
export function prefersAuthRedirect(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;

  // iPadOS 13+ reports as Mac — catch touch Macs.
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true;

  return false;
}

let pendingRedirectError: string | null = null;

/** Set after a failed `getRedirectResult` so Login/Register can surface it. */
export function setAuthRedirectError(message: string): void {
  pendingRedirectError = message;
}

/** Read and clear any redirect error (call once on auth page mount). */
export function takeAuthRedirectError(): string | null {
  const message = pendingRedirectError;
  pendingRedirectError = null;
  return message;
}
