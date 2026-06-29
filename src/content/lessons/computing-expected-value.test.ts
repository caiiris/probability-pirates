import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { computingExpectedValue } from './computing-expected-value';
import { checkAnswer } from '@/lib/checkAnswer';
import type { ConceptSlot, FillTextVariant, MultipleChoiceVariant } from '../types';

describe('computing-expected-value (Expected Value) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(computingExpectedValue)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(computingExpectedValue.comingSoon).toBeFalsy();
    expect(computingExpectedValue.slots.length).toBeGreaterThan(0);
  });

  it('walks the recipe arc', () => {
    expect(computingExpectedValue.slots.map((s) => s.id)).toEqual([
      'welcome',
      'the-rule',
      'worked',
      'dice-ev',
      'weighted-spinner',
      'include-zero',
      'cards-ev',
      'wrap',
    ]);
  });

  it('states the weighted-sum theorem', () => {
    const slot = computingExpectedValue.slots.find((s) => s.id === 'the-rule') as
      | ConceptSlot
      | undefined;
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.statement.toLowerCase()).toMatch(/payoff.*probability|probability.*payoff/);
    }
  });

  it('grades the dice game (6 pays $0) at $2.50, and rejects the unchanged $3.50', () => {
    const slot = computingExpectedValue.slots.find((s) => s.id === 'dice-ev');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label).toBe('$2.50');
      expect(v.options.find((o) => o.id === 'unchanged')?.label).toBe('$3.50');
    }
  });

  it('weights unequal wedges to $3, with the unweighted $4 as a trap', () => {
    const slot = computingExpectedValue.slots.find((s) => s.id === 'weighted-spinner');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label).toBe('$3');
      expect(v.options.find((o) => o.id === 'unweighted')?.label).toBe('$4');
    }
  });

  it('keeps the losing term: win/lose game is minus $1, dropping the loss gives +$1.25', () => {
    const slot = computingExpectedValue.slots.find((s) => s.id === 'include-zero');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label).toMatch(/minus \$1/i);
      expect(v.options.find((o) => o.id === 'drop-loss')?.label).toMatch(/1\.25/);
    }
  });

  it('grades the ace-pays card game (E = $1), accepting "1" and "$1.00"', () => {
    const slot = computingExpectedValue.slots.find((s) => s.id === 'cards-ev');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillTextVariant;
      expect(checkAnswer(v, { text: '1' }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { text: '$1.00' }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { text: '13' }).wasCorrect).toBe(false);
    }
  });

  it('segues to fair-games', () => {
    const wrap = computingExpectedValue.slots.find((s) => s.id === 'wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('fair-games');
    }
  });
});
