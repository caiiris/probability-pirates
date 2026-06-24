import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { lesson2 } from './02-law-of-large-numbers';

describe('lesson2 invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(lesson2)).not.toThrow();
  });

  it('is playable (has content, not coming soon)', () => {
    expect(lesson2.comingSoon).toBeFalsy();
    expect(lesson2.slots.length).toBeGreaterThan(0);
  });

  it('has the expected slot shape', () => {
    const conceptSlots = lesson2.slots.filter((s) => s.kind === 'concept');
    const problemSlots = lesson2.slots.filter((s) => s.kind === 'problem');
    const wrapSlots = lesson2.slots.filter((s) => s.kind === 'wrap');

    expect(conceptSlots).toHaveLength(2);
    expect(problemSlots).toHaveLength(4);
    expect(wrapSlots).toHaveLength(1);
  });

  it('includes a convergence simulation slot', () => {
    const sim = lesson2.slots.find(
      (s) => s.kind === 'problem' && s.interactionKind === 'simulate-proportion',
    );
    expect(sim).toBeDefined();
  });
});
