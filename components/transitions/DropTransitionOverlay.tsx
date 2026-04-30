"use client";

/**
 * DropTransitionOverlay — cinematic hellpod-launch sequence.
 *
 *   0–80ms     warning lights flash red+yellow alternating
 *   80–200ms   "HELLPOD LAUNCH SEQUENCE" header types in
 *   200–500ms  countdown 3 → 2 → 1 (one digit per ~100ms)
 *   500–700ms  brief screen tilt + impact wash
 *   700–800ms  fade out as the destination view becomes visible
 *
 * The whole thing wraps in ~800ms so the player isn't held hostage.
 * Skipped entirely under reduced-motion (provider downgrades the preset).
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { sfx } from "@/lib/sfx";
import { playTransitionSound } from "@/systems/transitions/transitionPresets";

const WARNING_YELLOW = "#f5c542";
const WARNING_RED = "#ff4d4d";

export default function DropTransitionOverlay({ durationMs }: { durationMs: number }) {
  // Drive the countdown internally — phase advances on a fixed schedule.
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Countdown 3 → 2 → 1 starting at 200ms after mount
    const t1 = window.setTimeout(() => setCount(3), 200);
    const t2 = window.setTimeout(() => setCount(2), 320);
    const t3 = window.setTimeout(() => setCount(1), 440);
    const t4 = window.setTimeout(() => {
      setCount(0); // 0 = "DROP" label
      playTransitionSound("drop_sequence_impact");
    }, 560);
    return () => {
      [t1, t2, t3, t4].forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <>
      {/* Black wash that comes in immediately and fades out near the end */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "#000" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.85, 0] }}
        transition={{
          duration: durationMs / 1000,
          times: [0, 0.18, 0.78, 1],
          ease: "linear",
        }}
      />

      {/* Top + bottom warning bars — alternating yellow/red flicker */}
      <WarningFlash />

      {/* Diagonal scan lines for tactical-display feel */}
      <motion.div
        className="absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(245,197,66,0.5) 0 1px, transparent 1px 4px)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: durationMs / 1000, ease: "linear" }}
      />

      {/* Center stack: header + countdown */}
      <div className="absolute inset-0 flex flex-col items-center justify-center font-display font-black select-none">
        <motion.div
          className="text-[10px] uppercase tracking-[0.5em] mb-3"
          style={{ color: WARNING_YELLOW, textShadow: `0 0 12px ${WARNING_YELLOW}` }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0.4], y: 0 }}
          transition={{
            duration: durationMs / 1000,
            times: [0, 0.18, 0.78, 1],
            ease: "easeOut",
          }}
        >
          ◢ Hellpod Launch Sequence ◣
        </motion.div>

        {/* Countdown number */}
        <CountdownNumber count={count} />

        <motion.div
          className="text-[9px] uppercase tracking-[0.4em] mt-3"
          style={{ color: "rgba(255,255,255,0.6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.85, 0] }}
          transition={{
            duration: durationMs / 1000,
            times: [0, 0.2, 0.8, 1],
          }}
        >
          For Super Earth
        </motion.div>
      </div>

      {/* Brief screen tilt at impact */}
      <motion.div
        className="absolute inset-0 origin-center"
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, 0, -0.6, 0.4, 0] }}
        transition={{
          duration: durationMs / 1000,
          times: [0, 0.7, 0.78, 0.85, 1],
          ease: "easeOut",
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
function CountdownNumber({ count }: { count: number | null }) {
  if (count === null) return <div className="h-[88px]" />;
  if (count === 0) {
    return (
      <motion.div
        key="drop"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: [0.7, 1.15, 1.0], opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="text-6xl tracking-[0.4em]"
        style={{
          color: WARNING_YELLOW,
          textShadow: `0 0 30px ${WARNING_YELLOW}, 0 0 60px ${WARNING_YELLOW}`,
        }}
      >
        DROP
      </motion.div>
    );
  }
  return (
    <motion.div
      key={count}
      initial={{ scale: 1.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="text-7xl tabular-nums"
      style={{
        color: WARNING_YELLOW,
        textShadow: `0 0 24px ${WARNING_YELLOW}`,
      }}
    >
      {count}
    </motion.div>
  );
}

function WarningFlash() {
  return (
    <>
      <motion.div
        className="absolute inset-x-0 top-0 h-[3px]"
        animate={{
          backgroundColor: [WARNING_YELLOW, WARNING_RED, WARNING_YELLOW, WARNING_RED, WARNING_YELLOW],
          boxShadow: [
            `0 0 12px ${WARNING_YELLOW}`,
            `0 0 18px ${WARNING_RED}`,
            `0 0 12px ${WARNING_YELLOW}`,
            `0 0 18px ${WARNING_RED}`,
            `0 0 12px ${WARNING_YELLOW}`,
          ],
        }}
        transition={{ duration: 0.7, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[3px]"
        animate={{
          backgroundColor: [WARNING_RED, WARNING_YELLOW, WARNING_RED, WARNING_YELLOW, WARNING_RED],
          boxShadow: [
            `0 0 18px ${WARNING_RED}`,
            `0 0 12px ${WARNING_YELLOW}`,
            `0 0 18px ${WARNING_RED}`,
            `0 0 12px ${WARNING_YELLOW}`,
            `0 0 18px ${WARNING_RED}`,
          ],
        }}
        transition={{ duration: 0.7, ease: "linear" }}
      />
    </>
  );
}
