"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import HudFrame from "./HudFrame";

export default function PlayerStats() {
  const { player, combat } = useGame();
  const hpPct = (player.hp / player.maxHp) * 100;

  const lastHp = useRef(player.hp);
  const [hit, setHit] = useState(0);

  useEffect(() => {
    if (player.hp < lastHp.current) {
      setHit((n) => n + 1);
    }
    lastHp.current = player.hp;
  }, [player.hp]);

  return (
    <HudFrame label="Helldiver Status" accent="yellow" className="p-3">
      <motion.div
        animate={hit > 0 ? { x: [0, -4, 4, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-helldiver-dim w-8 tracking-widest">HP</span>
          <div className="flex-1 h-5 bg-black border border-helldiver-steel relative overflow-hidden">
            <motion.div
              className={clsx(
                "h-full",
                hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-helldiver-yellow" : "bg-helldiver-red"
              )}
              animate={{ width: `${hpPct}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums font-display tracking-wider">
              {player.hp} / {player.maxHp}
            </div>
          </div>
        </div>

        {player.block > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-helldiver-dim w-8 tracking-widest">BLK</span>
            <div className="text-sky-400 font-bold font-display text-base flex items-center gap-1">
              <span>⛨</span>
              <span>{player.block}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1">
            {Array.from({ length: Math.max(player.maxRequisition, player.requisition) }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  backgroundColor: i < player.requisition ? "#F1D434" : "#0a0a0b",
                  borderColor: i < player.requisition ? "#F1D434" : "#2A2D33",
                }}
                className="w-4 h-5 border-2"
                style={{
                  boxShadow: i < player.requisition ? "0 0 8px rgba(255, 211, 77,0.6)" : "none",
                }}
              />
            ))}
          </div>
          <div className="text-[10px] text-helldiver-dim tracking-widest font-display">
            <span className="text-helldiver-yellow font-bold">{player.requisition}</span>
            <span className="mx-0.5">/</span>
            {player.maxRequisition}R
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-helldiver-steel/50 flex justify-between text-[10px] uppercase tracking-widest text-helldiver-dim">
          <span>Reinforce: <span className="text-white font-bold">{player.reinforcements}</span></span>
          <span>Turn <span className="text-helldiver-yellow font-bold">{combat.turn}</span></span>
        </div>
      </motion.div>
    </HudFrame>
  );
}
