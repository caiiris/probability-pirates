/**
 * XP → level/rank progression. Pure, client-derived from the `xp` total we
 * already store — no schema or backend change. This gives XP a payoff beyond the
 * leaderboard: you climb levels and earn themed pirate ranks.
 *
 * Curve: advancing from level L to L+1 costs `50 + 50*L` XP, so the first level
 * comes quickly (~one lesson) and later levels take progressively longer.
 *
 * Designed arc (≈40 lessons planned, ~110 XP each ≈ 4,400 XP from the path):
 * finishing the whole course lands a learner around level 13 (First Mate). The
 * higher ranks (Quartermaster L16, Captain L21, Commodore L28) are then reachable
 * via daily-capped practice XP (see lib/practiceXp.ts) — so XP keeps paying off
 * between content drops without practice replacing the core path.
 */
import { ACCENTS, type AccentName, type AccentStop } from './theme';

/** XP needed to advance from `level` to `level + 1`. */
function stepCost(level: number): number {
  return 50 + 50 * level;
}

/** Cumulative XP required to *reach* `level` (level 1 sits at 0 XP). */
function xpToReachLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += stepCost(l);
  return total;
}

export type Rank = { name: string; tone: AccentName };

/**
 * Ranks unlock at increasing levels. Cool → warm as you climb, ending on gold.
 * Extend freely as more content (and thus more reachable XP) ships.
 */
const RANK_TABLE: { minLevel: number; rank: Rank }[] = [
  { minLevel: 1, rank: { name: 'Stowaway', tone: 'blue' } },
  { minLevel: 2, rank: { name: 'Deckhand', tone: 'teal' } },
  { minLevel: 4, rank: { name: 'Sailor', tone: 'green' } },
  { minLevel: 6, rank: { name: 'Boatswain', tone: 'violet' } },
  { minLevel: 9, rank: { name: 'Navigator', tone: 'coral' } },
  { minLevel: 12, rank: { name: 'First Mate', tone: 'amber' } },
  { minLevel: 16, rank: { name: 'Quartermaster', tone: 'violet' } },
  { minLevel: 21, rank: { name: 'Captain', tone: 'amber' } },
  { minLevel: 28, rank: { name: 'Commodore', tone: 'coral' } },
];

function rankForLevel(level: number): Rank {
  let current = RANK_TABLE[0].rank;
  for (const entry of RANK_TABLE) {
    if (level >= entry.minLevel) current = entry.rank;
    else break;
  }
  return current;
}

export type LevelInfo = {
  level: number;
  rank: Rank;
  /** Resolved accent stop for the rank (badge fill / depth / progress). */
  tone: AccentStop;
  totalXp: number;
  /** XP earned past the current level's starting threshold. */
  xpIntoLevel: number;
  /** Total XP span of the current level. */
  xpForLevel: number;
  /** XP remaining until the next level. */
  xpToNext: number;
  /** 0..1 progress through the current level. */
  progress: number;
  levelStartXp: number;
  nextLevelXp: number;
};

const MAX_LEVEL = 999;

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp || 0));

  let level = 1;
  while (level < MAX_LEVEL && xp >= xpToReachLevel(level + 1)) level++;

  const levelStartXp = xpToReachLevel(level);
  const nextLevelXp = xpToReachLevel(level + 1);
  const xpForLevel = nextLevelXp - levelStartXp;
  const xpIntoLevel = xp - levelStartXp;
  const xpToNext = Math.max(0, nextLevelXp - xp);
  const progress = xpForLevel > 0 ? Math.min(1, xpIntoLevel / xpForLevel) : 1;

  return {
    level,
    rank: rankForLevel(level),
    tone: ACCENTS[rankForLevel(level).tone],
    totalXp: xp,
    xpIntoLevel,
    xpForLevel,
    xpToNext,
    progress,
    levelStartXp,
    nextLevelXp,
  };
}
