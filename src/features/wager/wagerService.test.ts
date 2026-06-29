/**
 * WP-CW-D service-layer tests.
 *
 * Test scope:
 *   - wagerXpForScore (via import — pure, no mocks)
 *   - computeUpdatedStats (pure helper, exported for testability)
 *   - submitWager — two-step flow assertions (step 1: setDoc placeholder;
 *     step 4: transaction score-patch + stats + XP) with mocked Firebase
 *   - ensureSubmissionScored — patches placeholder, no-op on real submission
 *   - Hook integration — useUserSubmission, useWagerAnswer, useWagerSubmissions,
 *     useWagerStats tested via renderHook + controlled onSnapshot callbacks
 *   - useUserSubmission self-heal — verifies ensureSubmissionScored fires
 *     when a placeholder submission is observed (with scoring provided)
 *
 * NOTE on test scope: full emulator-backed integration tests live in
 * firebase/rules-tests/wagers.test.ts (WP-CW-C). The tests here assert
 * client-side logic, write-payload shape, and hook state-machine correctness.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { WagerStats } from './types';

// ---------------------------------------------------------------------------
// Firebase mocks — must be set up before any import from wagerService
// ---------------------------------------------------------------------------

type SnapCallback = (snap: {
  exists: () => boolean;
  id: string;
  data: () => Record<string, unknown>;
  docs: Array<{ id: string; data: () => Record<string, unknown> }>;
}) => void;

const snapshotCallbacks = new Map<string, SnapCallback>();

const mockRunTransaction = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ __serverTimestamp: true }));
const mockIncrement = vi.fn((n: number) => ({ __increment: n }));
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();

// Track the paths of active onSnapshot subscriptions for the gating tests.
const activeSubscriptions = new Set<string>();

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => ({ _path: parts.join('/'), id: parts[parts.length - 1] }),
  collection: (_db: unknown, ...parts: string[]) => ({ _path: parts.join('/') }),
  query: (ref: { _path: string }) => ref,
  where: () => ({}),
  orderBy: () => ({}),
  onSnapshot: (
    ref: { _path: string },
    successCb: SnapCallback,
    _errorCb?: (err: unknown) => void,
  ) => {
    snapshotCallbacks.set(ref._path, successCb);
    activeSubscriptions.add(ref._path);
    return () => {
      snapshotCallbacks.delete(ref._path);
      activeSubscriptions.delete(ref._path);
    };
  },
  runTransaction: (_db: unknown, fn: (txn: unknown) => Promise<void>) =>
    mockRunTransaction(_db, fn),
  serverTimestamp: () => mockServerTimestamp(),
  increment: (n: number) => mockIncrement(n),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

vi.mock('@/lib/firebase', () => ({ db: {} }));

import { currentWeekKey } from '@/lib/weeklyXp';

import { computeUpdatedStats, ensureSubmissionScored, submitWager } from './wagerService';
import {
  useUserSubmission,
  useWagerAnswer,
  useWagerSubmissions,
  useWagerStats,
} from './wagerService';
import { wagerXpForScore } from './wagerXp';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fireDoc(path: string, data: Record<string, unknown> | null): void {
  const cb = snapshotCallbacks.get(path);
  if (!cb) return;
  const exists = data !== null;
  cb({
    exists: () => exists,
    id: path.split('/').pop() ?? '',
    data: () => data ?? {},
    docs: [],
  });
}

function fireCollection(path: string, docs: Array<Record<string, unknown>>): void {
  const cb = snapshotCallbacks.get(path);
  if (!cb) return;
  cb({
    exists: () => docs.length > 0,
    id: path.split('/').pop() ?? '',
    data: () => ({}),
    docs: docs.map((d) => ({ id: String(d.uid ?? ''), data: () => d })),
  });
}

const WAGER_ID = 'test-wager-2026';
const UID = 'user-alice';

const ANSWER_DOC_DATA = {
  trueAnswer: 50.7,
  source: 'Standard calculation',
  revealHeadline: 'Birthday paradox',
  revealExplanation: 'Pairs grow combinatorially.',
};

// ---------------------------------------------------------------------------
// wagerXpForScore — pure, table-driven
// ---------------------------------------------------------------------------

describe('wagerXpForScore', () => {
  it.each([
    [0, 5],
    [49, 5],
    [50, 10],
    [79, 10],
    [80, 20],
    [100, 20],
  ])('score %i → %i XP', (score, expected) => {
    expect(wagerXpForScore(score)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// computeUpdatedStats — pure helper
// ---------------------------------------------------------------------------

describe('computeUpdatedStats', () => {
  it('creates correct stats for a first wager', () => {
    const stats = computeUpdatedStats(null, WAGER_ID, 80, 0.2);
    expect(stats.totalSubmitted).toBe(1);
    expect(stats.averageScore).toBe(80);
    expect(stats.averageLogError).toBe(0.2);
    expect(stats.lastWagerId).toBe(WAGER_ID);
    expect(stats.last10Scores).toEqual([80]);
  });

  it('computes running averages correctly', () => {
    const old: WagerStats = {
      totalSubmitted: 2,
      averageScore: 70,
      averageLogError: 0.3,
      lastWagerId: 'prev',
      last10Scores: [60, 80],
    };
    const stats = computeUpdatedStats(old, WAGER_ID, 90, 0.1);
    expect(stats.totalSubmitted).toBe(3);
    expect(stats.averageScore).toBeCloseTo((70 * 2 + 90) / 3);
    expect(stats.averageLogError).toBeCloseTo((0.3 * 2 + 0.1) / 3);
  });

  it('last10Scores keeps only the last 10 entries', () => {
    const initial: WagerStats = {
      totalSubmitted: 10,
      averageScore: 50,
      averageLogError: 0.5,
      lastWagerId: 'prev',
      last10Scores: [10, 20, 30, 40, 50, 60, 70, 80, 90, 55],
    };
    const stats = computeUpdatedStats(initial, WAGER_ID, 99, 0.01);
    expect(stats.last10Scores).toHaveLength(10);
    expect(stats.last10Scores[9]).toBe(99);
    expect(stats.last10Scores[0]).toBe(20);
  });

  it('handles INFINITY_SENTINEL as effectiveLogError', () => {
    const stats = computeUpdatedStats(null, WAGER_ID, 0, 9999);
    expect(stats.averageLogError).toBe(9999);
    expect(stats.averageScore).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// submitWager — two-step flow assertions (mocked Firebase)
// ---------------------------------------------------------------------------

describe('submitWager', () => {
  let txnSets: Array<{ path: string; data: Record<string, unknown> }> = [];
  let txnUpdates: Array<{ path: string; data: Record<string, unknown> }> = [];
  let existingSubmission: boolean;

  const weekKey = currentWeekKey();
  const userDocData = { weekKey, xp: 0, weeklyXp: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
    txnSets = [];
    txnUpdates = [];
    existingSubmission = false;

    // getDoc: submission path (duplicate guard) + answer path (step 2)
    mockGetDoc.mockImplementation(async (ref: { _path: string }) => {
      if (ref._path === `wagers/${WAGER_ID}/submissions/${UID}`) {
        return { exists: () => existingSubmission, data: () => ({}) };
      }
      if (ref._path === `wagers/${WAGER_ID}/private/answer`) {
        return { exists: () => true, data: () => ANSWER_DOC_DATA };
      }
      return { exists: () => false, data: () => ({}) };
    });

    // setDoc: step 1 placeholder create
    mockSetDoc.mockResolvedValue(undefined);

    // runTransaction: step 4 score-patch + stats + XP
    mockRunTransaction.mockImplementation(
      async (_db: unknown, fn: (txn: unknown) => Promise<void>) => {
        const txn = {
          get: vi.fn(async (ref: { _path: string }) => {
            if (ref._path === `users/${UID}/wagerStats/summary`) {
              return { exists: () => false, data: () => ({}) };
            }
            if (ref._path === `users/${UID}`) {
              return { exists: () => true, data: () => userDocData };
            }
            return { exists: () => false, data: () => ({}) };
          }),
          set: vi.fn((ref: { _path: string }, data: Record<string, unknown>) => {
            txnSets.push({ path: ref._path, data });
          }),
          update: vi.fn((ref: { _path: string }, data: Record<string, unknown>) => {
            txnUpdates.push({ path: ref._path, data });
          }),
        };
        await fn(txn);
      },
    );
  });

  afterEach(() => {
    snapshotCallbacks.clear();
    activeSubscriptions.clear();
  });

  it('step 1 writes a placeholder (score=0, logError=0) via setDoc', async () => {
    await submitWager({ uid: UID, wagerId: WAGER_ID, guess: 50.7, scoring: 'log' });

    expect(mockSetDoc).toHaveBeenCalledOnce();
    const placeholderData = mockSetDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(placeholderData.uid).toBe(UID);
    expect(placeholderData.guess).toBe(50.7);
    expect(placeholderData.score).toBe(0);
    expect(placeholderData.logError).toBe(0);
    expect(placeholderData.submittedAt).toEqual({ __serverTimestamp: true });
  });

  it('placeholder has exactly the C-W1 keys (no extras)', async () => {
    await submitWager({ uid: UID, wagerId: WAGER_ID, guess: 10, scoring: 'log' });
    const placeholderData = mockSetDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(placeholderData).sort()).toEqual(
      ['guess', 'logError', 'score', 'submittedAt', 'uid'].sort(),
    );
  });

  it('step 4 patches submission with the real computed logError and score', async () => {
    const result = await submitWager({ uid: UID, wagerId: WAGER_ID, guess: 50.7, scoring: 'log' });

    // Exact match → score 100, logError ≈ 0
    expect(result.score).toBe(100);
    expect(result.logError).toBeCloseTo(0, 5);

    const submissionUpdate = txnUpdates.find(
      (u) => u.path === `wagers/${WAGER_ID}/submissions/${UID}`,
    );
    expect(submissionUpdate).toBeDefined();
    expect(submissionUpdate!.data.score).toBe(100);
    expect(submissionUpdate!.data.logError).toBeCloseTo(0, 5);
    // Placeholder fields must NOT appear in the update (partial update only).
    expect(submissionUpdate!.data).not.toHaveProperty('uid');
    expect(submissionUpdate!.data).not.toHaveProperty('guess');
    expect(submissionUpdate!.data).not.toHaveProperty('submittedAt');
  });

  it('resolves with the FINAL WagerSubmission (real score, not placeholder)', async () => {
    const result = await submitWager({ uid: UID, wagerId: WAGER_ID, guess: 50.7, scoring: 'log' });
    expect(result.score).toBe(100);
    expect(result.logError).toBeCloseTo(0, 5);
    expect(result.uid).toBe(UID);
    expect(result.guess).toBe(50.7);
  });

  it('writes stats summary in the step-4 transaction (not during placeholder create)', async () => {
    await submitWager({ uid: UID, wagerId: WAGER_ID, guess: 50.7, scoring: 'log' });
    const statsSet = txnSets.find((s) => s.path === `users/${UID}/wagerStats/summary`);
    expect(statsSet).toBeDefined();
    expect(statsSet!.data.totalSubmitted).toBe(1);
    expect(statsSet!.data.last10Scores).toEqual([100]);
    expect(statsSet!.data.lastWagerId).toBe(WAGER_ID);
  });

  it('grants XP to the user doc (xp / weeklyXp / weekKey only)', async () => {
    await submitWager({ uid: UID, wagerId: WAGER_ID, guess: 50.7, scoring: 'log' });
    const userUpdate = txnUpdates.find((u) => u.path === `users/${UID}`);
    expect(userUpdate).toBeDefined();
    expect(userUpdate!.data).toHaveProperty('xp');
    expect(userUpdate!.data).toHaveProperty('weeklyXp');
    expect(userUpdate!.data).toHaveProperty('weekKey');
    expect(userUpdate!.data).not.toHaveProperty('currentStreak');
    expect(userUpdate!.data).not.toHaveProperty('lessonsCompleted');
  });

  it('rejects a duplicate submission (AlreadySubmitted)', async () => {
    existingSubmission = true;
    await expect(
      submitWager({ uid: UID, wagerId: WAGER_ID, guess: 50.7, scoring: 'log' }),
    ).rejects.toMatchObject({ code: 'AlreadySubmitted' });
    // setDoc must NOT be called — duplicate is caught before the placeholder create.
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('encodes Infinity as INFINITY_SENTINEL (9999) for non-positive guess in log scoring', async () => {
    // Override answer doc — trueAnswer irrelevant since guess <= 0 short-circuits
    mockGetDoc.mockImplementation(async (ref: { _path: string }) => {
      if (ref._path === `wagers/${WAGER_ID}/submissions/${UID}`) {
        return { exists: () => false, data: () => ({}) };
      }
      if (ref._path === `wagers/${WAGER_ID}/private/answer`) {
        return { exists: () => true, data: () => ANSWER_DOC_DATA };
      }
      return { exists: () => false, data: () => ({}) };
    });

    const result = await submitWager({
      uid: UID,
      wagerId: WAGER_ID,
      guess: -1,
      scoring: 'log',
    });

    expect(result.logError).toBe(9999);
    expect(result.score).toBe(0);

    const submissionUpdate = txnUpdates.find(
      (u) => u.path === `wagers/${WAGER_ID}/submissions/${UID}`,
    );
    expect(submissionUpdate!.data.logError).toBe(9999);
    expect(Number.isFinite(submissionUpdate!.data.logError as number)).toBe(true);
  });

  it('produces score:0, logError:9999 for non-positive guess (final submission reflects real score)', async () => {
    const result = await submitWager({
      uid: UID,
      wagerId: WAGER_ID,
      guess: 0,
      scoring: 'log',
    });
    expect(result.score).toBe(0);
    expect(result.logError).toBe(9999);
  });

  it('handles abs scoring (guess of 0 is valid in abs)', async () => {
    // Override answer doc with trueAnswer: 0.5 for the abs test
    mockGetDoc.mockImplementation(async (ref: { _path: string }) => {
      if (ref._path === `wagers/${WAGER_ID}/submissions/${UID}`) {
        return { exists: () => false, data: () => ({}) };
      }
      if (ref._path === `wagers/${WAGER_ID}/private/answer`) {
        return {
          exists: () => true,
          data: () => ({
            trueAnswer: 0.5,
            source: 'test',
            revealHeadline: 'h',
            revealExplanation: 'e',
          }),
        };
      }
      return { exists: () => false, data: () => ({}) };
    });

    const result = await submitWager({
      uid: UID,
      wagerId: WAGER_ID,
      guess: 0,
      scoring: 'abs',
    });
    expect(result.logError).not.toBe(9999);
    expect(Number.isFinite(result.logError)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ensureSubmissionScored
// ---------------------------------------------------------------------------

describe('ensureSubmissionScored', () => {
  let txnSets: Array<{ path: string; data: Record<string, unknown> }> = [];
  let txnUpdates: Array<{ path: string; data: Record<string, unknown> }> = [];

  const weekKey = currentWeekKey();
  const userDocData = { weekKey, xp: 0, weeklyXp: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
    txnSets = [];
    txnUpdates = [];

    mockSetDoc.mockResolvedValue(undefined);

    mockRunTransaction.mockImplementation(
      async (_db: unknown, fn: (txn: unknown) => Promise<void>) => {
        const txn = {
          get: vi.fn(async (ref: { _path: string }) => {
            if (ref._path === `users/${UID}/wagerStats/summary`) {
              return { exists: () => false, data: () => ({}) };
            }
            if (ref._path === `users/${UID}`) {
              return { exists: () => true, data: () => userDocData };
            }
            return { exists: () => false, data: () => ({}) };
          }),
          set: vi.fn((ref: { _path: string }, data: Record<string, unknown>) => {
            txnSets.push({ path: ref._path, data });
          }),
          update: vi.fn((ref: { _path: string }, data: Record<string, unknown>) => {
            txnUpdates.push({ path: ref._path, data });
          }),
        };
        await fn(txn);
      },
    );
  });

  afterEach(() => {
    snapshotCallbacks.clear();
    activeSubscriptions.clear();
  });

  it('patches a placeholder submission (score=0, logError=0)', async () => {
    mockGetDoc.mockImplementation(async (ref: { _path: string }) => {
      if (ref._path === `wagers/${WAGER_ID}/submissions/${UID}`) {
        return {
          exists: () => true,
          data: () => ({
            uid: UID,
            guess: 50.7,
            logError: 0,
            score: 0,
            submittedAt: { toMillis: () => 1700000000000 },
          }),
        };
      }
      if (ref._path === `wagers/${WAGER_ID}/private/answer`) {
        return { exists: () => true, data: () => ANSWER_DOC_DATA };
      }
      return { exists: () => false, data: () => ({}) };
    });

    await ensureSubmissionScored({ uid: UID, wagerId: WAGER_ID, scoring: 'log' });

    expect(mockRunTransaction).toHaveBeenCalled();
    const submissionUpdate = txnUpdates.find(
      (u) => u.path === `wagers/${WAGER_ID}/submissions/${UID}`,
    );
    expect(submissionUpdate).toBeDefined();
    expect(submissionUpdate!.data.score).toBe(100);
    expect(submissionUpdate!.data.logError).toBeCloseTo(0, 5);
  });

  it('is a no-op when submission has a non-zero score (already scored)', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: UID,
        guess: 50.7,
        logError: 0.0,
        score: 100,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    });

    await ensureSubmissionScored({ uid: UID, wagerId: WAGER_ID, scoring: 'log' });

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('is a no-op when submission has non-zero logError (Infinity sentinel already patched)', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: UID,
        guess: -1,
        logError: 9999,
        score: 0,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    });

    await ensureSubmissionScored({ uid: UID, wagerId: WAGER_ID, scoring: 'log' });

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('is a no-op when submission does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });

    await ensureSubmissionScored({ uid: UID, wagerId: WAGER_ID, scoring: 'log' });

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('is a no-op when answer doc is missing', async () => {
    mockGetDoc.mockImplementation(async (ref: { _path: string }) => {
      if (ref._path === `wagers/${WAGER_ID}/submissions/${UID}`) {
        return {
          exists: () => true,
          data: () => ({
            uid: UID,
            guess: 50.7,
            logError: 0,
            score: 0,
            submittedAt: { toMillis: () => 1700000000000 },
          }),
        };
      }
      return { exists: () => false, data: () => ({}) };
    });

    await ensureSubmissionScored({ uid: UID, wagerId: WAGER_ID, scoring: 'log' });

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Hook: useUserSubmission
// ---------------------------------------------------------------------------

describe('useUserSubmission', () => {
  afterEach(() => {
    snapshotCallbacks.clear();
    activeSubscriptions.clear();
    vi.clearAllMocks();
  });

  it('returns loading:true initially', () => {
    const { result } = renderHook(() => useUserSubmission(UID, WAGER_ID));
    expect(result.current.loading).toBe(true);
    expect(result.current.submission).toBeNull();
  });

  it('returns null when uid is null (no subscription)', () => {
    const { result } = renderHook(() => useUserSubmission(null, WAGER_ID));
    expect(result.current.loading).toBe(false);
    expect(result.current.submission).toBeNull();
    expect(activeSubscriptions.has(`wagers/${WAGER_ID}/submissions/${UID}`)).toBe(false);
  });

  it('returns null before submission exists, then the submission after', () => {
    const { result } = renderHook(() => useUserSubmission(UID, WAGER_ID));

    expect(result.current.loading).toBe(true);

    act(() => fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, null));
    expect(result.current.loading).toBe(false);
    expect(result.current.submission).toBeNull();

    act(() =>
      fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, {
        uid: UID,
        guess: 50.7,
        logError: 0.0,
        score: 100,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    );
    expect(result.current.submission).not.toBeNull();
    expect(result.current.submission!.uid).toBe(UID);
    expect(result.current.submission!.score).toBe(100);
  });

  it('auto-calls ensureSubmissionScored when a placeholder (score=0, logError=0) is observed and scoring is provided', async () => {
    // Configure mockGetDoc for ensureSubmissionScored's internal reads
    mockGetDoc.mockImplementation(async (ref: { _path: string }) => {
      if (ref._path === `wagers/${WAGER_ID}/submissions/${UID}`) {
        return {
          exists: () => true,
          data: () => ({
            uid: UID,
            guess: 50.7,
            logError: 0,
            score: 0,
            submittedAt: { toMillis: () => 1700000000000 },
          }),
        };
      }
      if (ref._path === `wagers/${WAGER_ID}/private/answer`) {
        return { exists: () => true, data: () => ANSWER_DOC_DATA };
      }
      return { exists: () => false, data: () => ({}) };
    });

    mockRunTransaction.mockImplementation(async (_db: unknown, fn: (txn: unknown) => Promise<void>) => {
      const txn = {
        get: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
        set: vi.fn(),
        update: vi.fn(),
      };
      await fn(txn);
    });

    const { result } = renderHook(() => useUserSubmission(UID, WAGER_ID, 'log'));

    // Fire snapshot with placeholder submission
    act(() =>
      fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, {
        uid: UID,
        guess: 50.7,
        logError: 0,
        score: 0,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    );

    expect(result.current.submission?.score).toBe(0);

    // ensureSubmissionScored runs asynchronously; wait for runTransaction to be called
    await waitFor(() => {
      expect(mockRunTransaction).toHaveBeenCalled();
    });
  });

  it('does NOT auto-call ensureSubmissionScored when scoring is not provided', () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });

    renderHook(() => useUserSubmission(UID, WAGER_ID)); // no scoring arg

    act(() =>
      fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, {
        uid: UID,
        guess: 50.7,
        logError: 0,
        score: 0,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    );

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('does NOT trigger self-heal when score is non-zero (real submission)', () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });

    renderHook(() => useUserSubmission(UID, WAGER_ID, 'log'));

    act(() =>
      fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, {
        uid: UID,
        guess: 50.7,
        logError: 0.0,
        score: 100,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    );

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Hook: useWagerAnswer (gated)
// ---------------------------------------------------------------------------

describe('useWagerAnswer', () => {
  afterEach(() => {
    snapshotCallbacks.clear();
    activeSubscriptions.clear();
  });

  it('does not subscribe to the answer doc until the user has submitted', () => {
    const { result } = renderHook(() => useWagerAnswer(UID, WAGER_ID));

    act(() => fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, null));

    expect(result.current.answer).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(activeSubscriptions.has(`wagers/${WAGER_ID}/private/answer`)).toBe(false);
  });

  it('subscribes to the answer doc after the user submits', () => {
    const { result } = renderHook(() => useWagerAnswer(UID, WAGER_ID));

    act(() =>
      fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, {
        uid: UID,
        guess: 50.7,
        logError: 0.0,
        score: 100,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    );

    expect(activeSubscriptions.has(`wagers/${WAGER_ID}/private/answer`)).toBe(true);

    act(() =>
      fireDoc(`wagers/${WAGER_ID}/private/answer`, {
        trueAnswer: 50.7,
        source: 'Test source',
        revealHeadline: 'Birthday paradox',
        revealExplanation: 'Pairs grow combinatorially.',
      }),
    );

    expect(result.current.answer).not.toBeNull();
    expect(result.current.answer!.trueAnswer).toBe(50.7);
    expect(result.current.loading).toBe(false);
  });

  it('returns null and loading:false when uid is null', () => {
    const { result } = renderHook(() => useWagerAnswer(null, WAGER_ID));
    act(() => {});
    expect(result.current.answer).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(activeSubscriptions.has(`wagers/${WAGER_ID}/private/answer`)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Hook: useWagerSubmissions (gated)
// ---------------------------------------------------------------------------

describe('useWagerSubmissions', () => {
  afterEach(() => {
    snapshotCallbacks.clear();
    activeSubscriptions.clear();
  });

  it('returns null before the user has submitted (no subscription)', () => {
    const { result } = renderHook(() => useWagerSubmissions(UID, WAGER_ID));

    act(() => fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, null));

    expect(result.current.submissions).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(activeSubscriptions.has(`wagers/${WAGER_ID}/submissions`)).toBe(false);
  });

  it('returns the list after the user has submitted', () => {
    const { result } = renderHook(() => useWagerSubmissions(UID, WAGER_ID));

    act(() =>
      fireDoc(`wagers/${WAGER_ID}/submissions/${UID}`, {
        uid: UID,
        guess: 50.7,
        logError: 0.0,
        score: 100,
        submittedAt: { toMillis: () => 1700000000000 },
      }),
    );

    expect(activeSubscriptions.has(`wagers/${WAGER_ID}/submissions`)).toBe(true);

    act(() =>
      fireCollection(`wagers/${WAGER_ID}/submissions`, [
        { uid: UID, guess: 50.7, logError: 0.0, score: 100, submittedAt: 1700000000000 },
        { uid: 'bob', guess: 10, logError: 0.7, score: 30, submittedAt: 1700000001000 },
      ]),
    );

    expect(result.current.submissions).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Hook: useWagerStats
// ---------------------------------------------------------------------------

describe('useWagerStats', () => {
  afterEach(() => {
    snapshotCallbacks.clear();
    activeSubscriptions.clear();
  });

  it('returns null when uid is null', () => {
    const { result } = renderHook(() => useWagerStats(null));
    act(() => {});
    expect(result.current.stats).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns null when the stats doc does not exist (cold state)', () => {
    const { result } = renderHook(() => useWagerStats(UID));
    act(() => fireDoc(`users/${UID}/wagerStats/summary`, null));
    expect(result.current.stats).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns stats when the doc exists', () => {
    const { result } = renderHook(() => useWagerStats(UID));
    act(() =>
      fireDoc(`users/${UID}/wagerStats/summary`, {
        totalSubmitted: 5,
        averageScore: 72,
        averageLogError: 0.28,
        lastWagerId: WAGER_ID,
        last10Scores: [60, 70, 80, 65, 85],
      }),
    );
    expect(result.current.stats!.totalSubmitted).toBe(5);
    expect(result.current.stats!.averageScore).toBe(72);
    expect(result.current.loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// last10Scores roll-off (11 simulated wagers)
// ---------------------------------------------------------------------------

describe('computeUpdatedStats — last10Scores roll-off', () => {
  it('after 11 wagers only the last 10 scores are kept', () => {
    let stats: WagerStats | null = null;
    for (let i = 1; i <= 11; i++) {
      stats = computeUpdatedStats(stats, `wager-${i}`, i * 5, 0.1);
    }
    expect(stats!.last10Scores).toHaveLength(10);
    expect(stats!.last10Scores[0]).toBe(10); // wager 2
    expect(stats!.last10Scores[9]).toBe(55); // wager 11
  });
});
