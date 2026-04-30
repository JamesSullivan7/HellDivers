"use client";

/**
 * TransitionOverlay — full-screen visual layer that animates per preset.
 * Reads the active TransitionSnapshot from the store and renders one of
 * six choreographies. Drop-pod gets its own dedicated component for
 * complexity isolation.
 *
 * Renders nothing when no transition is active.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useTransitionStore } from "@/systems/transitions/transitionStore";
import { PRESET_SPECS } from "@/systems/transitions/transitionPresets";
import DropTransitionOverlay from "./DropTransitionOverlay";

export default function TransitionOverlay() {
  const active = useTransitionStore((s) => s.active);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.key}
          className="fixed inset-0 pointer-events-none z-[95]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {active.preset === "tacticalFade" && <TacticalFadeOverlay accent={PRESET_SPECS.tacticalFade.accent} durationMs={PRESET_SPECS.tacticalFade.durationMs} />}
          {active.preset === "commandSlide" && <CommandSlideOverlay accent={PRESET_SPECS.commandSlide.accent} />}
          {active.preset === "dropTransition" && <DropTransitionOverlay durationMs={PRESET_SPECS.dropTransition.durationMs} />}
          {active.preset === "combatImpact" && <CombatImpactOverlay accent={PRESET_SPECS.combatImpact.accent} />}
          {active.preset === "rewardBloom" && <RewardBloomOverlay accent={PRESET_SPECS.rewardBloom.accent} />}
          {active.preset === "failureCollapse" && <FailureCollapseOverlay accent={PRESET_SPECS.failureCollapse.accent} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Tactical Fade — thin scanline sweep + faint center wash
// ──────────────────────────────────────────────────────────────────────
function TacticalFadeOverlay({ accent }: { accent: string; durationMs: number }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${accent}10, transparent 60%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      />
      <ScanlineSweep accent={accent} durationMs={360} />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Command Slide — vertical wipe stripe
// ──────────────────────────────────────────────────────────────────────
function CommandSlideOverlay({ accent }: { accent: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-y-0 w-32"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
          mixBlendMode: "screen",
        }}
        initial={{ x: "-20%" }}
        animate={{ x: "120vw" }}
        transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.div
        className="absolute inset-x-0 h-px"
        style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        initial={{ top: "50%", opacity: 0.9 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.34 }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Combat Impact — sharp red flash + cross-hatch pulse
// ──────────────────────────────────────────────────────────────────────
function CombatImpactOverlay({ accent }: { accent: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ background: accent }}
        initial={{ opacity: 0.18 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${accent}33 0 1px, transparent 1px 14px)`,
        }}
        initial={{ opacity: 0.25, scale: 0.96 }}
        animate={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Reward Bloom — soft expanding glow ring
// ──────────────────────────────────────────────────────────────────────
function RewardBloomOverlay({ accent }: { accent: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${accent}33, transparent 65%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ duration: 0.52, ease: "easeOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
        style={{
          marginLeft: -12,
          marginTop: -12,
          width: 24,
          height: 24,
          border: `2px solid ${accent}`,
          boxShadow: `0 0 60px ${accent}`,
        }}
        initial={{ scale: 0, opacity: 0.95 }}
        animate={{ scale: 80, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Failure Collapse — heavy red wash + flicker
// ──────────────────────────────────────────────────────────────────────
function FailureCollapseOverlay({ accent }: { accent: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,1)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ duration: 0.40, ease: "easeIn" }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${accent}66, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.85, 0.5, 0.85, 0.5] }}
        transition={{ duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1], ease: "linear" }}
      />
      <motion.div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: accent, boxShadow: `0 0 18px ${accent}` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.45, repeat: 1, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ background: accent, boxShadow: `0 0 18px ${accent}` }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.45, repeat: 1, ease: "easeInOut", delay: 0.1 }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Reusable bits
// ──────────────────────────────────────────────────────────────────────
function ScanlineSweep({ accent, durationMs }: { accent: string; durationMs: number }) {
  return (
    <motion.div
      className="absolute inset-x-0 h-px pointer-events-none"
      style={{
        background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
      }}
      initial={{ top: "-2%", opacity: 0.95 }}
      animate={{ top: "102%", opacity: [0.95, 0.95, 0] }}
      transition={{ duration: durationMs / 1000, ease: "linear" }}
    />
  );
}
