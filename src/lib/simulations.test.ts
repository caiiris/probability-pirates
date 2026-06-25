import { describe, it, expect } from 'vitest';
import {
  flipIsHeads,
  rollIsSix,
  randomBirthdays,
  hasSharedBirthday,
  montyHallWins,
  setupMontyGame,
  switchTarget,
  mulberry32,
  cumulativeSuccesses,
} from './simulations';

/** Deterministic rng that cycles through a fixed list of values in [0,1). */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('flipIsHeads', () => {
  it('is heads below 0.5, tails at/above', () => {
    expect(flipIsHeads(() => 0.49)).toBe(true);
    expect(flipIsHeads(() => 0.5)).toBe(false);
  });
});

describe('rollIsSix', () => {
  it('detects a six only at the top sixth of the range', () => {
    expect(rollIsSix(() => 0.99)).toBe(true);
    expect(rollIsSix(() => 0.0)).toBe(false);
    expect(rollIsSix(() => 0.5)).toBe(false);
  });
});

describe('birthdays', () => {
  it('produces a room of the requested size', () => {
    expect(randomBirthdays(23).length).toBe(23);
  });
  it('flags an obvious collision and a clean room', () => {
    expect(hasSharedBirthday([10, 200, 10])).toBe(true);
    expect(hasSharedBirthday([1, 2, 3, 4])).toBe(false);
  });
  it('converges near the textbook 50.7% for 23 people over many rooms', () => {
    let matches = 0;
    const runs = 4000;
    for (let i = 0; i < runs; i++) {
      if (hasSharedBirthday(randomBirthdays(23))) matches++;
    }
    expect(matches / runs).toBeGreaterThan(0.43);
    expect(matches / runs).toBeLessThan(0.58);
  });
});

describe('montyHallWins', () => {
  it('switch wins iff the first pick missed the car', () => {
    // rng order inside: car, then pick. car=0, pick=1 -> miss -> switch wins.
    expect(montyHallWins('switch', seq([0.0, 0.4]))).toBe(true);
    // car=0, pick=0 -> hit -> switch loses, stay wins.
    expect(montyHallWins('switch', seq([0.0, 0.0]))).toBe(false);
    expect(montyHallWins('stay', seq([0.0, 0.0]))).toBe(true);
  });
  it('switching wins about 2/3 of the time over many games', () => {
    let wins = 0;
    const runs = 6000;
    for (let i = 0; i < runs; i++) {
      if (montyHallWins('switch')) wins++;
    }
    expect(wins / runs).toBeGreaterThan(0.6);
    expect(wins / runs).toBeLessThan(0.73);
  });
});

describe('mulberry32 (seeded PRNG)', () => {
  it('produces the same sequence for the same seed (deterministic)', () => {
    const a = mulberry32(0xc0de);
    const b = mulberry32(0xc0de);
    for (let i = 0; i < 50; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('cumulativeSuccesses', () => {
  it('starts at 0 and grows monotonically by 0 or 1', () => {
    const result = cumulativeSuccesses('coin', 500, 1);
    expect(result).toHaveLength(501);
    expect(result[0]).toBe(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i] - result[i - 1]).toBeGreaterThanOrEqual(0);
      expect(result[i] - result[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic in seed (same seed → same prefix counts)', () => {
    const a = cumulativeSuccesses('coin', 200, 42);
    const b = cumulativeSuccesses('coin', 200, 42);
    expect(a).toEqual(b);
  });

  it("converges to ~50% on coin and ~16.7% on die-six over 10,000 trials", () => {
    const coin = cumulativeSuccesses('coin', 10_000, 0xc0de);
    const dieSix = cumulativeSuccesses('die-six', 10_000, 0xc0de);
    const coinShare = coin[10_000] / 10_000;
    const dieShare = dieSix[10_000] / 10_000;
    // Wide envelopes — the test only catches "wildly wrong," not noise.
    expect(coinShare).toBeGreaterThan(0.45);
    expect(coinShare).toBeLessThan(0.55);
    expect(dieShare).toBeGreaterThan(0.13);
    expect(dieShare).toBeLessThan(0.20);
  });
});

describe('setupMontyGame / switchTarget', () => {
  it('never reveals the pick or the car, and switch target is the third door', () => {
    for (let i = 0; i < 200; i++) {
      const pick = i % 3;
      const game = setupMontyGame(pick);
      expect(game.revealed).not.toBe(game.pick);
      expect(game.revealed).not.toBe(game.car);
      const target = switchTarget(game);
      expect(target).not.toBe(game.pick);
      expect(target).not.toBe(game.revealed);
    }
  });
});
