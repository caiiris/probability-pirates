import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { expectedValueIntuition } from './expected-value-intuition';
import type { ConceptSlot, MultipleChoiceVariant } from '../types';

describe('expected-value-intuition (Expected Value) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(expectedValueIntuition)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(expectedValueIntuition.comingSoon).toBeFalsy();
    expect(expectedValueIntuition.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc', () => {
    expect(expectedValueIntuition.slots.map((s) => s.id)).toEqual([
      'welcome',
      'the-puzzle',
      'long-run-avg',
      'weighted',
      'not-an-outcome',
      'expected-vs-likely',
      'coin-game',
      'wrap',
    ]);
  });

  it('opens with the die-game average: $3.50 correct', () => {
    const slot = expectedValueIntuition.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label).toBe('$3.50');
    }
  });

  it('names expected value as a theorem (weighted long-run average)', () => {
    const slot = expectedValueIntuition.slots.find((s) => s.id === 'weighted') as
      | ConceptSlot
      | undefined;
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toMatch(/expected value/i);
    }
  });

  it('kills the "EV must be a possible outcome / most likely" misconception', () => {
    const slot = expectedValueIntuition.slots.find((s) => s.id === 'not-an-outcome');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'mode')).toBeDefined();
    }
  });

  it('separates expected ($0.50) from most likely ($0) on the scratch card', () => {
    const slot = expectedValueIntuition.slots.find((s) => s.id === 'expected-vs-likely');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label).toBe('$0.50');
      expect(v.options.find((o) => o.id === 'likely')?.label).toBe('$0');
    }
  });

  it('segues to computing-expected-value', () => {
    const wrap = expectedValueIntuition.slots.find((s) => s.id === 'wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('computing-expected-value');
    }
  });
});
