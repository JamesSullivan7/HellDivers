"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import StarField from "./StarField";
import HudFrame from "./HudFrame";

interface Props {
  victory: boolean;
}

export default function EndScreen({ victory }: Props) {
  const { goToMenu, ownedDeck, lastRunReward, account, targetPlanetId, difficulty, map, squadCode } = useGame();
  const reportRun = useMutation(api.war.reportRun);
  const reportSquad = useMutation(api.squads.reportSquadVictory);
  const reportedRef = useRef(false);

  useEffect(() => {
    if (victory) {
      sfx.victory();
      sfx.voice("Mission accomplished. For Super Earth.");
    } else {
      sfx.defeat();
      sfx.voice("Helldiver KIA. Reinforcements depleted.");
    }
  }, [victory]);

  useEffect(() => {
    if (reportedRef.current) return;
    if (!targetPlanetId) return;
    reportedRef.current = true;
    const nodesCleared = victory ? map.length : map.filter((n) => n.cleared).length;
    reportRun({
      planetSlug: targetPlanetId,
      helldiverName: account.helldiverName ?? "Anonymous",
      victory,
      difficulty,
      nodesCleared,
    }).catch(() => {});
    if (squadCode) {
      reportSquad({
        code: squadCode,
        helldiverName: account.helldiverName ?? "Anonymous",
        victory,
      }).catch(() => {});
    }
  }, [targetPlanetId, account.helldiverName, victory, difficulty, map, reportRun, reportSquad, squadCode]);

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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
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
                  <div className="text-sky-400 font-display font-black text-2xl">
                    +{lastRunReward.samples}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">Samples</div>
                </div>
                <div>
                  <div className="text-helldiver-orange font-display font-black text-2xl">
                    +{lastRunReward.requisition}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">Requisition</div>
                </div>
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
