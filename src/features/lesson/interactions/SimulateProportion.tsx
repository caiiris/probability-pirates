import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coin } from '@/components/illustrations/Coin';
import { Die } from '@/components/illustrations/Die';
import type { SimulateProportionVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { MOTION } from '@/lib/motion';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';
import { ProportionChart } from './ProportionChart';
import { flipIsHeads, randomBirthdays, hasSharedBirthday } from '@/lib/simulations';

const AFFORDANCE = 'Run trials and watch the share settle. Run more to see it steady.';
const MAX_SAMPLES = 160;

type Props = InteractionProps<SimulateProportionVariant>;

type ScenarioMeta = {
  noun: string;
  nounPlural: string;
  successLabel: string;
  steps: number[];
};

const SCENARIOS: Record<SimulateProportionVariant['scenario'], ScenarioMeta> = {
  coin: { noun: 'flip', nounPlural: 'flips', successLabel: 'heads', steps: [1, 10, 50] },
  'die-six': { noun: 'roll', nounPlural: 'rolls', successLabel: 'sixes', steps: [1, 10, 50] },
  birthday: {
    noun: 'room',
    nounPlural: 'rooms',
    successLabel: 'with a match',
    steps: [1, 25, 100],
  },
};

/** Keeps a bounded, evenly-spaced view of the proportion history so the chart stays cheap. */
function decimate(arr: number[], max: number): number[] {
  if (arr.length <= max) return arr;
  const out: number[] = [];
  const stride = arr.length / max;
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * stride)]);
  out[out.length - 1] = arr[arr.length - 1];
  return out;
}

type LastTrial =
  | { kind: 'coin'; heads: boolean }
  | { kind: 'die'; face: number }
  | { kind: 'birthday'; room: number[]; match: boolean };

export function SimulateProportion({ variant, feedbackState, onChange }: Props) {
  const meta = SCENARIOS[variant.scenario];
  const roomSize = variant.roomSize ?? 23;
  const locked = feedbackState === 'correct';
  const [hintVisible, dismissHint] = useInteractionHint('simulate-proportion');

  const [trials, setTrials] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [samples, setSamples] = useState<number[]>([]);
  const [last, setLast] = useState<LastTrial | null>(null);

  // Refs hold the live totals so a multi-trial batch accumulates correctly
  // without depending on the async state value.
  const trialsRef = useRef(0);
  const successesRef = useRef(0);

  const runBatch = useCallback(
    (k: number) => {
      if (locked) return;
      let s = successesRef.current;
      let t = trialsRef.current;
      const fresh: number[] = [];
      let lastTrial: LastTrial | null = null;

      for (let i = 0; i < k; i++) {
        let success = false;
        if (variant.scenario === 'birthday') {
          const room = randomBirthdays(roomSize);
          success = hasSharedBirthday(room);
          lastTrial = { kind: 'birthday', room, match: success };
        } else if (variant.scenario === 'die-six') {
          const face = Math.floor(Math.random() * 6) + 1;
          success = face === 6;
          lastTrial = { kind: 'die', face };
        } else {
          const heads = flipIsHeads();
          success = heads;
          lastTrial = { kind: 'coin', heads };
        }
        if (success) s++;
        t++;
        fresh.push(s / t);
      }

      successesRef.current = s;
      trialsRef.current = t;
      setSuccesses(s);
      setTrials(t);
      setSamples((prev) => decimate([...prev, ...fresh], MAX_SAMPLES));
      setLast(lastTrial);
      onChange(t >= variant.minTrials ? { trials: t } : null);
    },
    [locked, variant.scenario, variant.minTrials, roomSize, onChange],
  );

  const pct = trials > 0 ? Math.round((successes / trials) * 100) : 0;
  const reached = trials >= variant.minTrials;

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      <LastTrialVisual last={last} trials={trials} />

      <div className="w-full flex flex-col items-center gap-1 text-foreground">
        <ProportionChart
          series={[{ points: samples, stroke: 'var(--primary)' }]}
          references={[{ y: variant.targetProbability, label: variant.targetLabel }]}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span
            className="inline-block w-4 border-t-2 border-dashed border-foreground/60"
            aria-hidden="true"
          />
          {variant.targetLabel}
        </p>
      </div>

      {/* Running stat */}
      <p className="text-base font-semibold tabular-nums" aria-live="polite">
        {trials === 0 ? (
          <span className="text-muted-foreground">No {meta.nounPlural} yet</span>
        ) : (
          <>
            {successes} {meta.successLabel} in {trials} {meta.nounPlural} ={' '}
            <span className="text-primary">{pct}%</span>
          </>
        )}
      </p>

      {/* Run buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {meta.steps.map((step) => (
          <button
            key={step}
            type="button"
            disabled={locked}
            onClick={() => runBatch(step)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            +{step} {step === 1 ? meta.noun : meta.nounPlural}
          </button>
        ))}
      </div>

      {/* Progress toward the engagement gate */}
      {!reached && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {trials} / {variant.minTrials} {meta.nounPlural}
        </p>
      )}
    </div>
  );
}

function LastTrialVisual({ last, trials }: { last: LastTrial | null; trials: number }) {
  if (!last) {
    return (
      <div className="h-14 flex items-center text-sm text-muted-foreground">
        Press a button to start.
      </div>
    );
  }

  if (last.kind === 'coin') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={trials}
          initial={{ rotateX: 60, opacity: 0.5 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={MOTION.pop}
          className="h-14 flex items-center"
        >
          <Coin side={last.heads ? 'H' : 'T'} className="w-12 h-12 text-primary" />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (last.kind === 'die') {
    const isSix = last.face === 6;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={trials}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={MOTION.pop}
          className={`h-14 flex items-center rounded-xl px-1 ${isSix ? 'ring-2 ring-emerald-500' : ''}`}
        >
          <Die value={last.face} className="w-12 h-12" />
        </motion.div>
      </AnimatePresence>
    );
  }

  return <BirthdayRoom room={last.room} match={last.match} />;
}

function BirthdayRoom({ room, match }: { room: number[]; match: boolean }) {
  // Mark every person whose birthday is shared so collisions read at a glance.
  const counts = new Map<number, number>();
  for (const d of room) counts.set(d, (counts.get(d) ?? 0) + 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-1 max-w-xs">
        {room.map((day, i) => {
          const shared = (counts.get(day) ?? 0) > 1;
          return (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full ${shared ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
              aria-hidden="true"
            />
          );
        })}
      </div>
      <p className={`text-xs font-medium ${match ? 'text-emerald-700' : 'text-muted-foreground'}`}>
        {match ? 'Shared birthday in this room' : 'No match in this room'}
      </p>
    </div>
  );
}
