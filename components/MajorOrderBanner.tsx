"use client";

import { motion } from "framer-motion";
import { getMajorOrderProgress, WarState } from "@/lib/galacticWar";

interface Props {
  warState: WarState;
}

export default function MajorOrderBanner({ warState }: Props) {
  const order = warState.majorOrder;
  if (!order) return null;
  const prog = getMajorOrderProgress(warState);
  if (!prog) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-helldiver-red/30 via-helldiver-red/15 to-transparent border-2 border-helldiver-red p-4 mb-5 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-helldiver-red/40 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between gap-4 relative">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-helldiver-red mb-1">
            <span className="w-2 h-2 bg-helldiver-red animate-blink" />
            ◢ Major Order · From High Command ◣
          </div>
          <div className="text-2xl font-display font-black tracking-tight mb-1">
            {order.title}
          </div>
          <div className="text-xs text-gray-300 max-w-2xl">{order.briefing}</div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-helldiver-dim mb-1">
                <span>Progress</span>
                <span className="text-helldiver-yellow font-bold">{prog.liberated} / {prog.total} planets liberated</span>
              </div>
              <div className="h-2 bg-black border border-helldiver-steel relative overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-helldiver-yellow to-yellow-400"
                  animate={{ width: `${prog.pct}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 25 }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">Status</div>
          <div className={
            "font-display font-black text-2xl tabular-nums " +
            (prog.complete ? "text-emerald-400" : "text-helldiver-yellow")
          }>
            {prog.complete ? "READY TO CLAIM" : "ACTIVE"}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-helldiver-yellow mt-1">
            +{order.rewardMedals} Medals
          </div>
          <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mt-0.5">
            {prog.complete ? "Auto-paid on next victory" : "No expiry"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
