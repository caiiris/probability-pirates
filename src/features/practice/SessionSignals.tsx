/**
 * SessionSignals — live session stats displayed during a practice session (WP-6c).
 *
 * Pure presentational component; all counts come from PracticeSession state.
 * Renders:
 *   - Solved count (correct answers this session)
 *   - Current correct-in-a-row streak
 *   - Small rating-trend indicator (last up-to-5 results)
 */

import { TrendingUp, TrendingDown, Minus, CheckCircle2, Flame } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionSignalsProps = {
  /** Total correct answers this session. */
  solved: number;
  /** Current run of consecutive correct answers (resets on wrong). */
  correctStreak: number;
  /** Recent graded results (newest last); used to compute rating trend. */
  recentResults: boolean[];
};

// ─── Trend helper ─────────────────────────────────────────────────────────────

type Trend = 'up' | 'down' | 'neutral';

function computeTrend(results: boolean[]): Trend {
  if (results.length < 2) return 'neutral';
  // Split into two halves; compare correct rates.
  const mid = Math.floor(results.length / 2);
  const first = results.slice(0, mid);
  const second = results.slice(mid);
  const rateFirst = first.filter(Boolean).length / first.length;
  const rateSecond = second.filter(Boolean).length / second.length;
  if (rateSecond > rateFirst + 0.1) return 'up';
  if (rateSecond < rateFirst - 0.1) return 'down';
  return 'neutral';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionSignals({ solved, correctStreak, recentResults }: SessionSignalsProps) {
  if (solved === 0 && recentResults.length === 0) return null;

  const trend = computeTrend(recentResults);

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-[color:var(--green-deep)]'
      : trend === 'down'
        ? 'text-[color:var(--coral-deep)]'
        : 'text-muted-foreground';
  const trendLabel =
    trend === 'up' ? 'Improving' : trend === 'down' ? 'Struggling' : 'Steady';

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground"
      aria-label="Session stats"
    >
      {/* Solved count */}
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-[color:var(--green-base)]" aria-hidden="true" />
        <span>
          <span className="font-semibold text-foreground">{solved}</span> solved
        </span>
      </span>

      {/* Correct streak */}
      {correctStreak >= 2 && (
        <span className="flex items-center gap-1 text-[color:var(--amber-deep,#92400e)]">
          <Flame className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-semibold">{correctStreak}</span>
          <span className="text-muted-foreground">in a row</span>
        </span>
      )}

      {/* Rating trend */}
      {recentResults.length >= 2 && (
        <span className={`flex items-center gap-1 ${trendColor}`} aria-label={`Trend: ${trendLabel}`}>
          <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{trendLabel}</span>
        </span>
      )}
    </div>
  );
}
