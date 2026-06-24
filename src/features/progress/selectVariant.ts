import { fnv1a32 } from '@/lib/hash';
import type { LessonProgress } from './progressService';
import type { ProblemSlot, Variant } from '@/content/types';

/**
 * Deterministically picks a variant index for a given (user, lesson, attempt, slot).
 * Same inputs always produce the same output — stable within an attempt.
 * Different attemptId (replay) produces a different distribution.
 */
export function selectVariantIndex(
  userId: string,
  lessonId: string,
  attemptId: string,
  slotId: string,
  variantCount: number,
): number {
  const seed = `${userId}|${lessonId}|${attemptId}|${slotId}`;
  return fnv1a32(seed) % variantCount;
}

/**
 * Returns the variant for a slot, preferring the already-recorded choice from
 * the progress doc (ensures resume = same variant). Falls back to computing
 * a fresh selection if the slot hasn't been visited yet.
 */
export function pickVariantForSlot(
  progress: LessonProgress,
  slot: ProblemSlot,
  userId: string,
  lessonId: string,
): Variant {
  const existing = progress.selectedVariantIds[slot.id];
  if (existing) {
    const found = slot.variants.find((v) => v.id === existing);
    if (found) return found;
    // Variant no longer exists in content (deploy removed it) — recompute
    console.error(`Variant "${existing}" not found in slot "${slot.id}"; recomputing.`);
  }

  const idx = selectVariantIndex(
    userId,
    lessonId,
    progress.attemptId,
    slot.id,
    slot.variants.length,
  );
  return slot.variants[idx];
}
