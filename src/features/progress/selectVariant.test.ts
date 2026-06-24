import { describe, it, expect } from 'vitest';
import { selectVariantIndex } from './selectVariant';

describe('selectVariantIndex', () => {
  it('is deterministic — same inputs produce same output', () => {
    const a = selectVariantIndex('user1', 'lesson1', 'attempt1', 'slot1', 3);
    const b = selectVariantIndex('user1', 'lesson1', 'attempt1', 'slot1', 3);
    expect(a).toBe(b);
  });

  it('returns value in range [0, variantCount)', () => {
    for (let i = 0; i < 50; i++) {
      const idx = selectVariantIndex('u', 'l', `a${i}`, 's', 2);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(2);
    }
  });

  it('different attemptId produces different results (with high probability)', () => {
    const results = new Set<number>();
    for (let i = 0; i < 20; i++) {
      results.add(selectVariantIndex('user1', 'lesson1', `attempt-${i}`, 'slot1', 2));
    }
    // With 20 attempts and 2 variants, we should see both
    expect(results.size).toBe(2);
  });

  it('distributes roughly uniformly mod 2 across 1000 calls', () => {
    let zeros = 0;
    for (let i = 0; i < 1000; i++) {
      if (selectVariantIndex('u', 'l', `a${i}`, 's', 2) === 0) zeros++;
    }
    expect(zeros).toBeGreaterThan(400);
    expect(zeros).toBeLessThan(600);
  });
});
