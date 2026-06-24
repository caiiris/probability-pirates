import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { lesson3 } from './03-counting-carefully';

describe('lesson3 (counting-carefully) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(lesson3)).not.toThrow();
  });

  it('is playable (has content, not coming soon)', () => {
    expect(lesson3.comingSoon).toBeFalsy();
    expect(lesson3.slots.length).toBeGreaterThan(0);
  });

  it('has the expected slot shape (7 concept / 6 problem / 1 wrap)', () => {
    const conceptSlots = lesson3.slots.filter((s) => s.kind === 'concept');
    const problemSlots = lesson3.slots.filter((s) => s.kind === 'problem');
    const wrapSlots = lesson3.slots.filter((s) => s.kind === 'wrap');

    expect(conceptSlots).toHaveLength(7);
    expect(problemSlots).toHaveLength(6);
    expect(wrapSlots).toHaveLength(1);

    for (const slot of problemSlots) {
      expect(slot.variants).toHaveLength(2);
    }
  });

  it('teaches the four counting tools (multiplication, addition, permutations, combinations, complement)', () => {
    const ids = lesson3.slots.map((s) => s.id);
    for (const required of [
      'multiplication-principle',
      'addition-principle',
      'permutations',
      'combinations',
      'complement',
    ]) {
      expect(ids).toContain(required);
    }
  });

  it('uses the enriched concept-slot shape on the teach beats (title + body)', () => {
    const teachIds = [
      'multiplication-principle',
      'addition-principle',
      'permutations',
      'combinations',
      'complement',
    ];
    for (const id of teachIds) {
      const slot = lesson3.slots.find((s) => s.id === id);
      expect(slot?.kind).toBe('concept');
      if (slot?.kind === 'concept') {
        expect(slot.title).toBeTruthy();
        expect(slot.body && slot.body.length).toBeGreaterThan(0);
      }
    }
  });

  it('introduces every counting principle with a named theorem (D77)', () => {
    const namedRules: Array<[string, RegExp]> = [
      ['multiplication-principle', /multiplication/i],
      ['addition-principle', /addition/i],
      ['permutations', /permutation/i],
      ['combinations', /combination/i],
      ['complement', /complement/i],
    ];
    for (const [id, namePattern] of namedRules) {
      const slot = lesson3.slots.find((s) => s.id === id);
      expect(slot?.kind).toBe('concept');
      if (slot?.kind === 'concept') {
        expect(slot.theorem?.name).toMatch(namePattern);
        expect(slot.theorem?.statement.length).toBeGreaterThan(0);
      }
    }
  });

  it("uses the bookmarked derivation block for the combinations 'why divide by k!' proof", () => {
    const slot = lesson3.slots.find((s) => s.id === 'combinations');
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.derivation?.title).toBeTruthy();
      expect(slot.derivation?.steps.length).toBeGreaterThan(2);
    }
  });

  it('keeps short numerical worked examples on the other four principles', () => {
    const withWorkedExample = [
      'multiplication-principle',
      'addition-principle',
      'permutations',
      'complement',
    ];
    for (const id of withWorkedExample) {
      const slot = lesson3.slots.find((s) => s.id === id);
      expect(slot?.kind).toBe('concept');
      if (slot?.kind === 'concept') {
        expect(slot.example?.steps.length).toBeGreaterThan(0);
      }
    }
  });

  it('segues into the birthday lesson', () => {
    const wrap = lesson3.slots.find((s) => s.kind === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('counting-gets-hard');
    }
  });
});
