import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { howLikely } from './how-likely';
import type { ConceptSlot, FillFractionVariant, GridEventVariant, Lesson } from '../types';

describe('how-likely (course opener) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(howLikely)).not.toThrow();
  });

  it('is the playable opener (has content, not coming soon, number 1)', () => {
    expect(howLikely.comingSoon).toBeFalsy();
    expect(howLikely.slots.length).toBeGreaterThan(0);
    expect(howLikely.number).toBe(1);
  });

  it('ramps from one die (tap-outcomes) to two dice (grid)', () => {
    const ids = howLikely.slots.map((s) => s.id);
    expect(ids.indexOf('one-die')).toBeLessThan(ids.indexOf('grid-sum'));

    const oneDie = howLikely.slots.find((s) => s.id === 'one-die');
    expect(oneDie?.kind).toBe('problem');
    if (oneDie?.kind === 'problem') {
      expect(oneDie.interactionKind).toBe('tap-outcomes');
    }
  });

  it('poses the commit-once challenge question before the grid', () => {
    const ids = howLikely.slots.map((s) => s.id);
    expect(ids.indexOf('challenge')).toBeLessThan(ids.indexOf('grid-sum'));

    const challenge = howLikely.slots.find((s) => s.id === 'challenge');
    expect(challenge?.kind).toBe('problem');
    if (challenge?.kind === 'problem') {
      // No retry: answered once, proceeds right or wrong.
      expect(challenge.commitOnce).toBe(true);
      expect(challenge.challenge).toBe(true);
    }
  });

  it('keeps the signature 6x6 grid with the sum-7 payoff', () => {
    const grid = howLikely.slots.find((s) => s.id === 'grid-sum');
    expect(grid?.kind).toBe('problem');
    if (grid?.kind === 'problem') {
      const variant = grid.variants[0] as GridEventVariant;
      expect(variant.rows).toBe(6);
      expect(variant.cols).toBe(6);
      expect(variant.correctCells).toHaveLength(6);
    }
  });

  it('puts the tap-to-count even question before the definition, and another one-die question after', () => {
    const ids = howLikely.slots.map((s) => s.id);
    expect(ids[0]).toBe('welcome');
    // You can tap to count, so the even-number question comes before the formal definition...
    expect(ids.indexOf('p-even')).toBeLessThan(ids.indexOf('definition'));
    // ...and a second one-die question applies the definition right after it.
    expect(ids.indexOf('definition')).toBeLessThan(ids.indexOf('p-three'));

    const pEven = howLikely.slots.find((s) => s.id === 'p-even');
    expect(pEven?.kind).toBe('problem');
    if (pEven?.kind === 'problem') {
      expect(pEven.interactionKind).toBe('fill-fraction');
      const v = pEven.variants[0] as FillFractionVariant;
      // The fraction inputs are annotated with what each line counts.
      expect(v.numeratorLabel).toBeTruthy();
      expect(v.denominatorLabel).toBeTruthy();
    }
  });

  it('attaches in-interaction teaching notes (afterNote) on the one-die tap and the first fraction', () => {
    for (const id of ['one-die', 'p-five']) {
      const slot = howLikely.slots.find((s) => s.id === id);
      expect(slot?.kind).toBe('problem');
      if (slot?.kind === 'problem') {
        expect(slot.variants[0].afterNote).toBeTruthy();
      }
    }
  });

  it('frames the welcome with a pull-quote', () => {
    const welcome = howLikely.slots.find((s) => s.id === 'welcome') as ConceptSlot | undefined;
    expect(welcome?.kind).toBe('concept');
    if (welcome?.kind === 'concept') {
      expect(welcome.quote?.text).toBeTruthy();
      expect(welcome.quote?.attribution).toBeTruthy();
    }
  });

  it('throws when a quote has empty text', () => {
    const broken: Lesson = structuredClone(howLikely);
    const slot = broken.slots.find((s) => s.id === 'welcome') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept' && slot.quote) {
      slot.quote.text = '   ';
    }
    expect(() => assertLessonInvariants(broken)).toThrow(/quote\.text/);
  });

  it('defines probability rigorously up front (named theorem + plain gloss)', () => {
    const slot = howLikely.slots.find((s) => s.id === 'definition') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toBe('Probability');
      expect(slot.theorem?.statement.length).toBeGreaterThan(0);
      expect(slot.body && slot.body.length).toBeGreaterThan(0);
    }
  });

  it('derives the 36-roll count AFTER the grid, by cases, with no premature named theorem (D88 ordering)', () => {
    const ids = howLikely.slots.map((s) => s.id);
    // The count of all rolls comes after the grid tapping, as the "finally" beat.
    expect(ids.indexOf('grid-sum')).toBeLessThan(ids.indexOf('count-the-rolls'));

    const slot = howLikely.slots.find((s) => s.id === 'count-the-rolls') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      // The total is built by enumeration, not by naming the multiplication
      // principle (its own later lesson) or "sample space" (Unit 2).
      expect(slot.theorem).toBeUndefined();
      expect(slot.derivation?.steps.length).toBeGreaterThan(0);
      expect(slot.derivation?.question).toBeTruthy();
    }
  });

  it('throws when grid correctCells are out of bounds', () => {
    const broken: Lesson = structuredClone(howLikely);
    const slot = broken.slots.find((s) => s.id === 'grid-sum');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const variant = slot.variants[0] as GridEventVariant;
      variant.correctCells = [[6, 6], [7, 7]];
    }
    expect(() => assertLessonInvariants(broken)).toThrow(/out of bounds/);
  });
});
