/**
 * Unit tests for the pure helpers in usePracticeState (WP-6b).
 *
 * Tests:
 * - applyElo: Elo rating update formula
 * - trimRecentTemplateIds: keeps last 3 entries
 */

import { describe, it, expect } from 'vitest';
import { applyElo, trimRecentTemplateIds } from './usePracticeState';
import { DEFAULT_RATING, ELO_K } from '@/features/learner/learnerModel';

describe('applyElo', () => {
  it('raises rating on a correct answer against equal-rated opponent', () => {
    const newRating = applyElo(DEFAULT_RATING, DEFAULT_RATING, true);
    // expected = 0.5, actual = 1, delta = ELO_K * 0.5
    expect(newRating).toBeCloseTo(DEFAULT_RATING + ELO_K * 0.5, 5);
  });

  it('lowers rating on an incorrect answer against equal-rated opponent', () => {
    const newRating = applyElo(DEFAULT_RATING, DEFAULT_RATING, false);
    // expected = 0.5, actual = 0, delta = ELO_K * -0.5
    expect(newRating).toBeCloseTo(DEFAULT_RATING - ELO_K * 0.5, 5);
  });

  it('small increase on correct answer vs much harder problem', () => {
    // difficulty >> rating → expected ≈ 0 → delta ≈ ELO_K * 1 for correct
    const newRating = applyElo(1000, 2000, true);
    // expected ≈ 1/(1+10^(1000/400)) ≈ very small → delta ≈ K
    expect(newRating).toBeGreaterThan(1000);
    expect(newRating).toBeLessThan(1000 + ELO_K);
  });

  it('does not lower rating on an incorrect answer to an easier problem', () => {
    const newRating = applyElo(1000, 100, false);
    expect(newRating).toBe(1000);
  });

  it('applies ELO_K constant as the scaling factor', () => {
    // At equal difficulty, |delta| = ELO_K * 0.5 = 12
    const diff = Math.abs(applyElo(1000, 1000, true) - 1000);
    expect(diff).toBeCloseTo(ELO_K / 2, 5);
  });
});

describe('trimRecentTemplateIds', () => {
  it('appends the new id', () => {
    const result = trimRecentTemplateIds([], 'a');
    expect(result).toEqual(['a']);
  });

  it('keeps at most 3 entries', () => {
    const result = trimRecentTemplateIds(['a', 'b', 'c'], 'd');
    expect(result).toHaveLength(3);
  });

  it('drops the oldest entry when list is already length 3', () => {
    const result = trimRecentTemplateIds(['a', 'b', 'c'], 'd');
    expect(result).toEqual(['b', 'c', 'd']);
  });

  it('does not mutate the original list', () => {
    const original = ['a', 'b'];
    trimRecentTemplateIds(original, 'c');
    expect(original).toEqual(['a', 'b']);
  });

  it('works for lists shorter than 3', () => {
    expect(trimRecentTemplateIds(['a'], 'b')).toEqual(['a', 'b']);
    expect(trimRecentTemplateIds(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('allows duplicate ids (dedup is not required)', () => {
    const result = trimRecentTemplateIds(['a', 'b', 'a'], 'a');
    expect(result).toEqual(['b', 'a', 'a']);
  });
});
