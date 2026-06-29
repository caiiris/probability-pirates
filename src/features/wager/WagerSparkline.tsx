/**
 * WagerSparkline — tiny inline SVG line chart of the user's last ≤10 wager
 * scores (0–100), oldest to newest. Shows a linear regression trendline when
 * N ≥ 3 (dashed, lighter violet). Empty state for N === 0.
 *
 * Intentionally compact (~40 LoC of SVG logic). No charting library.
 */

export type WagerSparklineProps = {
  /** 0–100, oldest to newest, up to 10 entries. */
  scores: number[];
  className?: string;
};

const W = 280;
const H = 64;
const PAD = 6;

const USABLE_W = W - PAD * 2;
const USABLE_H = H - PAD * 2;

function xAt(i: number, n: number): number {
  return PAD + (n <= 1 ? USABLE_W / 2 : (i / (n - 1)) * USABLE_W);
}

function yAt(score: number): number {
  return PAD + (1 - score / 100) * USABLE_H;
}

/** Linear regression: returns { slope, intercept } or null when degenerate. */
function linearRegression(
  scores: number[],
): { slope: number; intercept: number } | null {
  const n = scores.length;
  if (n < 3) return null;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function WagerSparkline({ scores, className }: WagerSparklineProps): JSX.Element {
  const n = scores.length;

  if (n === 0) {
    return (
      <p className={`text-xs text-muted-foreground ${className ?? ''}`}>
        Submit a wager to see your calibration over time.
      </p>
    );
  }

  const points = scores.map((s, i) => `${xAt(i, n)},${yAt(s)}`).join(' ');

  const reg = linearRegression(scores);
  let trendPoints: string | null = null;
  if (reg) {
    const { slope, intercept } = reg;
    const y0 = intercept;
    const y1 = slope * (n - 1) + intercept;
    trendPoints = `${xAt(0, n)},${yAt(y0)} ${xAt(n - 1, n)},${yAt(y1)}`;
  }

  const label = `Calibration trend over your last ${n} wager${n === 1 ? '' : 's'}; latest score ${scores[n - 1]}.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? 'w-full max-w-xs'}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Faint midpoint gridline at score=50 */}
      <line
        x1={PAD}
        y1={yAt(50)}
        x2={W - PAD}
        y2={yAt(50)}
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* Trendline (linear regression, N ≥ 3) */}
      {trendPoints && (
        <polyline
          points={trendPoints}
          fill="none"
          stroke="var(--violet-base)"
          strokeOpacity={0.3}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
      )}

      {/* Score line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--violet-base)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dot for the latest score */}
      <circle
        cx={xAt(n - 1, n)}
        cy={yAt(scores[n - 1])}
        r={3}
        fill="var(--violet-base)"
      />
    </svg>
  );
}
