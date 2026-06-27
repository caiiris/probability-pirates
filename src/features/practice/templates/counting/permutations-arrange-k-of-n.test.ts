import { describe, it, expect } from 'vitest';
import { permutationsArrangeTemplate as t } from './permutations-arrange-k-of-n';
import { expectExactEnumeration } from '../testUtils';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { nPr, nCr } from '@/lib/probability/exact';
import type { NumberFillVariant } from '@/content/types';

function allParams(): Array<{ n: number; k: number }> {
  const out: Array<{ n: number; k: number }> = [];
  for (let n = 4; n <= 8; n++) {
    const maxK = Math.min(n - 1, 4);
    for (let k = 2; k <= maxK; k++) out.push({ n, k });
  }
  return out;
}

describe('permutations-arrange-k-of-n', () => {
  it('solve = nPr(n,k) and render round-trips through checkAnswer', () => {
    expect(() =>
      expectExactEnumeration(t, allParams(), (params, answer) => {
        if (answer.kind !== 'int') return false;
        if (answer.value !== Number(nPr(params.n, params.k))) return false;
        const variant = t.render(params);
        const payload = answerToPayload(answer, variant);
        return checkAnswer(variant, payload).wasCorrect;
      }),
    ).not.toThrow();
  });

  it('the combination count nCr(n,k) maps to the ordered_vs_unordered misconception', () => {
    for (const params of allParams()) {
      const variant = t.render(params) as NumberFillVariant;
      const combo = Number(nCr(params.n, params.k));
      expect(combo).not.toBe(variant.answer); // k ≥ 2 ⇒ nPr > nCr
      expect(variant.misconceptionByValue?.[combo]).toBe('ordered_vs_unordered');
      expect(checkAnswer(variant, { value: combo }).wasCorrect).toBe(false);
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (const params of allParams()) {
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });
});
