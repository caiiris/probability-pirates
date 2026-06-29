import { describe, expect, it } from 'vitest';
import {
  WAGER_EPOCH_MS,
  WAGER_WINDOW_DAYS,
  currentWindowIndex,
  featuredWager,
  msUntilNextWindow,
  pastFeaturedWagers,
  upcomingWagers,
} from './wagerRotation';
import type { Wager } from '@/features/wager/types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function makeBank(n: number): Wager[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w-${String(i + 1).padStart(2, '0')}`,
    sequence: i + 1,
    openAt: WAGER_EPOCH_MS,
    prompt: `prompt ${i + 1}`,
    unit: 'percent',
    tags: [],
    flavor: 'frequency',
    scoring: 'log',
    status: 'live',
    createdBy: 'system',
  }));
}

describe('currentWindowIndex', () => {
  it('clamps to 0 before the epoch', () => {
    expect(currentWindowIndex(WAGER_EPOCH_MS - 1)).toBe(0);
    expect(currentWindowIndex(WAGER_EPOCH_MS - 10_000_000)).toBe(0);
  });

  it('returns 0 at the epoch itself', () => {
    expect(currentWindowIndex(WAGER_EPOCH_MS)).toBe(0);
  });

  it('returns 0 just before the first rollover', () => {
    expect(
      currentWindowIndex(WAGER_EPOCH_MS + WAGER_WINDOW_DAYS * ONE_DAY_MS - 1),
    ).toBe(0);
  });

  it('rolls over to 1 exactly at the first rollover', () => {
    expect(currentWindowIndex(WAGER_EPOCH_MS + WAGER_WINDOW_DAYS * ONE_DAY_MS)).toBe(1);
  });

  it('advances one per window', () => {
    for (let k = 0; k < 20; k++) {
      expect(
        currentWindowIndex(WAGER_EPOCH_MS + k * WAGER_WINDOW_DAYS * ONE_DAY_MS),
      ).toBe(k);
    }
  });
});

describe('featuredWager', () => {
  it('returns null when the bank is empty', () => {
    expect(featuredWager([], WAGER_EPOCH_MS)).toBeNull();
  });

  it('returns SOME wager for a non-empty bank at the epoch', () => {
    const bank = makeBank(5);
    const f = featuredWager(bank, WAGER_EPOCH_MS);
    expect(f).not.toBeNull();
    expect(bank.find((w) => w.id === f!.id)).toBeDefined();
  });

  it('is deterministic for the same bank + nowMs', () => {
    const bank = makeBank(11);
    const a = featuredWager(bank, WAGER_EPOCH_MS + 5 * WAGER_WINDOW_DAYS * ONE_DAY_MS);
    const b = featuredWager(bank, WAGER_EPOCH_MS + 5 * WAGER_WINDOW_DAYS * ONE_DAY_MS);
    expect(a!.id).toBe(b!.id);
  });

  it('is invariant to the input order of the bank', () => {
    const bank = makeBank(11);
    const shuffled = [...bank].reverse();
    const t = WAGER_EPOCH_MS + 4 * WAGER_WINDOW_DAYS * ONE_DAY_MS;
    expect(featuredWager(bank, t)!.id).toBe(featuredWager(shuffled, t)!.id);
  });

  it('advances to a new wager at each window rollover (mostly)', () => {
    const bank = makeBank(11);
    const ids: string[] = [];
    for (let k = 0; k < 11; k++) {
      ids.push(featuredWager(bank, WAGER_EPOCH_MS + k * WAGER_WINDOW_DAYS * ONE_DAY_MS)!.id);
    }
    // All 11 distinct — every wager features exactly once per cycle.
    expect(new Set(ids).size).toBe(11);
  });

  it('cycles back to the first wager after one full pass', () => {
    const bank = makeBank(11);
    const first = featuredWager(bank, WAGER_EPOCH_MS)!.id;
    const after = featuredWager(bank, WAGER_EPOCH_MS + 11 * WAGER_WINDOW_DAYS * ONE_DAY_MS)!.id;
    expect(first).toBe(after);
  });
});

