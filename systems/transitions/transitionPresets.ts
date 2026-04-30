/**
 * SCREEN TRANSITION SYSTEM · preset specs
 * ──────────────────────────────────────────────────────────────────────
 * Six tuning blocks plus the sound-hook routing table. Designers tune
 * here without touching the manager / overlay components.
 */

import { sfx } from "@/lib/sfx";
import {
  PresetSpec,
  TransitionPreset,
  TransitionSoundId,
} from "./transitionTypes";

// ──────────────────────────────────────────────────────────────────────
//  Per-preset tuning
// ──────────────────────────────────────────────────────────────────────
export const PRESET_SPECS: Record<TransitionPreset, PresetSpec> = {
  tacticalFade: {
    durationMs: 360,
    swapMs: 200,
    accent: "#f5c542",
    soundId: "transition_soft",
    blocking: false,
  },
  commandSlide: {
    durationMs: 380,
    swapMs: 240,
    accent: "#f5c542",
    soundId: "transition_command_slide",
    blocking: false,
  },
  dropTransition: {
    durationMs: 800,
    swapMs: 380,
    accent: "#f5c542",
    soundId: "drop_sequence_start",
    blocking: true,
  },
  combatImpact: {
    durationMs: 280,
    swapMs: 180,
    accent: "#ff4d4d",
    soundId: "combat_impact_cut",
    blocking: false,
  },
  rewardBloom: {
    durationMs: 520,
    swapMs: 280,
    accent: "#34d399",
    soundId: "reward_reveal",
    blocking: false,
  },
  failureCollapse: {
    durationMs: 720,
    swapMs: 380,
    accent: "#ff4d4d",
    soundId: "defeat_collapse",
    blocking: true,
  },
};

/** Reduced-motion fallback — overrides everything to a simple opacity fade. */
export const REDUCED_MOTION_SPEC: PresetSpec = {
  durationMs: 200,
  swapMs: 200,
  accent: "#f5c542",
  soundId: "none",
  blocking: false,
};

// ──────────────────────────────────────────────────────────────────────
//  Sound routing — named hooks → existing sfx engine
// ──────────────────────────────────────────────────────────────────────
const SOUND_HANDLERS: Record<TransitionSoundId, () => void> = {
  transition_soft: () => sfx.click(),
  transition_command_slide: () => {
    sfx.click();
    sfx.draw();
  },
  drop_sequence_start: () => {
    sfx.alert();
    sfx.beacon();
  },
  drop_sequence_impact: () => {
    sfx.bigExplosion();
    sfx.combatStart();
  },
  combat_impact_cut: () => sfx.hit(),
  reward_reveal: () => {
    sfx.heal();
    sfx.beacon();
  },
  defeat_collapse: () => sfx.defeat(),
  none: () => {},
};

export function playTransitionSound(id: TransitionSoundId): void {
  try {
    SOUND_HANDLERS[id]?.();
  } catch {
    /* sfx may not be initialized yet on first paint */
  }
}

// ──────────────────────────────────────────────────────────────────────
//  Page-swap variants for each preset
//  Used by PageTransitionWrapper's AnimatePresence motion.div.
// ──────────────────────────────────────────────────────────────────────
export const PAGE_VARIANTS: Record<TransitionPreset, {
  initial: any;
  animate: any;
  exit: any;
}> = {
  tacticalFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.20, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.20, ease: "easeIn" } },
  },
  commandSlide: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } },
    exit: { opacity: 0, x: -60, transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } },
  },
  dropTransition: {
    initial: { opacity: 0, scale: 0.94, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.20, ease: "easeOut" } },
  },
  combatImpact: {
    initial: { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 1.06, transition: { duration: 0.14, ease: "easeOut" } },
  },
  rewardBloom: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.30, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.20, ease: "easeIn" } },
  },
  failureCollapse: {
    initial: { opacity: 0, filter: "blur(6px)" },
    animate: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.40, ease: "easeOut" } },
    exit: { opacity: 0, filter: "blur(8px)", transition: { duration: 0.30, ease: "easeIn" } },
  },
};

/** Reduced-motion variants — always a flat fade. */
export const REDUCED_MOTION_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
};
