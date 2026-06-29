import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { inclusionExclusion } from './inclusion-exclusion';
import { checkAnswer } from '@/lib/checkAnswer';
import type {
  ConceptSlot,
  FillFractionVariant,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('inclusion-exclusion (Counting Techniques) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(inclusionExclusion)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(inclusionExclusion.comingSoon).toBeFalsy();
    expect(inclusionExclusion.slots.length).toBeGreaterThan(0);
  });

  it('walks the discovery arc: welcome → puzzle → resolve → rule → cards → heart-or-queen → recognize → wrap', () => {
    const ids = inclusionExclusion.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'the-puzzle',
      'resolve',
      'the-rule',
      'cards-count',
      'heart-or-queen',
      'add-or-subtract',
      'wrap',
    ]);
  });

  it('opens with an overlap trap: 12 + 9 = 21, corrected to 16 by subtracting the 5 both-players', () => {
    const slot = inclusionExclusion.slots.find((s) => s.id === 'the-puzzle');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.commitOnce).not.toBe(true);
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('16');
      expect(v.options.find((o) => o.id === 'add')?.label).toBe('21');
      expect(v.feedbackByOption.add?.toLowerCase() ?? '').toMatch(/twice|both|12 ?\+ ?9/);
    }
  });

  it('leads with the probability formula in the theorem box and explains |X| notation in a second definition box', () => {
    const slot = inclusionExclusion.slots.find((s) => s.id === 'the-rule') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      // Main box (theorem): the probability form the learner already knows,
      // not the cardinality form they have not been taught.
      expect(slot.theorem?.name).toMatch(/inclusion.?exclusion/i);
      const statement = (slot.theorem?.statement ?? '').toLowerCase();
      expect(statement).toMatch(/p\(a or b\)\s*=\s*p\(a\)\s*\+\s*p\(b\)\s*[−-]\s*p\(a and b\)/);
      // The theorem must NOT lead with the unexplained |X| bars.
      expect(slot.theorem?.statement ?? '').not.toMatch(/\|/);

      // Second box (definition): introduces the |X| count notation and the
      // count-over-N fallback, and must actually clarify what the bars mean.
      const def = (slot.definition?.statement ?? '').toLowerCase();
      expect(def).toMatch(/number of outcomes/);
      expect(slot.definition?.statement ?? '').toMatch(/\|a\|/i);
      expect(def).toMatch(/sample space|÷ n|over the total|\/ n/);

      // The body must call out that disjoint (no overlap) recovers the
      // addition principle.
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/no overlap|special case|0|addition principle/);
    }
  });

  it('applies the count rule to hearts or face cards: 13 + 12 − 3 = 22', () => {
    const slot = inclusionExclusion.slots.find((s) => s.id === 'cards-count');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('correct');
      expect(v.options.find((o) => o.id === 'correct')?.label).toBe('22');
      expect(v.options.find((o) => o.id === 'add')?.label).toBe('25');
    }
  });

  it('grades P(heart or queen) = 16/52 (17/52 is the forgot-overlap trap)', () => {
    const slot = inclusionExclusion.slots.find((s) => s.id === 'heart-or-queen');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-fraction');
      const v = slot.variants[0] as FillFractionVariant;
      expect(v.numerator).toBe(16);
      expect(v.denominator).toBe(52);
      expect(checkAnswer(v, { numerator: 16, denominator: 52 }).wasCorrect).toBe(true);
      // 4/13 is the reduced form and must also grade correct (cross-multiply).
      expect(checkAnswer(v, { numerator: 4, denominator: 13 }).wasCorrect).toBe(true);
      expect(v.feedbackByWrongAnswer ?? {}).toHaveProperty('17/52');
    }
  });

  it('tests recognition: subtract only when groups overlap (red or king), not for disjoint cases', () => {
    const slot = inclusionExclusion.slots.find((s) => s.id === 'add-or-subtract');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('overlap');
      const wrongIds = v.options.map((o) => o.id).filter((id) => id !== v.correctOptionId);
      for (const id of wrongIds) {
        expect(v.feedbackByOption[id]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('closes with a wrap previewing permutations/combinations and no segue to an unauthored stub', () => {
    const wrap = inclusionExclusion.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBeUndefined();
      expect(wrap.body.toLowerCase()).toMatch(/arrang|order|selection/);
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('mixes interaction kinds: MCQ, MCQ, fill-fraction, MCQ', () => {
    const problems = inclusionExclusion.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'multiple-choice',
      'multiple-choice',
      'fill-fraction',
      'multiple-choice',
    ]);
  });
});
