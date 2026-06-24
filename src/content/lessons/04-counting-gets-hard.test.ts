import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { lesson4 } from './04-counting-gets-hard';

describe('lesson4 invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(lesson4)).not.toThrow();
  });

  it('is playable (has content, not coming soon)', () => {
    expect(lesson4.comingSoon).toBeFalsy();
    expect(lesson4.slots.length).toBeGreaterThan(0);
  });

  it('has the expected slot shape', () => {
    const conceptSlots = lesson4.slots.filter((s) => s.kind === 'concept');
    const problemSlots = lesson4.slots.filter((s) => s.kind === 'problem');
    const wrapSlots = lesson4.slots.filter((s) => s.kind === 'wrap');

    // 3 setup beats + 1 derivation page (D77) + 4 problems + 1 wrap.
    expect(conceptSlots).toHaveLength(4);
    expect(problemSlots).toHaveLength(4);
    expect(wrapSlots).toHaveLength(1);
  });

  it('shows the birthday-paradox derivation as a dedicated bookmarked page (D77)', () => {
    const slot = lesson4.slots.find((s) => s.id === 'birthday-derivation');
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.derivation?.title).toBeTruthy();
      expect(slot.derivation?.steps.length).toBeGreaterThan(3);
    }
  });

  it('includes a birthday simulation with a valid room size', () => {
    const sim = lesson4.slots.find(
      (s) => s.kind === 'problem' && s.interactionKind === 'simulate-proportion',
    );
    expect(sim).toBeDefined();
    if (sim && sim.kind === 'problem') {
      for (const variant of sim.variants) {
        if (variant.interactionKind === 'simulate-proportion' && variant.scenario === 'birthday') {
          expect(variant.roomSize ?? 0).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});
