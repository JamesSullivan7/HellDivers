import type { Variants } from "framer-motion";

/**
 * Enemy idle drift — 1–2px subtle motion to prevent dead UI.
 * 3-second loop, ease-in-out.
 */
export const enemyIdleDrift: Variants = {
  idle: {
    y: [0, -1.5, 0, 1, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * Enemy death sequence — per batch 5 spec.
 *   1. White flash (40ms)
 *   2. Desaturate
 *   3. Collapse downward
 *   4. Fade out
 *   Total ≈ 300ms
 */
export const enemyDeath: Variants = {
  alive: {
    filter: "saturate(1) brightness(1)",
    y: 0,
    opacity: 1,
    scale: 1,
  },
  dying: {
    filter: ["saturate(2) brightness(2)", "saturate(0) brightness(0.7)", "saturate(0) brightness(0.5)"],
    y: [0, 4, 16],
    opacity: [1, 1, 0.3],
    scale: [1, 1, 0.95],
    transition: {
      duration: 0.3,
      times: [0.13, 0.5, 1],
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
};

/**
 * Damage hit shake — micro screen shake on combat field.
 */
export const damageShake: Variants = {
  rest: { x: 0 },
  hit: {
    x: [0, -2, 2, -1, 1, 0],
    transition: { duration: 0.12, ease: "easeOut" },
  },
  critHit: {
    x: [0, -6, 6, -3, 3, 0],
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

/**
 * Damage number pop — 1 → 1.4 → 1, fade upward.
 */
export const damageNumberPop: Variants = {
  initial: { y: 10, opacity: 0, scale: 0.5 },
  animate: { y: -50, opacity: 1, scale: 1.4 },
  exit: { opacity: 0, y: -70 },
};
