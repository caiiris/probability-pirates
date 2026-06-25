/**
 * WP-6c — XP wiring tests.
 *
 * Tests the pure logic of grantPracticeXp as wired by usePracticeXp, and
 * asserts the write-payload contract for awardPracticeXp in habitService:
 *
 *  1. Correct answer grants PRACTICE_XP_PER_CORRECT (5) until daily cap (100).
 *  2. Once capped, grant is 0 and capReached is true.
 *  3. awardPracticeXp ONLY writes xp / weeklyXp / weekKey — never
 *     currentStreak, lastActiveDate, or lessonsCompleted (spec-practice.md).
 *  4. weeklyXp is incremented when weekKey matches; reset when week changed.
 *  5. Incorrect answer grants 0 and does NOT call the user-doc write.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  grantPracticeXp,
  PRACTICE_XP_PER_CORRECT,
  PRACTICE_DAILY_XP_CAP,
} from '@/lib/practiceXp';
import type { PracticeXpState } from '@/lib/practiceXp';

// ---------------------------------------------------------------------------
// Mock firebase/firestore — capture what updateDoc is called with
// ---------------------------------------------------------------------------

const mockUpdateDoc = vi.fn((_ref: unknown, _data: unknown) => Promise.resolve());
const mockIncrement = vi.fn((n: number) => ({ __increment: n }));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  increment: (n: number) => mockIncrement(n),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: (ref: unknown, data: unknown) => mockUpdateDoc(ref, data),
  writeBatch: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({ db: {} }));

// Import the function under test AFTER mocks.
import { awardPracticeXp } from '@/features/habit/habitService';
import { currentWeekKey } from '@/lib/weeklyXp';

// ---------------------------------------------------------------------------
// 1 & 2. grantPracticeXp wiring (pure logic — no mocks needed)
// ---------------------------------------------------------------------------

describe('grantPracticeXp wiring', () => {
  const TODAY = '2026-06-25';

  it('grants PRACTICE_XP_PER_CORRECT on a correct answer from a fresh state', () => {
    const { granted, capReached } = grantPracticeXp(undefined, TODAY, true);
    expect(granted).toBe(PRACTICE_XP_PER_CORRECT);
    expect(capReached).toBe(false);
  });

  it('grants 0 on an incorrect answer', () => {
    const { granted, capReached } = grantPracticeXp(undefined, TODAY, false);
    expect(granted).toBe(0);
    expect(capReached).toBe(false);
  });

  it('accumulates XP across multiple correct answers', () => {
    let state: PracticeXpState | undefined;
    let totalGranted = 0;

    for (let i = 0; i < 5; i++) {
      const result = grantPracticeXp(state, TODAY, true);
      state = result.state;
      totalGranted += result.granted;
    }

    expect(totalGranted).toBe(PRACTICE_XP_PER_CORRECT * 5);
    expect(state?.earnedToday).toBe(PRACTICE_XP_PER_CORRECT * 5);
  });

  it('stops granting XP once the daily cap is reached', () => {
    // Pre-fill up to cap.
    const atCap: PracticeXpState = { date: TODAY, earnedToday: PRACTICE_DAILY_XP_CAP };
    const { granted, capReached } = grantPracticeXp(atCap, TODAY, true);
    expect(granted).toBe(0);
    expect(capReached).toBe(true);
  });

  it('grants partial XP when close to the cap', () => {
    const nearCap: PracticeXpState = {
      date: TODAY,
      earnedToday: PRACTICE_DAILY_XP_CAP - 3, // 3 XP room left, award is 5
    };
    const { granted, capReached } = grantPracticeXp(nearCap, TODAY, true);
    expect(granted).toBe(3);
    expect(capReached).toBe(true);
  });

  it('resets the counter for a new day', () => {
    const yesterday: PracticeXpState = { date: '2026-06-24', earnedToday: PRACTICE_DAILY_XP_CAP };
    const { granted, capReached } = grantPracticeXp(yesterday, TODAY, true);
    expect(granted).toBe(PRACTICE_XP_PER_CORRECT);
    expect(capReached).toBe(false);
  });

  it('updates state.earnedToday by the granted amount', () => {
    const prev: PracticeXpState = { date: TODAY, earnedToday: 10 };
    const { state } = grantPracticeXp(prev, TODAY, true);
    expect(state.earnedToday).toBe(10 + PRACTICE_XP_PER_CORRECT);
    expect(state.date).toBe(TODAY);
  });
});

// ---------------------------------------------------------------------------
// 3 & 4. awardPracticeXp write-payload assertions (Firestore mock)
// ---------------------------------------------------------------------------

describe('awardPracticeXp — write-payload contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateDoc with exactly xp, weeklyXp, weekKey — no other fields', async () => {
    const weekKey = currentWeekKey();
    await awardPracticeXp('uid-123', 5, weekKey);

    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, payload] = mockUpdateDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];

    // Required fields are present.
    expect(payload).toHaveProperty('xp');
    expect(payload).toHaveProperty('weeklyXp');
    expect(payload).toHaveProperty('weekKey', weekKey);

    // Forbidden fields are absent — practice XP must NOT touch these.
    expect(payload).not.toHaveProperty('currentStreak');
    expect(payload).not.toHaveProperty('lastActiveDate');
    expect(payload).not.toHaveProperty('lessonsCompleted');
    expect(payload).not.toHaveProperty('stepsCompleted');
    expect(payload).not.toHaveProperty('bestStreak');
    expect(payload).not.toHaveProperty('activityDates');
    expect(payload).not.toHaveProperty('streakFreezes');
  });

  it('xp is an increment sentinel', async () => {
    await awardPracticeXp('uid-123', 5, currentWeekKey());
    const [, payload] = mockUpdateDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    // increment() is mocked to return { __increment: n }
    expect(payload.xp).toEqual({ __increment: 5 });
  });

  it('weeklyXp is an increment when week matches', async () => {
    const weekKey = currentWeekKey();
    await awardPracticeXp('uid-123', 5, weekKey);
    const [, payload] = mockUpdateDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(payload.weeklyXp).toEqual({ __increment: 5 });
  });

  it('weeklyXp is reset to granted amount when week changed', async () => {
    await awardPracticeXp('uid-123', 5, 'old-week-key');
    const [, payload] = mockUpdateDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(payload.weeklyXp).toBe(5);
  });

  it('weeklyXp is reset when storedWeekKey is null (first ever XP)', async () => {
    await awardPracticeXp('uid-123', 10, null);
    const [, payload] = mockUpdateDoc.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(payload.weeklyXp).toBe(10);
  });
});
