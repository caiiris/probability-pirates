import { assertLessonInvariants } from './assertLessonInvariants';
import { lesson1 } from './lessons/01-what-is-probability';
import { lesson2 } from './lessons/02-law-of-large-numbers';
import { lesson3 } from './lessons/03-counting-carefully';
import { lesson4 } from './lessons/04-counting-gets-hard';
import { lesson5 } from './lessons/05-conditional-probability';
import { lesson6 } from './lessons/06-distributions';
import { roadmapStubLessons } from './lessons/roadmapStubs';
import type { Lesson } from './types';

/**
 * The six authored lessons ship first, in pedagogical order. The roadmap
 * stubs (blank, locked previews of the full curriculum — see
 * `docs/curriculum-roadmap.md`) follow, so the live "Start here" lesson and
 * all progress/recommendation/reward behavior are unchanged.
 */
export const lessons: Lesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
  lesson5,
  lesson6,
  ...roadmapStubLessons,
];

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

export { lesson1, lesson2, lesson3, lesson4, lesson5, lesson6 };
export type { Lesson } from './types';
export * from './types';
