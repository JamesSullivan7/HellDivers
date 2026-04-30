"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";

interface Props {
  onEndTurn: () => void;
}

export default function ActionBar({ onEndTurn }: Props) {
  const { combat, player } = useGame();
  const lowR = player.requisition <= 1;
  const noActed = combat.turn > 0; // could be smarter — flag when player hasn't played anything

  return (
    <div
      className="flex items-center justify-center gap-tok-3 py-tok-2 px-tok-4 border-t border-border-subtle bg-bg-tertiary/85 backdrop-blur-md"
      style={{ minHeight: "56px" }}
    >
      {/* Requisition counter */}
      <div className="flex items-center gap-tok-2">
        <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono">R</span>
        <motion.div
          animate={lowR ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ repeat: lowR ? Infinity : 0, duration: 0.8 }}
          className={clsx(
            "px-tok-3 py-tok-2 border-2 font-display font-black text-xl tabular-nums min-w-[72px] text-center",
            lowR
              ? "border-accent-red text-accent-red"
              : "border-accent-yellow text-accent-yellow"
          )}
        >
          {player.requisition}
          <span className="text-text-dim text-base mx-1">/</span>
          <span className="text-text-secondary text-base">{player.maxRequisition}</span>
        </motion.div>
      </div>

      {/* End Turn (primary CTA) */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          sfx.endTurn();
          onEndTurn();
        }}
        className={clsx(
          "px-tok-5 py-tok-3 font-display font-black uppercase tracking-[0.3em] text-base border-2",
          "bg-gradient-to-b from-accent-red to-red-900 text-text-primary border-accent-red",
          "shadow-glow-red transition-shadow"
        )}
      >
        End Turn ▸
      </motion.button>

      {/* Deck info */}
      <div className="flex flex-col items-center gap-0.5 font-mono text-[10px] tracking-widest uppercase">
        <div className="text-text-dim">Deck</div>
        <div className="flex items-baseline gap-1">
          <span className="text-accent-yellow font-display font-black text-base tabular-nums">
            {combat.deck.length}
          </span>
          <span className="text-text-dim">·</span>
          <span className="text-text-secondary tabular-nums">{combat.discard.length}</span>
        </div>
      </div>
    </div>
  );
}
