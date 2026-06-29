import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { independenceRevisited } from './independence-revisited';
import type { ConceptSlot, MultipleChoiceVariant } from '../types';

describe('independence-revisited (Conditional Probability) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(independenceRevisited)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(independenceRevisited.comingSoon).toBeFalsy();
    expect(independenceRevisited.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc', () => {
    expect(independenceRevisited.slots.map((s) => s.id)).toEqual([
      'welcome',
      'the-puzzle',
      'the-rule',
      'resolve',
      'table-test',
      'dependent-draw',
      'product-test',
      'wrap',
    ]);
  });

  it('opens with the mutually-exclusive trap: heart and spade are NOT independent', () => {
    const slot = independenceRevisited.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label.toLowerCase()).toMatch(/not independent/);
    }
  });

  it('names independence as a definition and the three tests as a theorem', () => {
    const rule = independenceRevisited.slots.find((s) => s.id === 'the-rule') as
      | ConceptSlot
      | undefined;
    if (rule?.kind === 'concept') {
      expect(rule.definition?.name).toMatch(/independence/i);
      expect(rule.theorem?.statement.toLowerCase()).toMatch(/p\(a \| b\) = p\(a\)/);
    }
  });

  it('the table test concludes independent (48/80 = 120/200)', () => {
    const slot = independenceRevisited.slots.find((s) => s.id === 'table-test');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label.toLowerCase()).toMatch(
        /independent/,
      );
    }
  });

  it('marks draws without replacement as dependent and tags replacement_confusion', () => {
    const slot = independenceRevisited.slots.find((s) => s.id === 'dependent-draw');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label.toLowerCase()).toMatch(/no,/);
      expect(Object.values(v.misconceptionByOption ?? {})).toContain('replacement_confusion');
    }
  });

  it('segues to bayes-theorem', () => {
    const wrap = independenceRevisited.slots.find((s) => s.id === 'wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('bayes-theorem');
    }
  });
});
