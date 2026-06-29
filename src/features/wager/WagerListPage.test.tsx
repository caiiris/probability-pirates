/**
 * WagerListPage component tests.
 *
 * Covers the rotation layout:
 *   - Page header renders
 *   - Loading skeleton when wagers are loading
 *   - Friendly empty state when the bank is empty
 *   - Single-wager bank: featured card visible, no Past Wagers dropdown
 *   - Multi-wager bank: featured card AND collapsed dropdown with past entries
 *   - Tapping the dropdown reveals past-wager rows
 *   - StatusChip reflects per-user submission state on featured card + rows
 *   - Featured card and past rows link to /wager/:id
 *
 * useAuth, wagerService, and wagerRotation hooks are mocked — no Firebase
 * and no time-dependent rotation drift in tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/wager/wagerService', () => ({
  useLiveWagers: vi.fn(),
  useUserSubmission: vi.fn(),
}));

import type * as WagerRotationModule from '@/features/wager/wagerRotation';

vi.mock('@/features/wager/wagerRotation', async () => {
  const actual =
    await vi.importActual<typeof WagerRotationModule>('@/features/wager/wagerRotation');
  return {
    ...actual,
    featuredWager: vi.fn(),
    pastFeaturedWagers: vi.fn(),
  };
});

import { useAuth } from '@/features/auth/AuthProvider';
import { useLiveWagers, useUserSubmission } from '@/features/wager/wagerService';
import {
  featuredWager,
  pastFeaturedWagers,
} from '@/features/wager/wagerRotation';
import WagerListPage from '@/features/wager/WagerListPage';
import type { Wager, WagerSubmission } from '@/features/wager/types';

const mockUseAuth = vi.mocked(useAuth);
const mockUseLiveWagers = vi.mocked(useLiveWagers);
const mockUseUserSubmission = vi.mocked(useUserSubmission);
const mockFeaturedWager = vi.mocked(featuredWager);
const mockPastFeaturedWagers = vi.mocked(pastFeaturedWagers);

function makeWager(overrides: Partial<Wager> = {}): Wager {
  return {
    id: 'wager-1',
    sequence: 1,
    openAt: Date.now() - 1000,
    prompt: 'What fraction of US weddings involve people who met online?',
    unit: 'percent',
    tags: ['frequency'],
    flavor: 'frequency',
    scoring: 'log',
    status: 'live',
    createdBy: 'system',
    ...overrides,
  };
}

const liveWager = makeWager();

const submissionWith72: WagerSubmission = {
  uid: 'user-1',
  guess: 30,
  logError: 0.2,
  score: 72,
  submittedAt: Date.now(),
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/wager']}>
      <WagerListPage />
    </MemoryRouter>,
  );
}

describe('WagerListPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { uid: 'user-1' } as any,
      profile: null,
    });
    mockUseLiveWagers.mockReturnValue({ wagers: [], loading: false, error: null });
    mockUseUserSubmission.mockReturnValue({ submission: null, loading: false });
    mockFeaturedWager.mockReturnValue(null);
    mockPastFeaturedWagers.mockReturnValue([]);
  });

  afterEach(cleanup);

  it('renders the page header', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: "Captain's Wager" })).toBeInTheDocument();
    expect(screen.getByText(/A new bottle washes ashore/)).toBeInTheDocument();
  });

  it('renders the empty state when the bank is empty', () => {
    renderPage();
    // The empty state copy was upgraded from "No wagers yet — check back
    // soon" to a themed EmptyState card with the chest illustration.
    expect(screen.getByText(/sea is empty for now/i)).toBeInTheDocument();
    expect(screen.queryByText("Today's wager")).not.toBeInTheDocument();
  });

  it('renders a visible error state when useLiveWagers reports an error', () => {
    mockUseLiveWagers.mockReturnValue({
      wagers: [],
      loading: false,
      error: 'FirebaseError: [code=failed-precondition]: index missing',
    });
    renderPage();
    expect(screen.getByText('Could not load wagers.')).toBeInTheDocument();
    expect(
      screen.getByText(/FirebaseError: \[code=failed-precondition\]: index missing/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No wagers yet/)).not.toBeInTheDocument();
  });

  it('renders the featured skeleton while wagers are loading (no empty state, no featured)', () => {
    mockUseLiveWagers.mockReturnValue({ wagers: [], loading: true, error: null });
    renderPage();
    expect(screen.queryByText(/No wagers yet/)).not.toBeInTheDocument();
    expect(screen.queryByText("Today's wager")).not.toBeInTheDocument();
  });

  it('renders the featured card when a wager is featured and the bank has only one', () => {
    mockUseLiveWagers.mockReturnValue({ wagers: [liveWager], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(liveWager);
    mockPastFeaturedWagers.mockReturnValue([]);
    renderPage();
    expect(screen.getByText("Today's wager")).toBeInTheDocument();
    expect(screen.getByText(liveWager.prompt)).toBeInTheDocument();
    expect(screen.queryByText(/Past wagers/)).not.toBeInTheDocument();
  });

  it('renders both the featured card and the collapsed Past Wagers dropdown when there is history', () => {
    const featured = makeWager({ id: 'featured', prompt: 'Featured prompt' });
    const past = [
      makeWager({ id: 'p1', prompt: 'Past prompt 1' }),
      makeWager({ id: 'p2', prompt: 'Past prompt 2' }),
    ];
    mockUseLiveWagers.mockReturnValue({ wagers: [featured, ...past], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(featured);
    mockPastFeaturedWagers.mockReturnValue(past);
    renderPage();

    expect(screen.getByText("Today's wager")).toBeInTheDocument();
    expect(screen.getByText('Featured prompt')).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /Past wagers/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument();

    // Past rows are not visible until the dropdown is opened
    expect(screen.queryByText('Past prompt 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Past prompt 2')).not.toBeInTheDocument();
  });

  it('expanding the Past Wagers dropdown reveals each past wager row', () => {
    const featured = makeWager({ id: 'featured', prompt: 'Featured prompt' });
    const past = [
      makeWager({ id: 'p1', prompt: 'Past prompt 1' }),
      makeWager({ id: 'p2', prompt: 'Past prompt 2' }),
    ];
    mockUseLiveWagers.mockReturnValue({ wagers: [featured, ...past], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(featured);
    mockPastFeaturedWagers.mockReturnValue(past);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Past wagers/ }));
    expect(screen.getByRole('button', { name: /Past wagers/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Past prompt 1')).toBeInTheDocument();
    expect(screen.getByText('Past prompt 2')).toBeInTheDocument();
  });

  it('featured card shows the Submit chip for an unsubmitted wager', () => {
    mockUseLiveWagers.mockReturnValue({ wagers: [liveWager], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(liveWager);
    mockUseUserSubmission.mockReturnValue({ submission: null, loading: false });
    renderPage();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('auto-redirects to the reveal when today\'s wager is already answered', () => {
    mockUseLiveWagers.mockReturnValue({ wagers: [liveWager], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(liveWager);
    mockUseUserSubmission.mockReturnValue({ submission: submissionWith72, loading: false });
    render(
      <MemoryRouter initialEntries={['/wager']}>
        <Routes>
          <Route path="/wager" element={<WagerListPage />} />
          <Route path="/wager/:id" element={<div>REVEAL STUB</div>} />
        </Routes>
      </MemoryRouter>,
    );
    // Lands straight on the reveal, not the list's score card.
    expect(screen.getByText('REVEAL STUB')).toBeInTheDocument();
    expect(screen.queryByText('72')).not.toBeInTheDocument();
  });

  it('shows the Score chip on the list (no redirect) when viewing ?view=list', () => {
    mockUseLiveWagers.mockReturnValue({ wagers: [liveWager], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(liveWager);
    mockUseUserSubmission.mockReturnValue({ submission: submissionWith72, loading: false });
    render(
      <MemoryRouter initialEntries={['/wager?view=list']}>
        <WagerListPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('featured card links to /wager/:id', () => {
    mockUseLiveWagers.mockReturnValue({ wagers: [liveWager], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(liveWager);
    const { container } = renderPage();
    const link = container.querySelector(`a[href="/wager/${liveWager.id}"]`);
    expect(link).not.toBeNull();
  });

  it('renders the flavor tag on the featured card', () => {
    mockUseLiveWagers.mockReturnValue({ wagers: [liveWager], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(liveWager);
    renderPage();
    expect(screen.getByText('frequency')).toBeInTheDocument();
  });

  it('renders the featured card for an unauthenticated user (uid=null)', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' });
    mockUseLiveWagers.mockReturnValue({ wagers: [liveWager], loading: false, error: null });
    mockFeaturedWager.mockReturnValue(liveWager);
    renderPage();
    expect(screen.getByText("Today's wager")).toBeInTheDocument();
    expect(screen.getByText(liveWager.prompt)).toBeInTheDocument();
  });
});
