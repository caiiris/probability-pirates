import { describe, it, expect } from 'vitest';
import { parseAvailableLessonIds, REMOTE_CONFIG_DEFAULTS } from './remoteFlagsConfig';

describe('parseAvailableLessonIds', () => {
  it('parses a valid JSON array', () => {
    expect(parseAvailableLessonIds('["a","b"]')).toEqual(['a', 'b']);
  });

  it('returns [] for invalid JSON (never throws — defaults take over)', () => {
    expect(parseAvailableLessonIds('not-json')).toEqual([]);
    expect(parseAvailableLessonIds('')).toEqual([]);
  });

  it('returns [] for non-array JSON', () => {
    expect(parseAvailableLessonIds('{"foo":"bar"}')).toEqual([]);
    expect(parseAvailableLessonIds('42')).toEqual([]);
  });

  it('filters out non-string entries', () => {
    expect(parseAvailableLessonIds('["a",1,"b",null]')).toEqual(['a', 'b']);
  });

  it('bundled default is parseable and contains lesson 1', () => {
    const ids = parseAvailableLessonIds(REMOTE_CONFIG_DEFAULTS.available_lesson_ids);
    expect(ids).toContain('what-is-probability');
  });
});
