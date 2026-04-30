"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface Props {
  hp: number;
  maxHp: number;
  enraged: boolean;
}

/**
 * Enrage Bar — fills as boss HP drops past 50%.
 * Color shifts yellow → orange → red as the threshold approaches.
 */
export default function EnrageBar({ hp, maxHp, enraged }: Props) {
  // Pct of damage past the 50% threshold. 0 at 50% HP, 100% at 0 HP.
  const past50 = Math.max(0, 1 - hp / (maxHp * 0.5));
  const pct = Math.min(100, past50 * 100);

  const color = enraged
    ? "bg-accent-red"
    : pct > 75
      ? "bg-accent-red"
      : pct > 40
        ? "bg-accent-yellow"
        : "bg-text-dim";

  return (
    <div className="flex items-center gap-tok-2">
      <span
        className={clsx(
          "text-[9px] font-mono uppercase tracking-[0.3em] shrink-0",
          enraged ? "text-accent-red" : "text-text-dim"
        )}
      >
        {enraged ? "⚡ ENRAGED" : "ENRAGE"}
      </span>
      <div className="relative h-2 w-32 bg-black border border-border-strong overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: "tween", duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
        />
        {enraged && (
          <motion.div
            className="absolute inset-0 bg-accent-red"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}
