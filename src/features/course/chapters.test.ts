import { describe, it, expect } from 'vitest';
import { CHAPTERS, groupLessonsIntoChapters } from './chapters';
import { lessons } from '@/content';

describe('chapter structure', () => {
  const catalogIds = new Set(lessons.map((l) => l.id));

  it('only references lesson ids that exist in the catalog', () => {
    for (const chapter of CHAPTERS) {
      for (const id of chapter.lessonIds) {
        expect(catalogIds.has(id), `chapter "${chapter.id}" references unknown lesson "${id}"`).toBe(true);
      }
    }
  });

  it('never assigns a lesson to more than one chapter', () => {
    const seen = new Set<string>();
    for (const chapter of CHAPTERS) {
      for (const id of chapter.lessonIds) {
        expect(seen.has(id), `lesson "${id}" is in two chapters`).toBe(false);
        seen.add(id);
      }
    }
  });

  it('assigns every catalog lesson to a chapter (no leftovers / no trailing "More")', () => {
    const assigned = new Set(CHAPTERS.flatMap((c) => c.lessonIds));
    for (const lesson of lessons) {
      expect(assigned.has(lesson.id), `lesson "${lesson.id}" is not in any chapter`).toBe(true);
    }
    // Because everything is explicitly chaptered, the generated fallback chapter
    // should never appear.
    const groups = groupLessonsIntoChapters(lessons);
    expect(groups.some((g) => g.chapter.id === 'more')).toBe(false);
  });

  it('has unique, sequentially numbered chapters', () => {
    const ids = CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CHAPTERS.map((c) => c.number)).toEqual(CHAPTERS.map((_, i) => i + 1));
  });

  it('groups lessons in declared chapter order, preserving lesson order', () => {
    const groups = groupLessonsIntoChapters(lessons);
    // The first three chapters hold the live content in authored order.
    expect(groups[0].lessons.map((l) => l.id)).toEqual(['what-is-probability', 'law-of-large-numbers']);
    expect(groups[0].chapter.id).toBe('foundations');
  });
});
