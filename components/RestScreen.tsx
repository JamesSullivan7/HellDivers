"use client";

import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import StarField from "./StarField";
import HudFrame from "./HudFrame";

export default function RestScreen() {
  const { player, takeRest } = useGame();
  const heal = Math.floor(player.maxHp * 0.4);

  return (
    <div className="min-h-screen text-white font-mono flex items-center justify-center p-6 relative">
      <StarField />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full text-center relative z-10"
      >
        <HudFrame accent="emerald" glow className="p-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 mb-2">
            ▶ Resupply Beacon Active
          </div>
          <div className="text-4xl font-display font-black mb-2 tracking-tight">EXTRACTION ZONE</div>
          <div className="text-sm text-gray-300 mb-6">
            Squad rests, eats rations, rearms.
            <br />
            Recover <span className="text-emerald-400 font-bold">{heal} HP</span>.
          </div>
          <div className="text-[10px] text-helldiver-dim tracking-widest mb-6 font-mono">
            Current Status: {player.hp} / {player.maxHp} HP
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sfx.heal();
              takeRest();
            }}
            className="px-8 py-3 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-display font-black uppercase tracking-[0.3em] border-2 border-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            ✚ Rest & Recover
          </motion.button>
        </HudFrame>
      </motion.div>
    </div>
  );
}
