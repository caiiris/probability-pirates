import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { complementRule } from './complement-rule';
import { checkAnswer } from '@/lib/checkAnswer';
import type {
  ConceptSlot,
  FillFractionVariant,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('complement-rule (Counting Techniques) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(complementRule)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(complementRule.comingSoon).toBeFalsy();
    expect(complementRule.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc: welcome → puzzle → define → rule → not-six → at-least-one → three-coins → spot → challenge → wrap', () => {
    const ids = complementRule.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'the-puzzle',
      'define-complement',
      'the-rule',
      'not-a-six',
      'at-least-one',
      'three-coins',
      'spot-complement',
      'challenge-overlap',
      'wrap',
    ]);
  });

  it('ends with a challenge that hints at the overlap/double-count idea without naming inclusion-exclusion', () => {
    const slot = complementRule.slots.find((s) => s.id === 'challenge-overlap');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.challenge).toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('16');
      expect(v.options.find((o) => o.id === 'add')?.label).toBe('17');
      // The challenge itself must NOT name the technique; it should only
      // surface the overlap idea. (The wrap may name and segue to it.)
      const learnerCopy = [
        v.prompt,
        v.context ?? '',
        v.feedbackCorrect,
        v.feedbackDefault,
        v.explanation ?? '',
        ...Object.values(v.feedbackByOption ?? {}),
      ]
        .join(' ')
        .toLowerCase();
      expect(learnerCopy).not.toMatch(/inclusion.?exclusion/);
      expect(learnerCopy).toMatch(/twice|both|overlap|over-?count|shared/);
    }
  });

  it('opens with an "at least one six" trap, with 11/36 correct and 1/3 as the add-probabilities miss', () => {
    const slot = complementRule.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('11/36');
      expect(v.options.find((o) => o.id === 'add')?.label).toBe('1/3');
      expect(v.feedbackByOption.add?.toLowerCase() ?? '').toMatch(/1\/6|add|double/);
    }
  });

  it('introduces "complement" as a definition and the rule as a theorem (one word, one claim, two slots)', () => {
    const def = complementRule.slots.find((s) => s.id === 'define-complement') as
      | ConceptSlot
      | undefined;
    expect(def?.kind).toBe('concept');
    if (def?.kind === 'concept') {
      expect(def.definition?.name).toMatch(/complement/i);
      expect(def.theorem).toBeUndefined();
    }

    const rule = complementRule.slots.find((s) => s.id === 'the-rule') as ConceptSlot | undefined;
    expect(rule?.kind).toBe('concept');
    if (rule?.kind === 'concept') {
      expect(rule.theorem?.name).toMatch(/complement rule/i);
      expect(rule.definition).toBeUndefined();
      const statement = (rule.theorem?.statement ?? '').toLowerCase();
      expect(statement).toMatch(/1\s*[−-]\s*p\(a\)|p\(a\)\s*\+\s*p\(not a\)\s*=\s*1/);
    }
  });

  it('grades P(not 6) = 5/6 and rejects the P(6) = 1/6 confusion', () => {
    const slot = complementRule.slots.find((s) => s.id === 'not-a-six');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-fraction');
      const v = slot.variants[0] as FillFractionVariant;
      expect(v.numerator).toBe(5);
      expect(v.denominator).toBe(6);
      expect(checkAnswer(v, { numerator: 5, denominator: 6 }).wasCorrect).toBe(true);
      expect(v.feedbackByWrongAnswer ?? {}).toHaveProperty('1/6');
    }
  });

  it('uses the complement to resolve the opening puzzle (no six → 25/36, at least one → 11/36)', () => {
    const slot = complementRule.slots.find((s) => s.id === 'at-least-one') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/25\/36/);
      expect(body).toMatch(/11\/36/);
      expect(body).toMatch(/no six|none/);
    }
  });

  it('grades the three-coins at-least-one MCQ at 7/8 via the complement (1/8 = no heads trap)', () => {
    const slot = complementRule.slots.find((s) => s.id === 'three-coins');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('7/8');
      expect(v.options.find((o) => o.id === 'none')?.label).toBe('1/8');
      expect(v.feedbackByOption.none?.toLowerCase() ?? '').toMatch(/no heads|ttt|complement/);
    }
  });

  it('checks the learner can name a complement event (no heads = TTT)', () => {
    const slot = complementRule.slots.find((s) => s.id === 'spot-complement');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('no-heads');
      const wrongIds = v.options.map((o) => o.id).filter((id) => id !== v.correctOptionId);
      for (const id of wrongIds) {
        expect(v.feedbackByOption[id]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('closes with a wrap that segues to inclusion-exclusion (now authored and next in the unit)', () => {
    const wrap = complementRule.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('inclusion-exclusion');
      expect(wrap.body.toLowerCase()).toMatch(/overlap|double-count|both/);
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('mixes interaction kinds: MCQ, fill-fraction, MCQ, MCQ, MCQ', () => {
    const problems = complementRule.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'multiple-choice',
      'fill-fraction',
      'multiple-choice',
      'multiple-choice',
      'multiple-choice',
    ]);
  });
});
