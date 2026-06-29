import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { permutations } from './permutations';
import { checkAnswer } from '@/lib/checkAnswer';
import type {
  ConceptSlot,
  FillTextVariant,
  MultiplyStepsVariant,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('permutations (Counting Techniques) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(permutations)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(permutations.comingSoon).toBeFalsy();
    expect(permutations.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc, ending with the 4-page circular-arrangement challenge', () => {
    const ids = permutations.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'the-puzzle',
      'resolve',
      'factorial',
      'line-four',
      'partial',
      'partial-formula',
      'medals',
      'order-matters',
      'circle-intro',
      'circle-explore',
      'circle-why',
      'circle-answer',
      'wrap',
    ]);
  });

  it('marks every page of the circular-arrangement walkthrough as a challenge', () => {
    for (const id of ['circle-intro', 'circle-explore', 'circle-why', 'circle-answer']) {
      const slot = permutations.slots.find((s) => s.id === id);
      expect(slot, id).toBeTruthy();
      if (slot?.kind === 'problem' || slot?.kind === 'concept') {
        expect(slot.challenge, `${id} should carry the challenge flag`).toBe(true);
      }
    }
  });

  it('opens the circle challenge with a pirate-themed circle-vs-line question', () => {
    const slot = permutations.slots.find((s) => s.id === 'circle-intro');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.prompt.toLowerCase()).toMatch(/pirate|round table|loot/);
    }
  });

  it('gives the explore page an interactive circle-builder figure', () => {
    const slot = permutations.slots.find((s) => s.id === 'circle-explore') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.figure?.kind).toBe('circle-builder');
    }
  });

  it('derives (n−1)! on the why page (rotations collapse; pin one person)', () => {
    const slot = permutations.slots.find((s) => s.id === 'circle-why') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.statement ?? '').toMatch(/\(n ?[−-] ?1\)!/);
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/no ends|÷ ?n|n! ?÷ ?n|rotation/);
      const steps = (slot.derivation?.steps ?? []).join(' ').toLowerCase();
      expect(steps).toMatch(/fix|pin/);
    }
  });

  it('answers the circle challenge with a fill-text graded at 24 = (5−1)!, rejecting the 5! = 120 trap', () => {
    const slot = permutations.slots.find((s) => s.id === 'circle-answer');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-text');
      const v = slot.variants[0] as FillTextVariant;
      expect(checkAnswer(v, { text: '24' }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { text: '120' }).wasCorrect).toBe(false);
      expect(v.feedbackByWrongAnswer?.['120']?.toLowerCase() ?? '').toMatch(/5!|line|÷ ?5|rotation/);
    }
  });

  it('opens with an arrange-three trap: 6 correct, with the 3 (count) and 9 (repeats) misses', () => {
    const slot = permutations.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('6');
      expect(v.options.find((o) => o.id === 'square')?.label).toBe('9');
      expect(v.feedbackByOption.square?.toLowerCase() ?? '').toMatch(/3 ?× ?3|repeat|cannot also/);
    }
  });

  it('puts an interactive order-builder figure on the resolve slot (manipulative before the formula)', () => {
    const slot = permutations.slots.find((s) => s.id === 'resolve') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.figure?.kind).toBe('order-builder');
      if (slot.figure?.kind === 'order-builder') {
        expect((slot.figure.caption ?? '').length).toBeGreaterThan(0);
      }
    }
  });

  it('introduces the arrangement rule as a theorem and factorial as a definition (theorem leads, notation follows)', () => {
    const slot = permutations.slots.find((s) => s.id === 'factorial') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.statement.toLowerCase()).toMatch(/n\s*×\s*\(n\s*[−-]\s*1\)|arrang/);
      // Factorial is the new word → definition box, and it must define n!.
      expect(slot.definition?.name).toMatch(/factorial/i);
      expect(slot.definition?.statement ?? '').toMatch(/n!/);
      expect(slot.definition?.statement ?? '').toMatch(/4! ?= ?4 ?× ?3 ?× ?2 ?× ?1 ?= ?24/);
    }
  });

  it('walks the 4-person line through multiply-steps (4 → 3 → 2 → 1) and grades the product at 24', () => {
    const slot = permutations.slots.find((s) => s.id === 'line-four');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('multiply-steps');
      const v = slot.variants[0] as MultiplyStepsVariant;
      expect(v.steps.map((s) => s.answer)).toEqual([4, 3, 2, 1]);
      // Every step has its own prompt and a tailored hint.
      for (const step of v.steps) {
        expect(step.prompt.length).toBeGreaterThan(0);
        expect((step.hint ?? '').length).toBeGreaterThan(0);
      }
      // The built product (4×3×2×1 = 24) grades correct; a stop-early
      // product (4×3 = 12) does not.
      expect(checkAnswer(v, { value: 24 }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { value: 12 }).wasCorrect).toBe(false);
    }
  });

  it('teaches partial permutations first with the intuitive descending-factor rule (no opaque formula yet)', () => {
    const slot = permutations.slots.find((s) => s.id === 'partial') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.statement.toLowerCase()).toMatch(/descending|k terms|down for k/);
      // Worked example 8 × 7 × 6 = 336 must appear in the body.
      expect((slot.body ?? []).join(' ')).toMatch(/8 ?× ?7 ?× ?6|336/);
      // The opaque compact formula must NOT appear here; it gets its own
      // derivation slot next.
      expect(slot.definition).toBeUndefined();
    }
  });

  it('derives the nPk = n!/(n−k)! formula on its own slot via a winners/non-winners derivation card', () => {
    const slot = permutations.slots.find((s) => s.id === 'partial-formula') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      // The formula is the named claim.
      expect(slot.theorem?.statement ?? '').toMatch(/nP?k|n! ?÷ ?\(n ?[−-] ?k\)!|n!\/\(n[−-]k\)!/i);
      // A flippable derivation card carries the "why", with the winners /
      // non-winners split and the divide-out step.
      expect(slot.derivation?.steps.length ?? 0).toBeGreaterThanOrEqual(3);
      const steps = (slot.derivation?.steps ?? []).join(' ').toLowerCase();
      expect(steps).toMatch(/winner|non-winner|leftover/);
      expect(steps).toMatch(/8!|5!|\(n ?[−-] ?k\)!/);
      expect(steps).toMatch(/8! ?÷ ?5!|divide|÷/);
    }
  });

  it('grades the medals MCQ at 720 (10 × 9 × 8), with the repeats (1,000) and add (13) traps', () => {
    const slot = permutations.slots.find((s) => s.id === 'medals');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('720');
      expect(v.options.find((o) => o.id === 'repeats')?.label).toBe('1,000');
      const wrongIds = v.options.map((o) => o.id).filter((id) => id !== v.correctOptionId);
      for (const id of wrongIds) {
        expect(v.feedbackByOption[id]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('tests recognition with subtle near-misses: the distinct-roles scenario is the permutation', () => {
    const slot = permutations.slots.find((s) => s.id === 'order-matters');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      // Correct answer is the "choose 3 but with distinct roles" case, which
      // looks like a combination but is a permutation.
      expect(v.correctOptionId).toBe('roles');
      // The lottery distractor is the key near-miss: a real draw order that
      // does not matter. Its feedback must name that.
      expect(v.feedbackByOption.lottery?.toLowerCase() ?? '').toMatch(/draw|set|order does not matter|same ticket/);
      // Every wrong option has tailored feedback.
      const wrongIds = v.options.map((o) => o.id).filter((id) => id !== v.correctOptionId);
      for (const id of wrongIds) {
        expect(v.feedbackByOption[id]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('closes with a wrap previewing combinations (order does not matter) and no segue to an unauthored stub', () => {
    const wrap = permutations.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBeUndefined();
      expect(wrap.body.toLowerCase()).toMatch(/order does not matter|combination|team|hand/);
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('mixes interaction kinds: MCQ, multiply-steps, MCQ, MCQ, MCQ (circle intro), fill-text (circle answer)', () => {
    const problems = permutations.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'multiple-choice',
      'multiply-steps',
      'multiple-choice',
      'multiple-choice',
      'multiple-choice',
      'fill-text',
    ]);
  });
});
