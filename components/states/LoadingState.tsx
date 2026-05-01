"use client";

/**
 * LoadingState — themed loading indicator with optional message.
 *
 * Variants:
 *   "scanline"  — animated scanline bar (default; "loading map / war sync")
 *   "spinner"   — orbital spinner (compact; inline)
 *   "dots"      — three pulsing dots (very compact)
 *
 * Suppressed motion: under reduced motion the animation freezes to a
 * static state with a "PROCESSING" label so the user still sees feedback.
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import { POLISH_COLOR, POLISH_TIMING } from "@/systems/polish/polishTokens";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

interface Props {
  variant?: "scanline" | "spinner" | "dots";
  message?: string;
  className?: string;
}

export default function LoadingState({ variant = "scanline", message = "PROCESSING", className }: Props) {
  const reduced = useReducedMotionSafe();
  return (
    <div
      className={clsx("flex flex-col items-center justify-center gap-3 font-mono py-6", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {variant === "scanline" && <Scanline reduced={reduced} />}
      {variant === "spinner" && <Spinner reduced={reduced} />}
      {variant === "dots" && <Dots reduced={reduced} />}
      <div
        className="text-[10px] uppercase tracking-[0.3em]"
        style={{ color: POLISH_COLOR.textDim }}
      >
        {message}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Scanline
// ──────────────────────────────────────────────────────────────────────
function Scanline({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="relative w-40 h-[6px] overflow-hidden border"
      style={{ borderColor: POLISH_COLOR.borderSubtle, backgroundColor: POLISH_COLOR.bgTertiary }}
    >
      {!reduced && (
        <motion.div
          className="absolute top-0 bottom-0"
          style={{
            width: "40%",
            background: `linear-gradient(90deg, transparent, ${POLISH_COLOR.yellow}, transparent)`,
          }}
          animate={{ x: ["-50%", "150%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      )}
      {reduced && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: "40%", backgroundColor: POLISH_COLOR.yellow, opacity: 0.5 }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Spinner
// ──────────────────────────────────────────────────────────────────────
function Spinner({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      className="relative"
      style={{ width: 28, height: 28 }}
      animate={reduced ? undefined : { rotate: 360 }}
      transition={reduced ? undefined : { duration: 1.0, repeat: Infinity, ease: "linear" }}
    >
      <div
        className="absolute inset-0 border-2"
        style={{
          borderColor: `${POLISH_COLOR.yellow}33`,
          borderTopColor: POLISH_COLOR.yellow,
          borderRadius: "50%",
        }}
      />
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Dots
// ──────────────────────────────────────────────────────────────────────
function Dots({ reduced }: { reduced: boolean }) {
  const dur = (POLISH_TIMING.breath / 3) / 1000;
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block"
          style={{
            width: 6,
            height: 6,
            backgroundColor: POLISH_COLOR.yellow,
            borderRadius: "50%",
          }}
          animate={reduced ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={reduced ? undefined : { duration: dur, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}
