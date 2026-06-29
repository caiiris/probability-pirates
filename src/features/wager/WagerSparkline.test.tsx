/**
 * WagerSparkline tests (WP-CW-G).
 *
 * Covers:
 *   - SVG renders for N >= 1 scores
 *   - Trendline (dashed polyline) present when N >= 3, absent when N < 3
 *   - Empty state (text) for N === 0
 *   - Aria-label reflects score count
 *   - Latest-score dot is rendered
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WagerSparkline } from '@/features/wager/WagerSparkline';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('WagerSparkline — empty state', () => {
  it('renders a text message when scores is empty', () => {
    render(<WagerSparkline scores={[]} />);
    expect(screen.getByText(/submit a wager/i)).toBeInTheDocument();
  });

  it('does NOT render an SVG for empty scores', () => {
    const { container } = render(<WagerSparkline scores={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Single score
// ---------------------------------------------------------------------------

describe('WagerSparkline — single score', () => {
  it('renders an SVG for a single score', () => {
    const { container } = render(<WagerSparkline scores={[72]} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('does NOT render a trendline for N < 3', () => {
    const { container } = render(<WagerSparkline scores={[72]} />);
    const dashed = Array.from(container.querySelectorAll('polyline')).find(
      (p) => p.getAttribute('stroke-dasharray') !== null,
    );
    expect(dashed).toBeUndefined();
  });

  it('has role="img" with aria-label', () => {
    const { container } = render(<WagerSparkline scores={[72]} />);
    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('role')).toBe('img');
    expect(svg!.getAttribute('aria-label')).toMatch(/1 wager/i);
    expect(svg!.getAttribute('aria-label')).toMatch(/72/);
  });
});

// ---------------------------------------------------------------------------
// Two scores (no trendline still)
// ---------------------------------------------------------------------------

describe('WagerSparkline — two scores', () => {
  it('does NOT render a trendline for exactly N=2', () => {
    const { container } = render(<WagerSparkline scores={[50, 70]} />);
    const dashed = Array.from(container.querySelectorAll('polyline')).find(
      (p) => p.getAttribute('stroke-dasharray') !== null,
    );
    expect(dashed).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// N >= 3 scores (trendline present)
// ---------------------------------------------------------------------------

describe('WagerSparkline — 3+ scores', () => {
  const scores10 = [40, 55, 60, 70, 65, 75, 80, 72, 85, 90];

  it('renders an SVG for 10 scores', () => {
    const { container } = render(<WagerSparkline scores={scores10} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a trendline (dashed polyline) for N >= 3', () => {
    const { container } = render(<WagerSparkline scores={scores10} />);
    const dashed = Array.from(container.querySelectorAll('polyline')).find(
      (p) => p.getAttribute('stroke-dasharray') !== null,
    );
    expect(dashed).toBeDefined();
  });

  it('renders a dot for the latest score', () => {
    const { container } = render(<WagerSparkline scores={scores10} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it('aria-label reflects the score count and latest score', () => {
    const { container } = render(<WagerSparkline scores={scores10} />);
    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('aria-label')).toMatch(/10 wagers/i);
    expect(svg!.getAttribute('aria-label')).toMatch(/90/);
  });

  it('renders trendline for exactly 3 scores', () => {
    const { container } = render(<WagerSparkline scores={[40, 60, 80]} />);
    const dashed = Array.from(container.querySelectorAll('polyline')).find(
      (p) => p.getAttribute('stroke-dasharray') !== null,
    );
    expect(dashed).toBeDefined();
  });
});
