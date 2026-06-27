import { describe, it, expect } from 'vitest';
import { expectedTrialsUntilSuccessTemplate as t } from './expected-trials-until-success';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { mulberry32 } from '@/lib/simulations';
import { toNumber } from '@/lib/probability/exact';

const M_VALUES = [4, 6, 8, 10];
const K_VALUES = [1, 2, 3];

function allParams(): { m: number; k: number }[] {
  const out: { m: number; k: number }[] = [];
  for (const m of M_VALUES) {
    for (const k of K_VALUES) {
      if (k < m) out.push({ m, k });
    }
  }
  return out;
}

describe('expected-trials-until-success', () => {
  it('exact E equals m/k and the simulated mean agrees', () => {
    const sim = t.simulate;
    expect(sim).toBeDefined();

    for (const p of allParams()) {
      const answer = t.solve(p);
      expect(answer.kind).toBe('fraction');
      if (answer.kind !== 'fraction') continue;
      const exact = toNumber(answer.value);
      expect(exact).toBe(p.m / p.k);

      const rng = mulberry32(0xabcd + p.m * 17 + p.k);
      const mean = sim!(p, 200_000, rng);
      // Geometric SD is sqrt((1-p))/p; worst case p=1/10 gives SE ≈ 0.021 over
      // 200k trials. 0.15 is a safe band.
      expect(Math.abs(mean - exact)).toBeLessThan(0.15);
    }
  });

  it('render round-trips through checkAnswer', () => {
    for (const p of allParams()) {
      const answer = t.solve(p);
      const variant = t.render(p);
      const payload = answerToPayload(answer, variant);
      expect(checkAnswer(variant, payload).wasCorrect).toBe(true);
    }
  });

  it('sample yields m∈{4,6,8,10}, k∈{1,2,3} with k<m', () => {
    const rng = mulberry32(0xbeef);
    for (let i = 0; i < 500; i++) {
      const { m, k } = t.sample(rng);
      expect(M_VALUES).toContain(m);
      expect(K_VALUES).toContain(k);
      expect(k).toBeLessThan(m);
    }
  });

  it('rate stays within the Elo range [700, 2000] and clamps ≤ 1450', () => {
    for (const p of allParams()) {
      const r = t.rate(p);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
      expect(r).toBeLessThanOrEqual(1450);
    }
  });
});
