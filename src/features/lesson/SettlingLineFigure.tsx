import { useMemo } from 'react';
import type { ConceptFigure } from '@/content/types';
import { cumulativeSuccesses } from '@/lib/simulations';
import { ProportionChart } from './interactions/ProportionChart';

/**
 * Static convergence chart used inside concept slots. Shows the running
 * fraction of successes over many trials, with a horizontal reference at
 * the long-run probability. The line is wild on the left (few trials,
 * fraction can sit anywhere from 0 to 1) and tightens to the reference on
 * the right (many trials, fraction barely moves). Pedagogy: lets the
 * learner see the convergence story as a settling line in addition to
 * the falling-balls slider, without re-driving the simulation.
 *
 * Determinism: same seed produces the same picture. The `seed` prop on
 * the variant is what lets a single canonical "this is what convergence
 * looks like" image render the same way every time.
 */
type Props = Extract<ConceptFigure, { kind: 'settling-line' }>;

const DEFAULT_TRIAL_COUNT = 10_000;
const DEFAULT_SEED = 0xc0de;
// 200 evenly-spaced sample points keeps the SVG cheap while still showing
// the wobble on the left-hand side of the chart. With 10,000 trials and
// 200 samples, each sample averages 50 trials of progress — enough that
// adjacent samples differ visibly at low N (where wobbles are big) and
// blur into a steady line at high N (where they are tiny).
const SAMPLE_POINTS = 200;

export function SettlingLineFigure({
  scenario,
  targetProbability,
  targetLabel,
  trialCount = DEFAULT_TRIAL_COUNT,
  seed = DEFAULT_SEED,
  caption,
}: Props) {
  const points = useMemo(() => {
    const cumulative = cumulativeSuccesses(scenario, trialCount, seed);
    const out: number[] = [];
    for (let i = 0; i < SAMPLE_POINTS; i++) {
      const t = i / (SAMPLE_POINTS - 1);
      const N = Math.max(1, Math.round(t * trialCount));
      out.push(cumulative[N] / N);
    }
    return out;
  }, [scenario, trialCount, seed]);

  return (
    <figure className="space-y-2">
      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-foreground">
        <ProportionChart
          series={[{ points, stroke: 'var(--primary)' }]}
          references={[{ y: targetProbability, label: targetLabel }]}
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>1</span>
          <span>{trialCount.toLocaleString()} flips</span>
        </div>
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
