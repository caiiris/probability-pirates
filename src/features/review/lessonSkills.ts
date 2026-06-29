/**
 * Derive the set of skills a lesson teaches, from its problem variants'
 * `skills` tags. Used to seed the spaced-review schedule on lesson completion.
 * Pure — no Firebase, no React.
 */

import type { Lesson } from '@/content/types';
import type { SkillId } from '@/content/skills';

/** Union of `skills` across all problem-slot variants in the lesson. */
export function lessonSkills(lesson: Lesson): SkillId[] {
  const set = new Set<SkillId>();
  for (const slot of lesson.slots) {
    if (slot.kind !== 'problem') continue;
    for (const variant of slot.variants) {
      for (const skill of variant.skills ?? []) {
        set.add(skill);
      }
    }
  }
  return [...set];
}
