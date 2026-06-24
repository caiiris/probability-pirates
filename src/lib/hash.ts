/**
 * FNV-1a 32-bit hash — pure, deterministic, no dependencies.
 * Used to seed variant selection per (userId, lessonId, attemptId, slotId).
 */
export function fnv1a32(input: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Multiply by FNV prime (32-bit overflow is intentional — >>> 0 keeps it unsigned)
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}
