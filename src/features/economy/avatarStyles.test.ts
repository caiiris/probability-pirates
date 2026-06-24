import { describe, it, expect } from 'vitest';
import {
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
  getAvatarStyle,
  isAvatarStyle,
} from './avatarStyles';

describe('avatar style catalog', () => {
  it('includes a free default that everyone owns', () => {
    const classic = AVATAR_STYLES.find((s) => s.id === DEFAULT_AVATAR_STYLE);
    expect(classic).toBeDefined();
    expect(classic!.price).toBe(0);
    expect(classic!.background).toBeNull();
  });

  it('has unique ids and non-negative prices', () => {
    const ids = AVATAR_STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of AVATAR_STYLES) expect(s.price).toBeGreaterThanOrEqual(0);
  });
});

describe('getAvatarStyle', () => {
  it('returns the matching style', () => {
    expect(getAvatarStyle('ocean').id).toBe('ocean');
  });

  it('falls back to classic for unknown/empty ids', () => {
    expect(getAvatarStyle('does-not-exist').id).toBe(DEFAULT_AVATAR_STYLE);
    expect(getAvatarStyle(null).id).toBe(DEFAULT_AVATAR_STYLE);
    expect(getAvatarStyle(undefined).id).toBe(DEFAULT_AVATAR_STYLE);
  });
});

describe('isAvatarStyle', () => {
  it('recognizes known ids only', () => {
    expect(isAvatarStyle('gold')).toBe(true);
    expect(isAvatarStyle('nope')).toBe(false);
    expect(isAvatarStyle(null)).toBe(false);
  });
});
