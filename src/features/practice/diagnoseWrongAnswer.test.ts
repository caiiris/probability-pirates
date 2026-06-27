/**
 * Tests for diagnoseWrongAnswer — C-MC2.
 *
 * Pure function: no React, no Firebase.
 * Covers all three variant kinds, the 2/4≡1/2 reduced-match case, and null
 * cases (no trap defined, wrong value, den=0).
 */

import { describe, it, expect } from 'vitest';
import { diagnoseWrongAnswer } from './diagnoseWrongAnswer';
import type { NumberFillVariant, MultipleChoiceVariant, FillFractionVariant } from '@/content/types';
import type { AttemptPayload } from '@/features/progress/progressService';

// ─── Minimal variant stubs ────────────────────────────────────────────────────

const baseVariant = {
  id: 'test',
  prompt: 'test',
  feedbackCorrect: 'ok',
  feedbackDefault: 'nope',
};

function makeNumberFill(
  misconceptionByValue?: Record<number, 'ordered_vs_unordered' | 'gambler'>,
): NumberFillVariant {
  return {
    ...baseVariant,
    interactionKind: 'number-fill',
    answer: 6,
    misconceptionByValue,
  };
}

function makeMC(
  misconceptionByOption?: Record<string, 'ordered_vs_unordered' | 'gambler'>,
): MultipleChoiceVariant {
  return {
    ...baseVariant,
    interactionKind: 'multiple-choice',
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    correctOptionId: 'a',
    feedbackByOption: { a: 'ok', b: 'nope' },
    misconceptionByOption,
  };
}

function makeFillFraction(
  misconceptionByFraction?: FillFractionVariant['misconceptionByFraction'],
): FillFractionVariant {
  return {
    ...baseVariant,
    interactionKind: 'fill-fraction',
    numerator: 1,
    denominator: 6,
    misconceptionByFraction,
  };
}

// ─── number-fill ──────────────────────────────────────────────────────────────

describe('diagnoseWrongAnswer — number-fill', () => {
  it('returns the mapped key when the value matches a trap', () => {
    const variant = makeNumberFill({ 24: 'ordered_vs_unordered' });
    const payload: AttemptPayload = { value: 24 };
    expect(diagnoseWrongAnswer(variant, payload)).toBe('ordered_vs_unordered');
  });

  it('returns null when the value is not in the trap map', () => {
    const variant = makeNumberFill({ 24: 'ordered_vs_unordered' });
    const payload: AttemptPayload = { value: 10 };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns null when misconceptionByValue is undefined', () => {
    const variant = makeNumberFill(undefined);
    const payload: AttemptPayload = { value: 24 };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns null when the payload does not have value (wrong payload shape)', () => {
    const variant = makeNumberFill({ 24: 'ordered_vs_unordered' });
    const payload: AttemptPayload = { optionId: 'b' };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });
});

// ─── multiple-choice ─────────────────────────────────────────────────────────

describe('diagnoseWrongAnswer — multiple-choice', () => {
  it('returns the mapped key when optionId matches a trap', () => {
    const variant = makeMC({ b: 'gambler' });
    const payload: AttemptPayload = { optionId: 'b' };
    expect(diagnoseWrongAnswer(variant, payload)).toBe('gambler');
  });

  it('returns null when optionId is not in the trap map', () => {
    const variant = makeMC({ b: 'gambler' });
    const payload: AttemptPayload = { optionId: 'c' };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns null when misconceptionByOption is undefined', () => {
    const variant = makeMC(undefined);
    const payload: AttemptPayload = { optionId: 'b' };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns null when the payload does not have optionId', () => {
    const variant = makeMC({ b: 'gambler' });
    const payload: AttemptPayload = { value: 5 };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });
});

// ─── fill-fraction ────────────────────────────────────────────────────────────

describe('diagnoseWrongAnswer — fill-fraction', () => {
  it('returns the key when the submitted fraction exactly matches a trap', () => {
    const variant = makeFillFraction([{ num: 1, den: 2, key: 'complement_inversion' }]);
    const payload: AttemptPayload = { numerator: 1, denominator: 2 };
    expect(diagnoseWrongAnswer(variant, payload)).toBe('complement_inversion');
  });

  it('matches 2/4 against a 1/2 trap (reduced equality)', () => {
    const variant = makeFillFraction([{ num: 1, den: 2, key: 'complement_inversion' }]);
    const payload: AttemptPayload = { numerator: 2, denominator: 4 };
    expect(diagnoseWrongAnswer(variant, payload)).toBe('complement_inversion');
  });

  it('returns null when the fraction does not match any trap', () => {
    const variant = makeFillFraction([{ num: 1, den: 2, key: 'complement_inversion' }]);
    const payload: AttemptPayload = { numerator: 1, denominator: 3 };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns null when denominator is 0 (guard)', () => {
    const variant = makeFillFraction([{ num: 1, den: 2, key: 'complement_inversion' }]);
    const payload: AttemptPayload = { numerator: 1, denominator: 0 };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns null when misconceptionByFraction is undefined', () => {
    const variant = makeFillFraction(undefined);
    const payload: AttemptPayload = { numerator: 1, denominator: 2 };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns the first matching key from a multi-entry trap list', () => {
    const variant = makeFillFraction([
      { num: 1, den: 3, key: 'gambler' },
      { num: 1, den: 2, key: 'complement_inversion' },
    ]);
    const payload: AttemptPayload = { numerator: 2, denominator: 4 }; // reduces to 1/2
    expect(diagnoseWrongAnswer(variant, payload)).toBe('complement_inversion');
  });
});

// ─── other variant kinds ──────────────────────────────────────────────────────

describe('diagnoseWrongAnswer — other variant kinds', () => {
  it('returns null for tap-outcomes', () => {
    const variant = {
      ...baseVariant,
      interactionKind: 'tap-outcomes' as const,
      source: 'coin' as const,
      expectedOutcomes: ['H'],
    };
    const payload: AttemptPayload = { collected: ['T'] };
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });

  it('returns null for multiple-choice payload on fill-fraction variant (no optionId field)', () => {
    const variant = makeFillFraction([{ num: 1, den: 2, key: 'complement_inversion' }]);
    const payload: AttemptPayload = { optionId: 'b' }; // wrong shape for fill-fraction
    expect(diagnoseWrongAnswer(variant, payload)).toBeNull();
  });
});
