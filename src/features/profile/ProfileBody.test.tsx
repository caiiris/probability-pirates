/**
 * ProfileBody component tests (WP-CW-H).
 *
 * Covers the wager-stats subsection:
 *   - With wagerStats present → "Wagers" heading, stat tiles, and sparkline render
 *   - Without wagerStats (null) → "Wagers" heading is NOT in the DOM
 *
 * useWagerStats is mocked — no Firebase in tests.
 * Heavy sub-components (OceanScene, StrengthsPanel, etc.) are mocked to keep
 * the test fast and focused on the section under test.
 *
 * Explicit afterEach(cleanup) required: Vitest does not expose afterEach
 * globally, preventing RTL's auto-cleanup from firing.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { WagerStats } from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Mock wagerService — no Firebase
// ---------------------------------------------------------------------------

vi.mock('@/features/wager/wagerService', () => ({
  useWagerStats: vi.fn(),
}));

import { useWagerStats } from '@/features/wager/wagerService';
const mockUseWagerStats = vi.mocked(useWagerStats);

// ---------------------------------------------------------------------------
// Mock WagerSparkline — avoid SVG measurement quirks in JSDOM
// ---------------------------------------------------------------------------

vi.mock('@/features/wager/WagerSparkline', () => ({
  WagerSparkline: ({ scores }: { scores: number[] }) => (
    <div data-testid="wager-sparkline" data-score-count={scores.length} />
  ),
}));

// ---------------------------------------------------------------------------
// Mock heavy sub-components that pull in animation / complex deps
// ---------------------------------------------------------------------------

vi.mock('@/features/course/OceanScene', () => ({
  OceanScene: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/learner/StrengthsPanel', () => ({
  StrengthsPanel: () => <div data-testid="strengths-panel" />,
}));

vi.mock('@/features/economy/FlairBadge', () => ({
  FlairBadge: () => <div data-testid="flair-badge" />,
}));

vi.mock('@/components/illustrations/Chest', () => ({
  Chest: () => <div data-testid="chest-icon" />,
}));

vi.mock('./DefaultAvatar', () => ({
  DefaultAvatar: () => <div data-testid="default-avatar" />,
}));

vi.mock('./LevelBadge', () => ({
  RankPanel: () => <div data-testid="rank-panel" />,
}));

vi.mock('./TrophyCase', () => ({
  TrophyCase: () => <div data-testid="trophy-case" />,
}));

vi.mock('./ActivityGrid', () => ({
  ActivityGrid: () => <div data-testid="activity-grid" />,
}));

vi.mock('./StatsGrid', () => ({
  StatsGrid: () => <div data-testid="stats-grid" />,
}));

// Import component after mocks are registered
import { ProfileBody } from './ProfileBody';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MINIMAL_PROPS = {
  displayUsername: 'CaptainTest',
  bio: '',
  emptyBioText: 'No bio yet.',
  xp: 0,
  lessonsCompleted: 0,
  stepsCompleted: 0,
  currentStreak: 0,
  bestStreak: 0,
  courseCompleted: 0,
  courseTotal: 10,
  activityDates: undefined,
  milestonesReached: undefined,
  achievements: undefined,
};

function makeWagerStats(overrides: Partial<WagerStats> = {}): WagerStats {
  return {
    totalSubmitted: 7,
    averageScore: 63.4,
    averageLogError: 0.37,
    lastWagerId: 'wager-007',
    last10Scores: [80, 55, 70, 45, 90, 60, 75, 50, 65, 72],
    ...overrides,
  };
}

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Tests — wager-stats subsection
// ---------------------------------------------------------------------------

describe('ProfileBody — Wagers section WITH stats', () => {
  it('renders the "Wagers" heading when wagerStats is present', () => {
    mockUseWagerStats.mockReturnValue({ stats: makeWagerStats(), loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByRole('heading', { name: 'Wagers' })).toBeInTheDocument();
  });

  it('renders the Submitted stat tile with the correct count', () => {
    const stats = makeWagerStats({ totalSubmitted: 7 });
    mockUseWagerStats.mockReturnValue({ stats, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('renders the Average score stat tile with rounded value and /100 unit', () => {
    const stats = makeWagerStats({ averageScore: 63.4 });
    mockUseWagerStats.mockReturnValue({ stats, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByText('63 / 100')).toBeInTheDocument();
    expect(screen.getByText('Average score')).toBeInTheDocument();
  });

  it('renders the "Your last N wagers" caption', () => {
    const stats = makeWagerStats({ last10Scores: [80, 55, 70, 45, 90, 60, 75, 50, 65, 72] });
    mockUseWagerStats.mockReturnValue({ stats, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByText('Your last 10 wagers')).toBeInTheDocument();
  });

  it('uses singular "wager" when last10Scores has exactly 1 entry', () => {
    const stats = makeWagerStats({ last10Scores: [72] });
    mockUseWagerStats.mockReturnValue({ stats, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByText('Your last 1 wager')).toBeInTheDocument();
  });

  it('renders the WagerSparkline with the correct scores', () => {
    const scores = [80, 55, 70, 45, 90, 60, 75, 50, 65, 72];
    const stats = makeWagerStats({ last10Scores: scores });
    mockUseWagerStats.mockReturnValue({ stats, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    const sparkline = screen.getByTestId('wager-sparkline');
    expect(sparkline).toBeInTheDocument();
    expect(sparkline).toHaveAttribute('data-score-count', '10');
  });
});

describe('ProfileBody — Wagers section WITHOUT stats (cold state)', () => {
  it('does NOT render the "Wagers" heading when stats is null', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.queryByRole('heading', { name: 'Wagers' })).not.toBeInTheDocument();
  });

  it('does NOT render the WagerSparkline when stats is null', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.queryByTestId('wager-sparkline')).not.toBeInTheDocument();
  });

  it('does NOT render the "Submitted" label when stats is null', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.queryByText('Submitted')).not.toBeInTheDocument();
  });

  it('does NOT render the section when uid is not provided (no wager lookup)', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} />);
    expect(screen.queryByRole('heading', { name: 'Wagers' })).not.toBeInTheDocument();
  });
});

describe('ProfileBody — existing sections still render', () => {
  it('renders the Stats grid section', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByRole('heading', { name: 'Stats' })).toBeInTheDocument();
  });

  it('renders the Activity section', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });

  it('renders the Rank section', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByRole('heading', { name: 'Rank' })).toBeInTheDocument();
  });

  it('renders the Treasure shelf section', () => {
    mockUseWagerStats.mockReturnValue({ stats: null, loading: false });
    render(<ProfileBody {...MINIMAL_PROPS} uid="user-123" />);
    expect(screen.getByRole('heading', { name: 'Treasure shelf' })).toBeInTheDocument();
  });
});
