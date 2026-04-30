"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

interface Props {
  hp: number;
  maxHp: number;
  shield: number;
  armor: number;
}

export default function EnemyStats({ hp, maxHp, shield, armor }: Props) {
  const hpPct = maxHp > 0 ? Math.max(0, (hp / maxHp) * 100) : 0;
  const lowHp = hpPct <= 25;
  return (
    <div className="flex flex-col justify-center gap-tok-2 h-full px-tok-2">
      {shield > 0 && (
        <div>
          <div className="text-[8px] tracking-widest text-text-dim uppercase mb-0.5">SHLD</div>
          <div className="relative h-2 bg-black border border-accent-cyan/50 overflow-hidden">
            <motion.div
              className="h-full bg-accent-cyan"
              animate={{ width: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            />
          </div>
          <div className="text-[10px] tabular-nums text-accent-cyan font-bold mt-0.5">
            {shield}
          </div>
        </div>
      )}

      <div>
        <div className="text-[8px] tracking-widest text-text-dim uppercase mb-0.5">HP</div>
        <div className="relative h-2 bg-black border border-border-strong overflow-hidden">
          <motion.div
            className={clsx("h-full", lowHp ? "bg-accent-red" : "bg-accent-green")}
            animate={{ width: `${hpPct}%` }}
            transition={{ type: "tween", duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
        <div className="text-[10px] tabular-nums text-text-primary font-bold mt-0.5 tabular-nums">
          {hp}<span className="text-text-dim">/{maxHp}</span>
        </div>
      </div>

      {armor > 0 && (
        <div className="text-[10px] uppercase tracking-widest font-mono">
          <span className="text-text-dim">ARM</span>{" "}
          <span className="text-accent-cyan font-bold tabular-nums">{armor}</span>
        </div>
      )}
    </div>
  );
}
