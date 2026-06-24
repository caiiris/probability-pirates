import type { Lesson } from '@/content/types';
import type { AccentName } from '@/lib/theme';

/**
 * Presentation-only "worlds" for the course path. Like `lessonVisuals.ts`, this
 * lives in the feature (not on the `Lesson` content model) because chaptering is
 * pure chrome and the content is remote-config driven.
 *
 * ADD A LESSON TO A CHAPTER: add its id to the right `lessonIds` array. Any
 * lesson not listed in a chapter is collected into a trailing "More" chapter, so
 * the path never drops a lesson or breaks when new content ships.
 */
export type Chapter = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  accent: AccentName;
  lessonIds: string[];
};

// The course opens on a single hook lesson (`how-likely`), then runs the
// curriculum from `docs/curriculum-roadmap.md`. Scope is **classical HS
// probability**, ending on expected value:
//   - D89 collapsed the original 9 units to 8 by merging "Likelihood" into
//     "Sample Spaces" → "Defining Probability".
//   - D90 narrowed the count to 7 by dropping the RV/distributions/CLT
//     /Monte Carlo material (statistics-track, not classical probability)
//     and reshaping the final unit as "Expected Value" — the genuine
//     probability capstone.
// `how-likely` is the one authored, playable lesson; every other node is a
// locked preview until its content is authored. The old 3-chapter spine
// (Chance Basics / The Art of Counting / Going Deeper) was removed in D88.
export const CHAPTERS: Chapter[] = [
  {
    id: 'start-here',
    number: 1,
    title: 'Start Here',
    subtitle: 'Tap, count, and meet your first surprise.',
    accent: 'violet',
    lessonIds: ['how-likely'],
  },
  {
    id: 'defining-probability',
    number: 2,
    title: 'Defining Probability',
    subtitle: 'From the long-run feeling to the favorable-over-total formula.',
    accent: 'blue',
    lessonIds: [
      'long-run-frequency',
      'sample-space',
      'equally-likely-outcomes',
      'practice-single-events',
      'review-sample-spaces',
    ],
  },
  {
    id: 'compound',
    number: 3,
    title: 'Compound Experiments',
    subtitle: 'When experiments combine, outcomes multiply.',
    accent: 'teal',
    lessonIds: [
      'two-coins',
      'two-dice',
      'tree-diagrams',
      'multiplication-principle',
      'practice-counting-outcomes',
      'review-compound',
    ],
  },
  {
    id: 'events',
    number: 4,
    title: 'Events',
    subtitle: 'Events are sets of outcomes.',
    accent: 'green',
    lessonIds: ['event-as-set', 'p-event-by-counting', 'complement-rule', 'practice-events', 'review-events'],
  },
  {
    id: 'counting-techniques',
    number: 5,
    title: 'Counting Techniques',
    subtitle: 'Tools for when listing stops working.',
    accent: 'amber',
    lessonIds: [
      'addition-principle',
      'inclusion-exclusion',
      'permutations',
      'combinations',
      'divide-by-k-factorial',
      'practice-counting-techniques',
      'review-counting-techniques',
    ],
  },
  {
    id: 'combining',
    number: 6,
    title: 'Combining Probabilities',
    subtitle: 'Multiply, add, and flip to the complement.',
    accent: 'coral',
    lessonIds: [
      'independent-events',
      'mutually-exclusive',
      'at-least-one',
      'birthday-paradox',
      'practice-multi-event',
      'review-combining',
    ],
  },
  {
    id: 'conditional',
    number: 7,
    title: 'Conditional Probability',
    subtitle: 'How new information changes belief.',
    accent: 'violet',
    lessonIds: [
      'conditional-intuition',
      'conditional-formula',
      'independence-revisited',
      'bayes-theorem',
      'monty-hall',
      'practice-conditional',
      'review-conditional',
    ],
  },
  {
    id: 'expected-value',
    number: 8,
    title: 'Expected Value',
    subtitle: 'When you bet on a probability, what payoff do you expect?',
    accent: 'blue',
    lessonIds: [
      'expected-value-intuition',
      'computing-expected-value',
      'fair-games',
      'practice-expected-value',
      'review-expected-value',
    ],
  },
];

export type ChapterGroup = { chapter: Chapter; lessons: Lesson[] };

/**
 * Bucket the given lessons into chapters in CHAPTERS order. Lessons not assigned
 * to any chapter land in a generated trailing "More to explore" chapter. Empty
 * chapters are dropped so the path stays tight.
 */
export function groupLessonsIntoChapters(lessons: Lesson[]): ChapterGroup[] {
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const claimed = new Set<string>();
  const groups: ChapterGroup[] = [];

  for (const chapter of CHAPTERS) {
    const chapterLessons = chapter.lessonIds
      .map((id) => byId.get(id))
      .filter((l): l is Lesson => Boolean(l));
    chapterLessons.forEach((l) => claimed.add(l.id));
    if (chapterLessons.length > 0) groups.push({ chapter, lessons: chapterLessons });
  }

  const leftovers = lessons.filter((l) => !claimed.has(l.id));
  if (leftovers.length > 0) {
    groups.push({
      chapter: {
        id: 'more',
        number: groups.length + 1,
        title: 'More to Explore',
        subtitle: 'Fresh territory.',
        accent: 'coral',
        lessonIds: leftovers.map((l) => l.id),
      },
      lessons: leftovers,
    });
  }

  return groups;
}
