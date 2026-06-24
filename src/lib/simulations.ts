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
