import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { lessons } from '../index';
import { lesson1 } from './01-what-is-probability';
import type { ConceptSlot, GridEventVariant, Lesson } from '../types';

describe('lesson1 invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(lesson1)).not.toThrow();
  });

  it('has expected slot structure', () => {
    const conceptSlots = lesson1.slots.filter((slot) => slot.kind === 'concept');
    const problemSlots = lesson1.slots.filter((slot) => slot.kind === 'problem');
    const wrapSlots = lesson1.slots.filter((slot) => slot.kind === 'wrap');

    // Three-act arc: 6 concept teach beats, 6 problems, 1 wrap.
    expect(conceptSlots).toHaveLength(6);
    expect(problemSlots).toHaveLength(6);
    expect(wrapSlots).toHaveLength(1);

    for (const slot of problemSlots) {
      expect(slot.variants).toHaveLength(2);
    }
  });

  it('uses the enriched concept-slot shape on teach beats (title + body + theorem or derivation)', () => {
    const enrichedIds = ['equally-likely', 'two-dice-intro'];
    for (const id of enrichedIds) {
      const slot = lesson1.slots.find((s) => s.id === id);
      expect(slot?.kind).toBe('concept');
      if (slot?.kind === 'concept') {
        expect(slot.title).toBeTruthy();
        expect(slot.body && slot.body.length).toBeGreaterThan(0);
        // D77: every enriched teach beat has at least one structured artifact:
        // a named theorem, a worked example, or a derivation.
        expect(Boolean(slot.theorem || slot.example || slot.derivation)).toBe(true);
      }
    }
  });

  it('promotes the equally-likely slot to a named theorem (D77)', () => {
    const slot = lesson1.slots.find((s) => s.id === 'equally-likely');
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toBeTruthy();
      expect(slot.theorem?.statement.length).toBeGreaterThan(0);
    }
  });

  it('routes the two-dice-intro proof beat through the derivation field (D77)', () => {
    for (const id of ['two-dice-intro']) {
      const slot = lesson1.slots.find((s) => s.id === id);
      expect(slot?.kind).toBe('concept');
      if (slot?.kind === 'concept') {
        expect(slot.derivation?.title).toBeTruthy();
        expect(slot.derivation?.steps.length).toBeGreaterThan(0);
      }
    }
  });

  it("makes two-dice-intro's derivation a flippable flashcard with a leading question (D78)", () => {
    const slot = lesson1.slots.find((s) => s.id === 'two-dice-intro');
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.derivation?.question).toMatch(/sample space.*two/i);
    }
  });

  it('throws when a derivation question is empty (D78 invariant)', () => {
    const broken: Lesson = structuredClone(lesson1);
    const slot = broken.slots.find((s) => s.id === 'two-dice-intro') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept' && slot.derivation) {
      slot.derivation.question = '   ';
    }
    expect(() => assertLessonInvariants(broken)).toThrow(/derivation\.question/);
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

  it('throws when a concept slot derivation has empty steps', () => {
    const broken: Lesson = structuredClone(lesson1);
    const slot = broken.slots.find((s) => s.id === 'two-dice-intro') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept' && slot.derivation) {
      slot.derivation.steps = [];
    }
    expect(() => assertLessonInvariants(broken)).toThrow(/derivation\.steps/);
  });

  it('throws when a concept slot theorem statement is empty', () => {
    const broken: Lesson = structuredClone(lesson1);
    const slot = broken.slots.find((s) => s.id === 'equally-likely') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept' && slot.theorem) {
      slot.theorem.statement = '   ';
    }
    expect(() => assertLessonInvariants(broken)).toThrow(/theorem\.statement/);
  });

  it('throws when a concept slot body contains an empty paragraph', () => {
    const broken: Lesson = structuredClone(lesson1);
    const slot = broken.slots.find((s) => s.id === 'hook') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept' && slot.body) {
      slot.body[0] = '   ';
    }
    expect(() => assertLessonInvariants(broken)).toThrow(/body\[0\]/);
  });

  it('throws when grid correctCells are out of bounds', () => {
    const broken: Lesson = structuredClone(lesson1);
    const slot = broken.slots.find((s) => s.id === 'grid-sum');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const variant = slot.variants[0] as GridEventVariant;
      variant.correctCells = [
        [6, 6],
        [7, 7],
      ];
    }

    expect(() => assertLessonInvariants(broken)).toThrow(/out of bounds/);
  });
});

describe('course catalog', () => {
  it('opens on the authored lessons as the playable head of the catalog', () => {
    const playable = lessons.filter((l) => !l.comingSoon);
    // Authored, in catalog order. Add ids here as new roadmap lessons are
    // authored (D88, D92–D95, D99, …). The per-unit practice-*/review-*
    // stubs were removed, so this list is now the entire catalog. D99 added
    // `compound-experiments` (opens Unit 2, ahead
    // of multiplication-principle) and `complement-rule` (opens Counting
    // Techniques). D107–D112 completed the teaching path: the conditional
    // unit (`independence-revisited`, `bayes-theorem`) and the Expected
    // Value unit (`expected-value-intuition`, `computing-expected-value`,
    // `fair-games`). D113 dropped the standalone `tree-diagrams` lesson.
    expect(playable.map((l) => l.id)).toEqual([
      'how-likely',
      'long-run-frequency',
      'sample-space',
      'equally-likely-outcomes',
      'compound-experiments',
      'multiplication-principle',
      'addition-principle',
      'complement-rule',
      'inclusion-exclusion',
      'permutations',
      'combinations',
      'independent-events',
      'birthday-paradox',
      'conditional-intuition',
      'conditional-formula',
      'independence-revisited',
      'bayes-theorem',
      'monty-hall',
      'expected-value-intuition',
      'computing-expected-value',
      'fair-games',
    ]);
    expect(playable.every((l) => l.slots.length > 0)).toBe(true);
    // The per-unit practice-*/review-* stubs were the last locked previews.
    // With them removed, every node on the path is authored and playable;
    // standalone practice (/practice) and spaced review (/warmup) cover what
    // the dedicated path nodes would have.
    const locked = lessons.filter((l) => l.comingSoon);
    expect(locked.length).toBe(0);
  });

  it('leads the path with how-likely → long-run-frequency → sample-space at numbers 1, 2, 3', () => {
    expect(lessons[0].id).toBe('how-likely');
    expect(lessons[0].number).toBe(1);
    expect(lessons[1].id).toBe('long-run-frequency');
    expect(lessons[1].number).toBe(2);
    expect(lessons[2].id).toBe('sample-space');
    expect(lessons[2].number).toBe(3);
  });

  it('has globally unique lesson ids and monotonically numbered stubs', () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Numbering stays sequential down the whole catalog so "Lesson N" is monotonic.
    expect(lessons.map((l) => l.number)).toEqual(lessons.map((_, i) => i + 1));
  });
});
