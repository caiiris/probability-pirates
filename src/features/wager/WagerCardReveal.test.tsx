/**
 * WagerCardReveal tests (WP-CW-G).
 *
 * Covers:
 *   - True answer renders in the hero card
 *   - Captain Pascal teach-back renders (headline + explanation)
 *   - "You beat X%" pill suppressed when n < 2 (you're the only one)
 *   - "You beat X%" pill shown when n >= 2, with N count in the copy
 *   - Lesson link renders only when relatedLessonId is set and lesson resolves
 *   - Lesson link shows fallback text when relatedLessonId resolves to unknown lesson
 *   - Calibration sparkline section shows cold-start message when stats is null
 *   - revealWorked expander is present when provided, absent when not
 *   - Score chip renders with the submission score
 *
 * WagerHistogram and WagerSparkline are mocked to avoid full SVG rendering
 * in tests (their own tests cover the SVG structure).
 * binSubmissions and percentileBeaten are imported directly (pure helpers).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Wager, WagerAnswer, WagerStats, WagerSubmission } from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Mock SVG sub-components (avoids SVG rendering complexity in unit tests)
// ---------------------------------------------------------------------------

vi.mock('@/features/wager/WagerHistogram', () => ({
  WagerHistogram: ({ n }: { n: number }) => (
    <div data-testid="wager-histogram" data-n={n} />
  ),
  formatCompactCount: (n: number) => String(n),
}));

vi.mock('@/features/wager/WagerSparkline', () => ({
  WagerSparkline: ({ scores }: { scores: number[] }) => (
    <div data-testid="wager-sparkline" data-scores={scores.join(',')} />
  ),
}));

// Import after mocks are registered
import { WagerCardReveal } from '@/features/wager/WagerCardReveal';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeWager(overrides: Partial<Wager> = {}): Wager {
  return {
    id: 'test-wager-1',
    sequence: 1,
    openAt: Date.now(),
    prompt: 'In a group of 23 people, what is the probability two share a birthday?',
    unit: 'percent',
    tags: ['birthday-paradox'],
    flavor: 'counterintuition',
    scoring: 'log',
    status: 'live',
    createdBy: 'system',
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<WagerAnswer> = {}): WagerAnswer {
  return {
    trueAnswer: 50.7,
    source: 'Standard birthday-paradox calculation',
    revealHeadline: "It's the birthday paradox.",
    revealExplanation:
      'Pairs grow combinatorially, not linearly. In a group of 23 there are C(23,2)=253 pairs.',
    ...overrides,
  };
}

function makeSubmission(overrides: Partial<WagerSubmission> = {}): WagerSubmission {
  return {
    uid: 'user-1',
    guess: 8,
    logError: 0.8,
    score: 20,
    submittedAt: Date.now(),
    ...overrides,
  };
}

function makeSubmissions(n: number): WagerSubmission[] {
  return Array.from({ length: n }, (_, i) => ({
    uid: `user-${i}`,
    guess: 5 + i * 3,
    logError: 0.3 + i * 0.05,
    score: Math.max(0, 100 - i * 5),
    submittedAt: Date.now(),
  }));
}

function makeStats(overrides: Partial<WagerStats> = {}): WagerStats {
  return {
    totalSubmitted: 5,
    averageScore: 65,
    averageLogError: 0.35,
    last10Scores: [50, 60, 70, 65, 75, 80],
    ...overrides,
  };
}

function renderReveal(
  overrides: {
    wager?: Partial<Wager>;
    answer?: Partial<WagerAnswer>;
    submission?: Partial<WagerSubmission>;
    submissions?: WagerSubmission[];
    stats?: WagerStats | null;
  } = {},
) {
  const wager = makeWager(overrides.wager);
  const answer = makeAnswer(overrides.answer);
  const submission = makeSubmission(overrides.submission);
  const submissions = overrides.submissions ?? makeSubmissions(25);
  const stats = overrides.stats !== undefined ? overrides.stats : makeStats();

  return render(
    <MemoryRouter>
      <WagerCardReveal
        wager={wager}
        submission={submission}
        answer={answer}
        submissions={submissions}
        stats={stats}
      />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

// ---------------------------------------------------------------------------
// True answer reveal
// ---------------------------------------------------------------------------

describe('WagerCardReveal — true answer', () => {
  it('renders the true answer value', () => {
    renderReveal();
    expect(screen.getByText(/50\.7%/i)).toBeInTheDocument();
  });

  it('renders the source attribution', () => {
    renderReveal();
    expect(screen.getByText(/birthday-paradox calculation/i)).toBeInTheDocument();
  });

  it('does NOT show a worked-solution expander when revealWorked is absent', () => {
    renderReveal({ answer: { revealWorked: undefined } });
    expect(screen.queryByText(/how did we get this number/i)).toBeNull();
  });

  it('shows a worked-solution expander when revealWorked is provided', () => {
    renderReveal({ answer: { revealWorked: 'The formula is P = 1 - 365!/((365-n)!*365^n).' } });
    expect(screen.getByText(/how did we get this number/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Teach-back
// ---------------------------------------------------------------------------

describe('WagerCardReveal — teach-back', () => {
  it('renders the reveal headline', () => {
    renderReveal();
    expect(screen.getByText(/birthday paradox/i)).toBeInTheDocument();
  });

  it('renders the reveal explanation', () => {
    renderReveal();
    expect(screen.getByText(/pairs grow combinatorially/i)).toBeInTheDocument();
  });

  it('renders Captain Pascal label', () => {
    renderReveal();
    expect(screen.getByText(/captain pascal/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Lesson link
// ---------------------------------------------------------------------------

describe('WagerCardReveal — lesson link', () => {
  it('does NOT render a lesson link when relatedLessonId is absent', () => {
    renderReveal({ wager: { relatedLessonId: undefined } });
    expect(screen.queryByText(/practice this in/i)).toBeNull();
  });

  it('renders a lesson link when relatedLessonId is present (resolved lesson)', () => {
    // 'how-likely' is in the lessons registry
    renderReveal({ wager: { relatedLessonId: 'how-likely' } });
    expect(screen.getByText(/practice this in/i)).toBeInTheDocument();
  });

  it('renders fallback lesson link text when relatedLessonId does not resolve', () => {
    renderReveal({ wager: { relatedLessonId: 'nonexistent-lesson-xyz' } });
    expect(screen.getByText(/practice this in the related lesson/i)).toBeInTheDocument();
  });

  it('lesson link is an anchor tag pointing to the lesson', () => {
    renderReveal({ wager: { relatedLessonId: 'how-likely' } });
    const link = screen.getByText(/practice this in/i).closest('a');
    expect(link).toBeDefined();
    expect(link?.getAttribute('href')).toContain('how-likely');
  });
});

// ---------------------------------------------------------------------------
// Percentile pill (suppression only at N<2 — small distributions still show)
// ---------------------------------------------------------------------------

describe('WagerCardReveal — percentile pill', () => {
  it('suppresses the pill when n=1 (you are the only submitter)', () => {
    renderReveal({ submissions: makeSubmissions(1) });
    expect(screen.queryByText(/you beat/i)).toBeNull();
    expect(screen.getByText(/first to wager/i)).toBeInTheDocument();
  });

  it('shows the pill when n=2 (smallest comparison case)', () => {
    renderReveal({ submissions: makeSubmissions(2) });
    expect(screen.getByText(/you beat/i)).toBeInTheDocument();
    expect(screen.queryByText(/first to wager/i)).toBeNull();
  });

  it('shows the pill at small N (e.g. 5), which was previously suppressed', () => {
    renderReveal({ submissions: makeSubmissions(5) });
    expect(screen.getByText(/you beat/i)).toBeInTheDocument();
  });

  it('shows the pill with a percentage value and sample size', () => {
    renderReveal({ submissions: makeSubmissions(30) });
    expect(screen.getByText(/you beat \d+% of 30 wagerers/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Score chip
// ---------------------------------------------------------------------------

describe('WagerCardReveal — score chip', () => {
  it('renders the submission score', () => {
    renderReveal({ submission: { score: 72, logError: 0.28 } });
    // The score appears in the chip
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders the user guess', () => {
    renderReveal({ submission: { guess: 42, score: 58, logError: 0.42 } });
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Calibration sparkline
// ---------------------------------------------------------------------------

describe('WagerCardReveal — calibration sparkline', () => {
  it('does NOT render the calibration section when stats is null', () => {
    renderReveal({ stats: null });
    expect(screen.queryByText(/your calibration/i)).toBeNull();
    expect(screen.queryByTestId('wager-sparkline')).toBeNull();
  });

  it('does NOT render the section when last10Scores has fewer than 3 entries', () => {
    renderReveal({ stats: makeStats({ last10Scores: [50, 60] }) });
    expect(screen.queryByText(/your calibration/i)).toBeNull();
    expect(screen.queryByTestId('wager-sparkline')).toBeNull();
  });

  it('renders the section + sparkline when last10Scores has 3+ entries', () => {
    renderReveal({ stats: makeStats({ last10Scores: [50, 60, 70] }) });
    expect(screen.getByText(/your calibration/i)).toBeInTheDocument();
    expect(screen.getByTestId('wager-sparkline')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Histogram integration
// ---------------------------------------------------------------------------

describe('WagerCardReveal — histogram integration', () => {
  it('renders the histogram component', () => {
    renderReveal({ submissions: makeSubmissions(25) });
    expect(screen.getByTestId('wager-histogram')).toBeInTheDocument();
  });

  it('passes n = submissions.length to histogram', () => {
    renderReveal({ submissions: makeSubmissions(30) });
    const histogram = screen.getByTestId('wager-histogram');
    expect(histogram.getAttribute('data-n')).toBe('30');
  });
});
