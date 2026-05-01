"use client";

/**
 * BreathingGlow — wraps content in a slow-breathing accent.
 *
 *   <BreathingGlow accent="yellow" intensity="soft">
 *     <ActivePanel />
 *   </BreathingGlow>
 *
 * The glow loops opacity 0.85 → 1.0 over 2.4s. Disabled under reduced
 * motion (renders a static accent instead).
 *
 * Use sparingly — one or two breaths per screen at most. Multiple
 * breaths competing for attention is worse than none.
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import {
  GLOW,
  POLISH_COLOR,
  POLISH_TIMING,
} from "@/systems/polish/polishTokens";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

type Accent = "yellow" | "cyan" | "orange" | "red" | "green";

const ACCENT_HEX: Record<Accent, string> = {
  yellow: POLISH_COLOR.yellow,
  cyan: POLISH_COLOR.cyan,
  orange: POLISH_COLOR.orange,
  red: POLISH_COLOR.red,
  green: POLISH_COLOR.green,
};

type Intensity = "subtle" | "soft" | "strong";

const INTENSITY_GLOW: Record<Intensity, number> = {
  subtle: GLOW.hairline,
  soft: GLOW.soft,
  strong: GLOW.medium,
};

interface Props {
  accent?: Accent;
  intensity?: Intensity;
  /** When true, the glow lives ONLY on the border (no fill). */
  borderOnly?: boolean;
  /** When true, glow renders inside a sibling absolute element so the
   *  child layout isn't perturbed. Default. */
  asOverlay?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function BreathingGlow({
  accent = "yellow",
  intensity = "soft",
  borderOnly = false,
  asOverlay = true,
  className,
  children,
}: Props) {
  const reduced = useReducedMotionSafe();
  const color = ACCENT_HEX[accent];
  const radius = INTENSITY_GLOW[intensity];

  const overlayStyle: React.CSSProperties = borderOnly
    ? {
        boxShadow: `0 0 ${radius}px ${color}55`,
        borderColor: color,
      }
    : {
        boxShadow: `inset 0 0 ${radius}px ${color}33, 0 0 ${radius}px ${color}33`,
      };

  const breathDuration = POLISH_TIMING.breath / 1000;

  return (
    <div className={clsx("relative", className)}>
      {asOverlay ? (
        <>
          {children}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={overlayStyle}
            initial={{ opacity: reduced ? 0.5 : 0.85 }}
            animate={
              reduced
                ? undefined
                : { opacity: [0.85, 1.0, 0.85] }
            }
            transition={
              reduced
                ? undefined
                : { duration: breathDuration, repeat: Infinity, ease: "easeInOut" }
            }
          />
        </>
      ) : (
        <motion.div
          className="relative"
          style={{ ...overlayStyle, transition: "box-shadow 0.4s ease" }}
          animate={
            reduced
              ? undefined
              : {
                  boxShadow: [
                    `0 0 ${radius * 0.7}px ${color}33`,
                    `0 0 ${radius}px ${color}66`,
                    `0 0 ${radius * 0.7}px ${color}33`,
                  ],
                }
          }
          transition={
            reduced
              ? undefined
              : { duration: breathDuration, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