describe('pastFeaturedWagers', () => {
  it('is empty at window 0', () => {
    expect(pastFeaturedWagers(makeBank(11), WAGER_EPOCH_MS)).toEqual([]);
  });

  it('contains exactly one wager at window 1, and it is the previous featured one', () => {
    const bank = makeBank(11);
    const prev = featuredWager(bank, WAGER_EPOCH_MS)!.id;
    const past = pastFeaturedWagers(bank, WAGER_EPOCH_MS + WAGER_WINDOW_DAYS * ONE_DAY_MS);
    expect(past).toHaveLength(1);
    expect(past[0].id).toBe(prev);
  });

  it('does NOT contain the currently featured wager', () => {
    const bank = makeBank(11);
    const t = WAGER_EPOCH_MS + 4 * WAGER_WINDOW_DAYS * ONE_DAY_MS;
    const f = featuredWager(bank, t)!.id;
    const past = pastFeaturedWagers(bank, t);
    expect(past.map((w) => w.id)).not.toContain(f);
  });

  it('caps at bank.length - 1 after one full cycle', () => {
    const bank = makeBank(5);
    const t = WAGER_EPOCH_MS + 20 * WAGER_WINDOW_DAYS * ONE_DAY_MS;
    expect(pastFeaturedWagers(bank, t)).toHaveLength(4);
  });

  it('is ordered newest-first', () => {
    const bank = makeBank(11);
    const t = WAGER_EPOCH_MS + 3 * WAGER_WINDOW_DAYS * ONE_DAY_MS;
    const past = pastFeaturedWagers(bank, t);
    expect(past).toHaveLength(3);
    // past[0] = window 2's featured; past[2] = window 0's featured.
    expect(past[0].id).toBe(featuredWager(bank, t - WAGER_WINDOW_DAYS * ONE_DAY_MS)!.id);
    expect(past[2].id).toBe(featuredWager(bank, WAGER_EPOCH_MS)!.id);
  });
});

describe('upcomingWagers', () => {
  it('returns bank.length - 1 wagers at window 0', () => {
    const bank = makeBank(11);
    const upcoming = upcomingWagers(bank, WAGER_EPOCH_MS);
    expect(upcoming).toHaveLength(10);
  });

  it('does NOT include the currently featured wager', () => {
    const bank = makeBank(11);
    const t = WAGER_EPOCH_MS + 3 * WAGER_WINDOW_DAYS * ONE_DAY_MS;
    const f = featuredWager(bank, t)!.id;
    expect(upcomingWagers(bank, t).map((w) => w.id)).not.toContain(f);
  });

  it('is empty once every bank entry has been featured', () => {
    const bank = makeBank(5);
    const t = WAGER_EPOCH_MS + 4 * WAGER_WINDOW_DAYS * ONE_DAY_MS;
    expect(upcomingWagers(bank, t)).toEqual([]);
  });

  it('past + current + upcoming partitions the bank (no overlap, no gaps)', () => {
    const bank = makeBank(11);
    for (let k = 0; k < 11; k++) {
      const t = WAGER_EPOCH_MS + k * WAGER_WINDOW_DAYS * ONE_DAY_MS;
      const past = pastFeaturedWagers(bank, t).map((w) => w.id);
      const cur = [featuredWager(bank, t)!.id];
      const next = upcomingWagers(bank, t).map((w) => w.id);
      const union = new Set([...past, ...cur, ...next]);
      expect(union.size).toBe(11);
    }
  });
});

describe('msUntilNextWindow', () => {
  it('returns the full window duration at the epoch', () => {
    expect(msUntilNextWindow(WAGER_EPOCH_MS)).toBe(WAGER_WINDOW_DAYS * ONE_DAY_MS);
  });

  it('returns 1 ms when 1 ms remains in the current window', () => {
    expect(
      msUntilNextWindow(WAGER_EPOCH_MS + WAGER_WINDOW_DAYS * ONE_DAY_MS - 1),
    ).toBe(1);
  });

  it('flips to a full window duration at the rollover boundary', () => {
    expect(
      msUntilNextWindow(WAGER_EPOCH_MS + WAGER_WINDOW_DAYS * ONE_DAY_MS),
    ).toBe(WAGER_WINDOW_DAYS * ONE_DAY_MS);
  });

  it('returns the lead time until the epoch when called before it', () => {
    expect(msUntilNextWindow(WAGER_EPOCH_MS - ONE_DAY_MS)).toBe(ONE_DAY_MS);
  });
});
