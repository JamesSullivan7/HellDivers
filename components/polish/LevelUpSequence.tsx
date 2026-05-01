"use client";

/**
 * LevelUpSequence — choreographed "you leveled up" cinematic.
 *
 * Sequence:
 *   1. XP bar fills (caller drives — pass `xpBar` as a slot)
 *   2. Short pause at threshold
 *   3. Rank badge flashes
 *   4. Level number increments (counts up oldLevel → newLevel)
 *   5. Unlocks reveal as bullet list
 *   6. Sound hook fires (passed via `onPlayHook`)
 *   7. Reward summary appears + Continue
 *
 * Reduced motion: timing compresses, flash collapses to a brief tint, the
 * level number sets directly without ticking.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EASING,
  GLOW,
  OPACITY,
  POLISH_COLOR,
  STAGGER,
} from "@/systems/polish/polishTokens";
import { MICRO_DELAYS, resolveDelay } from "@/systems/polish/microDelays";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useReducedFlashSafe } from "@/hooks/useReducedMotionSafe";

interface Props {
  open: boolean;
  oldLevel: number;
  newLevel: number;
  rankAbbr: string;
  rankTitle: string;
  unlocks?: string[];
  rewardSummary?: { label: string; value: string }[];
  onPlayHook?: () => void;
  onContinue: () => void;
  className?: string;
}

export default function LevelUpSequence({
  open,
  oldLevel,
  newLevel,
  rankAbbr,
  rankTitle,
  unlocks = [],
  rewardSummary = [],
  onPlayHook,
  onContinue,
  className,
}: Props) {
  const reduced = useReducedMotionSafe();
  const reducedFlash = useReducedFlashSafe();

  const [phase, setPhase] = useState<"hold" | "flash" | "increment" | "unlocks" | "summary">("hold");
  const [displayedLevel, setDisplayedLevel] = useState(oldLevel);

  useEffect(() => {
    if (!open) {
      setPhase("hold");
      setDisplayedLevel(oldLevel);
      return;
    }
    const t1 = setTimeout(() => setPhase("flash"), resolveDelay("levelThresholdPause", reduced));
    const t2 = setTimeout(() => {
      setPhase("increment");
      onPlayHook?.();
    }, resolveDelay("levelThresholdPause", reduced) + resolveDelay("rankFlashHold", reduced));
    const t3 = setTimeout(
      () => setPhase("unlocks"),
      resolveDelay("levelThresholdPause", reduced) +
        resolveDelay("rankFlashHold", reduced) +
        resolveDelay("levelUpPreBurst", reduced),
    );
    const t4 = setTimeout(
      () => setPhase("summary"),
      resolveDelay("levelThresholdPause", reduced) +
        resolveDelay("rankFlashHold", reduced) +
        resolveDelay("levelUpPreBurst", reduced) +
        unlocks.length * resolveDelay("rewardCardStagger", reduced) +
        300,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [open, reduced, oldLevel, unlocks.length, onPlayHook]);

  // Level number count-up
  useEffect(() => {
    if (phase !== "increment") return;
    if (reduced) {
      setDisplayedLevel(newLevel);
      return;
    }
    const start = performance.now();
    const dur = Math.min(700, 200 + (newLevel - oldLevel) * 220);
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedLevel(oldLevel + Math.round((newLevel - oldLevel) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, oldLevel, newLevel, reduced]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-overlay flex items-center justify-center font-mono ${className ?? ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ background: `rgba(0,0,0,${OPACITY.dim})` }}
          role="dialog"
          aria-modal="true"
          aria-label={`Level ${newLevel} achieved`}
        >
          {/* Flash overlay (suppressed under reduced flash) */}
          <AnimatePresence>
            {phase === "flash" && !reducedFlash && (
              <motion.div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: POLISH_COLOR.yellow }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: EASING.exit }}
              />
            )}
          </AnimatePresence>

          {/* Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASING.anticipate }}
            className="relative bg-bg-secondary border-2 px-8 py-6 max-w-[480px] w-[90vw] flex flex-col items-center gap-3 text-center"
            style={{
              borderColor: POLISH_COLOR.yellow,
              boxShadow: `0 0 ${GLOW.cinematic}px ${POLISH_COLOR.yellow}66, inset 0 0 ${GLOW.medium}px ${POLISH_COLOR.yellow}22`,
              borderRadius: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-[10px] uppercase tracking-[0.4em] font-display font-black"
              style={{ color: POLISH_COLOR.yellow }}
            >
              ◢ LEVEL UP ◣
            </div>

            {/* Rank badge */}
            <motion.div
              animate={
                phase === "flash" && !reducedFlash
                  ? { scale: [1, 1.18, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.4, ease: EASING.bounce }}
              className="flex items-center justify-center border-2 font-display font-black"
              style={{
                width: 88,
                height: 88,
                color: POLISH_COLOR.yellow,
                borderColor: POLISH_COLOR.yellow,
                backgroundColor: `${POLISH_COLOR.yellow}10`,
                boxShadow: `0 0 ${GLOW.medium}px ${POLISH_COLOR.yellow}88`,
                borderRadius: 2,
              }}
            >
              <div className="flex flex-col leading-none">
                <span className="tabular-nums" style={{ fontSize: 36 }}>{displayedLevel}</span>
                <span className="text-[8px] uppercase tracking-widest mt-1" style={{ color: POLISH_COLOR.yellow }}>
                  {rankAbbr}
                </span>
              </div>
            </motion.div>

            <div className="text-[11px] uppercase tracking-[0.25em] font-black" style={{ color: POLISH_COLOR.textPrimary }}>
              {rankTitle}
            </div>

            {/* Unlocks list */}
            <AnimatePresence>
              {phase === "unlocks" && unlocks.length > 0 && (
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: STAGGER.cinematic } },
                  }}
                  className="flex flex-col gap-1 w-full"
                >
                  {unlocks.map((u, i) => (
                    <motion.li
                      key={i}
                      variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0 } }}
                      transition={{ duration: 0.32, ease: EASING.enter }}
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: POLISH_COLOR.cyan }}
                    >
                      ▸ {u}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            {/* Reward summary */}
            <AnimatePresence>
              {phase === "summary" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {rewardSummary.length > 0 && (
                    <div className="flex flex-col gap-1 w-full mb-2">
                      {rewardSummary.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[10px] uppercase tracking-widest border-b border-border-subtle pb-1 last:border-b-0"
                        >
                          <span style={{ color: POLISH_COLOR.textDim }}>{r.label}</span>
                          <span className="font-display font-black tabular-nums" style={{ color: POLISH_COLOR.yellow }}>
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={onContinue}
                    autoFocus
                    className="px-6 py-2 border-2 font-display font-black uppercase tracking-[0.3em] text-[11px] hover:bg-accent-yellow/10 transition-colors"
                    style={{
                      color: POLISH_COLOR.yellow,
                      borderColor: POLISH_COLOR.yellow,
                      boxShadow: `0 0 ${GLOW.medium}px ${POLISH_COLOR.yellow}55`,
                      borderRadius: 1,
                    }}
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
