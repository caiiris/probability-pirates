import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { StudyEvent } from './scheduleService';

// Mock the whole service so we never touch Firebase. This also lets us drive
// the real-time callback synchronously.
vi.mock('./scheduleService', () => ({
  subscribeToMonthEvents: vi.fn(),
}));

import { subscribeToMonthEvents } from './scheduleService';
import { useStudyEvents } from './useStudyEvents';

const sampleEvents: StudyEvent[] = [
  { id: 'e1', title: 'Review probability basics', date: '2026-06-10', eventType: 'study', completed: false },
  { id: 'e2', title: 'Practice quiz', date: '2026-06-12', eventType: 'test', completed: true },
];

beforeEach(() => {
  vi.mocked(subscribeToMonthEvents).mockReset();
});

describe('useStudyEvents', () => {
  // Regression for B053: the ready field was named `events`, but every consumer
  // (and the rest of the codebase's async-state hooks) reads `.data`. The
  // mismatch made `SchedulePage`'s `eventsState.data` undefined and crashed
  // `/schedule` with "undefined is not iterable". Pin the field name here.
  it('exposes ready events under `data`, not `events`', () => {
    let emit: (events: StudyEvent[]) => void = () => {};
    vi.mocked(subscribeToMonthEvents).mockImplementation((_uid, _yearMonth, onData) => {
      emit = onData;
      return () => {};
    });

    const { result } = renderHook(() => useStudyEvents('user1', '2026-06'));
    expect(result.current.status).toBe('loading');

    act(() => emit(sampleEvents));

    expect(result.current).toEqual({ status: 'ready', data: sampleEvents });
    expect((result.current as unknown as { events?: unknown }).events).toBeUndefined();
  });

  it('returns empty `data` and never subscribes when uid is missing', () => {
    const { result } = renderHook(() => useStudyEvents('', '2026-06'));
    expect(result.current).toEqual({ status: 'ready', data: [] });
    expect(subscribeToMonthEvents).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const unsub = vi.fn();
    vi.mocked(subscribeToMonthEvents).mockReturnValue(unsub);

    const { unmount } = renderHook(() => useStudyEvents('user1', '2026-06'));
    unmount();

    expect(unsub).toHaveBeenCalledTimes(1);
  });
});
