import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScrubTrialsVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { cumulativeSuccesses } from '@/lib/simulations';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';

/**
 * "Scrub the trials" — drag a slider from a small N up to a large N and watch
 * two buckets of falling balls (H on the left, T on the right) settle at
 * the true probability. Pedagogically: make the long-run convergence
 * something you *feel* by dragging, not just a chart someone else animated.
 *
 * The bucket-of-balls visualization is inspired by Brown University's
 * Seeing Theory project (https://seeingtheory.io), which pioneered the
 * pedagogical pattern of "watch the share settle as you flip more." Code
 * is original (their work is D3.js / SVG; ours is React + Framer Motion);
 * the pedagogical idea is the borrow.
 *
 * Determinism: the H/T sequence is fixed by `variant.seed` (default 0xC0DE),
 * so `result[N]` is the same on every render. The user can scrub back and
 * forth without the visualization re-rolling and feeling jittery.
 *
 * Engagement gate: Continue stays disabled until the slider has reached
 * `variant.reachN` — a low bar that just confirms the learner swept past the
 * wobbly low-N region.
 */
type Props = InteractionProps<ScrubTrialsVariant>;

const AFFORDANCE = 'Drag the slider to flip more times. Watch the share settle.';

// Logarithmic-ish stops the slider snaps to. Reads better than a smooth
// linear scale — the difference between 10 → 100 is huge, and between 9,000
// → 10,000 is small, so the slider's "feel" should mirror that.
const STEPS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000] as const;

function scenarioCopy(scenario: ScrubTrialsVariant['scenario']) {
  if (scenario === 'coin') {
    return {
      trialNoun: 'flip',
      trialNounPlural: 'flips',
      successNoun: 'heads',
      failureNoun: 'tails',
    };
  }
  return {
    trialNoun: 'roll',
    trialNounPlural: 'rolls',
    successNoun: 'sixes',
    failureNoun: 'other faces',
  };
}

function clampStepIdx(steps: readonly number[], minN: number, maxN: number): number[] {
  // Filter the canonical step ladder down to the variant's actual range.
  return steps.filter((n) => n >= minN && n <= maxN);
}

