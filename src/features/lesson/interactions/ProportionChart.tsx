/**
 * A small dependency-free SVG line chart for the simulation interactions.
 * Plots one or more proportion series (y in 0..1) against trial index, with
 * optional horizontal reference lines (the theoretical probability). Custom
 * SVG per `docs/ui-stack.md` (no chart library in Phase 1).
 */

export type ChartSeries = {
  /** Proportion values in 0..1, one per recorded sample. */
  points: number[];
  /** Stroke color (CSS color or var()). */
  stroke: string;
  label?: string;
};

export type ChartReference = {
  /** y position in 0..1. */
  y: number;
  label: string;
  stroke?: string;
};

type Props = {
  series: ChartSeries[];
  references?: ChartReference[];
  /** Pixel height of the drawing area; width is fluid. */
  className?: string;
};

const W = 320;
const H = 150;
const PAD_L = 30;
const PAD_R = 28;
const PAD_T = 8;
const PAD_B = 18;

function xAt(index: number, count: number): number {
  if (count <= 1) return PAD_L;
  const usable = W - PAD_L - PAD_R;
  return PAD_L + (index / (count - 1)) * usable;
}

function yAt(p: number): number {
  const usable = H - PAD_T - PAD_B;
  return PAD_T + (1 - p) * usable;
}

export function ProportionChart({ series, references = [], className }: Props) {
  const maxCount = Math.max(1, ...series.map((s) => s.points.length));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? 'w-full max-w-md h-40'}
      role="img"
      aria-label="Running proportion over many trials"
      preserveAspectRatio="none"
    >
      {/* y axis gridlines at 0, 0.5, 1 */}
      {[0, 0.5, 1].map((g) => (
        <g key={g}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yAt(g)}
            y2={yAt(g)}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeWidth={1}
          />
          <text
            x={PAD_L - 5}
            y={yAt(g) + 3}
            textAnchor="end"
            fontSize={9}
            fill="currentColor"
            fillOpacity={0.45}
          >
            {g === 0.5 ? '½' : g}
          </text>
        </g>
      ))}

      {/* reference lines (theoretical probability) */}
      {references.map((ref, i) => (
        <g key={`ref-${i}`}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yAt(ref.y)}
            y2={yAt(ref.y)}
            stroke={ref.stroke ?? '#0f172a'}
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <text
            x={W - PAD_R + 4}
            y={yAt(ref.y) + 3}
            textAnchor="start"
            fontSize={9}
            fill="currentColor"
            fillOpacity={0.55}
          >
            {ref.label}
          </text>
        </g>
      ))}

      {/* series polylines */}
      {series.map((s, i) =>
        s.points.length === 0 ? null : (
          <polyline
            key={`series-${i}`}
            fill="none"
            stroke={s.stroke}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.points
              .map(
                (p, idx) =>
                  `${xAt(idx, s.points.length === 1 ? maxCount : s.points.length)},${yAt(p)}`,
              )
              .join(' ')}
          />
        ),
      )}
    </svg>
  );
}
