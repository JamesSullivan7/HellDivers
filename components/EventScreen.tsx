"use client";

import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { EVENTS } from "@/lib/events";
import StarField from "./StarField";
import HudFrame from "./HudFrame";

export default function EventScreen() {
  const { pendingEventId, resolveEventChoice } = useGame();
  const event = pendingEventId ? EVENTS[pendingEventId] : null;

  if (!event) {
    return (
      <div className="min-h-screen text-white font-mono flex items-center justify-center p-6 relative">
        <StarField />
        <div className="text-helldiver-dim text-xs tracking-[0.3em]">
          ◢ NO EVENT PAYLOAD ◣
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-mono flex items-center justify-center p-6 relative">
      <StarField />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full relative z-10"
      >
        <HudFrame accent="yellow" glow className="p-7">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-2">
            ▶ Field Encounter
          </div>
          <div className="text-3xl md:text-4xl font-display font-black mb-3 tracking-tight">
            {event.title}
          </div>
          <div className="text-sm text-gray-300 leading-relaxed mb-6 italic border-l-2 border-helldiver-yellow/40 pl-3">
            {event.flavor}
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim mb-3">
            Select Course of Action
          </div>

          <div className="space-y-3">
            {event.choices.map((c, idx) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                whileHover={{ x: 4, scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  sfx.unlock();
                  sfx.beacon();
                  resolveEventChoice(c.id);
                }}
                className="w-full text-left p-4 bg-helldiver-panel/40 border-2 border-helldiver-steel/40 hover:border-helldiver-yellow hover:bg-helldiver-yellow/5 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="font-display font-black text-base tracking-wider text-helldiver-yellow uppercase">
                    [{idx + 1}] {c.label}
                  </div>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed">
                  {c.description}
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-5 text-[9px] uppercase tracking-[0.3em] text-helldiver-dim text-center">
            ◢ Decision is final · For Super Earth ◣
          </div>
        </HudFrame>
      </motion.div>
    </div>
  );
}
