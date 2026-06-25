/**
 * Vetting test for gambler-fallacy-mc template.
 *
 * Structural assertion test (no Monte-Carlo, no exact enumeration):
 * 1. solve always returns { kind:'choice', optionId:'independent' }
 * 2. render: correctOptionId === 'independent' for all sampled params
 * 3. render: exactly one option with id='independent' exists in the options list
 * 4. render: misconceptionByOption.due === 'gambler'
 * 5. Rate monotonicity: longer streak → slightly harder
 */

import { describe, it, expect } from 'vitest';
import { gamblerFallacyMcTemplate as t } from './gambler-fallacy-mc';
import { mulberry32 } from '@/lib/simulations';
import type { MultipleChoiceVariant } from '@/content/types';

describe('gambler-fallacy-mc', () => {
  it('solve always returns { kind:"choice", optionId:"independent" }', () => {
    const rng = mulberry32(0x6a_b1e_11);
    for (let i = 0; i < 200; i++) {
      const params = t.sample(rng);
      const answer = t.solve(params);
      expect(answer.kind).toBe('choice');
      if (answer.kind !== 'choice') continue;
      expect(answer.optionId).toBe('independent');
    }
  });

  it('render: correctOptionId matches solve.optionId for all sampled params', () => {
    const rng = mulberry32(0x6a_b1e_2);
    for (let i = 0; i < 200; i++) {
      const params = t.sample(rng);
      const answer = t.solve(params);
      const variant = t.render(params) as MultipleChoiceVariant;
      expect(variant.interactionKind).toBe('multiple-choice');
      if (answer.kind !== 'choice') continue;
      expect(variant.correctOptionId).toBe(answer.optionId);
    }
  });

  it('render: exactly one option with id="independent" exists', () => {
    const rng = mulberry32(0xabcdef);
    for (let i = 0; i < 100; i++) {
      const params = t.sample(rng);
      const variant = t.render(params) as MultipleChoiceVariant;
      const indepOpts = variant.options.filter((o) => o.id === 'independent');
      expect(indepOpts.length).toBe(1);
    }
  });

  it('render: misconceptionByOption.due === "gambler"', () => {
    const rng = mulberry32(0xfade_cafe);
    for (let i = 0; i < 100; i++) {
      const params = t.sample(rng);
      const variant = t.render(params) as MultipleChoiceVariant;
      expect(variant.misconceptionByOption?.due).toBe('gambler');
    }
  });

  it('render: feedbackByOption is defined for all 4 option ids', () => {
    const variant = t.render({ streakLen: 5, flavor: 0 }) as MultipleChoiceVariant;
    const optionIds = variant.options.map((o) => o.id);
    for (const id of optionIds) {
      expect(variant.feedbackByOption[id]).toBeDefined();
    }
  });

  it('rate grows with streakLen', () => {
    expect(t.rate({ streakLen: 3, flavor: 0 })).toBeLessThan(t.rate({ streakLen: 6, flavor: 0 }));
    expect(t.rate({ streakLen: 6, flavor: 0 })).toBeLessThan(t.rate({ streakLen: 8, flavor: 0 }));
  });

  it('rate stays within Elo range [700, 2000]', () => {
    for (let streakLen = 3; streakLen <= 8; streakLen++) {
      for (let flavor = 0; flavor < 3; flavor++) {
        const r = t.rate({ streakLen, flavor });
        expect(r).toBeGreaterThanOrEqual(700);
        expect(r).toBeLessThanOrEqual(2000);
      }
    }
  });
});
