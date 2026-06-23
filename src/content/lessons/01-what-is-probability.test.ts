import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { lessons } from '../index';
import { lesson1 } from './01-what-is-probability';
import type { GridEventVariant, Lesson } from '../types';

describe('lesson1 invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(lesson1)).not.toThrow();
  });

  it('has expected slot structure', () => {
    const conceptSlots = lesson1.slots.filter((slot) => slot.kind === 'concept');
    const problemSlots = lesson1.slots.filter((slot) => slot.kind === 'problem');
    const wrapSlots = lesson1.slots.filter((slot) => slot.kind === 'wrap');

    expect(conceptSlots).toHaveLength(2);
    expect(problemSlots).toHaveLength(5);
    expect(wrapSlots).toHaveLength(1);

    for (const slot of problemSlots) {
      expect(slot.variants).toHaveLength(2);
    }
  });

  it('throws when a variant interactionKind mismatches its slot', () => {
    const broken: Lesson = structuredClone(lesson1);
    const slot = broken.slots.find((s) => s.id === 'sample-space');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      slot.variants[0].interactionKind = 'fill-fraction';
    }

    expect(() => assertLessonInvariants(broken)).toThrow(/does not match slot interactionKind/);
  });

  it('throws when grid correctCells are out of bounds', () => {
    const broken: Lesson = structuredClone(lesson1);
    const slot = broken.slots.find((s) => s.id === 'grid-sum');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const variant = slot.variants[0] as GridEventVariant;
      variant.correctCells = [[6, 6], [7, 7]];
    }

    expect(() => assertLessonInvariants(broken)).toThrow(/out of bounds/);
  });
});

describe('course catalog', () => {
  it('exports six lessons with lesson1 playable', () => {
    expect(lessons).toHaveLength(6);
    expect(lessons[0]?.comingSoon).toBeUndefined();
    expect(lessons.slice(1).every((lesson) => lesson.comingSoon)).toBe(true);
  });
});
