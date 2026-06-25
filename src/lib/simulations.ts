/**
 * Pure trial generators for the lesson simulations. No React, no DOM — so they
 * are unit-testable and the renderers stay thin. Each takes an optional `rng`
 * (defaults to `Math.random`) so tests can inject a deterministic sequence.
 */

export type Rng = () => number;

/** One fair coin flip. True = heads. */
export function flipIsHeads(rng: Rng = Math.random): boolean {
  return rng() < 0.5;
}

/** One fair d6 roll. True = the face is a six. */
export function rollIsSix(rng: Rng = Math.random): boolean {
  return Math.floor(rng() * 6) + 1 === 6;
}

/** A room of `roomSize` people, each with a random birthday in 0..364. */
export function randomBirthdays(roomSize: number, rng: Rng = Math.random): number[] {
  const days: number[] = [];
  for (let i = 0; i < roomSize; i++) {
    days.push(Math.floor(rng() * 365));
  }
  return days;
}

/** True if any two people in the room share a birthday. */
export function hasSharedBirthday(birthdays: readonly number[]): boolean {
  const seen = new Set<number>();
  for (const day of birthdays) {
    if (seen.has(day)) return true;
    seen.add(day);
  }
  return false;
}

/**
 * `mulberry32` — a tiny, deterministic PRNG. Given the same seed, returns the
 * same sequence of [0, 1) values forever. Used by the `scrub-trials`
 * interaction so the H/T sequence at any N is reproducible across renders,
 * scrubs, and resumes (the learner can drag back and forth without the
 * visualization re-rolling and feeling jittery).
 */
export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pre-compute, for a binary-trial scenario, the cumulative success count at
 * every prefix from 0 to `maxN`. Returns an array of length `maxN + 1` where
 * `result[N]` = number of successes among the first N trials.
 *
 * Cheap (one pass, microseconds for maxN = 10,000), and lets the
 * `scrub-trials` UI compute "successes at any N" with a single array index
 * lookup — no recomputation on every drag. Deterministic in `seed`.
 */
export function cumulativeSuccesses(
  scenario: 'coin' | 'die-six',
  maxN: number,
  seed: number,
): number[] {
  const rng = mulberry32(seed);
  const out = new Array<number>(maxN + 1);
  out[0] = 0;
  for (let i = 1; i <= maxN; i++) {
    let success = false;
    if (scenario === 'coin') {
      success = flipIsHeads(rng);
    } else {
      success = rollIsSix(rng);
    }
    out[i] = out[i - 1] + (success ? 1 : 0);
  }
  return out;
}

export type MontyStrategy = 'stay' | 'switch';

/**
 * One Monty Hall game reduced to its outcome. Switching wins exactly when the
 * first pick missed the car (probability 2/3); staying wins when it hit (1/3).
 */
export function montyHallWins(strategy: MontyStrategy, rng: Rng = Math.random): boolean {
  const car = Math.floor(rng() * 3);
  const pick = Math.floor(rng() * 3);
  return strategy === 'switch' ? pick !== car : pick === car;
}

export type MontyGame = {
  /** Door hiding the car (0..2). */
  car: number;
  /** Door the player picked first (0..2). */
  pick: number;
  /** Goat door the host opened (0..2), never the pick and never the car. */
  revealed: number;
};

/** Sets up one interactive game for a given first pick: places the car and opens a goat. */
export function setupMontyGame(pick: number, rng: Rng = Math.random): MontyGame {
  const car = Math.floor(rng() * 3);
  const goatDoors = [0, 1, 2].filter((d) => d !== pick && d !== car);
  const revealed = goatDoors[Math.floor(rng() * goatDoors.length)];
  return { car, pick, revealed };
}

/** The door a switcher would move to: the one that is neither the pick nor the revealed goat. */
export function switchTarget(game: MontyGame): number {
  return [0, 1, 2].find((d) => d !== game.pick && d !== game.revealed) as number;
}
