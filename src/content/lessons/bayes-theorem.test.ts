import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { bayesTheorem } from './bayes-theorem';
import { checkAnswer } from '@/lib/checkAnswer';
import type { ConceptSlot, FillFractionVariant, MultipleChoiceVariant } from '../types';

describe("bayes-theorem (Conditional Probability) invariants", () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(bayesTheorem)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(bayesTheorem.comingSoon).toBeFalsy();
    expect(bayesTheorem.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc', () => {
    expect(bayesTheorem.slots.map((s) => s.id)).toEqual([
      'welcome',
      'the-puzzle',
      'natural-freq',
      'the-rule',
      'flagged-fill',
      'flip-it',
      'base-rate-matters',
      'wrap',
    ]);
  });

  it('opens with the medical-test trap: about 9% correct, 99% tagged base_rate_neglect', () => {
    const slot = bayesTheorem.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label).toMatch(/9%/);
      expect(v.misconceptionByOption?.accuracy).toBe('base_rate_neglect');
    }
  });

  it('teaches natural frequencies with the 100,000-person count picture', () => {
    const slot = bayesTheorem.slots.find((s) => s.id === 'natural-freq') as ConceptSlot | undefined;
    if (slot?.kind === 'concept') {
      const steps = (slot.example?.steps ?? []).join(' ').toLowerCase();
      expect(steps).toMatch(/100,000|1098/);
    }
  });

  it('names Bayes as a theorem and base rate as a definition', () => {
    const rule = bayesTheorem.slots.find((s) => s.id === 'the-rule') as ConceptSlot | undefined;
    if (rule?.kind === 'concept') {
      expect(rule.theorem?.name).toMatch(/bayes/i);
      expect(rule.definition?.name).toMatch(/base rate/i);
    }
  });

  it('grades the clean Bayes flip P(has it | flagged) = 90/180 = 1/2, rejecting the 90/100 reverse', () => {
    const slot = bayesTheorem.slots.find((s) => s.id === 'flagged-fill');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillFractionVariant;
      expect(checkAnswer(v, { numerator: 90, denominator: 180 }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { numerator: 1, denominator: 2 }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { numerator: 90, denominator: 100 }).wasCorrect).toBe(false);
      expect(v.feedbackByWrongAnswer ?? {}).toHaveProperty('90/100');
    }
  });

  it('shows the base rate drives the answer (common disease -> about 99%)', () => {
    const slot = bayesTheorem.slots.find((s) => s.id === 'base-rate-matters');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label).toMatch(/99%/);
    }
  });

  it('segues to monty-hall', () => {
    const wrap = bayesTheorem.slots.find((s) => s.id === 'wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('monty-hall');
    }
  });
});
