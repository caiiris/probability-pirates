import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { equallyLikelyOutcomes } from './equally-likely-outcomes';
import type {
  ConceptSlot,
  FillFractionVariant,
  FillTextVariant,
  Lesson,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('equally-likely-outcomes (Unit 1.3) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(equallyLikelyOutcomes)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(equallyLikelyOutcomes.comingSoon).toBeFalsy();
    expect(equallyLikelyOutcomes.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc: welcome → puzzle → resolve → rule → seven → four spotting checks → dice-equal → wrap', () => {
    const ids = equallyLikelyOutcomes.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'the-puzzle',
      'resolve',
      'the-rule',
      'sum-of-seven',
      'spotting-wheel',
      'spotting-thumbtack',
      'spotting-deck',
      'spotting-dice-sum',
      'spotting-dice-equal',
      'wrap',
    ]);
  });

  it('opens the trap with a retryable MCQ so the two-tier hint flow works', () => {
    // Retryable (not commit-once): a first wrong shows the targeted feedback,
    // a second wrong reveals the explanation. The resolve concept slot still
    // does the teaching.
    const slot = equallyLikelyOutcomes.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      expect(slot.interactionKind).toBe('multiple-choice');
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('one-half');
      // The granularity-trap distractor (1/3) must be a distinct option
      // with its own tailored feedback. If it disappears, the trap
      // structure of the lesson disappears with it.
      const optionIds = v.options.map((o) => o.id);
      expect(optionIds).toContain('one-third');
      expect(v.feedbackByOption['one-third']).toBeTruthy();
    }
  });

  it('places resolve immediately after the-puzzle and uses the two-coins-grid figure to anchor the four equally-likely pairs', () => {
    const ids = equallyLikelyOutcomes.slots.map((s) => s.id);
    expect(ids.indexOf('the-puzzle')).toBe(ids.indexOf('resolve') - 1);
    const resolve = equallyLikelyOutcomes.slots.find((s) => s.id === 'resolve') as
      | ConceptSlot
      | undefined;
    expect(resolve?.kind).toBe('concept');
    if (resolve?.kind === 'concept') {
      // The two-coins-grid figure (autonomous animation from L3) is the
      // visual proof that the four pairs are the equally-likely sample
      // space. The body and the figure must agree.
      expect(resolve.figure?.kind).toBe('two-coins-grid');
      const body = (resolve.body ?? []).join(' ').toLowerCase();
      // Body must walk the three-bucket misconception explicitly.
      expect(body).toMatch(/(0h|zero heads).*?(1h|one head).*?(2h|two heads)/);
      // And must name both sample spaces — the wrong (3-bucket) one and
      // the right (4-pair) one — so the upgrade is visible.
      expect(body).toMatch(/\{0h,?\s*1h,?\s*2h\}|three buckets|three groups/);
      expect(body).toMatch(/\{hh,?\s*ht,?\s*th,?\s*tt\}|four pairs|four equally/);
    }
  });

  it('states the equally-likely precondition as a theorem callout, not a definition', () => {
    // This is a CLAIM about when P = k/N is valid (a derivable
    // condition), not a new term being named. So it lives in the
    // violet `theorem` callout, not the blue `definition` callout.
    // L3's "Probability of an event" definition is being conditioned,
    // not re-defined.
    const slot = equallyLikelyOutcomes.slots.find((s) => s.id === 'the-rule') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name?.length ?? 0).toBeGreaterThan(0);
      expect(slot.theorem?.statement.length ?? 0).toBeGreaterThan(0);
      expect(slot.definition).toBeUndefined();
      // The statement must call out the equally-likely condition AND
      // the fix (switch to a finer sample space).
      const statement = (slot.theorem?.statement ?? '').toLowerCase();
      expect(statement).toMatch(/equally likely|same chance/);
      expect(statement).toMatch(/finer sample space|specific|drop down|where they are|same number of times|use a sample space/);
    }
  });

  it('grades the sum-of-seven fill-fraction at k=6, N=36 with explicit k and N labels', () => {
    const slot = equallyLikelyOutcomes.slots.find((s) => s.id === 'sum-of-seven');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-fraction');
      const v = slot.variants[0] as FillFractionVariant;
      expect(v.numerator).toBe(6);
      expect(v.denominator).toBe(36);
      // The k and N variables introduced in L3 should be carried
      // forward to this slot's input labels so the formula reads as a
      // continuous thread.
      expect(v.numeratorLabel ?? '').toMatch(/k\b/);
      expect(v.denominatorLabel ?? '').toMatch(/N\b/);
      // If a context blurb is present, it must point at the 36 pairs
      // (not the 11 sums) as the equally-likely sample space.
      if (v.context) {
        expect(v.context.toLowerCase()).toMatch(/36 pairs|36 ordered/);
        expect(v.context.toLowerCase()).toMatch(/not equally likely|11 sums/);
      }
      // The wrong-answer feedback should cover the canonical "counted
      // sums not pairs" miss.
      expect(v.feedbackByWrongAnswer ?? {}).toHaveProperty('1/11');
    }
  });

  it('does not give away the unsimplified 6/36 fraction in the sum-of-seven prompt, context, or default feedback', () => {
    const slot = equallyLikelyOutcomes.slots.find((s) => s.id === 'sum-of-seven');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillFractionVariant;
      const learnerVisible = [v.prompt, v.context ?? '', v.feedbackDefault]
        .join(' ')
        .toLowerCase();
      expect(learnerVisible).not.toMatch(/6\s*\/\s*36/);
      expect(learnerVisible).not.toMatch(/1\s*\/\s*6/);
    }
  });

  it('splits recognition into four focused checks: wheel/thumbtack yes-no, deck "all of the above", and dice-sum size', () => {
    const wheel = equallyLikelyOutcomes.slots.find((s) => s.id === 'spotting-wheel');
    const thumbtack = equallyLikelyOutcomes.slots.find((s) => s.id === 'spotting-thumbtack');
    const deck = equallyLikelyOutcomes.slots.find((s) => s.id === 'spotting-deck');
    const diceSum = equallyLikelyOutcomes.slots.find((s) => s.id === 'spotting-dice-sum');

    for (const slot of [wheel, thumbtack, deck, diceSum]) {
      expect(slot?.kind).toBe('problem');
    }

    // Wheel and thumbtack are yes/no, both "No" (not equally likely).
    for (const slot of [wheel, thumbtack]) {
      if (slot?.kind === 'problem') {
        const v = slot.variants[0] as MultipleChoiceVariant;
        expect(v.options.map((o) => o.id).sort()).toEqual(['no', 'yes']);
        expect(v.correctOptionId).toBe('no');
        expect(v.feedbackByOption.yes?.length ?? 0).toBeGreaterThan(0);
      }
    }

    // Deck: "all of the above" is correct (52 cards, 4 suits, 13 ranks all even).
    if (deck?.kind === 'problem') {
      const v = deck.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('all');
      expect(v.options.map((o) => o.id).sort()).toEqual(['all', 'cards', 'ranks', 'suits']);
    }

    // Dice sum: 11 distinct sums, with 6 (one die), 12 (max sum), and
    // 36 (pairs) as traps.
    if (diceSum?.kind === 'problem') {
      const v = diceSum.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('sums');
      expect(v.options.find((o) => o.id === 'sums')?.label).toBe('11');
      expect(v.options.find((o) => o.id === 'pairs')?.label).toBe('36');
      expect(v.options.find((o) => o.id === 'one-die')?.label).toBe('6');
      expect(v.options.find((o) => o.id === 'max')?.label).toBe('12');
      // Every option label must be a concrete number, not a placeholder.
      for (const o of v.options) {
        expect(o.label).toMatch(/^\d+$/);
      }
    }
  });

  it('follows the dice-sum MCQ with a fill-text that grades the equally-likely sample space at 36 (6 × 6)', () => {
    const slot = equallyLikelyOutcomes.slots.find((s) => s.id === 'spotting-dice-equal');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-text');
      const v = slot.variants[0] as FillTextVariant;
      expect(new RegExp(v.acceptRegex, 'i').test('36')).toBe(true);
      expect(new RegExp(v.acceptRegex, 'i').test('11')).toBe(false);
      // The 11-sums miss must be called out as not equally likely.
      expect(v.feedbackByWrongAnswer?.['11']?.toLowerCase() ?? '').toMatch(/not equally likely|sums/);
    }
  });

  it('segues the wrap to multiplication-principle (the next authored lesson, not the next stub)', () => {
    const wrap = equallyLikelyOutcomes.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('multiplication-principle');
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
      // The wrap must preview L5's "count without listing" framing so
      // the segue lands as a continuation, not a jump.
      expect(wrap.body.toLowerCase()).toMatch(/list|count|too big|huge/);
    }
  });

  it('rejects an empty figure caption at validation time (figures must speak for themselves if rendered without the body)', () => {
    const broken: Lesson = structuredClone(equallyLikelyOutcomes);
    const slot = broken.slots.find((s) => s.id === 'resolve') as ConceptSlot | undefined;
    if (slot?.kind === 'concept' && slot.figure?.kind === 'two-coins-grid') {
      slot.figure.caption = '   ';
    }
    expect(() => assertLessonInvariants(broken)).toThrow();
  });

  it('keeps the variants spread across multiple-choice and fill-fraction (no single-interaction monotony)', () => {
    const problems = equallyLikelyOutcomes.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'multiple-choice',
      'fill-fraction',
      'multiple-choice',
      'multiple-choice',
      'multiple-choice',
      'multiple-choice',
      'fill-text',
    ]);
  });
});
