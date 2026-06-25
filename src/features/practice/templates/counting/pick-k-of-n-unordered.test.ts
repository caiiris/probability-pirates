/**
 * Vetting test for pick-k-of-n-unordered template.
 *
 * Updated for I-WP-H fix (WP-6b): solve now returns { kind:'choice', optionId:'combo' }
 * instead of { kind:'int' }, so we can use answerToPayload + checkAnswer for round-trip
 * verification (risk R2 is resolved for this family).
 *
 * Checks:
 * 1. solve returns { kind:'choice', optionId:'combo' } for all (n, k)
 * 2. The correct option's numeric label equals nCr(n,k) for sampled params
 * 3. answerToPayload + checkAnswer round-trips correctly (render-consistency)
 * 4. The ordered-count distractor is present and maps to ordered_vs_unordered misconception
 * 5. Rate monotonicity and Elo-range bounds
 */

import { describe, it, expect } from 'vitest';
import { pickKOfNUnorderedTemplate as t } from './pick-k-of-n-unordered';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { nCr } from '@/lib/probability/exact';
import type { MultipleChoiceVariant } from '@/content/types';

/** All (n, k) pairs in the template's sample space. */
function allParams(): Array<{ n: number; k: number }> {
  const params: Array<{ n: number; k: number }> = [];
  for (let n = 3; n <= 8; n++) {
    const maxK = Math.min(n - 1, 5);
    for (let k = 2; k <= maxK; k++) {
      params.push({ n, k });
    }
  }
  return params;
}

describe('pick-k-of-n-unordered', () => {
  it('solve returns { kind:"choice", optionId:"combo" } for all valid (n, k)', () => {
    for (const params of allParams()) {
      const answer = t.solve(params);
      expect(answer.kind).toBe('choice');
      if (answer.kind !== 'choice') continue;
      expect(answer.optionId).toBe('combo');
    }
  });

  it('correct option label equals nCr(n,k) for all valid (n, k)', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as MultipleChoiceVariant;
      const expected = Number(nCr(params.n, params.k));
      const correctOpt = variant.options.find((o) => o.id === variant.correctOptionId);
      expect(correctOpt).toBeDefined();
      expect(Number(correctOpt?.label)).toBe(expected);
    }
  });

  it('answerToPayload + checkAnswer round-trips correctly for all valid (n, k)', () => {
    for (const params of allParams()) {
      const answer = t.solve(params);
      const variant = t.render(params);
      // answerToPayload must not throw (I-WP-H fix: choice kind is valid for MC)
      const payload = answerToPayload(answer, variant);
      const result = checkAnswer(variant, payload);
      expect(result.wasCorrect).toBe(true);
    }
  });

  it('render: correctOptionId is "combo"', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as MultipleChoiceVariant;
      expect(variant.interactionKind).toBe('multiple-choice');
      expect(variant.correctOptionId).toBe('combo');
    }
  });

  it('render: exactly one correct option', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as MultipleChoiceVariant;
      const correctOpts = variant.options.filter((o) => o.id === variant.correctOptionId);
      expect(correctOpts.length).toBe(1);
    }
  });

  it('render: all 4 options have distinct labels', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as MultipleChoiceVariant;
      expect(variant.options).toHaveLength(4);
      const labels = variant.options.map((o) => o.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(4);
    }
  });

  it('render: ordered-count distractor (perm) maps to ordered_vs_unordered misconception', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as MultipleChoiceVariant;
      const permOpt = variant.options.find((o) => o.id === 'perm');
      expect(permOpt).toBeDefined();
      expect(variant.misconceptionByOption?.perm).toBe('ordered_vs_unordered');
    }
  });

  it('rate grows with n and k', () => {
    expect(t.rate({ n: 3, k: 2 })).toBeLessThan(t.rate({ n: 5, k: 3 }));
    expect(t.rate({ n: 5, k: 3 })).toBeLessThan(t.rate({ n: 8, k: 5 }));
  });

  it('rate stays within Elo range [700, 2000]', () => {
    for (const params of allParams()) {
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });
});
