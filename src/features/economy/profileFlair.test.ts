import { describe, it, expect } from 'vitest';
import { PROFILE_FLAIR, DEFAULT_FLAIR, getFlair, isFlair } from './profileFlair';

describe('profile flair catalog', () => {
  it('includes a free default that everyone owns', () => {
    const none = PROFILE_FLAIR.find((f) => f.id === DEFAULT_FLAIR);
    expect(none).toBeDefined();
    expect(none!.price).toBe(0);
    expect(none!.background).toBeNull();
  });

  it('has unique ids and non-negative prices', () => {
    const ids = PROFILE_FLAIR.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of PROFILE_FLAIR) expect(f.price).toBeGreaterThanOrEqual(0);
  });

  it('gives every paid flair a gradient and a name', () => {
    for (const f of PROFILE_FLAIR.filter((x) => x.price > 0)) {
      expect(f.background).toBeTruthy();
      expect(f.name.length).toBeGreaterThan(0);
    }
  });
});

describe('getFlair / isFlair', () => {
  it('returns the matching flair', () => {
    expect(getFlair('legend').id).toBe('legend');
  });

  it('falls back to the default for unknown/empty ids', () => {
    expect(getFlair('nope').id).toBe(DEFAULT_FLAIR);
    expect(getFlair(null).id).toBe(DEFAULT_FLAIR);
    expect(getFlair(undefined).id).toBe(DEFAULT_FLAIR);
  });

  it('recognizes known ids only', () => {
    expect(isFlair('navigator')).toBe(true);
    expect(isFlair('nope')).toBe(false);
    expect(isFlair(null)).toBe(false);
  });
});
