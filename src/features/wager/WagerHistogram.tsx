/**
 * WagerHistogram — SVG bar chart of submission distribution (WP-CW-G, C-W6).
 *
 * Log-scaled x-axis when scoring='log': bucket boundaries (actual values) are
 * log10-transformed for positioning; axis labels remain as human-readable
 * numbers (powers of 10). Linear x-axis when scoring='abs'.
 *
 * The chart always renders as long as there is at least one bin to draw. The
 * original D-CW9 N>=20 placeholder was dropped (2026-06-28) — when the user
 * base is small, hiding the chart hurts the product more than a "thin chart"
 * would, and showing your guess + true-answer markers is informative even
 * with one or two submitters. The "you beat X%" percentile is gated
 * separately at the parent (needs N>=2 to be meaningful).
 */

import type { HistogramBucket, WagerScoring, WagerUnit } from '@/features/wager/types';

export type WagerHistogramProps = {
  bins: HistogramBucket[];
  userGuess: number;
  trueAnswer: number;
  scoring: WagerScoring;
  unit: WagerUnit;
  n: number;
  className?: string;
};

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/** Compact number: 1_200_000 → "1.2M", 23_000 → "23K", 420 → "420". */
export function formatCompactCount(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    const s = (num / 1_000_000).toPrecision(3).replace(/\.?0+$/, '');
    return `${s}M`;
  }
  if (abs >= 1_000) {
    const s = (num / 1_000).toPrecision(3).replace(/\.?0+$/, '');
    return `${s}K`;
  }
  return String(Math.round(num));
}

function formatTickValue(num: number, unit: WagerUnit): string {
  if (unit === 'percent') return `${num}%`;
  if (unit === 'count') return formatCompactCount(num);
  // fraction: 2 significant figures, trailing zeros stripped
  return num.toPrecision(2).replace(/\.?0+$/, '');
}

// ---------------------------------------------------------------------------
// SVG layout constants
// ---------------------------------------------------------------------------

const W = 480;
const H = 200;
const PAD_L = 12;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 32;

const USABLE_W = W - PAD_L - PAD_R;
const USABLE_H = H - PAD_T - PAD_B;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WagerHistogram({
  bins,
  userGuess,
  trueAnswer,
  scoring,
  unit,
  n,
  className,
}: WagerHistogramProps): JSX.Element {
  if (bins.length === 0) {
    return (
      <div
        className={`rounded-xl border border-dashed bg-muted/30 px-6 py-8 text-center ${className ?? ''}`}
      >
        <p className="text-sm text-muted-foreground">No submissions to display yet.</p>
      </div>
    );
  }

  // ---- x-coordinate mapping ------------------------------------------------
  // For log scoring, all x positions are computed in log10 space.
  // Bucket lo/hi are stored as actual values; we log10-transform for position.

  const leftBound = bins[0].lo;
  const rightBound = bins[bins.length - 1].hi;

  let xOf: (val: number) => number;
  let ticks: number[];

  if (scoring === 'log') {
    const logLeft = Math.log10(Math.max(leftBound, 1e-10));
    const logRight = Math.log10(Math.max(rightBound, 1e-10));
    const logRange = logRight - logLeft || 1;

    xOf = (val: number) => {
      const logVal = Math.log10(Math.max(val, 1e-10));
      return PAD_L + ((logVal - logLeft) / logRange) * USABLE_W;
    };

    // Ticks at major powers of 10 within the data range
    const firstPow = Math.ceil(logLeft);
    const lastPow = Math.floor(logRight);
    const powTicks: number[] = [];
    for (let p = firstPow; p <= lastPow; p++) {
      powTicks.push(Math.pow(10, p));
    }
    // Fallback: show endpoints if no powers of 10 fit
    ticks = powTicks.length > 0 ? powTicks : [leftBound, rightBound];
  } else {
    const absRange = rightBound - leftBound || 1;
    xOf = (val: number) => PAD_L + ((val - leftBound) / absRange) * USABLE_W;

    // 6 evenly-spaced ticks
    const step = (rightBound - leftBound) / 6;
    ticks = Array.from({ length: 7 }, (_, i) => leftBound + i * step);
  }

  // ---- y-coordinate mapping ------------------------------------------------

  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const barBase = PAD_T + USABLE_H;

  const userX = xOf(userGuess);
  const trueX = xOf(trueAnswer);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? 'w-full'}
      role="img"
      aria-label={`Distribution of ${n} guesses. True answer: ${trueAnswer}. Your guess: ${userGuess}.`}
      aria-hidden={false}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Baseline */}
      <line
        x1={PAD_L}
        y1={barBase}
        x2={W - PAD_R}
        y2={barBase}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={1}
      />

      {/* Bars */}
      {bins.map((b, i) => {
        const x1 = xOf(b.lo);
        const x2 = xOf(b.hi);
        const barW = Math.max(1, x2 - x1 - 1);
        const barH = (b.count / maxCount) * USABLE_H;
        return (
          <rect
            key={i}
            x={x1}
            y={barBase - barH}
            width={barW}
            height={barH}
            fill="var(--violet-base)"
            fillOpacity={0.45}
            rx={2}
          />
        );
      })}

      {/* True-answer marker: green dashed vertical line */}
      <line
        x1={trueX}
        y1={PAD_T}
        x2={trueX}
        y2={barBase}
        stroke="var(--green-base)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* User-guess marker: violet solid vertical line + dot at top */}
      <line
        x1={userX}
        y1={PAD_T}
        x2={userX}
        y2={barBase}
        stroke="var(--violet-base)"
        strokeWidth={2.5}
      />
      <circle cx={userX} cy={PAD_T} r={4} fill="var(--violet-base)" />

      {/* Axis tick marks + labels */}
      {ticks.map((tick, i) => {
        const tx = xOf(tick);
        if (tx < PAD_L - 4 || tx > W - PAD_R + 4) return null;
        return (
          <g key={i}>
            <line
              x1={tx}
              y1={barBase}
              x2={tx}
              y2={barBase + 4}
              stroke="currentColor"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
            <text
              x={tx}
              y={H - 4}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.5}
            >
              {formatTickValue(tick, unit)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
