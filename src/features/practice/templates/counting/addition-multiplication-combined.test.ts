import { describe, it, expect } from 'vitest';
import { additionMultiplicationCombinedTemplate as t } from './addition-multiplication-combined';
import { expectExactEnumeration } from '../testUtils';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';

function allParams(): Array<{ a: number; c: number; p: number }> {
  const out: Array<{ a: number; c: number; p: number }> = [];
  for (let a = 2; a <= 4; a++)
    for (let c = 2; c <= 4; c++) for (let p = 2; p <= 4; p++) out.push({ a, c, p });
  return out;
}

describe('addition-multiplication-combined', () => {
  it('solve = (a + c) × p and render round-trips through checkAnswer', () => {
    expect(() =>
      expectExactEnumeration(t, allParams(), (params, answer) => {
        if (answer.kind !== 'int') return false;
        if (answer.value !== (params.a + params.c) * params.p) return false;
        const variant = t.render(params);
        return checkAnswer(variant, answerToPayload(answer, variant)).wasCorrect;
      }),
    ).not.toThrow();
  });

  it('grades the multiply-all and add-all traps as wrong', () => {
    for (const { a, c, p } of allParams()) {
      const variant = t.render({ a, c, p });
      const correct = (a + c) * p;
      const multiplyAll = a * c * p;
      const addAll = a + c + p;
      if (multiplyAll !== correct) {
        expect(checkAnswer(variant, { value: multiplyAll }).wasCorrect).toBe(false);
      }
      if (addAll !== correct) {
        expect(checkAnswer(variant, { value: addAll }).wasCorrect).toBe(false);
      }
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (const params of allParams()) {
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('trap tag: misconceptionByValue maps traps to add_vs_multiply for a=2,c=3,p=4', () => {
    // correct = 5*4 = 20; multiplyAll = 2*3*4 = 24; addAll = 2+3+4 = 9
    const variant = t.render({ a: 2, c: 3, p: 4 });
    expect(variant.interactionKind).toBe('number-fill');
    if (variant.interactionKind !== 'number-fill') return;
    const mbv = variant.misconceptionByValue;
    expect(mbv).toBeDefined();
    expect(mbv![24]).toBe('add_vs_multiply'); // multiplyAll
    expect(mbv![9]).toBe('add_vs_multiply');  // addAll
    expect(mbv![20]).toBeUndefined();          // correct answer has no trap tag
  });

  it('trap tag: collision guard omits multiplyAll when it equals correct (a=2,c=2,p=2)', () => {
    // correct = (2+2)*2 = 8; multiplyAll = 2*2*2 = 8 (collision!); addAll = 6
    const variant = t.render({ a: 2, c: 2, p: 2 });
    expect(variant.interactionKind).toBe('number-fill');
    if (variant.interactionKind !== 'number-fill') return;
    const mbv = variant.misconceptionByValue;
    // multiplyAll collides with correct, so no entry for 8
    expect(mbv?.[8]).toBeUndefined();
    // addAll = 6 differs from correct, so it should be tagged
    expect(mbv![6]).toBe('add_vs_multiply');
  });

  it('trap tag: traps differ from the correct answer', () => {
    for (const params of allParams()) {
      const variant = t.render(params);
      if (variant.interactionKind !== 'number-fill') continue;
      const mbv = variant.misconceptionByValue ?? {};
      for (const key of Object.keys(mbv)) {
        expect(Number(key)).not.toBe(variant.answer);
      }
    }
  });
});
