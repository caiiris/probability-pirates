/**
 * Tests for practiceEngine.ts (WP-3).
 *
 * Uses 1-2 tiny stub templates defined below — no WP-4 content.
 * Covers: generateInstance, answerToPayload, pickNextTemplate.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { frac } from '@/lib/probability/exact';
import { mulberry32 } from '@/lib/simulations';
import { checkAnswer } from '@/lib/checkAnswer';
import {
  generateInstance,
  answerToPayload,
  pickNextTemplate,
  TEMPLATES,
  type PracticeInstance,
} from './practiceEngine';
import type { Template } from './templates/types';
import type { Variant } from '@/content/types';
import type { ExactAnswer } from '@/lib/probability/exact';

// ---------------------------------------------------------------------------
// Stub templates (not WP-4 content — testing fixtures only)
// ---------------------------------------------------------------------------

/** Stub A: multiple-choice, fixed params, difficulty 900. */
const stubChoice: Template<{ question: string }> = {
  id: 'stub-choice',
  topic: 'counting',
  skills: ['favorable-over-total'],
  retrievalForm: 'definition',
  rate: (_p) => 900,
  sample: (_rng) => ({ question: 'pick-a' }),
  solve: (_p): ExactAnswer => ({ kind: 'choice', optionId: 'opt-a' }),
  render: (_p): Variant => ({
    interactionKind: 'multiple-choice',
    id: 'stub-choice-v',
    prompt: 'Which option?',
    options: [
      { id: 'opt-a', label: 'A' },
      { id: 'opt-b', label: 'B' },
    ],
    correctOptionId: 'opt-a',
    feedbackByOption: { 'opt-a': 'Correct!', 'opt-b': 'Wrong.' },
    feedbackCorrect: 'Well done!',
    feedbackDefault: 'Try again.',
  }),
  explain: (_p) => ({ title: 'Answer is A', steps: ['Option A is always correct in this stub.'] }),
};

/** Stub B: fill-fraction, fixed params, difficulty 1100. */
const stubFraction: Template<{ num: number; den: number }> = {
  id: 'stub-fraction',
  topic: 'counting',
  skills: ['favorable-over-total'],
  retrievalForm: 'operation',
  rate: (_p) => 1100,
  sample: (_rng) => ({ num: 3, den: 4 }),
  solve: (p): ExactAnswer => ({ kind: 'fraction', value: frac(p.num, p.den) }),
  render: (p): Variant => ({
    interactionKind: 'fill-fraction',
    id: 'stub-fraction-v',
    prompt: 'Enter the probability.',
    numerator: p.num,
    denominator: p.den,
    feedbackCorrect: 'Correct!',
    feedbackDefault: 'Try again.',
  }),
  explain: (p) => ({
    title: `Answer is ${p.num}/${p.den}`,
    steps: [`There are ${p.num} favorable outcomes out of ${p.den} total.`],
  }),
};

// ---------------------------------------------------------------------------
// answerToPayload
// ---------------------------------------------------------------------------

