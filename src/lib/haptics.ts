/**
 * Tiny haptic feedback helper. Uses the Vibration API, which is supported on
 * Android Chrome and ignored elsewhere (iOS Safari, desktop) — so this is a
 * pure progressive enhancement: it never throws and never blocks.
 *
 * Patterns are intentionally short so taps feel crisp rather than buzzy.
 */
export type HapticKind = 'tap' | 'correct' | 'wrong' | 'celebrate';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  correct: [14, 36, 22],
  wrong: [26, 30, 26],
  celebrate: [10, 28, 10, 28, 48],
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function haptic(kind: HapticKind): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  // Respect the OS reduced-motion preference as a proxy for "minimal feedback".
  if (prefersReducedMotion()) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Vibration can throw if called from a non-user-gesture context; ignore.
  }
}
