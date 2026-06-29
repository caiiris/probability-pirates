import type { WagerScoring, WagerSubmission, HistogramBucket } from '@/features/wager/types';

const MAX_BUCKETS = 20;

/**
 * Pick a bucket count that reads as a distribution for any N.
 *
 * Fixed 20 buckets at small N produced 20 mostly-empty bars + a few 1-tall
 * stubs that all looked uniform (no "distribution" shape). Scaling to N caps
 * means each bar represents ~1 submission at small N (so the chart shows
 * "here's where everyone landed") and caps at MAX_BUCKETS once the sample
 * grows enough for the buckets to fill in unevenly.
 */
function targetBuckets(n: number): number {
  return Math.min(MAX_BUCKETS, Math.max(1, n));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Build log-spaced buckets aligned so that `trueAnswer` falls exactly on a
 * bucket boundary (lo or hi). Bucket count is adaptive — see targetBuckets().
 * Guesses ≤ 0 are dropped — they have no log10 representation and would
 * corrupt the range calculation.
 *
 * Alignment strategy: the grid of boundaries is { trueAnswer × 10^(n×step) : n ∈ ℤ }
 * in actual-value space, equivalently { log10(trueAnswer) + n×step : n ∈ ℤ } in
 * log space. Because the grid always passes through log10(trueAnswer), that value
 * is the lo of exactly one bucket (n = 0) when any guesses fall above trueAnswer,
 * or the hi of the last bucket when all guesses fall below it.
 *
 * lo / hi stored as actual values (not log10 values); the histogram renderer
 * applies a log scale visually.
 */
function buildLogBuckets(
  guesses: number[],
  trueAnswer: number,
): HistogramBucket[] {
  const valid = guesses.filter((g) => g > 0);
  if (valid.length === 0) return [];

  const logTrue = Math.log10(trueAnswer);
  const logValues = valid.map((g) => Math.log10(g));
  const logMin = Math.min(...logValues, logTrue);
  const logMax = Math.max(...logValues, logTrue);

  const range = logMax - logMin;
  const step = range === 0 ? 1 : range / targetBuckets(valid.length);

  // Grid: boundary at logTrue + n*step for integer n.
  // Bucket n covers [logTrue + n*step, logTrue + (n+1)*step).
  const nFirst = Math.floor((logMin - logTrue) / step);
  // Ensure at least one bucket even when all guesses equal trueAnswer.
  const nLast = Math.max(nFirst, Math.ceil((logMax - logTrue) / step) - 1);

  const buckets: HistogramBucket[] = [];
  for (let n = nFirst; n <= nLast; n++) {
    buckets.push({
      lo: Math.pow(10, logTrue + n * step),
      hi: Math.pow(10, logTrue + (n + 1) * step),
      count: 0,
    });
  }

  for (const g of valid) {
    const rawN = Math.floor((Math.log10(g) - logTrue) / step);
    const n = clamp(rawN, nFirst, nLast);
    buckets[n - nFirst].count++;
  }

  return buckets;
}

/**
 * Build linearly-spaced buckets aligned so that `trueAnswer` falls exactly
 * on a bucket boundary. Bucket count is adaptive — see targetBuckets().
 *
 * Alignment strategy: the grid of boundaries is { trueAnswer + n×step : n ∈ ℤ }.
 * Because the grid always passes through trueAnswer, it is the lo of exactly
 * one bucket (n = 0) when any guesses fall above trueAnswer, or the hi of the
 * last bucket when all guesses fall below it.
 *
 * All guesses are valid in the abs branch (no filtering needed).
 */
function buildAbsBuckets(
  guesses: number[],
  trueAnswer: number,
): HistogramBucket[] {
  const allMin = Math.min(...guesses, trueAnswer);
  const allMax = Math.max(...guesses, trueAnswer);

  const range = allMax - allMin;
  const step = range === 0 ? 1 : range / targetBuckets(guesses.length);

  // Grid: boundary at trueAnswer + n*step for integer n.
  const nFirst = Math.floor((allMin - trueAnswer) / step);
  // Ensure at least one bucket even when all guesses equal trueAnswer.
  const nLast = Math.max(nFirst, Math.ceil((allMax - trueAnswer) / step) - 1);

  const buckets: HistogramBucket[] = [];
  for (let n = nFirst; n <= nLast; n++) {
    buckets.push({
      lo: trueAnswer + n * step,
      hi: trueAnswer + (n + 1) * step,
      count: 0,
    });
  }

  for (const g of guesses) {
    const rawN = Math.floor((g - trueAnswer) / step);
    const n = clamp(rawN, nFirst, nLast);
    buckets[n - nFirst].count++;
  }

  return buckets;
}

/**
 * Build buckets (log-spaced for 'log' scoring, linear-spaced for 'abs') with
 * `trueAnswer` guaranteed to fall on a bucket boundary. Bucket count adapts
 * to sample size: ~N buckets for small N (each bar represents ~1 submission,
 * so the chart reads as "here's where everyone landed"), capped at 20 for
 * large N (so the chart reads as a smooth distribution).
 *
 * The returned `lo` / `hi` values are always actual values, not log10 values.
 * The histogram renderer is responsible for log-scaling the x-axis visually.
 */
export function binSubmissions(
  submissions: Pick<WagerSubmission, 'guess'>[],
  trueAnswer: number,
  scoring: WagerScoring,
): HistogramBucket[] {
  if (submissions.length === 0) return [];
  const guesses = submissions.map((s) => s.guess);
  return scoring === 'log'
    ? buildLogBuckets(guesses, trueAnswer)
    : buildAbsBuckets(guesses, trueAnswer);
}

/**
 * Returns the fraction of `submissions` whose `logError` is strictly larger
 * than `userLogError`. A user who beat half the field → 0.5; the worst
 * performer → 0; the best → close to 1.
 *
 * Ties (including Infinity vs Infinity) use strict inequality: neither tied
 * submission "beats" the other. The caller is expected to suppress this
 * callout when `submissions.length < HISTOGRAM_MIN_N`.
 */
export function percentileBeaten(
  submissions: Pick<WagerSubmission, 'logError'>[],
  userLogError: number,
): number {
  if (submissions.length === 0) return 0;
  let beaten = 0;
  for (const s of submissions) {
    if (s.logError > userLogError) beaten++;
  }
  return beaten / submissions.length;
}
