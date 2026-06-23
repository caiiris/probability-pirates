import { assertLessonInvariants } from './assertLessonInvariants';
import { lesson1 } from './lessons/01-what-is-probability';
import { lesson2 } from './lessons/02-law-of-large-numbers';
import { lesson3 } from './lessons/03-counting-gets-hard';
import { lesson4 } from './lessons/04-conditional-probability';
import { lesson5 } from './lessons/05-distributions';
import { lesson6 } from './lessons/06-central-limit-theorem';
import type { Lesson } from './types';

export const lessons: Lesson[] = [
  lesson1,
  lesson2,
  lesson3,
  lesson4,
  lesson5,
  lesson6,
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
