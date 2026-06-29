import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { compoundExperiments } from './compound-experiments';
import { checkAnswer } from '@/lib/checkAnswer';
import type {
  ConceptSlot,
  FillTextVariant,
  MultipleChoiceVariant,
  ProblemSlot,
  TapOutcomesVariant,
} from '../types';

describe('compound-experiments (Unit 2.1) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(compoundExperiments)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(compoundExperiments.comingSoon).toBeFalsy();
    expect(compoundExperiments.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc: welcome → define → recap → build → type → count → grows → wrap', () => {
    const ids = compoundExperiments.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'define-compound',
      'recap-one-die',
      'build-coin-die',
      'type-outcome',
      'count-outcomes',
      'it-grows',
      'wrap',
    ]);
  });

  it('introduces "compound experiment" as a definition callout, not a theorem', () => {
    const slot = compoundExperiments.slots.find((s) => s.id === 'define-compound') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.definition?.name).toMatch(/compound experiment/i);
      expect(slot.theorem).toBeUndefined();
      // The definition must convey that each outcome is an ordered combination.
      const text = `${slot.definition?.statement ?? ''} ${(slot.body ?? []).join(' ')}`.toLowerCase();
      expect(text).toMatch(/combination|in order|order/);
    }
  });

  it('recaps a single die with tap-outcomes before compounding', () => {
    const slot = compoundExperiments.slots.find((s) => s.id === 'recap-one-die');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('tap-outcomes');
      const v = slot.variants[0] as TapOutcomesVariant;
      expect(v.source).toBe('d6');
      expect(v.expectedOutcomes).toEqual(['1', '2', '3', '4', '5', '6']);
    }
  });

  it('builds the (coin, die) sample space by systematic listing (mentions all 12 / the two rows)', () => {
    const slot = compoundExperiments.slots.find((s) => s.id === 'build-coin-die') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/twelve|12/);
      expect(body).toMatch(/\(h, ?1\)|\(h,1\)/);
      expect(body).toMatch(/\(t, ?1\)|\(t,1\)/);
    }
  });

  it('accepts a valid (coin, die) outcome and rejects an impossible die face', () => {
    const slot = compoundExperiments.slots.find((s) => s.id === 'type-outcome');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillTextVariant;
      for (const text of ['H4', 'h4', 'T6', '(H,4)', 't 2']) {
        expect(checkAnswer(v, { text }).wasCorrect, `expected "${text}" correct`).toBe(true);
      }
      for (const text of ['H7', 'H0', '4', 'HH', '']) {
        expect(checkAnswer(v, { text }).wasCorrect, `expected "${text}" wrong`).toBe(false);
      }
    }
  });

  it('counts the compound sample space at 12 by listing, with the 8 = 2 + 6 add-trap present', () => {
    const slot = compoundExperiments.slots.find((s) => s.id === 'count-outcomes');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('all');
      expect(v.options.find((o) => o.id === 'all')?.label).toBe('12');
      expect(v.options.find((o) => o.id === 'added-wrong')?.label).toBe('8');
      // The lesson must NOT name the multiply rule here (saved for the
      // next lesson): no "2 × 6" / "multiplication principle" in learner copy.
      const learnerCopy = [v.feedbackCorrect, v.feedbackDefault, v.explanation ?? '']
        .join(' ')
        .toLowerCase();
      expect(learnerCopy).not.toMatch(/multiplication principle/);
      expect(learnerCopy).not.toMatch(/2\s*×\s*6/);
    }
  });

  it('closes the loop by previewing the counting shortcut and segues to multiplication-principle', () => {
    const grows = compoundExperiments.slots.find((s) => s.id === 'it-grows') as
      | ConceptSlot
      | undefined;
    expect(grows?.kind).toBe('concept');
    if (grows?.kind === 'concept') {
      expect((grows.body ?? []).join(' ').toLowerCase()).toMatch(/shortcut|faster|next lesson/);
    }
    const wrap = compoundExperiments.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('multiplication-principle');
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('mixes interaction kinds: tap-outcomes, fill-text, multiple-choice', () => {
    const problems = compoundExperiments.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'tap-outcomes',
      'fill-text',
      'multiple-choice',
    ]);
  });
});
