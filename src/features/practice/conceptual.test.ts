import { describe, it, expect } from 'vitest';
import {
  parseAnswerString,
  gradeConceptualAnswer,
  reasoningMultiplier,
  pickConceptualProblem,
  REASONING_PENALTY,
} from './conceptual';
import { frac } from '@/lib/probability/exact';
import type { ExactAnswer } from '@/lib/probability/exact';
import { conceptualProblems } from '@/content/conceptual/problems';

describe('parseAnswerString', () => {
  it('parses fractions, integers, and decimals', () => {
    expect(parseAnswerString('3/6')).toEqual({ kind: 'fraction', num: 3, den: 6 });
    expect(parseAnswerString(' 10 ')).toEqual({ kind: 'number', value: 10 });
    expect(parseAnswerString('0.5')).toEqual({ kind: 'number', value: 0.5 });
    expect(parseAnswerString('.5')).toEqual({ kind: 'number', value: 0.5 });
  });

  it('returns null for empty, zero-denominator, or non-numeric input', () => {
    expect(parseAnswerString('')).toBeNull();
    expect(parseAnswerString('   ')).toBeNull();
    expect(parseAnswerString('1/0')).toBeNull();
    expect(parseAnswerString('half')).toBeNull();
    expect(parseAnswerString('1/2/3')).toBeNull();
  });
});

describe('gradeConceptualAnswer — accepts any equivalent form', () => {
  const half: ExactAnswer = { kind: 'fraction', value: frac(1, 2) };
  const ten: ExactAnswer = { kind: 'int', value: 10 };

  it('matches a fraction answer across equivalent forms', () => {
    expect(gradeConceptualAnswer(half, '1/2')).toBe(true);
    expect(gradeConceptualAnswer(half, '2/4')).toBe(true);
    expect(gradeConceptualAnswer(half, '0.5')).toBe(true);
  });

  it('rejects wrong values, including the inverted complement trap', () => {
    expect(gradeConceptualAnswer(half, '1/3')).toBe(false);
    expect(gradeConceptualAnswer({ kind: 'fraction', value: frac(5, 6) }, '1/6')).toBe(false);
  });

  it('matches an integer answer as int, fraction, or decimal', () => {
    expect(gradeConceptualAnswer(ten, '10')).toBe(true);
    expect(gradeConceptualAnswer(ten, '10/1')).toBe(true);
    expect(gradeConceptualAnswer(ten, '60')).toBe(false); // ordered-vs-unordered trap
  });

  it('rejects unparseable answers', () => {
    expect(gradeConceptualAnswer(half, 'one half')).toBe(false);
  });
});

describe('reasoningMultiplier', () => {
  it('penalizes only confident negative classifications', () => {
    expect(reasoningMultiplier('misconception')).toBe(REASONING_PENALTY);
    expect(reasoningMultiplier('incorrect-reasoning')).toBe(REASONING_PENALTY);
    expect(reasoningMultiplier('irrelevant')).toBe(REASONING_PENALTY);
  });

  it('never penalizes correct reasoning or an absent signal', () => {
    expect(reasoningMultiplier('correct-reasoning')).toBe(1);
    expect(reasoningMultiplier(null)).toBe(1);
    expect(reasoningMultiplier(undefined)).toBe(1);
  });
});

describe('pickConceptualProblem', () => {
  const rng = () => 0; // deterministic: always the first of the pool

  it('returns a problem matching the topic', () => {
    const p = pickConceptualProblem({ topic: 'permutations-combinations', recentIds: [], rng });
    expect(p).not.toBeNull();
    expect(p?.topic).toBe('permutations-combinations');
  });

  it('avoids recently-served ids when alternatives exist, else falls back', () => {
    // 'long-run' has exactly one seed problem → recent list forces the fallback.
    const only = conceptualProblems.find((p) => p.topic === 'long-run')!;
    const p = pickConceptualProblem({ topic: 'long-run', recentIds: [only.id], rng });
    expect(p?.id).toBe(only.id); // fallback to the full topic set
  });

  it('returns null for a topic with no conceptual problems', () => {
    expect(pickConceptualProblem({ topic: 'distributions', recentIds: [], rng })).toBeNull();
  });
});
