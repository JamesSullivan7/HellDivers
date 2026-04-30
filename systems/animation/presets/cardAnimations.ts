import type { Variants } from "framer-motion";

/**
 * Card play exit animation — 3-stage per spec:
 *   1. Lift (80ms)
 *   2. Snap forward (120ms)  — scale up, light rotate
 *   3. Fade out (100ms)
 * Total: 300ms (within batch 5's 220–300ms range).
 */
export const cardPlayExit: Variants = {
  initial: { opacity: 0, y: 30, rotate: -5 },
  animate: { opacity: 1, y: 0, rotate: 0, scale: 1 },
  exit: {
    y: [0, -30, -50, -90],
    scale: [1, 1.06, 1.12, 0.4],
    rotate: [0, -2, 0, 4],
    opacity: [1, 1, 0.9, 0],
    transition: {
      duration: 0.3,
      times: [0, 0.27, 0.6, 1],
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
};

export const cardHoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.03 },
  tap: { scale: 0.97 },
};
