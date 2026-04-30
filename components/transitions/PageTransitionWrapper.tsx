"use client";

/**
 * PageTransitionWrapper — wraps the active phase view in an
 * AnimatePresence with motion variants chosen by the active preset.
 *
 * Subscribes to useTransitionStore — when no transition is active, this
 * just renders children inside a keyed motion.div so AnimatePresence
 * still handles the exit/enter swap correctly when phase changes.
 */

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { useTransitionStore } from "@/systems/transitions/transitionStore";
import {
  PAGE_VARIANTS,
  REDUCED_MOTION_VARIANTS,
} from "@/systems/transitions/transitionPresets";
import { prefersReducedMotion } from "@/systems/feedback/FeedbackManager";

export default function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const phase = useGame((s) => s.phase);
  const active = useTransitionStore((s) => s.active);

  const variants =
    prefersReducedMotion() || !active
      ? REDUCED_MOTION_VARIANTS
      : PAGE_VARIANTS[active.preset];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={phase}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants as any}
        className="contents"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
