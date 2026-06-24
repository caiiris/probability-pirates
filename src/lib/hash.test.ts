import { describe, it, expect } from 'vitest';
import { fnv1a32 } from './hash';

describe('fnv1a32', () => {
  it('returns a number', () => {
    expect(typeof fnv1a32('hello')).toBe('number');
  });

  it('is deterministic', () => {
    expect(fnv1a32('abc')).toBe(fnv1a32('abc'));
  });

  it('different inputs produce different outputs', () => {
    expect(fnv1a32('aaa')).not.toBe(fnv1a32('bbb'));
  });

  it('returns unsigned 32-bit number', () => {
    const h = fnv1a32('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('distributes roughly uniformly mod 2 over 1000 calls', () => {
    let zeros = 0;
    for (let i = 0; i < 1000; i++) {
      if (fnv1a32(`seed-${i}`) % 2 === 0) zeros++;
    }
    expect(zeros).toBeGreaterThan(400);
    expect(zeros).toBeLessThan(600);
  });
});
