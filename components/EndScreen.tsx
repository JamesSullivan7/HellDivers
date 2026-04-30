"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import StarField from "./StarField";
import HudFrame from "./HudFrame";

interface Props {
  victory: boolean;
}

export default function EndScreen({ victory }: Props) {
  const { goToMenu, ownedDeck, lastRunReward, account, objectives } = useGame();

  useEffect(() => {
    if (victory) {
      sfx.victory();
      sfx.voice("Mission accomplished. For Super Earth.");
    } else {
      sfx.defeat();
      sfx.voice("Helldiver KIA. Reinforcements depleted.");
    }
  }, [victory]);

  return (
    <div className="min-h-screen text-white font-mono flex items-center justify-center p-6 relative">
      <StarField />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-xl w-full text-center relative z-10"
      >
        <HudFrame accent={victory ? "yellow" : "red"} glow className="p-8">
          <div
            className={
              "text-[10px] uppercase tracking-[0.4em] mb-2 " +
              (victory ? "text-helldiver-yellow" : "text-helldiver-red")
            }
          >
            {victory ? "▶ Mission Accomplished" : "▶ Helldiver KIA"}
          </div>
          <div className="text-5xl font-display font-black mb-3 tracking-tight">
            {victory ? "VICTORY" : "MISSION FAILED"}
          </div>
          <div className="text-sm text-gray-300 mb-6">
            {victory
              ? "Planet liberated. Super Earth is proud. Democracy advances another sector."
              : "Reinforcements depleted. Your sacrifice will not be forgotten. Liberty endures."}
          </div>

          {lastRunReward && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-y border-helldiver-steel py-3 mb-5"
            >
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim mb-2">
                Mission Rewards
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-helldiver-yellow font-display font-black text-2xl">
                    +{lastRunReward.medals}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">Medals</div>
                </div>
                <div>
                  <div className="text-emerald-400 font-display font-black text-2xl">
                    +{lastRunReward.xp}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">XP</div>
                </div>
                <div>
                  <div className="text-helldiver-orange font-display font-black text-2xl">
                    +{lastRunReward.requisition}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">Requisition</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-helldiver-steel/40">
                <div className="text-[9px] uppercase tracking-widest text-helldiver-dim text-center mb-2">Samples</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <SampleCell label="Common" value={lastRunReward.samples} color="text-sky-400" />
                  <SampleCell label="Rare" value={lastRunReward.rareSamples} color="text-emerald-400" />
                  <SampleCell label="Super" value={lastRunReward.superSamples} color="text-helldiver-orange" />
                </div>
              </div>
            </motion.div>
          )}

          {objectives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="border border-helldiver-steel/50 p-3 mb-5 text-left"
            >
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim mb-2 text-center">
                Mission Objectives
              </div>
              <div className="space-y-1.5">
                {objectives.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <span
                        className={
                          o.completed ? "text-emerald-400 font-bold" : "text-helldiver-dim"
                        }
                      >
                        {o.completed ? "✓" : "✕"}
                      </span>
                      <span
                        className={
                          o.completed ? "text-gray-200" : "text-helldiver-dim line-through"
                        }
                      >
                        {o.description}
                      </span>
                    </div>
                    <span
                      className={
                        "tabular-nums font-display font-black " +
                        (o.completed ? "text-helldiver-yellow" : "text-helldiver-dim")
                      }
                    >
                      {o.completed ? `+${o.rewardMedals}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="text-[10px] text-helldiver-dim tracking-widest mb-6 font-mono space-y-1">
            <div>FINAL LOADOUT: {ownedDeck.length} STRATAGEMS</div>
            <div>HELLDIVER LEVEL · {account.level} · {account.medals} MEDALS</div>
            <div>SES DEMOCRATIC FLAME · STANDING DOWN</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sfx.click();
              goToMenu();
            }}
            className="w-full bg-gradient-to-b from-helldiver-yellow to-yellow-500 text-helldiver-dark font-display font-black py-3 uppercase tracking-[0.3em] border-2 border-helldiver-yellow transition-colors shadow-[0_0_24px_rgba(255, 211, 77,0.4)]"
          >
            ⌂ Return to HQ
          </motion.button>
        </HudFrame>
      </motion.div>
    </div>
  );
}

function SampleCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`font-display font-black text-xl ${color} ${value === 0 ? "opacity-40" : ""}`}>
        +{value}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">{label}</div>
    </div>
  );
}
