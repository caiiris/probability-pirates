/**
 * Captain Pascal's voice: short, encouraging, lightly nautical lines for the
 * moments where a guide helps most: the first welcome, the all-caught-up lull,
 * and finishing the whole course. Pure data + a tiny picker; no React.
 *
 * Tone is grounded, not hype: it names effort and progress (competence support,
 * per Self-Determination Theory) rather than empty praise.
 */

export type CaptainContext = 'welcome' | 'allCaught' | 'courseComplete' | 'lessonIntro' | 'tip';

/** `{name}` and `{title}` are replaced when present (with safe fallbacks). */
export const CAPTAIN_LINES: Record<CaptainContext, string[]> = {
  welcome: [
    "Ahoy, {name}! I'm Captain Pascal. Probability is a strange sea, but we'll learn to sail it together.",
    'Welcome aboard, {name}. Every great navigator started with one lesson. Shall we?',
    "Glad to have you, {name}. Probability looks choppy from shore, but it's calmer once we're sailing.",
  ],
  allCaught: [
    'All caught up, well sailed! Rest in port today. Spacing your practice makes it stick.',
    "Decks are clear, {name}. A day's rest sets the lessons deeper. Back at it tomorrow.",
    "Nothing left on the charts for now. Come about tomorrow and we'll press on.",
  ],
  courseComplete: [
    "Land ho! You've charted every shore of probability. Proud to have sailed with you, {name}.",
    'The whole map, explored. That took real persistence, {name}. The mark of a true navigator.',
  ],
  lessonIntro: [
    "New waters: {title}. We'll take it one step at a time. Try things; mistakes are welcome.",
    "Let's chart {title} together. Read slow, tap around, and don't fear a wrong turn.",
    "Casting off into {title}. Curiosity over speed; that's how a navigator learns.",
  ],
  tip: [
    'Short daily sessions beat one long cram. Spacing your practice locks it in.',
    'Got one wrong? Good. A mistake you fix is remembered better than a lucky guess.',
    'Try to recall the idea before you check it. That effort is what makes it stick.',
    'Stuck? Name what you *do* know first; the rest of the chart often fills itself in.',
    'Streaks are about showing up, not being perfect. A few minutes still counts.',
    'Explain a step out loud, as if teaching me. If you can teach it, you know it.',
  ],
};

/**
 * Pick one of Captain Pascal's lines for a context. By default returns the
 * first (deterministic, test-friendly); pass `pick` to rotate or randomize.
 * `{name}` is filled when provided, else softened to a generic address.
 */
export function captainLine(
  context: CaptainContext,
  opts?: { name?: string; title?: string; pick?: number },
): string {
  const lines = CAPTAIN_LINES[context];
  const i = opts?.pick != null ? ((opts.pick % lines.length) + lines.length) % lines.length : 0;
  let line = lines[i];

  const name = opts?.name?.trim();
  line = name
    ? line.replaceAll('{name}', name)
    : line.replaceAll(', {name}', '').replaceAll('{name}', 'friend');

  const title = opts?.title?.trim();
  line = line.replaceAll('{title}', title || 'this lesson');

  return line;
}

/**
 * Index of today's tip: stable within a calendar day, rotating daily so the
 * Captain's log feels fresh without being random on every render.
 */
export function dailyTipIndex(date: Date = new Date()): number {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return dayOfYear % CAPTAIN_LINES.tip.length;
}
