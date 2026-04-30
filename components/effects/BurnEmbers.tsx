"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  /** Anchor seed (enemy id) so positions are deterministic per enemy. */
  seed: string;
  /** How many embers to render. Defaults to 5. */
  count?: number;
}

/**
 * Burn ember particles — rising orange/red dots that fade upward.
 * Deterministic per seed so the same enemy always gets the same particle pattern.
 * Lightweight: pure CSS/Motion, no canvas, no particle library.
 */
export default function BurnEmbers({ seed, count = 5 }: Props) {
  const embers = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: count }).map((_, i) => {
      h = (h * 1103515245 + 12345) >>> 0;
      const x = 10 + (h % 80); // 10–90% of width
      h = (h * 1103515245 + 12345) >>> 0;
      const delay = ((h % 100) / 100) * 1.5;
      h = (h * 1103515245 + 12345) >>> 0;
      const duration = 1.4 + ((h % 100) / 100) * 0.8;
      h = (h * 1103515245 + 12345) >>> 0;
      const size = 2 + (h % 3);
      return { id: i, x, delay, duration, size };
    });
  }, [seed, count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {embers.map((e) => (
        <motion.div
          key={e.id}
          initial={{ y: "100%", opacity: 0 }}
          animate={{
            y: "-20%",
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: "easeOut",
            times: [0, 0.15, 0.85, 1],
          }}
          className="absolute rounded-full bg-accent-red shadow-[0_0_8px_currentColor] text-accent-red"
          style={{
            left: `${e.x}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
          }}
        />
      ))}
    </div>
  );
}
