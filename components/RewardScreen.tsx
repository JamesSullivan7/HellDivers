"use client";

import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { useEffect } from "react";
import StarField from "./StarField";
import HudFrame from "./HudFrame";
import CardView from "./CardView";

export default function RewardScreen() {
  const { rewardChoices, takeReward, proceedAfterReward } = useGame();

  useEffect(() => {
    sfx.victory();
  }, []);

  return (
    <div className="min-h-screen text-white font-mono flex items-center justify-center p-6 relative">
      <StarField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full relative z-10"
      >
        <HudFrame accent="yellow" glow className="p-6 mb-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1">
            ▶ Mission Reward · Hostiles Eliminated
          </div>
          <div className="text-3xl font-display font-black tracking-tight">
            SUPER EARTH HQ DELIVERS
          </div>
          <div className="text-xs text-gray-300 mt-2">
            New stratagem authorized for your loadout. Choose wisely, Helldiver.
          </div>
        </HudFrame>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {rewardChoices.map((card, i) => (
            <motion.div
              key={card.id + i}
              initial={{ opacity: 0, y: 30, rotate: -3 + i * 3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 250, damping: 22 }}
            >
              <CardView
                card={card}
                onClick={() => {
                  sfx.beacon();
                  takeReward(card);
                  proceedAfterReward();
                }}
              />
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              sfx.click();
              takeReward(null);
              proceedAfterReward();
            }}
            className="px-6 py-2 border-2 border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow text-[10px] uppercase tracking-[0.3em] font-mono transition-colors"
          >
            ✕ Skip — No Stratagem
          </button>
        </div>
      </motion.div>
    </div>
  );
}
