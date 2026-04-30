"use client";

/**
 * TensionOverlay — purely visual response layer that floats above app UI.
 *
 *   calm     →  invisible (no overlay rendered)
 *   alert    →  thin top warning bar pulse, faint edge glow
 *   danger   →  stronger edge glow + bottom warning bar + occasional particles
 *   critical →  full vignette pulse + corner chevrons + warning particles + slight color flicker
 *
 * Strict rule: never blocks pointer events, never recolors content text,
 * never reduces contrast on the underlying UI.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TENSION_COLORS,
  getTensionAnimationPreset,
  tensionColorAlpha,
  useTension,
} from "@/lib/tension";

export default function TensionOverlay() {
  const state = useTension((s) => s.tensionState);
  const level = useTension((s) => s.tensionLevel);
  const preset = getTensionAnimationPreset(state);

  if (state === "calm") return null;

  const color = TENSION_COLORS[state];
  const intensity = Math.max(0, level - 20) / 80; // 0..1 scaled from 20→100

  return (
    <div className="fixed inset-0 pointer-events-none z-[40]">
      {/* Edge vignette glow — strongest on critical */}
      <motion.div
        className="absolute inset-0"
        animate={
          state === "critical"
            ? { opacity: [intensity * 0.65, intensity * 0.95, intensity * 0.65] }
            : { opacity: intensity * 0.55 }
        }
        transition={
          state === "critical"
            ? { duration: 1 / preset.pulseFreq, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.6 }
        }
        style={{
          boxShadow: `inset 0 0 ${100 + intensity * 220}px ${tensionColorAlpha(state, 0.55)}`,
        }}
      />

      {/* Top warning bar (alert+) */}
      <motion.div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
        animate={{ opacity: [0.45, 0.95, 0.45] }}
        transition={{ duration: state === "critical" ? 0.7 : state === "danger" ? 1.1 : 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom warning bar (danger+) */}
      {(state === "danger" || state === "critical") && (
        <motion.div
          className="absolute bottom-0 inset-x-0 h-[2px]"
          style={{
            background: color,
            boxShadow: `0 0 14px ${color}`,
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: state === "critical" ? 0.65 : 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
      )}

      {/* Corner chevrons (critical only) */}
      {state === "critical" && (
        <>
          <CornerChevron pos="tl" color={color} pulseFreq={preset.pulseFreq} />
          <CornerChevron pos="tr" color={color} pulseFreq={preset.pulseFreq} />
          <CornerChevron pos="bl" color={color} pulseFreq={preset.pulseFreq} />
          <CornerChevron pos="br" color={color} pulseFreq={preset.pulseFreq} />
        </>
      )}

      {/* Floating warning particles (danger+) */}
      {(state === "danger" || state === "critical") && (
        <TensionParticles
          state={state}
          color={color}
          speed={preset.particleSpeed}
        />
      )}
    </div>
  );
}

function CornerChevron({
  pos,
  color,
  pulseFreq,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  color: string;
  pulseFreq: number;
}) {
  const positionStyle: React.CSSProperties =
    pos === "tl" ? { top: 12, left: 12 } :
    pos === "tr" ? { top: 12, right: 12 } :
    pos === "bl" ? { bottom: 12, left: 12 } :
    { bottom: 12, right: 12 };

  // Build chevron via two right-angle borders
  const borders =
    pos === "tl" ? "border-t-2 border-l-2" :
    pos === "tr" ? "border-t-2 border-r-2" :
    pos === "bl" ? "border-b-2 border-l-2" :
    "border-b-2 border-r-2";

  return (
    <motion.div
      style={{ ...positionStyle, borderColor: color, boxShadow: `0 0 16px ${color}` }}
      className={`absolute w-7 h-7 ${borders}`}
      animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.08, 1] }}
      transition={{ duration: 1 / pulseFreq, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function TensionParticles({
  state,
  color,
  speed,
}: {
  state: "danger" | "critical";
  color: string;
  speed: number;
}) {
  // Deterministic positions — keyed by state so React doesn't reshuffle constantly
  const particles = useMemo(
    () =>
      Array.from({ length: state === "critical" ? 14 : 7 }).map((_, i) => ({
        left: `${(i * 73) % 100}%`,
        delay: (i % 5) * 0.4,
        duration: (state === "critical" ? 4.5 : 7) / speed,
        size: 1 + (i % 3),
      })),
    [state, speed]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: -8,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
          animate={{
            y: ["0vh", "-110vh"],
            opacity: [0, 0.85, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
