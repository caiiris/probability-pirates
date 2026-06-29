import { describe, it, expect } from 'vitest';
import { computeWagerScore } from './scoring';

// ── Log branch ───────────────────────────────────────────────────────────────

describe('computeWagerScore — log branch', () => {
  const TRUE = 100;

  it('exact match → logError 0, score 100', () => {
    const { logError, score } = computeWagerScore(TRUE, TRUE, 'log');
    expect(logError).toBeCloseTo(0, 12);
    expect(score).toBe(100);
  });

  it('2× high → score 70', () => {
    const { logError, score } = computeWagerScore(200, TRUE, 'log');
    expect(logError).toBeCloseTo(Math.log10(2), 10);
    expect(score).toBe(70);
  });

  it('2× low → same score as 2× high (sign symmetry)', () => {
    const { logError, score } = computeWagerScore(50, TRUE, 'log');
    expect(logError).toBeCloseTo(Math.log10(2), 10);
    expect(score).toBe(70);
  });

  it('5× off → score 30', () => {
    const { logError, score } = computeWagerScore(500, TRUE, 'log');
    expect(logError).toBeCloseTo(Math.log10(5), 10);
    expect(score).toBe(30);
  });

  it('10× off (1 order of magnitude) → score 0', () => {
    const { logError, score } = computeWagerScore(1000, TRUE, 'log');
    expect(logError).toBeCloseTo(1, 10);
    expect(score).toBe(0);
  });

  it('100× off → score 0 (floors, no negative)', () => {
    const { score } = computeWagerScore(10000, TRUE, 'log');
    expect(score).toBe(0);
  });

  it('guess = 0 → { logError: Infinity, score: 0 }', () => {
    expect(computeWagerScore(0, TRUE, 'log')).toEqual({ logError: Infinity, score: 0 });
  });

  it('negative guess → { logError: Infinity, score: 0 }', () => {
    expect(computeWagerScore(-5, TRUE, 'log')).toEqual({ logError: Infinity, score: 0 });
  });

  it('guess = trueAnswer with arbitrary trueAnswer → score 100', () => {
    expect(computeWagerScore(50.7, 50.7, 'log').score).toBe(100);
    expect(computeWagerScore(0.001, 0.001, 'log').score).toBe(100);
    expect(computeWagerScore(1_000_000, 1_000_000, 'log').score).toBe(100);
  });

  it('score is never negative', () => {
    expect(computeWagerScore(1, TRUE, 'log').score).toBeGreaterThanOrEqual(0);
    expect(computeWagerScore(0.0001, TRUE, 'log').score).toBeGreaterThanOrEqual(0);
  });

  it('table: worked examples from spec §5', () => {
    const trueAnswer = 100;
    const cases: Array<{ guess: number; expectedScore: number }> = [
      { guess: trueAnswer, expectedScore: 100 },
      { guess: trueAnswer * 2, expectedScore: 70 },
      { guess: trueAnswer * 5, expectedScore: 30 },
      { guess: trueAnswer * 10, expectedScore: 0 },
      { guess: trueAnswer * 100, expectedScore: 0 },
    ];
    for (const { guess, expectedScore } of cases) {
      expect(computeWagerScore(guess, trueAnswer, 'log').score).toBe(expectedScore);
    }
  });
});

// ── Abs branch ───────────────────────────────────────────────────────────────

describe('computeWagerScore — abs branch', () => {
  it('exact match → logError 0, score 100', () => {
    const { logError, score } = computeWagerScore(0.05, 0.05, 'abs');
    expect(logError).toBe(0);
    expect(score).toBe(100);
  });

  it('guess = 0, trueAnswer = 0.05 → score 50 (< 100)', () => {
    // logError = 0.05; (0.05/0.05) × 0.5 = 0.5; score = round(50) = 50
    const { score } = computeWagerScore(0, 0.05, 'abs');
    expect(score).toBe(50);
    expect(score).toBeLessThan(100);
  });

  it('guess offset by exactly 2×trueAnswer (guess = 3×trueAnswer) → score 0', () => {
    // logError = 0.2 = 2×0.1; (0.2/0.1)×0.5 = 1; score = 0
    const trueAnswer = 0.1;
    const { score } = computeWagerScore(3 * trueAnswer, trueAnswer, 'abs');
    expect(score).toBe(0);
  });

  it('guess offset by more than 2×trueAnswer → score 0 (floored)', () => {
    const { score } = computeWagerScore(0.8, 0.1, 'abs');
    expect(score).toBe(0);
  });

  it('guess = trueAnswer → score 100', () => {
    expect(computeWagerScore(0.3, 0.3, 'abs').score).toBe(100);
    expect(computeWagerScore(0.5, 0.5, 'abs').score).toBe(100);
  });

  it('score is non-negative for any guess', () => {
    expect(computeWagerScore(1000, 0.001, 'abs').score).toBeGreaterThanOrEqual(0);
    expect(computeWagerScore(-99, 0.5, 'abs').score).toBeGreaterThanOrEqual(0);
  });

  it('trueAnswer = 0 uses the 0.01 floor to prevent div-by-zero', () => {
    // max(0, 0.01) = 0.01; large guess still scores ≥ 0
    const { score } = computeWagerScore(1, 0, 'abs');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(score)).toBe(true);
  });
});
