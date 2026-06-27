import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TreeDiagramFigure as Variant } from '@/content/types';

/**
 * Autonomous looping tree-diagram figure for the multiplication
 * principle. Renders a two-stage branching tree as SVG:
 *
 *                       (root)
 *                      / | ... \
 *           (stageA_1)      (stageA_a)
 *           / | ... \       / | ... \
 *         leaves...        leaves...     ←  a*b total
 *
 * The reveal happens in four steps so the multiplication is felt rather
 * than asserted:
 *   1. The root appears.
 *   2. The `a` stage-A nodes fan out, labeled.
 *   3. The `a*b` stage-B leaves branch out from each.
 *   4. Optionally, "a × b = N" prints under the tree.
 *
 * Then the whole thing holds for a beat and resets. No learner input.
 * The visible structure is the proof: every stage-A node has the same
 * `b` children, and the count of leaves is one row of the times table.
 */
type Props = Variant;

const DEFAULT_STEP_MS = 900;
const DEFAULT_HOLD_MS = 2400;

// SVG canvas geometry. The tree is laid out top-down: root on top, stage
// A in the middle band, stage B (leaves) at the bottom. The canvas
// width is sized to comfortably hold a*b leaves; the component scales
// the SVG to fit its container via `preserveAspectRatio`.
const WIDTH = 360;
const HEIGHT = 260;
const ROOT_Y = 28;
const STAGE_A_Y = 110;
const STAGE_B_Y = 210;
const NODE_R = 11;

type Coord = { x: number; y: number };

function evenlySpacedXs(count: number, totalWidth: number, leftPad = 28): number[] {
  if (count <= 1) return [totalWidth / 2];
  const usable = totalWidth - leftPad * 2;
  const step = usable / (count - 1);
  return Array.from({ length: count }, (_, i) => leftPad + i * step);
}

