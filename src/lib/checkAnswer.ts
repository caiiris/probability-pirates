import type { Variant } from '@/content/types';
import type { AttemptPayload } from '@/features/progress/progressService';

export type CheckResult = { wasCorrect: true } | { wasCorrect: false; matchedWrongKey: string };

/**
 * Pure function: evaluates an answer payload against a variant's correctness rules.
 * One case per InteractionKind. Exhaustive switch — TS will catch missing cases.
 */
export function checkAnswer(variant: Variant, payload: AttemptPayload): CheckResult {
  switch (variant.interactionKind) {
    case 'tap-outcomes': {
      const p = payload as { collected: string[] };
      const expected = new Set(variant.expectedOutcomes);
      const collected = p.collected;

      // Check for duplicates
      const seen = new Set<string>();
      for (const item of collected) {
        if (seen.has(item)) return { wasCorrect: false, matchedWrongKey: 'duplicate' };
        seen.add(item);
      }

      // Check unexpected values
      for (const item of collected) {
        if (!expected.has(item)) return { wasCorrect: false, matchedWrongKey: item };
      }

      // Must have collected exactly all expected
      if (collected.length !== expected.size) {
        const missing = [...expected].find((e) => !seen.has(e));
        return { wasCorrect: false, matchedWrongKey: missing ?? 'incomplete' };
      }

      return { wasCorrect: true };
    }

    case 'fill-fraction': {
      const p = payload as { numerator: number; denominator: number };
      if (p.denominator === 0) {
        return { wasCorrect: false, matchedWrongKey: `${p.numerator}/0` };
      }
      // Cross-multiply to avoid floating-point: a/b == c/d iff a*d == b*c
      const correct = p.numerator * variant.denominator === variant.numerator * p.denominator;
      if (correct) return { wasCorrect: true };
      return { wasCorrect: false, matchedWrongKey: `${p.numerator}/${p.denominator}` };
    }

    case 'tap-event': {
      const p = payload as { selected: string[] };
      const correct = new Set(variant.correctOutcomes);
      const selected = new Set(p.selected);

      for (const item of selected) {
        if (!correct.has(item)) return { wasCorrect: false, matchedWrongKey: item };
      }
      if (selected.size !== correct.size) {
        return { wasCorrect: false, matchedWrongKey: 'incomplete' };
      }
      return { wasCorrect: true };
    }

    case 'grid-event': {
      const p = payload as { selectedCells: Array<[number, number]> };
      const correctSet = new Set(variant.correctCells.map(([r, c]) => `${r},${c}`));
      const selectedSet = new Set(p.selectedCells.map(([r, c]) => `${r},${c}`));

      for (const key of selectedSet) {
        if (!correctSet.has(key)) return { wasCorrect: false, matchedWrongKey: key };
      }
      if (selectedSet.size !== correctSet.size) {
        return { wasCorrect: false, matchedWrongKey: 'incomplete' };
      }
      return { wasCorrect: true };
    }

    case 'multiple-choice': {
      const p = payload as { optionId: string };
      if (p.optionId === variant.correctOptionId) return { wasCorrect: true };
      return { wasCorrect: false, matchedWrongKey: p.optionId };
    }

    case 'simulate-proportion': {
      const p = payload as { trials: number };
      if (p.trials >= variant.minTrials) return { wasCorrect: true };
      return { wasCorrect: false, matchedWrongKey: 'incomplete' };
    }

    case 'scrub-trials': {
      const p = payload as { trials: number };
      if (p.trials >= variant.reachN) return { wasCorrect: true };
      return { wasCorrect: false, matchedWrongKey: 'incomplete' };
    }

    case 'fill-text': {
      // Normalize: trim outer whitespace and lowercase. The author writes
      // `acceptRegex` against the lowercase form; we anchor it at both
      // ends here so partial matches do not slip through. The `i` flag is
      // belt-and-suspenders given the lowercase normalization.
      const p = payload as { text: string };
      const normalized = p.text.trim().toLowerCase();
      const anchored = new RegExp(`^(?:${variant.acceptRegex})$`, 'i');
      if (anchored.test(normalized)) return { wasCorrect: true };
      return {
        wasCorrect: false,
        matchedWrongKey: normalized.length > 0 ? normalized : 'empty',
      };
    }

    case 'monty-hall': {
      const p = payload as { games: number };
      if (p.games >= variant.minGames) return { wasCorrect: true };
      return { wasCorrect: false, matchedWrongKey: 'incomplete' };
    }
  }
}
