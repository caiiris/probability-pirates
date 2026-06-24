import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Door } from '@/components/illustrations/Door';
import type { MontyHallVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { MOTION } from '@/lib/motion';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';
import { ProportionChart } from './ProportionChart';
import { setupMontyGame, switchTarget, montyHallWins, type MontyGame } from '@/lib/simulations';

const AFFORDANCE = 'Play a few rounds, then run a batch on autopilot to compare the strategies.';
const MAX_SAMPLES = 160;
const AUTO_BATCH = 100;

type Props = InteractionProps<MontyHallVariant>;
type Phase = 'pick' | 'revealed' | 'result';

type Tally = { games: number; wins: number };

function decimate(arr: number[], max: number): number[] {
  if (arr.length <= max) return arr;
  const out: number[] = [];
  const stride = arr.length / max;
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * stride)]);
  out[out.length - 1] = arr[arr.length - 1];
  return out;
}

export function MontyHall({ variant, feedbackState, onChange }: Props) {
  const locked = feedbackState === 'correct';
  const [hintVisible, dismissHint] = useInteractionHint('monty-hall');

  const [phase, setPhase] = useState<Phase>('pick');
  const [game, setGame] = useState<MontyGame | null>(null);
  const [finalDoor, setFinalDoor] = useState<number | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);

  const [switchTally, setSwitchTally] = useState<Tally>({ games: 0, wins: 0 });
  const [stayTally, setStayTally] = useState<Tally>({ games: 0, wins: 0 });
  const [switchHist, setSwitchHist] = useState<number[]>([]);
  const [stayHist, setStayHist] = useState<number[]>([]);

  // Live mirrors so an autopilot batch accumulates without stale state.
  const switchRef = useRef<Tally>({ games: 0, wins: 0 });
  const stayRef = useRef<Tally>({ games: 0, wins: 0 });

  const totalGames = switchTally.games + stayTally.games;

  const emitProgress = useCallback(
    (total: number) => {
      onChange(total >= variant.minGames ? { games: total } : null);
    },
    [onChange, variant.minGames],
  );

  const pickDoor = useCallback(
    (door: number) => {
      if (locked || phase !== 'pick') return;
      setGame(setupMontyGame(door));
      setFinalDoor(door);
      setPhase('revealed');
    },
    [locked, phase],
  );

  const decide = useCallback(
    (choseSwitch: boolean) => {
      if (!game || phase !== 'revealed') return;
      const chosen = choseSwitch ? switchTarget(game) : game.pick;
      const won = chosen === game.car;
      setFinalDoor(chosen);
      setLastWon(won);
      setPhase('result');

      if (choseSwitch) {
        const next = {
          games: switchRef.current.games + 1,
          wins: switchRef.current.wins + (won ? 1 : 0),
        };
        switchRef.current = next;
        setSwitchTally(next);
        setSwitchHist((prev) => decimate([...prev, next.wins / next.games], MAX_SAMPLES));
      } else {
        const next = {
          games: stayRef.current.games + 1,
          wins: stayRef.current.wins + (won ? 1 : 0),
        };
        stayRef.current = next;
        setStayTally(next);
        setStayHist((prev) => decimate([...prev, next.wins / next.games], MAX_SAMPLES));
      }
      emitProgress(switchRef.current.games + stayRef.current.games);
    },
    [game, phase, emitProgress],
  );

  const playAgain = useCallback(() => {
    setPhase('pick');
    setGame(null);
    setFinalDoor(null);
    setLastWon(null);
  }, []);

  const runAuto = useCallback(() => {
    if (locked) return;
    const sw = { ...switchRef.current };
    const st = { ...stayRef.current };
    const swFresh: number[] = [];
    const stFresh: number[] = [];

    for (let i = 0; i < AUTO_BATCH; i++) {
      if (montyHallWins('switch')) sw.wins++;
      sw.games++;
      swFresh.push(sw.wins / sw.games);

      if (montyHallWins('stay')) st.wins++;
      st.games++;
      stFresh.push(st.wins / st.games);
    }

    switchRef.current = sw;
    stayRef.current = st;
    setSwitchTally(sw);
    setStayTally(st);
    setSwitchHist((prev) => decimate([...prev, ...swFresh], MAX_SAMPLES));
    setStayHist((prev) => decimate([...prev, ...stFresh], MAX_SAMPLES));
    emitProgress(sw.games + st.games);
  }, [locked, emitProgress]);

  const switchPct =
    switchTally.games > 0 ? Math.round((switchTally.wins / switchTally.games) * 100) : 0;
  const stayPct = stayTally.games > 0 ? Math.round((stayTally.wins / stayTally.games) * 100) : 0;

  function doorState(door: number): 'closed' | 'goat' | 'car' {
    if (!game) return 'closed';
    if (phase === 'revealed') return door === game.revealed ? 'goat' : 'closed';
    if (phase === 'result') return door === game.car ? 'car' : 'goat';
    return 'closed';
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      {/* Doors */}
      <div className="flex justify-center gap-3">
        {[0, 1, 2].map((door) => {
          const isPicked = finalDoor === door;
          const ring =
            phase === 'result' && isPicked
              ? lastWon
                ? 'ring-2 ring-emerald-500'
                : 'ring-2 ring-rose-500'
              : isPicked && phase !== 'pick'
                ? 'ring-2 ring-primary'
                : '';
          return (
            <motion.button
              key={door}
              type="button"
              disabled={locked || phase !== 'pick'}
              onClick={() => pickDoor(door)}
              aria-label={`Door ${door + 1}`}
              className={`rounded-lg p-0.5 ${ring} ${phase === 'pick' && !locked ? 'cursor-pointer hover:ring-2 hover:ring-primary/40' : 'cursor-default'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              whileTap={phase === 'pick' && !locked ? { scale: 0.95 } : {}}
              transition={MOTION.pop}
            >
              <Door state={doorState(door)} label={`${door + 1}`} className="w-16 h-auto" />
            </motion.button>
          );
        })}
      </div>

      {/* Per-phase prompt + controls */}
      {phase === 'pick' && (
        <p className="text-sm text-muted-foreground">Pick a door to start a round.</p>
      )}
      {phase === 'revealed' && game && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            The host opened door {game.revealed + 1} to show a goat. Switch or stay?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => decide(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Switch to door {switchTarget(game) + 1}
            </button>
            <button
              type="button"
              onClick={() => decide(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-border hover:border-primary/40 active:scale-95 transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Stay with door {game.pick + 1}
            </button>
          </div>
        </div>
      )}
      {phase === 'result' && (
        <div className="flex flex-col items-center gap-2">
          <p
            className={`text-base font-semibold ${lastWon ? 'text-emerald-700' : 'text-rose-600'}`}
          >
            {lastWon ? 'You won the car.' : 'A goat. You lost this round.'}
          </p>
          <button
            type="button"
            disabled={locked}
            onClick={playAgain}
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-border hover:border-primary/40 active:scale-95 transition-all disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Play again
          </button>
        </div>
      )}

      {/* Autopilot + convergence */}
      <div className="w-full flex flex-col items-center gap-2 border-t pt-4">
        <button
          type="button"
          disabled={locked}
          onClick={runAuto}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Run {AUTO_BATCH} games on autopilot
        </button>

        {totalGames > 0 && (
          <>
            <div className="text-foreground">
              <ProportionChart
                series={[
                  { points: switchHist, stroke: '#22C55E' },
                  { points: stayHist, stroke: '#64748b' },
                ]}
                references={[
                  { y: 2 / 3, label: '2/3', stroke: '#22C55E' },
                  { y: 1 / 3, label: '1/3', stroke: '#64748b' },
                ]}
              />
            </div>
            <div className="flex gap-4 text-sm font-semibold tabular-nums">
              <span className="text-emerald-700">
                Switch {switchPct}%{' '}
                <span className="text-muted-foreground font-normal">
                  ({switchTally.wins}/{switchTally.games})
                </span>
              </span>
              <span className="text-slate-600">
                Stay {stayPct}%{' '}
                <span className="text-muted-foreground font-normal">
                  ({stayTally.wins}/{stayTally.games})
                </span>
              </span>
            </div>
          </>
        )}

        {totalGames < variant.minGames && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {totalGames} / {variant.minGames} games
          </p>
        )}
      </div>
    </div>
  );
}
