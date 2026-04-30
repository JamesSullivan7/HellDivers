"use client";

import { motion } from "framer-motion";

/**
 * Shield ripple — a faint cyan pulsing border that indicates active shield.
 * Sits as an overlay on a shielded enemy.
 */
export default function ShieldRipple() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 border border-accent-cyan/50"
      animate={{
        opacity: [0.15, 0.45, 0.15],
        scale: [1, 1.005, 1],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      style={{ borderRadius: "inherit" }}
    />
  );
}
