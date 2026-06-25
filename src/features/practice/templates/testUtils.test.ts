/**
 * Self-tests for the expectTemplateAgrees helper.
 *
 * Two goals:
 *  1. Prove the PASSING path: a correctly-implemented fair-coin template
 *     passes without throwing.
 *  2. Prove the GATE BITES: a deliberately-buggy template (solve returns 1/3
 *     but simulate is a fair coin ≈ 0.5) fails the Monte-Carlo assertion.
 */

import { describe, it, expect } from 'vitest';
import { expectTemplateAgrees } from './testUtils';
import { frac } from '@/lib/probability/exact';
import { flipIsHeads } from '@/lib/simulations';

// ---------------------------------------------------------------------------
// Shared stub helpers
// ---------------------------------------------------------------------------

/** Always returns wasCorrect: true — stand-in for WP-0's checkAnswer. */
const stubCheckAnswer = () => ({ wasCorrect: true as const });

/** Returns a trivial payload — stand-in for WP-3's answerToPayload. */
const stubAnswerToPayload = () => ({});

// ---------------------------------------------------------------------------
// Passing test: fair coin (solve = 1/2, simulate ≈ 1/2)
// ---------------------------------------------------------------------------

describe('expectTemplateAgrees self-tests', () => {
  it('PASSES for a correct fair-coin stub', () => {
    const fairCoinTemplate = {
      sample: (_rng: () => number) => ({}),

      solve: (_params: Record<string, never>) =>
        ({ kind: 'fraction' as const, value: frac(1, 2) }),

      render: (_params: Record<string, never>) => ({}),

      simulate: (_params: Record<string, never>, trials: number, rng: () => number): number => {
        let heads = 0;
        for (let i = 0; i < trials; i++) {
          if (flipIsHeads(rng)) heads++;
        }
        return heads / trials;
      },
    };

    expect(() =>
      expectTemplateAgrees(fairCoinTemplate, {
        seed: 0xc0ffee,
        samples: 50,
        trials: 10_000,
        checkAnswer: stubCheckAnswer,
        answerToPayload: stubAnswerToPayload,
      }),
    ).not.toThrow();
  });

  // --------------------------------------------------------------------------
  // Failing test: buggy template (solve = 1/3, simulate = fair coin ≈ 0.5)
  // --------------------------------------------------------------------------

  it('FAILS for a buggy stub (solve=1/3 but simulate is a fair coin)', () => {
    // |0.5 - 0.333| ≈ 0.167  >>  5 * sqrt(0.333*0.667/10000) ≈ 0.024
    // So the Monte-Carlo gate must fire on essentially every sample.
    const buggyTemplate = {
      sample: (_rng: () => number) => ({}),

      // Deliberate bug: claims P = 1/3 but the simulator is a fair coin (P ≈ 1/2)
      solve: (_params: Record<string, never>) =>
        ({ kind: 'fraction' as const, value: frac(1, 3) }),

      render: (_params: Record<string, never>) => ({}),

      simulate: (_params: Record<string, never>, trials: number, rng: () => number): number => {
        let heads = 0;
        for (let i = 0; i < trials; i++) {
          if (flipIsHeads(rng)) heads++;
        }
        return heads / trials;
      },
    };

    expect(() =>
      expectTemplateAgrees(buggyTemplate, {
        seed: 0xc0ffee,
        samples: 5, // first sample will already exceed the 5-sigma band
        trials: 10_000,
        checkAnswer: stubCheckAnswer,
        answerToPayload: stubAnswerToPayload,
      }),
    ).toThrow(/Monte-Carlo cross-check FAILED/);
  });
});
