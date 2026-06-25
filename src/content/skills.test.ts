import { describe, expect, it } from 'vitest';
import { SKILLS, TOPICS } from '@/content/skills';
import type { SkillId } from '@/content/skills';
import { MISCONCEPTIONS } from '@/content/misconceptions';
import type { MisconceptionKey } from '@/content/misconceptions';
import { assertLessonInvariants } from '@/content/assertLessonInvariants';
import type { Lesson, MultipleChoiceVariant } from '@/content/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid lesson wrapping a single MC variant in a problem slot. */
function lessonWithVariant(variant: MultipleChoiceVariant): Lesson {
  return {
    id: 'test-lesson',
    number: 99,
    title: 'Test lesson',
    blurb: 'A lesson used in tests.',
    estimatedMinutes: 1,
    slots: [
      {
        id: 'test-slot',
        kind: 'problem',
        interactionKind: 'multiple-choice',
        variants: [variant],
      },
    ],
  };
}

const BASE_MC: MultipleChoiceVariant = {
  id: 'test-mc-v1',
  interactionKind: 'multiple-choice',
  prompt: 'Which is correct?',
  feedbackCorrect: 'Correct!',
  feedbackDefault: 'Try again.',
  options: [
    { id: 'a', label: 'Option A' },
    { id: 'b', label: 'Option B' },
  ],
  correctOptionId: 'a',
  feedbackByOption: { a: 'Yes!', b: 'No.' },
};

// ---------------------------------------------------------------------------
// SKILLS invariants
// ---------------------------------------------------------------------------

describe('SKILLS taxonomy', () => {
  const skillIds = Object.keys(SKILLS) as SkillId[];
  const topicSet = new Set<string>(TOPICS);

  it('has at least 15 skills', () => {
    expect(skillIds.length).toBeGreaterThanOrEqual(15);
  });

  it('every skill topic is a member of TOPICS', () => {
    for (const id of skillIds) {
      const { topic } = SKILLS[id];
      expect(topicSet.has(topic), `skill "${id}" topic "${topic}" not in TOPICS`).toBe(true);
    }
  });

  it('has no duplicate labels', () => {
    const labels = skillIds.map((id) => SKILLS[id].label);
    const labelSet = new Set(labels);
    expect(labelSet.size).toBe(labels.length);
  });
});

// ---------------------------------------------------------------------------
// MISCONCEPTIONS invariants
// ---------------------------------------------------------------------------

describe('MISCONCEPTIONS taxonomy', () => {
  const misconceptionKeys = Object.keys(MISCONCEPTIONS) as MisconceptionKey[];
  const skillSet = new Set<string>(Object.keys(SKILLS));

  it('every relatedSkills entry is a valid SkillId', () => {
    for (const key of misconceptionKeys) {
      for (const skillId of MISCONCEPTIONS[key].relatedSkills) {
        expect(
          skillSet.has(skillId),
          `misconception "${key}" relatedSkills contains unknown skill "${skillId}"`,
        ).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// assertLessonInvariants — bad skills
// ---------------------------------------------------------------------------

describe('assertLessonInvariants — skills field', () => {
  it('throws when a variant has an unknown skill id', () => {
    const variant: MultipleChoiceVariant = {
      ...BASE_MC,
      id: 'bad-skills-v1',
      // Cast to bypass TS — intentionally invalid value for the test
      skills: ['not-a-skill' as SkillId],
    };
    expect(() => assertLessonInvariants(lessonWithVariant(variant))).toThrow(
      /unknown skill id "not-a-skill"/,
    );
  });

  it('does not throw when skills are valid SkillIds', () => {
    const variant: MultipleChoiceVariant = {
      ...BASE_MC,
      id: 'good-skills-v1',
      skills: ['complement-rule', 'independence'],
    };
    expect(() => assertLessonInvariants(lessonWithVariant(variant))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// assertLessonInvariants — bad misconceptionByOption
// ---------------------------------------------------------------------------

describe('assertLessonInvariants — misconceptionByOption field', () => {
  it('throws when misconceptionByOption has an unknown misconception key', () => {
    const variant: MultipleChoiceVariant = {
      ...BASE_MC,
      id: 'bad-misconception-v1',
      skills: ['complement-rule'],
      // Cast to bypass TS — intentionally invalid value for the test
      misconceptionByOption: { b: 'not-a-key' as MisconceptionKey },
    };
    expect(() => assertLessonInvariants(lessonWithVariant(variant))).toThrow(
      /unknown misconception key "not-a-key"/,
    );
  });

  it('throws when misconceptionByOption references an option id not in options', () => {
    const variant: MultipleChoiceVariant = {
      ...BASE_MC,
      id: 'bad-option-id-v1',
      skills: ['complement-rule'],
      misconceptionByOption: { 'z-does-not-exist': 'gambler' },
    };
    expect(() => assertLessonInvariants(lessonWithVariant(variant))).toThrow(
      /option id "z-does-not-exist" does not exist in options/,
    );
  });

  it('does not throw when misconceptionByOption is valid', () => {
    const variant: MultipleChoiceVariant = {
      ...BASE_MC,
      id: 'good-misconception-v1',
      skills: ['complement-rule'],
      misconceptionByOption: { b: 'complement_inversion' },
    };
    expect(() => assertLessonInvariants(lessonWithVariant(variant))).not.toThrow();
  });
});