export function TreeDiagramFigure({
  stageA,
  stageB,
  caption,
  showProduct,
  stepMs = DEFAULT_STEP_MS,
  holdMs = DEFAULT_HOLD_MS,
}: Props) {
  // 0 = nothing, 1 = root, 2 = stage A nodes, 3 = stage B leaves,
  // 4 = product caption (if showProduct). The cycle holds at the final
  // level, then resets to 0.
  const [phase, setPhase] = useState(0);

  const maxPhase = showProduct ? 4 : 3;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setPhase((prev) => {
        const next = prev >= maxPhase ? 0 : prev + 1;
        // Long hold when the tree is fully drawn; quick steps otherwise.
        const isFull = next === maxPhase;
        const wasFull = prev === maxPhase;
        const delay = wasFull || next === 0 ? holdMs : stepMs;
        timer = setTimeout(tick, isFull ? holdMs : delay);
        return next;
      });
    };
    timer = setTimeout(tick, stepMs);
    return () => clearTimeout(timer);
  }, [stepMs, holdMs, maxPhase]);

  // Positions. Stage-A nodes spread across the canvas. Each stage-B
  // leaf hangs under its parent A-node in a tight fan of `b` siblings.
  const rootPos: Coord = { x: WIDTH / 2, y: ROOT_Y };
  const aXs = evenlySpacedXs(stageA.count, WIDTH, 40);
  const aPositions: Coord[] = aXs.map((x) => ({ x, y: STAGE_A_Y }));

  // Per-parent leaf spacing: keep each fan narrow enough that fans do
  // not overlap. Width budget per parent ≈ totalWidth / a, leave some
  // gap. Leaves are evenly spaced within that budget.
  const perParentBudget = (WIDTH - 60) / Math.max(stageA.count, 1);
  const leafGap = Math.min(perParentBudget / Math.max(stageB.count, 1), 28);
  const leafPositions: Coord[][] = aPositions.map((parent) => {
    const totalSpan = leafGap * (stageB.count - 1);
    const startX = parent.x - totalSpan / 2;
    return Array.from({ length: stageB.count }, (_, j) => ({
      x: startX + j * leafGap,
      y: STAGE_B_Y,
    }));
  });

  const product = stageA.count * stageB.count;

  return (
    <figure className="space-y-3">
      <div
        className="rounded-xl border bg-muted/30 px-3 py-4"
        role="img"
        aria-label={`Tree diagram: ${stageA.count} ${stageA.label} choices times ${stageB.count} ${stageB.label} choices, equals ${product} combined outcomes`}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto block w-full max-w-[22rem]"
        >
          {/* Stage labels along the left margin. */}
          <text x={6} y={ROOT_Y + 4} className="fill-muted-foreground" fontSize={9}>
            start
          </text>
          <text x={6} y={STAGE_A_Y + 4} className="fill-muted-foreground" fontSize={9}>
            {stageA.label}
          </text>
          <text x={6} y={STAGE_B_Y + 4} className="fill-muted-foreground" fontSize={9}>
            {stageB.label}
          </text>

          {/* Edges from root → stage A. Reveal in phase 2. */}
          {phase >= 2 &&
            aPositions.map((a, i) => (
              <motion.line
                key={`root-a-${i}`}
                x1={rootPos.x}
                y1={rootPos.y}
                x2={a.x}
                y2={a.y}
                stroke="var(--border)"
                strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              />
            ))}

          {/* Edges from each stage-A node → its leaves. Reveal in phase 3. */}
          {phase >= 3 &&
            aPositions.map((a, i) =>
              leafPositions[i].map((leaf, j) => (
                <motion.line
                  key={`a${i}-leaf${j}`}
                  x1={a.x}
                  y1={a.y}
                  x2={leaf.x}
                  y2={leaf.y}
                  stroke="var(--border)"
                  strokeWidth={1.5}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: (i * stageB.count + j) * 0.03 }}
                />
              )),
            )}

          {/* Root node. Reveal in phase 1. */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.circle
                key="root"
                cx={rootPos.x}
                cy={rootPos.y}
                r={NODE_R}
                className="fill-primary-soft stroke-primary"
                strokeWidth={1.5}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              />
            )}
          </AnimatePresence>

          {/* Stage-A nodes, with their index inside. Reveal in phase 2. */}
          <AnimatePresence>
            {phase >= 2 &&
              aPositions.map((a, i) => (
                <motion.g
                  key={`a-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 360,
                    damping: 22,
                    delay: i * 0.05,
                  }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={NODE_R}
                    className="fill-card stroke-primary"
                    strokeWidth={1.5}
                  />
                  <text
                    x={a.x}
                    y={a.y + 3.5}
                    textAnchor="middle"
                    fontSize={10}
                    className="fill-foreground"
                  >
                    {i + 1}
                  </text>
                </motion.g>
              ))}
          </AnimatePresence>

          {/* Stage-B leaves. Reveal in phase 3. */}
          <AnimatePresence>
            {phase >= 3 &&
              aPositions.map((_, i) =>
                leafPositions[i].map((leaf, j) => (
                  <motion.g
                    key={`leaf-${i}-${j}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 360,
                      damping: 22,
                      delay: (i * stageB.count + j) * 0.04,
                    }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  >
                    <circle
                      cx={leaf.x}
                      cy={leaf.y}
                      r={NODE_R - 2}
                      className="fill-[color:var(--green-soft)] stroke-[color:var(--green-base)]"
                      strokeWidth={1.5}
                    />
                    <text
                      x={leaf.x}
                      y={leaf.y + 3.2}
                      textAnchor="middle"
                      fontSize={9}
                      className="fill-foreground"
                    >
                      {j + 1}
                    </text>
                  </motion.g>
                )),
              )}
          </AnimatePresence>

          {/* Product caption (e.g. "3 × 2 = 6"). Reveal in phase 4. */}
          <AnimatePresence>
            {phase >= 4 && showProduct && (
              <motion.text
                key="product"
                x={WIDTH / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                className="fill-foreground"
                initial={{ opacity: 0, y: HEIGHT + 4 }}
                animate={{ opacity: 1, y: HEIGHT - 6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {stageA.count} × {stageB.count} = {product}
              </motion.text>
            )}
          </AnimatePresence>
        </svg>
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
