"use client";

/**
 * BossEnrageSequence — cinematic moment when the boss flips to phase 2.
 *
 * Sequence:
 *   1. Trigger when boss HP crosses threshold
 *   2. Half-second silence — audio mixer ducks (caller's responsibility
 *      via `onSilence`); UI freezes briefly
 *   3. Screen darkens (~0.7 dim)
 *   4. Red warning pulse fades up at the screen edges
 *   5. Boss frame "expands" — caller passes the targetRect via prop and
 *      we render an expanding box at that screen position
 *   6. New intent label types in
 *   7. Tension spike triggers via callback
 *   8. Combat resumes — sequence dismisses itself
 *
 * Reduced flash: skip the red strobe, render a steady red rim instead.
 * Reduced motion: compress timing 60%, no scale animations.
 *
 * Usage:
 *   <BossEnrageSequence
 *     open={boss.enraged && !alreadyShown}
 *     bossName={boss.name}
 *     newIntentLabel="REALITY LANCE"
 *     targetRect={{ x, y, w, h }}
 *     onComplete={() => setAlreadyShown(true)}
 *     onTensionSpike={() => useTension.getState().addTension(5, "boss_enrage")}
 *   />
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EASING,
  GLOW,
  POLISH_COLOR,
} from "@/systems/polish/polishTokens";
import { resolveDelay } from "@/systems/polish/microDelays";
import { useReducedMotionSafe, useReducedFlashSafe } from "@/hooks/useReducedMotionSafe";

export interface BossTargetRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  open: boolean;
  bossName: string;
  newIntentLabel?: string;
  /** Screen-space rectangle of the boss card — used for the expand pulse. */
  targetRect?: BossTargetRect;
  onSilence?: () => void;
  onTensionSpike?: () => void;
  onComplete?: () => void;
  className?: string;
}

export default function BossEnrageSequence({
  open,
  bossName,
  newIntentLabel,
  targetRect,
  onSilence,
  onTensionSpike,
  onComplete,
  className,
}: Props) {
  const reduced = useReducedMotionSafe();
  const reducedFlash = useReducedFlashSafe();

  const [phase, setPhase] = useState<"silence" | "darken" | "impact" | "intent" | "done">("silence");

  useEffect(() => {
    if (!open) {
      setPhase("silence");
      return;
    }
    onSilence?.();
    const t1 = setTimeout(() => setPhase("darken"), resolveDelay("bossEnrageSilence", reduced));
    const t2 = setTimeout(
      () => {
        setPhase("impact");
        onTensionSpike?.();
      },
      resolveDelay("bossEnrageSilence", reduced) + resolveDelay("bossEnrageDarken", reduced),
    );
    const t3 = setTimeout(
      () => setPhase("intent"),
      resolveDelay("bossEnrageSilence", reduced) +
        resolveDelay("bossEnrageDarken", reduced) +
        resolveDelay("bossEnrageImpact", reduced) * 0.6,
    );
    const t4 = setTimeout(
      () => {
        setPhase("done");
        onComplete?.();
      },
      resolveDelay("bossEnrageSilence", reduced) +
        resolveDelay("bossEnrageDarken", reduced) +
        resolveDelay("bossEnrageImpact", reduced) +
        500,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reduced]);

  const visible = open && phase !== "done";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          className={`fixed inset-0 pointer-events-none z-overlay ${className ?? ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Darken overlay */}
          <motion.div
            className="absolute inset-0"
            initial={{ backgroundColor: "rgba(0,0,0,0)" }}
            animate={{
              backgroundColor:
                phase === "silence"
                  ? "rgba(0,0,0,0)"
                  : phase === "darken"
                    ? "rgba(0,0,0,0.55)"
                    : "rgba(0,0,0,0.7)",
            }}
            transition={{ duration: 0.4, ease: EASING.standard }}
          />

          {/* Red rim — reduced flash collapses the strobe to a steady rim */}
          <AnimatePresence>
            {phase !== "silence" && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={
                  reducedFlash
                    ? { opacity: 1 }
                    : { opacity: [0, 1, 0.6, 1, 0.85] }
                }
                transition={
                  reducedFlash
                    ? { duration: 0.3 }
                    : { duration: 0.9, ease: EASING.exit }
                }
                exit={{ opacity: 0 }}
                style={{
                  boxShadow: `inset 0 0 ${GLOW.cinematic * 2}px ${POLISH_COLOR.red}aa, inset 0 0 ${GLOW.cinematic}px ${POLISH_COLOR.red}66`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Boss-frame expanding pulse */}
          <AnimatePresence>
            {phase === "impact" && targetRect && !reduced && (
              <motion.div
                className="absolute border-2"
                style={{
                  left: targetRect.x,
                  top: targetRect.y,
                  width: targetRect.w,
                  height: targetRect.h,
                  borderColor: POLISH_COLOR.red,
                  boxShadow: `0 0 ${GLOW.cinematic}px ${POLISH_COLOR.red}, inset 0 0 ${GLOW.medium}px ${POLISH_COLOR.red}88`,
                  borderRadius: 4,
                }}
                initial={{ scale: 1, opacity: 0.9 }}
                animate={{ scale: 1.18, opacity: 0 }}
                transition={{ duration: 0.7, ease: EASING.exit }}
              />
            )}
          </AnimatePresence>

          {/* Cinematic banner */}
          <AnimatePresence>
            {(phase === "impact" || phase === "intent") && (
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-center"
                initial={{ opacity: 0, scale: 0.94, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35, ease: EASING.anticipate }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.5em] font-display font-black mb-2"
                  style={{ color: POLISH_COLOR.red, textShadow: `0 0 12px ${POLISH_COLOR.red}` }}
                >
                  ◢ ENRAGED ◣
                </div>
                <div
                  className="text-2xl uppercase tracking-[0.25em] font-display font-black"
                  style={{ color: POLISH_COLOR.red, textShadow: `0 0 18px ${POLISH_COLOR.red}aa, 0 0 6px ${POLISH_COLOR.red}` }}
                >
                  {bossName.toUpperCase()}
                </div>
                {newIntentLabel && phase === "intent" && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASING.enter }}
                    className="mt-3 text-[12px] uppercase tracking-[0.25em] font-black"
                    style={{ color: POLISH_COLOR.yellow, textShadow: `0 0 6px ${POLISH_COLOR.yellow}aa` }}
                  >
                    NEW PATTERN · {newIntentLabel.toUpperCase()}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
