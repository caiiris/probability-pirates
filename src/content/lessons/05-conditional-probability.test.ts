import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { lesson5 } from './05-conditional-probability';

describe('lesson5 invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(lesson5)).not.toThrow();
  });

  it('is playable (has content, not coming soon)', () => {
    expect(lesson5.comingSoon).toBeFalsy();
    expect(lesson5.slots.length).toBeGreaterThan(0);
  });

  it('has the expected slot shape', () => {
    const conceptSlots = lesson5.slots.filter((s) => s.kind === 'concept');
    const problemSlots = lesson5.slots.filter((s) => s.kind === 'problem');
    const wrapSlots = lesson5.slots.filter((s) => s.kind === 'wrap');

    expect(conceptSlots).toHaveLength(2);
    expect(problemSlots).toHaveLength(4);
    expect(wrapSlots).toHaveLength(1);
  });

  it('includes the Monty Hall interaction', () => {
    const monty = lesson5.slots.find(
      (s) => s.kind === 'problem' && s.interactionKind === 'monty-hall',
    );
    expect(monty).toBeDefined();
  });

  it('introduces the conditional-probability rule with a named theorem (D77)', () => {
    const intro = lesson5.slots.find((s) => s.id === 'intro');
    expect(intro?.kind).toBe('concept');
    if (intro?.kind === 'concept') {
      expect(intro.theorem?.name).toMatch(/conditional/i);
      expect(intro.theorem?.statement).toMatch(/P\(A \| B\)/);
    }
  });
});
