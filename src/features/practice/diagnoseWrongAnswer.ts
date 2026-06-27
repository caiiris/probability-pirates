/**
 * C-MC2 — Centralises the diagnostic-trap lookup for all four variant kinds.
 *
 * Pure: no React, no Firebase, no side-effects. Given a variant and the
 * learner's submitted payload, returns the misconception key that matches the
 * trap answer, or null when there is no match or no trap is defined.
 *
 * fill-fraction matching uses exact reduced equality (eqF), so a submitted
 * 2/4 matches a trap stored as 1/2.
 */

import { frac, eqF } from '@/lib/probability/exact';
import type { Variant } from '@/content/types';
import type { MisconceptionKey } from '@/content/misconceptions';
import type { AttemptPayload } from '@/features/progress/progressService';

export function diagnoseWrongAnswer(
  variant: Variant,
  payload: AttemptPayload,
): MisconceptionKey | null {
  switch (variant.interactionKind) {
    case 'number-fill': {
      if ('value' in payload) {
        return variant.misconceptionByValue?.[payload.value] ?? null;
      }
      return null;
    }

    case 'multiple-choice': {
      if ('optionId' in payload) {
        return variant.misconceptionByOption?.[payload.optionId] ?? null;
      }
      return null;
    }

    case 'fill-fraction': {
      if ('numerator' in payload && 'denominator' in payload) {
        if (payload.denominator === 0) return null;
        const entries = variant.misconceptionByFraction;
        if (!entries || entries.length === 0) return null;
        const submitted = frac(payload.numerator, payload.denominator);
        for (const entry of entries) {
          if (eqF(submitted, frac(entry.num, entry.den))) {
            return entry.key;
          }
        }
        return null;
      }
      return null;
    }

    default:
      return null;
  }
}
