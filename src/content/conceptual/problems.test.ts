/**
 * Unit tests for the conceptual problem bank (F2-C).
 *
 * Asserts:
 *  1. Every problem's misconceptions[] contains only valid MisconceptionKeys.
 *  2. Every problem's answer is a well-formed ExactAnswer.
 *  3. Every required string field is non-empty.
 *  4. rubricKeyPoints is a non-empty array of non-empty strings.
 *  5. ids are unique across the bank.
 */

import { describe, it, expect } from 'vitest';
import { MISCONCEPTIONS } from '../misconceptions';
import type { MisconceptionKey } from '../misconceptions';
import type { ExactAnswer } from '../../lib/probability/exact';
import { conceptualProblems } from './problems';

const validKeys = new Set<MisconceptionKey>(
  Object.keys(MISCONCEPTIONS) as MisconceptionKey[],
);

describe('conceptual problem bank — structural invariants', () => {
  it('has at least one problem', () => {
    expect(conceptualProblems.length).toBeGreaterThanOrEqual(1);
  });

  it('all ids are unique', () => {
    const ids = conceptualProblems.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  describe.each(conceptualProblems.map((p) => [p.id, p] as const))(
    'problem %s',
    (_id, problem) => {
      it('id is non-empty', () => {
        expect(problem.id.trim().length).toBeGreaterThan(0);
      });

      it('prompt is non-empty', () => {
        expect(problem.prompt.trim().length).toBeGreaterThan(0);
      });

      it('canonicalWhy is non-empty', () => {
        expect(problem.canonicalWhy.trim().length).toBeGreaterThan(0);
      });

      it('rubricKeyPoints is a non-empty array of non-empty strings', () => {
        expect(Array.isArray(problem.rubricKeyPoints)).toBe(true);
        expect(problem.rubricKeyPoints.length).toBeGreaterThan(0);
        for (const point of problem.rubricKeyPoints) {
          expect(typeof point).toBe('string');
          expect(point.trim().length).toBeGreaterThan(0);
        }
      });

      it('misconceptions is a non-empty array of valid MisconceptionKeys', () => {
        expect(Array.isArray(problem.misconceptions)).toBe(true);
        expect(problem.misconceptions.length).toBeGreaterThan(0);
        for (const key of problem.misconceptions) {
          expect(
            validKeys.has(key),
            `"${key}" is not a valid MisconceptionKey — add it to misconceptions.ts or remove it`,
          ).toBe(true);
        }
      });

      it('answer is a well-formed ExactAnswer', () => {
        const answer: ExactAnswer = problem.answer;
        expect(['int', 'fraction', 'choice']).toContain(answer.kind);

        if (answer.kind === 'int') {
          expect(typeof answer.value).toBe('number');
          expect(Number.isInteger(answer.value)).toBe(true);
        } else if (answer.kind === 'fraction') {
          expect(typeof answer.value).toBe('object');
          expect(answer.value).not.toBeNull();
          expect(typeof answer.value.num).toBe('bigint');
          expect(typeof answer.value.den).toBe('bigint');
          // Denominator must be positive (the reduce() contract)
          expect(answer.value.den).toBeGreaterThan(0n);
        } else if (answer.kind === 'choice') {
          expect(typeof answer.optionId).toBe('string');
          expect(answer.optionId.trim().length).toBeGreaterThan(0);
        }
      });
    },
  );
});

describe('conceptual problem bank — domain correctness spot-checks', () => {
  it('cp-001 gambler\'s fallacy answer is 1/2', () => {
    const p = conceptualProblems.find((x) => x.id === 'cp-001-gamblers-fallacy');
    expect(p).toBeDefined();
    expect(p!.answer.kind).toBe('fraction');
    if (p!.answer.kind === 'fraction') {
      expect(p!.answer.value.num).toBe(1n);
      expect(p!.answer.value.den).toBe(2n);
    }
    expect(p!.misconceptions).toContain('gambler' satisfies MisconceptionKey);
  });

  it('cp-002 base-rate neglect answer is 1/12', () => {
    const p = conceptualProblems.find((x) => x.id === 'cp-002-base-rate-neglect');
    expect(p).toBeDefined();
    expect(p!.answer.kind).toBe('fraction');
    if (p!.answer.kind === 'fraction') {
      expect(p!.answer.value.num).toBe(1n);
      expect(p!.answer.value.den).toBe(12n);
    }
    expect(p!.misconceptions).toContain('base_rate_neglect' satisfies MisconceptionKey);
  });

  it('cp-003 ordered-vs-unordered answer is 10', () => {
    const p = conceptualProblems.find((x) => x.id === 'cp-003-ordered-vs-unordered');
    expect(p).toBeDefined();
    expect(p!.answer.kind).toBe('int');
    if (p!.answer.kind === 'int') {
      expect(p!.answer.value).toBe(10);
    }
    expect(p!.misconceptions).toContain('ordered_vs_unordered' satisfies MisconceptionKey);
  });

  it('cp-004 complement-inversion answer is 5/6', () => {
    const p = conceptualProblems.find((x) => x.id === 'cp-004-complement-inversion');
    expect(p).toBeDefined();
    expect(p!.answer.kind).toBe('fraction');
    if (p!.answer.kind === 'fraction') {
      expect(p!.answer.value.num).toBe(5n);
      expect(p!.answer.value.den).toBe(6n);
    }
    expect(p!.misconceptions).toContain('complement_inversion' satisfies MisconceptionKey);
  });
});
