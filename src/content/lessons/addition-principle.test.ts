import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { additionPrinciple } from './addition-principle';
import type {
  ConceptSlot,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('addition-principle (Unit 2.5, D95) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(additionPrinciple)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(additionPrinciple.comingSoon).toBeFalsy();
    expect(additionPrinciple.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc: welcome → puzzle → resolve → rule → and-vs-or → mixed-practice → wrap', () => {
    const ids = additionPrinciple.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'the-puzzle',
      'resolve',
      'the-rule',
      'and-vs-or',
      'mixed-practice',
      'wrap',
    ]);
  });

  it('opens with the sandwich-or-salad trap (retryable, two-tier hints)', () => {
    const slot = additionPrinciple.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('add');
      // The multiply-by-reflex distractor (15 = 3 × 5) is the canonical
      // miss right after multiplication-principle. It must have its own
      // tailored feedback, naming the previous lesson's rule so the
      // contrast lands.
      const optionIds = v.options.map((o) => o.id);
      expect(optionIds).toContain('multiply');
      const multiplyFeedback = (v.feedbackByOption.multiply ?? '').toLowerCase();
      expect(multiplyFeedback).toMatch(/multiplication|multiply|last lesson|previous/);
      expect(multiplyFeedback).toMatch(/and|sequence/);
    }
  });

  it('states the addition principle as a theorem callout (not a definition), avoiding the word "disjoint" in the statement', () => {
    const slot = additionPrinciple.slots.find((s) => s.id === 'the-rule') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toMatch(/addition principle/i);
      expect(slot.definition).toBeUndefined();
      const statement = (slot.theorem?.statement ?? '').toLowerCase();
      // The statement must mention m, n, and m + n.
      expect(statement).toMatch(/\bm\b/);
      expect(statement).toMatch(/\bn\b/);
      expect(statement).toMatch(/m\s*\+\s*n/);
      // And it must express the disjoint condition without using the
      // technical word "disjoint" — that is a later vocab move. Look
      // for the plain-English equivalent.
      expect(statement).not.toMatch(/disjoint/);
      expect(statement).toMatch(/no option.*both|not.*both|different type|separate/);
    }
  });

  it('teaches AND-vs-OR recognition explicitly with the same closet on both rules', () => {
    // The recognition slot is the actual pedagogical payoff. The body
    // must put AND and OR side by side on the same closet (3 shirts,
    // 2 pants) so the contrast is concrete: 3 × 2 = 6 (AND) vs
    // 3 + 2 = 5 (OR). Same nouns, different question, different math.
    const slot = additionPrinciple.slots.find((s) => s.id === 'and-vs-or') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const body = (slot.body ?? []).join(' ').toLowerCase();
      // Same closet appears on both branches.
      expect(body).toMatch(/3 shirts/);
      expect(body).toMatch(/2 pair/);
      // Both rules show the math.
      expect(body).toMatch(/3\s*×\s*2\s*=\s*6/);
      expect(body).toMatch(/3\s*\+\s*2\s*=\s*5/);
      // AND and OR are named as the recognition cues.
      expect(body).toMatch(/\band\b/);
      expect(body).toMatch(/\bor\b/);
    }
  });

  it('tests recognition end-to-end on the mixed-practice MCQ with both an all-add and an all-multiply trap', () => {
    const slot = additionPrinciple.slots.find((s) => s.id === 'mixed-practice');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('multiple-choice');
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      const labels = v.options.map((o) => o.label);
      // The correct answer (14) must appear, alongside the two canonical
      // misconception distractors: 9 = 4+3+2 (treated as all-OR) and
      // 24 = 4×3×2 (treated as all-AND).
      expect(labels).toContain('14');
      expect(labels).toContain('9');
      expect(labels).toContain('24');
      // All wrong-answer feedback must be tailored, since each
      // wrong answer corresponds to a specific recognition mistake.
      const wrongIds = v.options
        .map((o) => o.id)
        .filter((id) => id !== v.correctOptionId);
      for (const id of wrongIds) {
        expect((v.feedbackByOption[id] ?? '').length).toBeGreaterThan(0);
      }
    }
  });

  it('does not give away the final answer (14) in the mixed-practice prompt, context, or default feedback', () => {
    const slot = additionPrinciple.slots.find((s) => s.id === 'mixed-practice');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      const learnerVisible = [v.prompt, v.context ?? '', v.feedbackDefault]
        .join(' ')
        .toLowerCase();
      // 14 may not appear as a standalone number in the prompt or
      // default feedback (which the learner sees BEFORE answering).
      // Option labels are allowed to show it.
      expect(learnerVisible).not.toMatch(/\b14\b/);
    }
  });

  it('closes with a wrap that previews inclusion-exclusion without segueing to an unauthored stub', () => {
    const wrap = additionPrinciple.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      // Same pattern as L5: no segueToLessonId because the next stubs
      // (practice-counting-outcomes, review-compound, then Unit 3, then
      // inclusion-exclusion at the top of Unit 4) are not authored yet.
      expect(wrap.segueToLessonId).toBeUndefined();
      // But the body must preview the overlapping-cases problem so the
      // course feels continuous and the disjoint precondition feels
      // honest, not hand-waved.
      expect(wrap.body.toLowerCase()).toMatch(/overlap|inclusion|double.count|both/);
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('keeps two-problem variety: two retryable MCQs (discovery trap + recognition)', () => {
    const problems = additionPrinciple.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'multiple-choice',
      'multiple-choice',
    ]);
    // Both are retryable now (no commit-once), so each gets the two-tier
    // hint flow: a first wrong shows feedback, a second reveals the
    // explanation.
    expect(problems[0].commitOnce).toBeFalsy();
    expect(problems[1].commitOnce).toBeFalsy();
  });
});

describe('addition-principle catalog placement', () => {
  it('is positioned directly after multiplication-principle in the playable head', async () => {
    // D95: the whole point of the reshuffle is that the OR-rule is one
    // tap away from the AND-rule. Lock that adjacency in a test.
    const { lessons } = await import('../index');
    const playable = lessons.filter((l) => !l.comingSoon);
    const ids = playable.map((l) => l.id);
    const multIdx = ids.indexOf('multiplication-principle');
    const addIdx = ids.indexOf('addition-principle');
    expect(multIdx).toBeGreaterThanOrEqual(0);
    expect(addIdx).toBe(multIdx + 1);
  });
});
