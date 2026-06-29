/**
 * WagerHistogram tests (WP-CW-G).
 *
 * Covers:
 *   - SVG renders with the correct number of <rect> bar elements (one per bin)
 *   - The user-guess marker (violet line + dot) is present
 *   - The true-answer marker (green dashed line) is present
 *   - Placeholder branch renders when n < HISTOGRAM_MIN_N (R-W7)
 *   - Real histogram renders when n >= HISTOGRAM_MIN_N
 *   - Log-scoring: bars render and markers exist
 *   - Abs-scoring: bars render and markers exist
 *   - formatCompactCount helper: 1.2M / 23K / 420
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WagerHistogram, formatCompactCount } from '@/features/wager/WagerHistogram';
import { HISTOGRAM_MIN_N } from '@/features/wager/constants';
import type { HistogramBucket } from '@/features/wager/types';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBins(count: number): HistogramBucket[] {
  // 5 log-spaced-ish buckets, true answer at boundary lo of bucket 2
  return [
    { lo: 1, hi: 5, count: count },
    { lo: 5, hi: 10, count: count * 2 },
    { lo: 10, hi: 50, count: count * 3 }, // true answer (10) is lo of this bucket
    { lo: 50, hi: 100, count: count * 2 },
    { lo: 100, hi: 500, count: count },
  ];
}

const LOG_PROPS = {
  bins: makeBins(5),
  userGuess: 8,
  trueAnswer: 10,
  scoring: 'log' as const,
  unit: 'count' as const,
  n: 25,
};

const ABS_PROPS = {
  bins: [
    { lo: 0, hi: 0.2, count: 3 },
    { lo: 0.2, hi: 0.4, count: 8 },
    { lo: 0.4, hi: 0.6, count: 5 }, // true answer at lo
    { lo: 0.6, hi: 0.8, count: 2 },
    { lo: 0.8, hi: 1.0, count: 1 },
  ],
  userGuess: 0.35,
  trueAnswer: 0.4,
  scoring: 'abs' as const,
  unit: 'fraction' as const,
  n: 20,
};

// ---------------------------------------------------------------------------
// Placeholder branch (R-W7)
// ---------------------------------------------------------------------------

describe('WagerHistogram — always renders the chart, no minimum-N gate', () => {
  it('renders the SVG even at n=1 (single submitter)', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} n={1} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.queryByText(/distribution will fill in/i)).toBeNull();
  });

  it('renders the SVG at n=5 (small but real distribution)', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} n={5} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders the SVG at the old HISTOGRAM_MIN_N boundary (no-op now)', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} n={HISTOGRAM_MIN_N} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.queryByText(/distribution will fill in/i)).toBeNull();
  });

  it('still shows the empty-state card when bins is literally an empty array', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} bins={[]} n={0} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByText(/No submissions to display yet/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SVG structure — log scoring
// ---------------------------------------------------------------------------

describe('WagerHistogram — SVG structure (log scoring)', () => {
  it('renders exactly one <rect> per bin', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(LOG_PROPS.bins.length);
  });

  it('renders two vertical <line> markers (true-answer + user-guess)', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} />);
    // All lines — baseline + tick marks + two vertical markers
    const lines = container.querySelectorAll('line');
    // We have at least 2 marker lines (true answer + user guess) + baseline
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('renders a <circle> dot for the user-guess marker', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it('has accessible role="img" with aria-label', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
    expect(svg!.getAttribute('aria-label')).toMatch(/distribution/i);
  });

  it('the violet user-guess line has stroke="var(--violet-base)"', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} />);
    // The user-guess line is the thicker one (strokeWidth=2.5)
    const violetLine = Array.from(container.querySelectorAll('line')).find(
      (l) => l.getAttribute('stroke-width') === '2.5',
    );
    expect(violetLine).toBeDefined();
    expect(violetLine!.getAttribute('stroke')).toBe('var(--violet-base)');
  });

  it('the green true-answer line has stroke-dasharray', () => {
    const { container } = render(<WagerHistogram {...LOG_PROPS} />);
    const dashedLine = Array.from(container.querySelectorAll('line')).find(
      (l) => l.getAttribute('stroke-dasharray') !== null,
    );
    expect(dashedLine).toBeDefined();
    expect(dashedLine!.getAttribute('stroke')).toBe('var(--green-base)');
  });
});

// ---------------------------------------------------------------------------
// SVG structure — abs scoring
// ---------------------------------------------------------------------------

describe('WagerHistogram — SVG structure (abs scoring)', () => {
  it('renders exactly one <rect> per bin', () => {
    const { container } = render(<WagerHistogram {...ABS_PROPS} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(ABS_PROPS.bins.length);
  });

  it('renders SVG with role="img"', () => {
    const { container } = render(<WagerHistogram {...ABS_PROPS} />);
    expect(container.querySelector('svg[role="img"]')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatCompactCount helper
// ---------------------------------------------------------------------------

describe('formatCompactCount', () => {
  it('formats 1_200_000 as "1.2M"', () => {
    expect(formatCompactCount(1_200_000)).toBe('1.2M');
  });

  it('formats 23_000 as "23K"', () => {
    expect(formatCompactCount(23_000)).toBe('23K');
  });

  it('formats 420 as "420"', () => {
    expect(formatCompactCount(420)).toBe('420');
  });

  it('formats 1_000_000 exactly as "1M"', () => {
    expect(formatCompactCount(1_000_000)).toBe('1M');
  });

  it('formats 1_500 as "1.5K"', () => {
    expect(formatCompactCount(1_500)).toBe('1.5K');
  });
});