export function ScrubTrials({ variant, feedbackState, onChange }: Props) {
  const seed = variant.seed ?? 0xc0de;
  const [hintVisible, dismissHint] = useInteractionHint('scrub-trials');

  // Trim the slider's stop list to the variant's allowed range, so authors
  // can shrink the demo without forking the component.
  const stops = useMemo(() => {
    const inRange = clampStepIdx(STEPS, variant.minN, variant.maxN);
    // Always include the explicit minN and maxN as stops, even if they
    // aren't on the canonical ladder, so the bar starts and ends exactly
    // where the variant says it should.
    const set = new Set<number>([variant.minN, ...inRange, variant.maxN]);
    return Array.from(set).sort((a, b) => a - b);
  }, [variant.minN, variant.maxN]);

  // Pre-compute cumulative successes once per variant. Reading the count at
  // any N is then a single array lookup. Cap at the topmost stop in case
  // the variant's maxN is huge.
  const cumulative = useMemo(
    () => cumulativeSuccesses(variant.scenario, stops[stops.length - 1], seed),
    [variant.scenario, stops, seed],
  );

  // The slider's value is an INDEX into `stops` (0…stops.length-1), not a
  // raw N. That's how we get a logarithmic-feeling slider on top of a
  // standard <input type="range">.
  const [stepIdx, setStepIdx] = useState(0);
  const [highWaterIdx, setHighWaterIdx] = useState(0);

  const N = stops[stepIdx];
  const successes = cumulative[N];
  const share = successes / N;
  const sharePct = (share * 100).toFixed(N >= 1000 ? 2 : 1);
  const reached = stops[highWaterIdx] >= variant.reachN;
  const copy = scenarioCopy(variant.scenario);
  const locked = feedbackState === 'correct';

  // Notify the parent every time the high-water mark crosses the gate. The
  // payload is the largest N the learner has reached — not the current N —
  // so a learner who scrubs forward then back still gets credit.
  useEffect(() => {
    onChange(reached ? { trials: stops[highWaterIdx] } : null);
  }, [reached, highWaterIdx, stops, onChange]);

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      {/* Running stat — large, calm, the headline number for the bar below. */}
      <div className="flex flex-col items-center gap-1 text-center" aria-live="polite">
        <p className="text-3xl font-semibold tabular-nums text-primary">
          {sharePct}%
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {successes.toLocaleString()} {copy.successNoun} in {N.toLocaleString()} {copy.trialNounPlural}
        </p>
      </div>

      {/* The buckets. Two stacks of falling balls (successes left, failures
          right), each filling bottom-up in proportion to its share of N.
          A dashed reference line cuts across both at the target probability
          so the learner can see "where they ought to land" even at small N.
          As N grows and the share converges, both stacks settle right at
          the line — that is the visible payoff of the lesson. */}
      <BallBuckets
        share={share}
        target={variant.targetProbability}
        targetLabel={variant.targetLabel}
        successLabel={copy.successNoun}
        failureLabel={copy.failureNoun}
      />

      {/* The slider. A <input type="range"> over indices, so we get
          accessible keyboard support and native screen-reader semantics
          for free. The visible labels under the track are the actual N
          values, anchored to the slider's full width. */}
      <div className="w-full max-w-md flex flex-col gap-2">
        <input
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={stepIdx}
          disabled={locked}
          onChange={(e) => {
            const next = Number(e.target.value);
            setStepIdx(next);
            setHighWaterIdx((prev) => Math.max(prev, next));
          }}
          aria-label={`Number of ${copy.trialNounPlural}`}
          aria-valuemin={stops[0]}
          aria-valuemax={stops[stops.length - 1]}
          aria-valuenow={N}
          aria-valuetext={`${N.toLocaleString()} ${copy.trialNounPlural}`}
          className="w-full accent-[color:var(--primary)] disabled:opacity-50"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{stops[0].toLocaleString()}</span>
          <span>{stops[stops.length - 1].toLocaleString()}</span>
        </div>
      </div>

      {/* Engagement gate progress. Hidden once the gate is cleared so the
          UI doesn't keep nagging after the learner has obviously engaged. */}
      {!reached && (
        <p className="text-xs text-muted-foreground tabular-nums text-center max-w-md">
          Drag past <span className="font-semibold">{variant.reachN.toLocaleString()}</span> {copy.trialNounPlural}{' '}
          to keep going. The wobble dies down past then.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Two falling-ball buckets (the "watch it settle" visualization)
// ---------------------------------------------------------------------------
// Layout knobs. Each bucket holds BUCKET_COLS × BUCKET_ROWS visible balls;
// the count rendered is `share × max` for the H bucket (and the complement
// for T), so balls "shift" between buckets as the share moves. Animations
// (drop in / fade out, ~180ms) make rapid scrubs read as balls falling
// rather than snapping in.
const BUCKET_COLS = 8;
const BUCKET_ROWS = 8;
const BUCKET_MAX = BUCKET_COLS * BUCKET_ROWS; // 64 balls per side
const CELL = 11; // px between ball centers
const BALL = 7; // px ball diameter
const BUCKET_W = BUCKET_COLS * CELL;
const BUCKET_H = BUCKET_ROWS * CELL;

function BallBuckets({
  share,
  target,
  targetLabel,
  successLabel,
  failureLabel,
}: {
  share: number;
  target: number;
  targetLabel: string;
  successLabel: string;
  failureLabel: string;
}) {
  const successCount = Math.round(BUCKET_MAX * Math.max(0, Math.min(1, share)));
  const failureCount = BUCKET_MAX - successCount;

  // Reference line measured from the bottom of the ball grid only — at
  // target=0.5 it sits on the visual midline. The line must NOT be
  // positioned from the outer card bottom: the H/T labels sit below the
  // grids and were pulling the line up to ~25% when target was 1/2.
  const refOffsetFromBottom = Math.max(0, Math.min(1, target)) * BUCKET_H;

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-2">
      <div
        className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg border border-border bg-muted/40"
        aria-label={`${(share * 100).toFixed(1)}% ${successLabel}, the rest ${failureLabel}`}
        role="img"
      >
        {/* Grids only — the dashed reference is positioned inside this
            wrapper so it lines up with the ball rows, not the labels. */}
        <div className="relative flex justify-center gap-6" style={{ height: BUCKET_H }}>
          <BucketGrid count={successCount} variant="success" />
          <BucketGrid count={failureCount} variant="failure" />
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-foreground/45 pointer-events-none"
            style={{ bottom: refOffsetFromBottom }}
            aria-hidden="true"
          />
        </div>
        <div className="flex justify-center gap-6" style={{ width: BUCKET_W * 2 + 24 }}>
          <span className="text-xs font-semibold tabular-nums text-primary" style={{ width: BUCKET_W, textAlign: 'center' }}>
            H
          </span>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground" style={{ width: BUCKET_W, textAlign: 'center' }}>
            T
          </span>
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <span
          className="inline-block w-4 border-t-2 border-dashed border-foreground/45"
          aria-hidden="true"
        />
        {targetLabel}
      </p>
    </div>
  );
}

/** One bucket of stacked balls — grid only; labels render outside. */
function BucketGrid({
  count,
  variant,
}: {
  count: number;
  variant: 'success' | 'failure';
}) {
  const fillColor =
    variant === 'success' ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 35%, transparent)';

  return (
    <div
      className="relative"
      style={{ width: BUCKET_W, height: BUCKET_H }}
      aria-hidden="true"
    >
        {/* Ghost grid: every cell drawn faintly so the empty bucket reads
            as "capacity," and balls appear to fall *into* something
            rather than sitting on nothing. */}
        {Array.from({ length: BUCKET_MAX }).map((_, i) => {
          const row = Math.floor(i / BUCKET_COLS); // 0 = bottom row
          const col = i % BUCKET_COLS;
          const left = col * CELL + (CELL - BALL) / 2;
          const bottom = row * CELL + (CELL - BALL) / 2;
          return (
            <div
              key={`ghost-${i}`}
              className="absolute rounded-full border border-foreground/8"
              style={{ width: BALL, height: BALL, left, bottom }}
            />
          );
        })}

        {/* Live balls. AnimatePresence drops them in from above (y: -10 →
            0) and lifts them out (y: -6) when the count shrinks, so
            scrubbing the slider reads as balls settling rather than
            snapping. */}
        <AnimatePresence>
          {Array.from({ length: count }).map((_, i) => {
            const row = Math.floor(i / BUCKET_COLS);
            const col = i % BUCKET_COLS;
            const left = col * CELL + (CELL - BALL) / 2;
            const bottom = row * CELL + (CELL - BALL) / 2;
            return (
              <motion.div
                key={`ball-${i}`}
                className="absolute rounded-full"
                style={{
                  width: BALL,
                  height: BALL,
                  left,
                  bottom,
                  background: fillColor,
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            );
          })}
        </AnimatePresence>
    </div>
  );
}

