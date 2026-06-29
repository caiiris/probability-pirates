import { describe, it, expect } from 'vitest';
import { binSubmissions, percentileBeaten } from './binning';
import { mulberry32 } from '@/lib/simulations';
import { HISTOGRAM_MIN_N } from '@/features/wager/constants';

const SEED = 42;
const TRUE_ANSWER_LOG = 50.7;
const TRUE_ANSWER_ABS = 0.5;
const FLOAT_TOL = 1e-9;

/**
 * Generate `n` log-normal guesses around `trueAnswer` using Box-Muller.
 * log10(guess) ~ N(log10(trueAnswer), sigma).
 * Uses the provided seeded RNG so results are deterministic.
 */
function makeLogNormalGuesses(
  trueAnswer: number,
  n: number,
  sigma: number,
  rng: () => number,
): number[] {
  const logTrue = Math.log10(trueAnswer);
  const guesses: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    guesses.push(Math.pow(10, logTrue + sigma * z));
  }
  return guesses;
}

// ── Log-scoring binning ───────────────────────────────────────────────────────

describe('binSubmissions — log scoring', () => {
  const rng = mulberry32(SEED);
  const guesses = makeLogNormalGuesses(TRUE_ANSWER_LOG, 100, 1.0, rng);
  const submissions = guesses.map((guess) => ({ guess }));
  const buckets = binSubmissions(submissions, TRUE_ANSWER_LOG, 'log');

  it('returns ~20 buckets (18–22)', () => {
    expect(buckets.length).toBeGreaterThanOrEqual(18);
    expect(buckets.length).toBeLessThanOrEqual(22);
  });

  it('true answer falls on a bucket boundary (lo or hi) within float tolerance', () => {
    const onBoundary = buckets.some(
      (b) =>
        Math.abs(b.lo - TRUE_ANSWER_LOG) < FLOAT_TOL ||
        Math.abs(b.hi - TRUE_ANSWER_LOG) < FLOAT_TOL,
    );
    expect(onBoundary).toBe(true);
  });

  it('sum of bucket counts equals number of valid (positive) submissions', () => {
    const validCount = guesses.filter((g) => g > 0).length;
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(validCount);
  });

  it('each bucket has non-negative count', () => {
    for (const b of buckets) {
      expect(b.count).toBeGreaterThanOrEqual(0);
    }
  });

  it('buckets are contiguous and non-overlapping (hi[n] === lo[n+1])', () => {
    for (let i = 0; i + 1 < buckets.length; i++) {
      expect(buckets[i].hi).toBeCloseTo(buckets[i + 1].lo, 10);
    }
  });

  it('empty submissions → empty array', () => {
    expect(binSubmissions([], TRUE_ANSWER_LOG, 'log')).toEqual([]);
  });

  it('all non-positive guesses → empty array (no log-binneable submissions)', () => {
    const negSubs = [{ guess: -1 }, { guess: 0 }, { guess: -100 }];
    expect(binSubmissions(negSubs, TRUE_ANSWER_LOG, 'log')).toEqual([]);
  });

  it('single valid submission → returns buckets with count 1', () => {
    const result = binSubmissions([{ guess: TRUE_ANSWER_LOG }], TRUE_ANSWER_LOG, 'log');
    expect(result.length).toBeGreaterThan(0);
    const total = result.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(1);
  });

  it('adaptive bucket count: ~N buckets at small N (so each bar represents ~1 wagerer)', () => {
    // N=6 should give roughly 6 buckets (give or take 1 for true-answer alignment),
    // not the old fixed ~20. This is what makes the chart read as a distribution
    // instead of "twenty mostly-empty thin bars."
    const subs = [0.001, 0.002, 0.003, 0.005, 0.01, 0.02].map((guess) => ({ guess }));
    const buckets = binSubmissions(subs, TRUE_ANSWER_LOG, 'log');
    expect(buckets.length).toBeGreaterThanOrEqual(4);
    expect(buckets.length).toBeLessThanOrEqual(8);
  });

  it('adaptive cap at MAX_BUCKETS=20 for large N', () => {
    const subs = Array.from({ length: 200 }, (_, i) => ({ guess: 0.001 * (i + 1) }));
    const buckets = binSubmissions(subs, TRUE_ANSWER_LOG, 'log');
    expect(buckets.length).toBeLessThanOrEqual(22);
  });

  it('true answer on boundary when all guesses are above trueAnswer', () => {
    const highSubs = [{ guess: TRUE_ANSWER_LOG * 10 }, { guess: TRUE_ANSWER_LOG * 100 }];
    const result = binSubmissions(highSubs, TRUE_ANSWER_LOG, 'log');
    const onBoundary = result.some(
      (b) =>
        Math.abs(b.lo - TRUE_ANSWER_LOG) < FLOAT_TOL ||
        Math.abs(b.hi - TRUE_ANSWER_LOG) < FLOAT_TOL,
    );
    expect(onBoundary).toBe(true);
  });

  it('true answer on boundary when all guesses are below trueAnswer', () => {
    const lowSubs = [{ guess: TRUE_ANSWER_LOG / 10 }, { guess: TRUE_ANSWER_LOG / 100 }];
    const result = binSubmissions(lowSubs, TRUE_ANSWER_LOG, 'log');
    const onBoundary = result.some(
      (b) =>
        Math.abs(b.lo - TRUE_ANSWER_LOG) < FLOAT_TOL ||
        Math.abs(b.hi - TRUE_ANSWER_LOG) < FLOAT_TOL,
    );
    expect(onBoundary).toBe(true);
  });
});

