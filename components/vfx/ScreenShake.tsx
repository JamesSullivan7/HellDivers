"use client";

/**
 * ScreenShake — wraps children and applies an x/y shake animation
 * whenever the feedback queue fires a shake event. Latest shake wins
 * (auto-cancels prior).
 *
 * Skipped automatically when prefers-reduced-motion is active because
 * the manager never schedules a shake in that case (queue.shake stays
 * null).
 */

import { motion } from "framer-motion";
import { useFeedbackQueue } from "@/systems/feedback/feedbackQueue";

export default function ScreenShake({ children }: { children: React.ReactNode }) {
  const shake = useFeedbackQueue((s) => s.shake);

  if (!shake) {
    return <>{children}</>;
  }

  // Build a shake keyframe sequence — alternating x/y offsets that decay.
  const a = shake.amp;
  const xKeys = [0, -a, a, -a * 0.66, a * 0.66, -a * 0.33, a * 0.33, 0];
  const yKeys = [0, a * 0.5, -a * 0.5, a * 0.33, -a * 0.33, a * 0.16, -a * 0.16, 0];

  return (
    <motion.div
      key={shake.key}
      animate={{ x: xKeys, y: yKeys }}
      transition={{ duration: shake.durationMs / 1000, ease: "easeOut" }}
      className="contents"
    >
      {children}
    </motion.div>
  );
}
