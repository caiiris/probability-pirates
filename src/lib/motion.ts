/** Shared Framer Motion timing constants. All durations are in seconds. */
export const MOTION = {
  fast: 0.2,
  slide: { type: 'spring', stiffness: 300, damping: 30 },
  shake: { duration: 0.2, ease: [0.36, 0.07, 0.19, 0.97] },
  pop: { type: 'spring', stiffness: 400, damping: 25 },
} as const;

/** Shake animation keyframes for wrong-answer feedback. */
export const SHAKE_KEYFRAMES = {
  x: [0, -8, 8, -8, 8, 0],
  transition: MOTION.shake,
};
