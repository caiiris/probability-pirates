/**
 * Template vetting helpers for the probability practice engine.
 *
 * `expectTemplateAgrees` — Monte-Carlo cross-check: samples param sets,
 * runs the template's exact solver and optional simulator, and asserts
 * they agree within a tolerance band.
 *
 * `expectExactEnumeration` — Alternate path for small sample spaces:
 * exhaustively checks every provided param against the template's solver.
 *
 * WP-1 implementation. Imports only from src/lib/*.
 * See docs/specs/wp/wp-1-verification-core.md for the full spec.
 */

import { mulberry32 } from '@/lib/simulations';
import { toNumber, type ExactAnswer, type Fraction } from '@/lib/probability/exact';

export type { ExactAnswer };

// ---------------------------------------------------------------------------
// Minimal Template structural type (C5 subset)
// TODO: replace with import from templates/types once WP-3 lands
// ---------------------------------------------------------------------------

export type Rng = () => number;

/**
 * Minimal structural slice of C5 Template<P> needed by the vetting helpers.
 * Uses unknown for Variant so this file is independent of WP-3 / content types.
 */
export type MinimalTemplate<P = unknown> = {
  sample(rng: Rng): P;
  solve(params: P): ExactAnswer;
  render(params: P): unknown;
  simulate?(params: P, trials: number, rng: Rng): number;
};

// ---------------------------------------------------------------------------
// Injected dependencies (avoids coupling to WP-0 / WP-3 before they land)
// ---------------------------------------------------------------------------

// Test-util seam: these functions are injected from the real `checkAnswer` /
// `answerToPayload`, which are strictly typed against `Variant`. The
// templates dir tests them against synthetic variants, so the param types
// here are deliberately wide (`any`) to accept either form without forcing
// every caller to cast at the boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CheckAnswerFn = (variant: any, payload: any) => { wasCorrect: boolean };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnswerToPayloadFn = (answer: ExactAnswer, variant: any) => unknown;

// ---------------------------------------------------------------------------
// expectTemplateAgrees options
// ---------------------------------------------------------------------------

export type ExpectTemplateAgreesOpts = {
  /** Seed for the deterministic RNG. Default: 0xC0FFEE. */
  seed?: number;
  /** Number of param sets to draw and test. Default: 1000. */
  samples?: number;
  /** Number of Monte-Carlo trials per sample. Default: 10000. */
  trials?: number;
  /**
   * Tolerance in standard-deviation units (sigmas). Default: 5.
   * A 5-sigma test fails by chance with probability ~3e-7 per sample, so
   * even 1000 samples have ~0.03% flake probability per run.
   */
  tolerance?: number;
  /**
   * Injected from WP-0 (src/lib/checkAnswer.ts) once that WP lands.
   * If omitted the render-consistency check is skipped.
   */
  checkAnswer?: CheckAnswerFn;
  /**
   * Injected from the WP-3 engine (practiceEngine.ts) once that WP lands.
   * If omitted the render-consistency check is skipped.
   */
  answerToPayload?: AnswerToPayloadFn;
};

// ---------------------------------------------------------------------------
// Helper: is the ExactAnswer a probability in [0,1]?
// ---------------------------------------------------------------------------

function extractProbability(answer: ExactAnswer): number | null {
  if (answer.kind === 'fraction') {
    const p = toNumber(answer.value as Fraction);
    if (p >= 0 && p <= 1) return p;
  }
  if (answer.kind === 'int') {
    const p = answer.value;
    if (p >= 0 && p <= 1) return p;
  }
  return null;
}

// ---------------------------------------------------------------------------
// expectTemplateAgrees
// ---------------------------------------------------------------------------

/**
 * Sample `opts.samples` param sets from `template.sample`, then for each:
 *
 * 1. Compute `p = template.solve(params)`.
 * 2. If `template.simulate` is defined and `p` is a probability in [0,1]:
 *    run the simulator and assert `|pHat - p| < tolerance * sqrt(p*(1-p)/n)`.
 * 3. If `opts.checkAnswer` and `opts.answerToPayload` are both provided:
 *    assert `checkAnswer(render(params), answerToPayload(p, render(params)))` returns `wasCorrect: true`.
 *
 * Throws a descriptive Error (not a Vitest assertion) on any failure so the
 * caller's `expect(() => ...).toThrow()` / `.not.toThrow()` works cleanly.
 */
export function expectTemplateAgrees<P>(
  template: MinimalTemplate<P>,
  opts: ExpectTemplateAgreesOpts = {},
): void {
  const seed = opts.seed ?? 0xc0ffee;
  const samples = opts.samples ?? 1000;
  const trials = opts.trials ?? 10000;
  const sigmas = opts.tolerance ?? 5;

  const rng = mulberry32(seed);

  for (let i = 0; i < samples; i++) {
    const params = template.sample(rng);
    const answer = template.solve(params);

    // --- Monte-Carlo cross-check ---
    if (template.simulate !== undefined) {
      const p = extractProbability(answer);
      if (p !== null) {
        const pHat = template.simulate(params, trials, rng);
        const pq = p * (1 - p);
        // Use at least a tiny positive variance even for p=0 or p=1
        const stdDev = Math.sqrt(pq / trials) || 1 / trials;
        const threshold = sigmas * stdDev;
        const diff = Math.abs(pHat - p);
        if (diff >= threshold) {
          throw new Error(
            `[expectTemplateAgrees] Monte-Carlo cross-check FAILED at sample ${i}:\n` +
              `  solve → ${p} (exact)\n` +
              `  simulate → ${pHat} (${trials} trials)\n` +
              `  |diff| = ${diff.toFixed(6)} ≥ threshold = ${threshold.toFixed(6)} (${sigmas}σ)`,
          );
        }
      }
    }

    // --- Render-consistency check (requires injected WP-0/WP-3 fns) ---
    if (opts.checkAnswer !== undefined && opts.answerToPayload !== undefined) {
      const variant = template.render(params);
      const payload = opts.answerToPayload(answer, variant);
      const result = opts.checkAnswer(variant, payload);
      if (!result.wasCorrect) {
        throw new Error(
          `[expectTemplateAgrees] Render-consistency FAILED at sample ${i}:\n` +
            `  checkAnswer returned wasCorrect=false.\n` +
            `  This means render(params) and solve(params) disagree.`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// expectExactEnumeration
// ---------------------------------------------------------------------------

/**
 * For small, fully enumerable sample spaces: verify that every param set in
 * `enumerate` agrees with `template.solve`.
 *
 * The `verify` callback receives `(params, answer)` and may throw or return
 * false to signal a failure. Throws a descriptive Error on the first failure.
 */
export function expectExactEnumeration<P>(
  template: MinimalTemplate<P>,
  enumerate: P[],
  verify: (params: P, answer: ExactAnswer) => boolean | void,
): void {
  for (let i = 0; i < enumerate.length; i++) {
    const params = enumerate[i];
    const answer = template.solve(params);
    let ok: boolean | void;
    try {
      ok = verify(params, answer);
    } catch (err) {
      throw new Error(
        `[expectExactEnumeration] Verification threw at index ${i}: ${String(err)}`,
      );
    }
    if (ok === false) {
      throw new Error(`[expectExactEnumeration] Verification returned false at index ${i}.`);
    }
  }
}
