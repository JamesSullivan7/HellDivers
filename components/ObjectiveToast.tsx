"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import type { MissionObjective } from "@/lib/types";

interface QueuedToast {
  id: string;
  objective: MissionObjective;
  /** Internal timestamp so multiple flips queue distinctly. */
  uid: string;
}

/**
 * Listens to the objectives list and fires a toast every time an objective
 * transitions from in-progress to completed. Multiple flips in the same tick
 * queue and dismiss sequentially.
 */
export default function ObjectiveToast() {
  const objectives = useGame((s) => s.objectives);
  const completedRef = useRef<Set<string>>(new Set());
  const [queue, setQueue] = useState<QueuedToast[]>([]);

  // Initialize completedRef from objectives that were already done on mount.
  useEffect(() => {
    objectives.forEach((o) => {
      if (o.completed) completedRef.current.add(o.id);
    });
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for new completions
  useEffect(() => {
    const newly: QueuedToast[] = [];
    objectives.forEach((o) => {
      if (o.completed && !completedRef.current.has(o.id)) {
        completedRef.current.add(o.id);
        newly.push({ id: o.id, objective: o, uid: `${o.id}-${Date.now()}` });
      }
    });
    if (newly.length > 0) {
      setQueue((q) => [...q, ...newly]);
      try {
        sfx.unlock();
        sfx.beacon();
      } catch {}
    }
  }, [objectives]);

  // Auto-dismiss the head of the queue every 2.6s
  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => {
      setQueue((q) => q.slice(1));
    }, 2600);
    return () => clearTimeout(t);
  }, [queue]);

  return (
    <div className="fixed top-6 right-6 z-50 pointer-events-none flex flex-col gap-2">
      <AnimatePresence>
        {queue.slice(0, 3).map((t) => (
          <motion.div
            key={t.uid}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="relative w-[300px] border-2 border-emerald-500 bg-helldiver-panel/95 shadow-[0_0_24px_rgba(16,185,129,0.55)] backdrop-blur"
          >
            <div className="bg-emerald-500 text-black px-2 py-1 text-[9px] uppercase tracking-[0.3em] font-display font-black flex items-center justify-between">
              <span>✓ Objective Cleared</span>
              <span className="text-[9px]">+{t.objective.rewardMedals} Medals</span>
            </div>
            <div className="px-3 py-2 text-[12px] text-gray-100 leading-snug">
              {t.objective.description}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
