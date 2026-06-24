import { describe, it, expect } from 'vitest';
import { newAchievementsFor, ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from './achievements';

describe('newAchievementsFor', () => {
  it('awards xp thresholds as they are crossed', () => {
    expect(newAchievementsFor([], { xp: 50 })).toEqual([]);
    expect(newAchievementsFor([], { xp: 100 })).toEqual(['xp-100']);
    expect(newAchievementsFor([], { xp: 500 })).toEqual(['xp-100', 'xp-500']);
    expect(newAchievementsFor([], { xp: 1000 })).toEqual(['xp-100', 'xp-500', 'xp-1000']);
  });

  it('skips already-earned ids (idempotent)', () => {
    const first = newAchievementsFor([], { xp: 500 });
    const second = newAchievementsFor(first, { xp: 500 });
    expect(second).toEqual([]);
  });

  it('awards course-cleared only when all lessons are done', () => {
    expect(newAchievementsFor([], { lessonsCompleted: 5, courseTotal: 6 })).toEqual([]);
    expect(newAchievementsFor([], { lessonsCompleted: 6, courseTotal: 6 })).toEqual([
      'course-cleared',
    ]);
  });

  it('does not award course-cleared when courseTotal is unknown or zero', () => {
    expect(newAchievementsFor([], { lessonsCompleted: 6 })).toEqual([]);
    expect(newAchievementsFor([], { lessonsCompleted: 0, courseTotal: 0 })).toEqual([]);
  });

  it('awards flawless and bounce-back from lesson summary flags', () => {
    expect(newAchievementsFor([], { lessonAllFirstTry: true })).toEqual(['flawless']);
    expect(newAchievementsFor([], { lessonHadComeback: true })).toEqual(['bounce-back']);
    expect(newAchievementsFor([], {})).toEqual([]);
  });

  it('awards welcome-back only after a 3+ day gap', () => {
    expect(newAchievementsFor([], { gapDays: 2 })).toEqual([]);
    expect(newAchievementsFor([], { gapDays: 3 })).toEqual(['welcome-back']);
  });

  it('returns nothing for an empty context', () => {
    expect(newAchievementsFor([], {})).toEqual([]);
    expect(newAchievementsFor(undefined, {})).toEqual([]);
  });
});

describe('achievement catalog', () => {
  it('has a unique id, title, description and icon for every entry', () => {
    const ids = new Set<string>();
    for (const a of ACHIEVEMENTS) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(a.icon.length).toBeGreaterThan(0);
      expect(ids.has(a.id)).toBe(false);
      ids.add(a.id);
    }
  });

  it('ACHIEVEMENT_BY_ID resolves every catalog entry', () => {
    for (const a of ACHIEVEMENTS) {
      expect(ACHIEVEMENT_BY_ID[a.id]).toBe(a);
    }
  });
});
