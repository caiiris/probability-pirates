import { assertLessonInvariants } from './assertLessonInvariants';
import { lesson1 } from './lessons/01-what-is-probability';
import { lesson2 } from './lessons/02-law-of-large-numbers';
import { lesson3 } from './lessons/03-counting-carefully';
import { lesson4 } from './lessons/04-counting-gets-hard';
import { lesson5 } from './lessons/05-conditional-probability';
import { lesson6 } from './lessons/06-distributions';
import { howLikely } from './lessons/how-likely';
import { roadmapStubLessons } from './lessons/roadmapStubs';
import type { Lesson } from './types';

/**
 * The live catalog (D88): the `how-likely` course opener leads, then the 9-unit
 * curriculum from `docs/curriculum-roadmap.md` follows as blank, locked stubs.
 * `how-likely` is the one authored, playable lesson; the `two-dice` stub stays a
 * locked preview of the future Unit 3 compound lesson.
 *
 * Numbers are assigned by position (1…N) so "Lesson N" is always monotonic on
 * the path regardless of how the stubs are ordered.
 *
 * The original five dense lessons (`lesson1`-`lesson5`) and the `distributions`
 * stub are NOT on the live path. They are kept imported and re-exported below as
 * the content reservoir for the later Unit 2-4 / Unit 5 / Unit 7 splits, so the
 * old 6-lesson spine and the new granular plan do not appear twice (overlap
 * resolved per D88). `main` still holds the prior arrangement.
 */
export const lessons: Lesson[] = [howLikely, ...roadmapStubLessons].map(
  (lesson, i) => (lesson.number === i + 1 ? lesson : { ...lesson, number: i + 1 }),
);

export const lessonById = new Map<string, Lesson>(
  lessons.map((lesson) => [lesson.id, lesson]),
);

function validateAllLessons(): void {
  for (const lesson of lessons) {
    try {
      assertLessonInvariants(lesson);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (process.env.NODE_ENV === 'production') {
        console.error(`Lesson invariant failed: ${message}`);
      } else {
        throw error;
      }
    }
  }
}

validateAllLessons();

// `lesson1`-`lesson6` are the preserved source content (not on the live path).
export { lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, howLikely };
export type { Lesson } from './types';
export * from './types';
