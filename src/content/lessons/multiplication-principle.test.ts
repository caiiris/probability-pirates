import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { multiplicationPrinciple } from './multiplication-principle';
import { checkAnswer } from '@/lib/checkAnswer';
import type {
  ConceptSlot,
  FillTextVariant,
  Lesson,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('multiplication-principle (Unit 2.4) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(multiplicationPrinciple)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(multiplicationPrinciple.comingSoon).toBeFalsy();
    expect(multiplicationPrinciple.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc: welcome → outfit → rule → road → routes → look-back → dice → lock → meal → wrap', () => {
    const ids = multiplicationPrinciple.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'outfit-puzzle',
      'the-rule',
      'resolve-with-road',
      'road-routes',
      'look-back',
      'two-dice-size',
      'bicycle-lock',
      'diner-meal',
      'wrap',
    ]);
  });

  it('uses fill-text with combination picker on the outfit puzzle', () => {
    const slot = multiplicationPrinciple.slots.find((s) => s.id === 'outfit-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      expect(slot.interactionKind).toBe('fill-text');
      const v = slot.variants[0] as FillTextVariant;
      expect(checkAnswer(v, { text: '6' }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { text: '5' }).wasCorrect).toBe(false);
      expect(v.combinationPicker?.stageAOptions.length).toBe(3);
      expect(v.combinationPicker?.stageBOptions.length).toBe(2);
      expect(v.context?.toLowerCase()).toMatch(/use the picker/);
      expect(v.feedbackByWrongAnswer?.['5']?.toLowerCase() ?? '').toMatch(/add|adding|3\s*\+\s*2/);
    }
  });

  it('places the-rule immediately after outfit-puzzle, then resolve-with-road with road-fork figure 3 × 2 = 6', () => {
    const ids = multiplicationPrinciple.slots.map((s) => s.id);
    expect(ids.indexOf('outfit-puzzle')).toBe(ids.indexOf('the-rule') - 1);
    expect(ids.indexOf('the-rule')).toBe(ids.indexOf('resolve-with-road') - 1);

    const resolve = multiplicationPrinciple.slots.find((s) => s.id === 'resolve-with-road') as
      | ConceptSlot
      | undefined;
    expect(resolve?.kind).toBe('concept');
    if (resolve?.kind === 'concept' && resolve.figure?.kind === 'road-fork') {
      expect(resolve.figure.stageA.count).toBe(3);
      expect(resolve.figure.stageB.count).toBe(2);
      expect(resolve.figure.showProduct).toBe(true);
      expect(resolve.figure.stageA.label.length).toBeGreaterThan(0);
      expect(resolve.figure.stageB.label.length).toBeGreaterThan(0);
    } else {
      throw new Error('resolve-with-road must use a road-fork figure');
    }
  });

  it('states the multiplication principle as a theorem callout (a derivable claim, not a name)', () => {
    const slot = multiplicationPrinciple.slots.find((s) => s.id === 'the-rule') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toMatch(/multiplication principle/i);
      expect(slot.definition).toBeUndefined();
      const statement = (slot.theorem?.statement ?? '').toLowerCase();
      expect(statement).toMatch(/a₁|a_1/);
      expect(statement).toMatch(/aₙ|a_n/);
      expect(statement).toMatch(/a₁\s*×\s*a₂|a_1\s*×\s*a_2|combined|total/);
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/same number of options|regardless|interfere|condition|fine.print|independent|catch|stage/);
    }
  });

  it('look-back concept reconnects Lesson 1 two dice and Lesson 3 two coins', () => {
    const slot = multiplicationPrinciple.slots.find((s) => s.id === 'look-back') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    const body = (slot?.body ?? []).join(' ').toLowerCase();
    expect(body).toMatch(/6\s*×\s*6|36/);
    expect(body).toMatch(/2\s*×\s*2|4/);
  });

  it('two-dice-size MCQ grades 1,764 as the sample-space size for two 42-sided dice', () => {
    const slot = multiplicationPrinciple.slots.find((s) => s.id === 'two-dice-size');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('pairs');
      expect(v.prompt.toLowerCase()).toMatch(/42/);
      expect(v.options.find((o) => o.id === 'pairs')?.label).toBe('1,764');
      expect(v.options.find((o) => o.id === 'unordered')?.label).toBe('882');
      expect(checkAnswer(v, { optionId: 'pairs' }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { optionId: 'added' }).wasCorrect).toBe(false);
      expect(checkAnswer(v, { optionId: 'unordered' }).wasCorrect).toBe(false);
      expect(v.feedbackByOption.unordered?.toLowerCase()).toMatch(/order|unordered|separately/);
    }
  });

  it('grades the bicycle-lock fill-text at 10,000 (10^4) and rejects every off-by-one-factor wrong answer with tailored feedback', () => {
    const slot = multiplicationPrinciple.slots.find((s) => s.id === 'bicycle-lock');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-text');
      const v = slot.variants[0] as FillTextVariant;

      for (const text of ['10000', '10,000', '10 000', '10,000']) {
        if (text === '10 000') continue;
        expect(checkAnswer(v, { text }).wasCorrect, `expected "${text}" correct`).toBe(true);
      }

      const wrongKeys = Object.keys(v.feedbackByWrongAnswer ?? {});
      for (const k of ['40', '1000', '100', '4']) {
        expect(wrongKeys, `missing tailored feedback for "${k}"`).toContain(k);
      }
    }
  });

  it('does not give away the unsimplified 10,000 answer in the bicycle-lock prompt, context, or default feedback', () => {
    const slot = multiplicationPrinciple.slots.find((s) => s.id === 'bicycle-lock');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillTextVariant;
      const learnerVisible = [v.prompt, v.context ?? '', v.feedbackDefault]
        .join(' ')
        .toLowerCase();
      expect(learnerVisible).not.toMatch(/10,?000/);
      expect(learnerVisible).not.toMatch(/10\s*\^\s*4|10 to the fourth/);
    }
  });

  it('uses a three-stage MCQ (sandwich × side × drink) at the end so the principle reads as scalable, not two-stage', () => {
    const slot = multiplicationPrinciple.slots.find((s) => s.id === 'diner-meal');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('multiple-choice');
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('all-three');
      const labels = v.options.map((o) => o.label);
      expect(labels.some((l) => l.includes('24'))).toBe(true);
      expect(labels.some((l) => l.includes('9'))).toBe(true);
      expect(labels.some((l) => l.includes('12'))).toBe(true);
      const wrongIds = v.options.map((o) => o.id).filter((id) => id !== v.correctOptionId);
      for (const id of wrongIds) {
        expect(v.feedbackByOption[id]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('closes with a wrap that segues to addition-principle (the next authored lesson)', () => {
    const wrap = multiplicationPrinciple.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('addition-principle');
      expect(wrap.body.toLowerCase()).toMatch(/addition|or adds|and multiplies/);
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('rejects a road-fork with too few or too many branches at validation time', () => {
    const broken: Lesson = structuredClone(multiplicationPrinciple);
    const slot = broken.slots.find((s) => s.id === 'resolve-with-road') as
      | ConceptSlot
      | undefined;
    if (slot?.kind === 'concept' && slot.figure?.kind === 'road-fork') {
      slot.figure.stageA.count = 0;
      expect(() => assertLessonInvariants(broken)).toThrow();
      slot.figure.stageA.count = 7;
      expect(() => assertLessonInvariants(broken)).toThrow();
      slot.figure.stageA.count = 3;
    }
  });

  it('keeps interaction variety across five problems: fill-text, MCQ, MCQ, fill-text, MCQ', () => {
    const problems = multiplicationPrinciple.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'fill-text',
      'multiple-choice',
      'multiple-choice',
      'fill-text',
      'multiple-choice',
    ]);
  });
});
