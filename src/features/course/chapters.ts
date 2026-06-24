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

export const CHAPTERS: Chapter[] = [
  {
    id: 'foundations',
    number: 1,
    title: 'Chance Basics',
    subtitle: 'What randomness is, and how it settles down.',
    accent: 'violet',
    lessonIds: ['what-is-probability', 'law-of-large-numbers'],
  },
  {
    id: 'counting',
    number: 2,
    title: 'The Art of Counting',
    subtitle: 'Count the ways things can happen.',
    accent: 'green',
    lessonIds: ['counting-carefully', 'counting-gets-hard'],
  },
  {
    id: 'deeper',
    number: 3,
    title: 'Going Deeper',
    subtitle: 'Conditions, and the shapes of chance.',
    accent: 'amber',
    lessonIds: ['conditional-probability', 'distributions'],
  },

  // --------------------------------------------------------------------------
  // Roadmap units (locked previews). These hold the forward-looking curriculum
  // from `docs/curriculum-roadmap.md` as blank, coming-soon lessons. They sit
  // after the live content above; until a stub is authored + flipped on, every
  // node renders locked. See `src/content/lessons/roadmapStubs.ts`.
  // --------------------------------------------------------------------------
  {
    id: 'likelihood',
    number: 4,
    title: 'Likelihood',
    subtitle: 'The language of chance, before any math.',
    accent: 'violet',
    lessonIds: ['likelihood-compare', 'probability-scale', 'long-run-frequency', 'review-likelihood'],
  },
  {
    id: 'sample-spaces',
    number: 5,
    title: 'Sample Spaces',
    subtitle: 'List every outcome, then count it.',
    accent: 'blue',
    lessonIds: ['sample-space', 'equally-likely-outcomes', 'practice-single-events', 'review-sample-spaces'],
  },
  {
    id: 'compound',
    number: 6,
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
    number: 7,
    title: 'Events',
    subtitle: 'Events are sets of outcomes.',
    accent: 'green',
    lessonIds: ['event-as-set', 'p-event-by-counting', 'complement-rule', 'practice-events', 'review-events'],
  },
  {
    id: 'counting-techniques',
    number: 8,
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
    number: 9,
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
    number: 10,
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
    id: 'random-variables',
    number: 11,
    title: 'Random Variables',
    subtitle: 'Outcomes become numbers with value.',
    accent: 'blue',
    lessonIds: [
      'random-variable',
      'distributions-intro',
      'expected-value-intuition',
      'computing-expected-value',
      'variance-spread',
      'practice-expected-value',
      'review-random-variables',
    ],
  },
  {
    id: 'famous-distributions',
    number: 12,
    title: 'Famous Distributions',
    subtitle: 'The shapes you actually see.',
    accent: 'teal',
    lessonIds: [
      'binomial-distribution',
      'normal-distribution',
      'central-limit-theorem',
      'monte-carlo',
      'capstone-problem-set',
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