describe('answerToPayload', () => {
  it('maps choice to { optionId }', () => {
    const answer: ExactAnswer = { kind: 'choice', optionId: 'opt-a' };
    expect(answerToPayload(answer, stubChoice.render({} as never))).toEqual({ optionId: 'opt-a' });
  });

  it('maps fraction to { numerator, denominator }', () => {
    const answer: ExactAnswer = { kind: 'fraction', value: frac(3, 4) };
    const payload = answerToPayload(answer, stubFraction.render({ num: 3, den: 4 }));
    expect(payload).toEqual({ numerator: 3, denominator: 4 });
  });

  it('maps int to { numerator, denominator: 1 } for fill-fraction variant', () => {
    const answer: ExactAnswer = { kind: 'int', value: 5 };
    const variant = stubFraction.render({ num: 3, den: 4 });
    const payload = answerToPayload(answer, variant);
    expect(payload).toEqual({ numerator: 5, denominator: 1 });
  });

  it('maps int to { value } for a number-fill variant', () => {
    const answer: ExactAnswer = { kind: 'int', value: 10 };
    const variant: Variant = {
      id: 'nf',
      interactionKind: 'number-fill',
      prompt: 'How many groups?',
      answer: 10,
      feedbackCorrect: '',
      feedbackDefault: '',
    };
    const payload = answerToPayload(answer, variant);
    expect(payload).toEqual({ value: 10 });
    expect(checkAnswer(variant, payload).wasCorrect).toBe(true);
  });

  it('throws for int answer with multiple-choice variant', () => {
    const answer: ExactAnswer = { kind: 'int', value: 2 };
    const mcVariant = stubChoice.render({ question: 'x' });
    expect(() => answerToPayload(answer, mcVariant)).toThrow(
      /templates must use.*choice.*for multiple-choice/i,
    );
  });

  it('round-trips choice through checkAnswer', () => {
    const params = { question: 'pick-a' };
    const answer = stubChoice.solve(params);
    const variant = stubChoice.render(params);
    const payload = answerToPayload(answer, variant);
    expect(checkAnswer(variant, payload).wasCorrect).toBe(true);
  });

  it('round-trips fraction through checkAnswer', () => {
    const params = { num: 3, den: 4 };
    const answer = stubFraction.solve(params);
    const variant = stubFraction.render(params);
    const payload = answerToPayload(answer, variant);
    expect(checkAnswer(variant, payload).wasCorrect).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generateInstance
// ---------------------------------------------------------------------------

describe('generateInstance', () => {
  it('produces a PracticeInstance with the correct shape (choice template)', () => {
    const rng = mulberry32(42);
    const inst = generateInstance(stubChoice, rng);

    expect(inst.templateId).toBe('stub-choice');
    expect(inst.topic).toBe('counting');
    expect(inst.skills).toContain('favorable-over-total');
    expect(inst.difficulty).toBe(900);
    expect(inst.answer).toEqual({ kind: 'choice', optionId: 'opt-a' });
    expect(inst.variant.interactionKind).toBe('multiple-choice');
    expect(inst.explanation.title).toBeTruthy();
    expect(inst.instanceId).toMatch(/^stub-choice:/);
  });

  it('produces a PracticeInstance with the correct shape (fraction template)', () => {
    const rng = mulberry32(42);
    const inst = generateInstance(stubFraction, rng);

    expect(inst.templateId).toBe('stub-fraction');
    expect(inst.difficulty).toBe(1100);
    expect(inst.answer.kind).toBe('fraction');
    expect(inst.variant.interactionKind).toBe('fill-fraction');
  });

  it("grades the instance's answer correct via checkAnswer + answerToPayload", () => {
    const rng = mulberry32(7);
    // Cast to Template (base type) so both stubs pass the union through generateInstance
    for (const stub of [stubChoice, stubFraction] as Template[]) {
      const inst: PracticeInstance = generateInstance(stub, rng);
      const payload = answerToPayload(inst.answer, inst.variant);
      const result = checkAnswer(inst.variant, payload);
      expect(result.wasCorrect).toBe(true);
    }
  });

  it('instanceId is stable for the same params', () => {
    // Both calls produce the same params because the stub ignores rng
    const inst1 = generateInstance(stubChoice, mulberry32(1));
    const inst2 = generateInstance(stubChoice, mulberry32(99));
    expect(inst1.instanceId).toBe(inst2.instanceId);
  });

  it('instanceId differs for different params', () => {
    // Create a stub whose params depend on rng
    const paramStub: Template<{ n: number }> = {
      id: 'stub-param-rng',
      topic: 'counting',
      skills: ['favorable-over-total'],
      retrievalForm: 'definition',
      rate: (_p) => 900,
      sample: (rng) => ({ n: Math.floor(rng() * 1000) }),
      solve: (p): ExactAnswer => ({ kind: 'choice', optionId: p.n < 500 ? 'opt-a' : 'opt-b' }),
      render: (_p): Variant => stubChoice.render({ question: 'x' }),
      explain: (_p) => ({ title: 'stub', steps: [] }),
    };

    // With seed 1 the first draw from mulberry32(1) is ~0.67 → n≈670
    // With seed 2 the first draw from mulberry32(2) is ~0.14 → n≈140
    const inst1 = generateInstance(paramStub, mulberry32(1));
    const inst2 = generateInstance(paramStub, mulberry32(2));
    // Different seeds → different n → different hash
    expect(inst1.instanceId).not.toBe(inst2.instanceId);
  });
});

// ---------------------------------------------------------------------------
// pickNextTemplate
// ---------------------------------------------------------------------------

describe('pickNextTemplate', () => {
  // WP-4 registers six real families into the global TEMPLATES at import time.
  // These tests need a controlled registry, so save + clear it, register only
  // the stubs, and restore the real templates afterward (hermetic).
  let saved: Template[];

  beforeEach(() => {
    saved = TEMPLATES.splice(0, TEMPLATES.length);
    TEMPLATES.push(stubChoice, stubFraction);
  });

  afterEach(() => {
    TEMPLATES.splice(0, TEMPLATES.length);
    TEMPLATES.push(...saved);
  });

  it('returns a template from the correct topic', () => {
    const rng = mulberry32(0);
    const t = pickNextTemplate({ topic: 'counting', ratingForTopic: 1000, recentTemplateIds: [], rng });
    expect(t.topic).toBe('counting');
  });

  it('avoids templates in recentTemplateIds', () => {
    const rng = mulberry32(0);
    // Exclude stubChoice; only stubFraction should be returned
    const t = pickNextTemplate({
      topic: 'counting',
      ratingForTopic: 1000,
      recentTemplateIds: ['stub-choice'],
      rng,
    });
    expect(t.id).toBe('stub-fraction');
  });

  it('falls back to full topic set if all templates are recently seen', () => {
    const rng = mulberry32(0);
    // Both stubs recently seen → must still return one
    const t = pickNextTemplate({
      topic: 'counting',
      ratingForTopic: 1000,
      recentTemplateIds: ['stub-choice', 'stub-fraction'],
      rng,
    });
    expect(['stub-choice', 'stub-fraction']).toContain(t.id);
  });

  it('respects the rating window — prefers candidate whose difficulty is in range', () => {
    const rng = mulberry32(0);
    // stubChoice.rate = 900, stubFraction.rate = 1100
    // With ratingForTopic=900: window [850, 1000] → only stubChoice qualifies
    const t = pickNextTemplate({
      topic: 'counting',
      ratingForTopic: 900,
      recentTemplateIds: [],
      rng,
    });
    expect(t.id).toBe('stub-choice');
  });

  it('widens window if no candidate in initial window', () => {
    const rng = mulberry32(0);
    // stubChoice.rate = 900, stubFraction.rate = 1100
    // With ratingForTopic=1500: window [1450, 1600] → no match initially
    // After first widening: [1350, 1700] → still no match
    // After second: [1250, 1800] → still no match
    // After third: [1150, 1900] → stubFraction (1100 still out) ...
    // After fourth: [1050, 2000] → stubFraction (1100 in) → returns stubFraction
    const t = pickNextTemplate({
      topic: 'counting',
      ratingForTopic: 1500,
      recentTemplateIds: [],
      rng,
    });
    // Should return something (not throw)
    expect(['stub-choice', 'stub-fraction']).toContain(t.id);
  });

  it('is deterministic given a seeded rng', () => {
    const t1 = pickNextTemplate({
      topic: 'counting',
      ratingForTopic: 1000,
      recentTemplateIds: [],
      rng: mulberry32(42),
    });
    const t2 = pickNextTemplate({
      topic: 'counting',
      ratingForTopic: 1000,
      recentTemplateIds: [],
      rng: mulberry32(42),
    });
    expect(t1.id).toBe(t2.id);
  });

  it('throws when no templates are registered for the requested topic', () => {
    const rng = mulberry32(0);
    expect(() =>
      pickNextTemplate({ topic: 'distributions', ratingForTopic: 1000, recentTemplateIds: [], rng }),
    ).toThrow(/no templates found for topic/i);
  });
});