// ── Abs-scoring binning ───────────────────────────────────────────────────────

describe('binSubmissions — abs scoring', () => {
  it('returns linearly-spaced buckets (constant width within float tolerance)', () => {
    const rng = mulberry32(SEED + 1);
    const subs = Array.from({ length: 50 }, () => ({ guess: rng() }));
    const buckets = binSubmissions(subs, TRUE_ANSWER_ABS, 'abs');
    expect(buckets.length).toBeGreaterThan(0);
    const firstWidth = buckets[0].hi - buckets[0].lo;
    for (const b of buckets) {
      expect(b.hi - b.lo).toBeCloseTo(firstWidth, 10);
    }
  });

  it('true answer falls on a bucket boundary', () => {
    const subs = Array.from({ length: 30 }, (_, i) => ({ guess: (i + 1) * 0.02 }));
    const result = binSubmissions(subs, TRUE_ANSWER_ABS, 'abs');
    const onBoundary = result.some(
      (b) =>
        Math.abs(b.lo - TRUE_ANSWER_ABS) < FLOAT_TOL ||
        Math.abs(b.hi - TRUE_ANSWER_ABS) < FLOAT_TOL,
    );
    expect(onBoundary).toBe(true);
  });

  it('sum of bucket counts equals submission count', () => {
    const rng = mulberry32(SEED + 2);
    const subs = Array.from({ length: 50 }, () => ({ guess: rng() }));
    const buckets = binSubmissions(subs, TRUE_ANSWER_ABS, 'abs');
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(50);
  });

  it('returns ~20 buckets for a spread-out set', () => {
    const rng = mulberry32(SEED + 3);
    const subs = Array.from({ length: 100 }, () => ({ guess: rng() }));
    const buckets = binSubmissions(subs, TRUE_ANSWER_ABS, 'abs');
    expect(buckets.length).toBeGreaterThanOrEqual(18);
    expect(buckets.length).toBeLessThanOrEqual(22);
  });

  it('empty submissions → empty array', () => {
    expect(binSubmissions([], TRUE_ANSWER_ABS, 'abs')).toEqual([]);
  });
});

// ── percentileBeaten ─────────────────────────────────────────────────────────

describe('percentileBeaten', () => {
  it('empty submissions → 0', () => {
    expect(percentileBeaten([], 0.5)).toBe(0);
  });

  it('user has the smallest logError → beats all others (result = 1)', () => {
    const subs = [{ logError: 1 }, { logError: 2 }, { logError: 3 }, { logError: 4 }];
    expect(percentileBeaten(subs, 0.5)).toBe(1.0);
  });

  it('user has the largest logError → beats nobody (result = 0)', () => {
    const subs = [{ logError: 0.1 }, { logError: 0.5 }, { logError: 1.0 }];
    expect(percentileBeaten(subs, 2.0)).toBe(0);
  });

  it('user beats half the field', () => {
    const subs = [{ logError: 0.5 }, { logError: 1.5 }];
    expect(percentileBeaten(subs, 1.0)).toBeCloseTo(0.5, 10);
  });

  it('user ties with another → tied submissions not counted (strict inequality)', () => {
    // logErrors: [1.0, 1.0, 2.0]; user = 1.0 → only 2.0 > 1.0 → 1/3
    const subs = [{ logError: 1.0 }, { logError: 1.0 }, { logError: 2.0 }];
    expect(percentileBeaten(subs, 1.0)).toBeCloseTo(1 / 3, 10);
  });

  it('single submission with same logError as user → 0 (tie, not beaten)', () => {
    expect(percentileBeaten([{ logError: 1.0 }], 1.0)).toBe(0);
  });

  it('all others tied with user → 0 (all ties, nobody strictly beaten)', () => {
    const subs = [{ logError: 1.0 }, { logError: 1.0 }, { logError: 1.0 }];
    expect(percentileBeaten(subs, 1.0)).toBe(0);
  });

  it('user logError = Infinity ties with other Infinity entries (no one beaten)', () => {
    // Infinity > Infinity is false in JS; neither beats the other
    const subs = [{ logError: Infinity }, { logError: Infinity }, { logError: 0.5 }];
    expect(percentileBeaten(subs, Infinity)).toBe(0);
  });

  it('other submissions have Infinity logError; user is finite → user beats them', () => {
    // Infinity > 0.1 is true; 0.5 > 0.1 is true → beaten = 3/3 = 1
    const subs = [{ logError: Infinity }, { logError: Infinity }, { logError: 0.5 }];
    expect(percentileBeaten(subs, 0.1)).toBe(1.0);
  });

  it('result is always in [0, 1]', () => {
    const subs = Array.from({ length: 10 }, (_, i) => ({ logError: i * 0.1 }));
    for (let ue = 0; ue <= 1.0; ue += 0.1) {
      const r = percentileBeaten(subs, ue);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it('HISTOGRAM_MIN_N = 20 is the caller-level gate for suppressing the callout', () => {
    // The helper itself does not suppress; callers check n >= HISTOGRAM_MIN_N.
    expect(HISTOGRAM_MIN_N).toBe(20);
    const fewSubs = Array.from({ length: HISTOGRAM_MIN_N - 1 }, () => ({ logError: 1.0 }));
    // Still computes a valid result; caller decides whether to show it.
    const result = percentileBeaten(fewSubs, 0.5);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
