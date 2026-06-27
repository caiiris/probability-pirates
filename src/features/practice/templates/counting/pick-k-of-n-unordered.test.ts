/**
 * Vetting test for pick-k-of-n-unordered template.
 *
 * F2: converted MC → free-response `number-fill`. solve now returns
 * { kind:'int', value: nCr(n,k) }, rendered via the number-fill interaction.
 *
 * Checks:
 * 1. solve returns { kind:'int', value: nCr(n,k) } for all (n, k)
 * 2. render is a number-fill variant whose `answer` equals nCr(n,k)
 * 3. answerToPayload + checkAnswer round-trips correctly
 * 4. the ordered-count value nPr(n,k) maps to the ordered_vs_unordered misconception
 * 5. rate monotonicity and Elo-range bounds
 */

import { describe, it, expect } from 'vitest';
import { pickKOfNUnorderedTemplate as t } from './pick-k-of-n-unordered';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { nCr, nPr } from '@/lib/probability/exact';
import type { NumberFillVariant } from '@/content/types';

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
  it('solve returns { kind:"int", value: nCr(n,k) } for all valid (n, k)', () => {
    for (const params of allParams()) {
      const answer = t.solve(params);
      expect(answer.kind).toBe('int');
      if (answer.kind !== 'int') continue;
      expect(answer.value).toBe(Number(nCr(params.n, params.k)));
    }
  });

  it('renders a number-fill variant whose answer equals nCr(n,k)', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as NumberFillVariant;
      expect(variant.interactionKind).toBe('number-fill');
      expect(variant.answer).toBe(Number(nCr(params.n, params.k)));
    }
  });

  it('answerToPayload + checkAnswer round-trips correctly for all valid (n, k)', () => {
    for (const params of allParams()) {
      const answer = t.solve(params);
      const variant = t.render(params);
      const payload = answerToPayload(answer, variant);
      expect(payload).toEqual({ value: Number(nCr(params.n, params.k)) });
      expect(checkAnswer(variant, payload).wasCorrect).toBe(true);
    }
  });

  it('the ordered-count value nPr(n,k) maps to the ordered_vs_unordered misconception', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as NumberFillVariant;
      const ordered = Number(nPr(params.n, params.k));
      // k ≥ 2 guarantees nPr > nCr, so the trap value is distinct from the answer.
      expect(ordered).not.toBe(variant.answer);
      expect(variant.misconceptionByValue?.[ordered]).toBe('ordered_vs_unordered');
    }
  });

  it('grades the ordered-count value as wrong', () => {
    for (const params of allParams()) {
      const variant = t.render(params);
      const ordered = Number(nPr(params.n, params.k));
      expect(checkAnswer(variant, { value: ordered }).wasCorrect).toBe(false);
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
