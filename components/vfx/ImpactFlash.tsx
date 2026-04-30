"use client";

/**
 * ImpactFlash — subscribes to the feedback queue's flash slot and renders
 * a timed full-screen tinted flash (critical hit, boss enrage, victory,
 * defeat). Latest flash wins. Skipped entirely under prefers-reduced-motion
 * because the manager never schedules them in that case.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useFeedbackQueue } from "@/systems/feedback/feedbackQueue";

export default function ImpactFlash() {
  const flash = useFeedbackQueue((s) => s.flash);

  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.key}
          initial={{ opacity: flash.opacity }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: flash.durationMs / 1000, ease: "easeOut" }}
          className="fixed inset-0 pointer-events-none z-[90]"
          style={{ background: flash.color }}
        />
      )}
    </AnimatePresence>
  );
}
