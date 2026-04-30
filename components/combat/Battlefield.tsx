"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import EnemyView from "../EnemyView";
import BossFrame from "../boss/BossFrame";

interface Props {
  needsTarget: boolean;
  onEnemyClick: (enemyId: string) => void;
}

export default function Battlefield({ needsTarget, onEnemyClick }: Props) {
  const { combat } = useGame();
  const bosses = combat.enemies.filter((e) => e.isBoss);
  const minions = combat.enemies.filter((e) => !e.isBoss);

  return (
    <div className="flex-1 flex flex-col gap-tok-4 p-tok-4 overflow-auto">
      {/* Boss row — full-width frame at top */}
      {bosses.length > 0 && (
        <div className="flex flex-col gap-tok-3 max-w-[960px] mx-auto w-full">
          <AnimatePresence>
            {bosses.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <BossFrame
                  enemy={b}
                  targetable={needsTarget}
                  needsTarget={needsTarget}
                  onClick={() => onEnemyClick(b.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Minions row — regular enemy cards below boss */}
      {minions.length > 0 && (
        <div className="flex flex-wrap gap-tok-4 justify-center">
          <AnimatePresence>
            {minions.map((e) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
              >
                <EnemyView
                  enemy={e}
                  targetable={needsTarget}
                  needsTarget={needsTarget}
                  onClick={() => onEnemyClick(e.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
