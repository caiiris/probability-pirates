import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoadForkFigure as Variant } from '@/content/types';

/**
 * Autonomous looping "fork in the road" animation for the multiplication
 * principle. Reads left to right:
 *
 *   START ──┬── route 1 ──┬── end
 *           ├── route 2 ──┼── end
 *           └── route 3 ──┴── end
 *
 * Phase 0: blank
 * Phase 1: start dot + trunk road
 * Phase 2: first fork (`stageA.count` routes)
 * Phase 3: second forks on each route (`stageB.count` endpoints each)
 * Phase 4: optional product caption
 *
 * Same pedagogical job as `TreeDiagramFigure`, different metaphor. Pure
 * observation — no learner input.
 */
type Props = Variant;

const DEFAULT_STEP_MS = 900;
const DEFAULT_HOLD_MS = 2400;
const WIDTH = 380;
const HEIGHT = 240;
const START_X = 36;
const FORK1_X = 110;
const FORK2_X = 220;
const END_X = 320;

function laneYs(count: number, centerY: number, spread: number): number[] {
  if (count <= 1) return [centerY];
  const half = (spread * (count - 1)) / 2;
  return Array.from({ length: count }, (_, i) => centerY - half + (spread * i));
}

export function RoadForkFigure({
  stageA,
  stageB,
  caption,
  showProduct,
  stepMs = DEFAULT_STEP_MS,
  holdMs = DEFAULT_HOLD_MS,
}: Props) {
  const [phase, setPhase] = useState(0);
  const maxPhase = showProduct ? 4 : 3;
  const centerY = HEIGHT / 2;
  const aYs = laneYs(stageA.count, centerY, 28);
  const product = stageA.count * stageB.count;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setPhase((prev) => {
        const next = prev >= maxPhase ? 0 : prev + 1;
        const delay = prev === maxPhase || next === 0 ? holdMs : stepMs;
        timer = setTimeout(tick, delay);
        return next;
      });
    };
    timer = setTimeout(tick, stepMs);
    return () => clearTimeout(timer);
  }, [stepMs, holdMs, maxPhase]);

  return (
    <figure className="space-y-3">
      <div
        className="rounded-xl border bg-muted/30 px-3 py-4"
        role="img"
        aria-label={`Road fork: ${stageA.count} ${stageA.label} choices, then ${stageB.count} ${stageB.label} choices each, ${product} routes total`}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto block w-full max-w-[24rem]"
        >
          {/* Stage labels along the top */}
          <text x={START_X} y={16} fontSize={9} className="fill-muted-foreground">
            start
          </text>
          <text x={FORK1_X - 20} y={16} fontSize={9} className="fill-muted-foreground">
            {stageA.label}
          </text>
          <text x={FORK2_X - 24} y={16} fontSize={9} className="fill-muted-foreground">
            {stageB.label}
          </text>

          {/* Trunk road */}
          {phase >= 1 && (
            <motion.line
              x1={START_X + 8}
              y1={centerY}
              x2={FORK1_X}
              y2={centerY}
              stroke="#78716c"
              strokeWidth={5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
            />
          )}

          {/* First fork: center to each stage-A lane */}
          {phase >= 2 &&
            aYs.map((y, i) => (
              <motion.path
                key={`fork1-${i}`}
                d={`M ${FORK1_X} ${centerY} L ${FORK2_X - 20} ${y}`}
                fill="none"
                stroke="#78716c"
                strokeWidth={4}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              />
            ))}

          {/* Second fork: each stage-A lane to stage-B endpoints */}
          {phase >= 3 &&
            aYs.flatMap((aY, ai) => {
              const bSpread = Math.min(36, 60 / stageB.count);
              const bYs = laneYs(stageB.count, aY, bSpread);
              return bYs.map((bY, bi) => (
                <motion.line
                  key={`fork2-${ai}-${bi}`}
                  x1={FORK2_X - 20}
                  y1={aY}
                  x2={END_X}
                  y2={bY}
                  stroke="#a8a29e"
                  strokeWidth={3}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.28, delay: (ai * stageB.count + bi) * 0.04 }}
                />
              ));
            })}

          {/* Start node */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.circle
                key="start"
                cx={START_X}
                cy={centerY}
                r={10}
                className="fill-primary stroke-primary"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              />
            )}
          </AnimatePresence>

          {/* First-fork nodes */}
          <AnimatePresence>
            {phase >= 2 &&
              aYs.map((y, i) => (
                <motion.circle
                  key={`a-${i}`}
                  cx={FORK2_X - 20}
                  cy={y}
                  r={7}
                  className="fill-card stroke-[#78716c]"
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22, delay: i * 0.05 }}
                />
              ))}
          </AnimatePresence>

          {/* Endpoints */}
          <AnimatePresence>
            {phase >= 3 &&
              aYs.flatMap((aY, ai) => {
                const bSpread = Math.min(36, 60 / stageB.count);
                const bYs = laneYs(stageB.count, aY, bSpread);
                return bYs.map((bY, bi) => (
                  <motion.circle
                    key={`end-${ai}-${bi}`}
                    cx={END_X}
                    cy={bY}
                    r={5}
                    className="fill-[color:var(--green-soft)] stroke-[color:var(--green-base)]"
                    strokeWidth={1.5}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 360,
                      damping: 22,
                      delay: (ai * stageB.count + bi) * 0.04,
                    }}
                  />
                ));
              })}
          </AnimatePresence>

          {/* Product */}
          <AnimatePresence>
            {phase >= 4 && showProduct && (
              <motion.text
                key="product"
                x={WIDTH / 2}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                className="fill-foreground"
                initial={{ opacity: 0, y: HEIGHT }}
                animate={{ opacity: 1, y: HEIGHT - 8 }}
                exit={{ opacity: 0 }}
              >
                {stageA.count} × {stageB.count} = {product} routes
              </motion.text>
            )}
          </AnimatePresence>
        </svg>
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
