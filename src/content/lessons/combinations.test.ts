import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { combinations } from './combinations';
import { checkAnswer } from '@/lib/checkAnswer';
import type {
  ConceptSlot,
  FillTextVariant,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('combinations (Counting Techniques) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(combinations)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(combinations.comingSoon).toBeFalsy();
    expect(combinations.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc: welcome → puzzle → resolve → rule → toppings → p-vs-c → handshakes → recognition → challenge → wrap', () => {
    const ids = combinations.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'the-puzzle',
      'resolve',
      'the-rule',
      'toppings',
      'p-vs-c',
      'handshakes',
      'recognition',
      'challenge-stars-bars',
      'wrap',
    ]);
  });

  it('ends with a stars-and-bars challenge: 6 identical lollipops to 3 children = C(8,2) = 28', () => {
    const slot = combinations.slots.find((s) => s.id === 'challenge-stars-bars');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.challenge).toBe(true);
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('28');
      // The distinct-items reflex (3^6 = 729) must be a tailored trap.
      expect(v.options.find((o) => o.id === 'distinct')?.label).toBe('729');
      // The explanation must teach the stars-and-bars picture.
      expect((v.explanation ?? '').toLowerCase()).toMatch(/stars and bars|star|bar/);
      expect(v.explanation ?? '').toMatch(/C\(8, ?2\)|8.*2.*28|= ?28/);
    }
  });

  it('opens with a committee trap: 10 correct, 60 the ordered-count miss', () => {
    const slot = combinations.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('10');
      expect(v.options.find((o) => o.id === 'ordered')?.label).toBe('60');
      expect(v.feedbackByOption.ordered?.toLowerCase() ?? '').toMatch(/5 ?× ?4 ?× ?3|order|same/);
    }
  });

  it('resolves by dividing the ordered count by 3! (60 ÷ 6 = 10)', () => {
    const slot = combinations.slots.find((s) => s.id === 'resolve') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const body = (slot.body ?? []).join(' ');
      expect(body).toMatch(/60/);
      expect(body).toMatch(/3! ?= ?6|÷ ?6|divide.*6/i);
      expect(body).toMatch(/10/);
    }
  });

  it('states the combinations formula as a theorem and "n choose k" as a definition (theorem leads)', () => {
    const slot = combinations.slots.find((s) => s.id === 'the-rule') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toMatch(/combination/i);
      const statement = slot.theorem?.statement ?? '';
      expect(statement).toMatch(/C\(n, ?k\)/);
      expect(statement).toMatch(/k! ?× ?\(n ?[−-] ?k\)!|k!\(n[−-]k\)!/);
      // The "n choose k" notation must be the definition box.
      expect(slot.definition?.name).toMatch(/choose/i);
      expect(slot.definition?.statement.toLowerCase() ?? '').toMatch(/unordered|order does not/);
    }
  });

  it('grades the toppings fill-text at 6 = C(4,2) and rejects the ordered (12) and repeats (16) traps', () => {
    const slot = combinations.slots.find((s) => s.id === 'toppings');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-text');
      const v = slot.variants[0] as FillTextVariant;
      expect(checkAnswer(v, { text: '6' }).wasCorrect).toBe(true);
      expect(checkAnswer(v, { text: '12' }).wasCorrect).toBe(false);
      for (const k of ['12', '16']) {
        expect(Object.keys(v.feedbackByWrongAnswer ?? {})).toContain(k);
      }
    }
  });

  it('contrasts permutation vs combination on the same 5 people (20 ordered, 10 unordered, ÷ 2!)', () => {
    const slot = combinations.slots.find((s) => s.id === 'p-vs-c') as ConceptSlot | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const body = (slot.body ?? []).join(' ');
      expect(body).toMatch(/20/);
      expect(body).toMatch(/10/);
      expect(body).toMatch(/2!|÷ ?2|divide.*2/i);
    }
  });

  it('grades the handshakes MCQ at 15 = C(6,2), with the ordered (30) and repeats (36) traps', () => {
    const slot = combinations.slots.find((s) => s.id === 'handshakes');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('15');
      expect(v.options.find((o) => o.id === 'ordered')?.label).toBe('30');
      const wrongIds = v.options.map((o) => o.id).filter((id) => id !== v.correctOptionId);
      for (const id of wrongIds) {
        expect(v.feedbackByOption[id]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('tests recognition: a role-free team is the combination; podium / PIN / batting order are permutations', () => {
    const slot = combinations.slots.find((s) => s.id === 'recognition');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('team');
      expect(v.feedbackByOption.podium?.toLowerCase() ?? '').toMatch(/order matters|permutation/);
    }
  });

  it('closes with a wrap tying counts back to k/N probability and no segue to an unauthored stub', () => {
    const wrap = combinations.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBeUndefined();
      expect(wrap.body.toLowerCase()).toMatch(/k\/n|probability|equally likely/);
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('mixes interaction kinds: MCQ, fill-text, MCQ, MCQ, MCQ', () => {
    const problems = combinations.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'multiple-choice',
      'fill-text',
      'multiple-choice',
      'multiple-choice',
      'multiple-choice',
    ]);
  });
});
