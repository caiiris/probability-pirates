import { assertLessonInvariants } from './assertLessonInvariants';
import { lesson1 } from './lessons/01-what-is-probability';
import { lesson2 } from './lessons/02-law-of-large-numbers';
import { lesson3 } from './lessons/03-counting-carefully';
import { lesson4 } from './lessons/04-counting-gets-hard';
import { lesson5 } from './lessons/05-conditional-probability';
import { lesson6 } from './lessons/06-distributions';
import { howLikely } from './lessons/how-likely';
import { longRunFrequency } from './lessons/long-run-frequency';
import { sampleSpace } from './lessons/sample-space';
import { equallyLikelyOutcomes } from './lessons/equally-likely-outcomes';
import { multiplicationPrinciple } from './lessons/multiplication-principle';
import { additionPrinciple } from './lessons/addition-principle';
import { roadmapStubLessons } from './lessons/roadmapStubs';
import type { Lesson } from './types';

/**
 * The live catalog. The `how-likely` course opener leads (D88), then the
 * curriculum from `docs/curriculum-roadmap.md` (collapsed to 7 units in D90)
 * follows. Within that curriculum, lessons that have been authored swap in for
 * their stub by id; everything else stays as a blank, locked preview.
 *
 * Currently authored, in catalog order: `how-likely`, `long-run-frequency`
 * (D92), `sample-space` (D93). The `two-dice` stub is reserved for the
 * future Unit 2 compound lesson.
 *
 * Numbers are assigned by position (1…N) so "Lesson N" is always monotonic on
 * the path regardless of how the stubs are ordered.
 *
 * The original five dense lessons (`lesson1`-`lesson5`) and the `distributions`
 * stub are NOT on the live path. They are kept imported and re-exported below as
 * the content reservoir for the later Unit 2 / Unit 4 / Unit 6 splits, so the
 * old 6-lesson spine and the new granular plan do not appear twice (overlap
 * resolved per D88). `main` still holds the prior arrangement.
 */

// Lessons we have hand-authored from the roadmap. Each one swaps in for the
// matching id in `roadmapStubLessons` below (no manual surgery on the stub
// list). To author another one: write the file, import it, add it here.
// `how-likely` is excluded — it's the dedicated course opener (no roadmap
// stub mirrors it; it sits ahead of Unit 1 in the path).
//
// `additionPrinciple` is authored but intentionally NOT included here, so the
// path renders its locked roadmap stub instead. To unlock it later, just add
// `additionPrinciple` back to this array — the import + re-export below stay
// so the file is one edit away from going live.
const authoredRoadmapLessons: Lesson[] = [
  longRunFrequency,
  sampleSpace,
  equallyLikelyOutcomes,
  multiplicationPrinciple,
];
const authoredRoadmapById = new Map<string, Lesson>(
  authoredRoadmapLessons.map((lesson) => [lesson.id, lesson]),
);

const liveRoadmap = roadmapStubLessons.map((stub) => authoredRoadmapById.get(stub.id) ?? stub);

export const lessons: Lesson[] = [howLikely, ...liveRoadmap].map((lesson, i) =>
  lesson.number === i + 1 ? lesson : { ...lesson, number: i + 1 },
);

export const lessonById = new Map<string, Lesson>(lessons.map((lesson) => [lesson.id, lesson]));

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
export {
  lesson1,
  lesson2,
  lesson3,
  lesson4,
  lesson5,
  lesson6,
  howLikely,
  longRunFrequency,
  sampleSpace,
  equallyLikelyOutcomes,
  multiplicationPrinciple,
  additionPrinciple,
};
export type { Lesson } from './types';
export * from './types';
