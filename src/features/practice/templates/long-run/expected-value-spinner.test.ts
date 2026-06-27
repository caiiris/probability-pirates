import { describe, it, expect } from 'vitest';
import { expectedValueSpinnerTemplate as t } from './expected-value-spinner';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { mulberry32 } from '@/lib/simulations';
import { toNumber } from '@/lib/probability/exact';

// A spread of representative param sets (k=3 and k=4) plus sampled ones.
const FIXED: { payoffs: number[] }[] = [
  { payoffs: [1, 2, 3] },
  { payoffs: [2, 5, 8] },
  { payoffs: [3, 7, 10] },
  { payoffs: [1, 4, 6, 9] },
  { payoffs: [2, 3, 5, 10] },
];

describe('expected-value-spinner', () => {
  it('exact E equals sum/k and the simulated mean agrees', () => {
    const sim = t.simulate;
    expect(sim).toBeDefined();

    const rng = mulberry32(0xc0ffee);
    const params: { payoffs: number[] }[] = [...FIXED];
    for (let i = 0; i < 30; i++) params.push(t.sample(rng));

    for (const p of params) {
      const answer = t.solve(p);
      expect(answer.kind).toBe('fraction');
      if (answer.kind !== 'fraction') continue;
      const exact = toNumber(answer.value);
      const sum = p.payoffs.reduce((a, b) => a + b, 0);
      expect(exact).toBe(sum / p.payoffs.length);

      const simRng = mulberry32(0x5eed + sum * 7 + p.payoffs.length);
      const mean = sim!(p, 200_000, simRng);
      // Payoffs are bounded by 10, so the per-spin SD is small; over 200k
      // trials the SE is well under 0.05. 0.1 is a safe band.
      expect(Math.abs(mean - exact)).toBeLessThan(0.1);
    }
  });

  it('render round-trips through checkAnswer', () => {
    const rng = mulberry32(0x1234);
    const params: { payoffs: number[] }[] = [...FIXED];
    for (let i = 0; i < 20; i++) params.push(t.sample(rng));

    for (const p of params) {
      const answer = t.solve(p);
      const variant = t.render(p);
      const payload = answerToPayload(answer, variant);
      expect(checkAnswer(variant, payload).wasCorrect).toBe(true);
    }
  });

  it('sample yields k∈{3,4} distinct payoffs in [1,10] with sum ≤ 40', () => {
    const rng = mulberry32(0xbeef);
    for (let i = 0; i < 500; i++) {
      const { payoffs } = t.sample(rng);
      expect([3, 4]).toContain(payoffs.length);
      expect(new Set(payoffs).size).toBe(payoffs.length);
      for (const v of payoffs) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(10);
      }
      expect(payoffs.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(40);
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    const rng = mulberry32(0x9999);
    const params: { payoffs: number[] }[] = [...FIXED];
    for (let i = 0; i < 50; i++) params.push(t.sample(rng));
    for (const p of params) {
      const r = t.rate(p);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });
});
