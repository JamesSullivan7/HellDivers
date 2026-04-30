/**
 * SCREEN TRANSITION SYSTEM · types
 * ──────────────────────────────────────────────────────────────────────
 * One TransitionSnapshot is dispatched on every meaningful phase change.
 * Subscribers (overlay, wrapper, debug HUD) read it and animate.
 */

import type { GamePhase } from "@/lib/types";

/** Six visual presets — each has its own overlay choreography. */
export type TransitionPreset =
  | "tacticalFade"
  | "commandSlide"
  | "dropTransition"
  | "combatImpact"
  | "rewardBloom"
  | "failureCollapse";

/**
 * Direction hint — used by some presets to pick slide direction or to
 * decide whether to play a "back" sound vs a "forward" sound.
 *   forward  → moving deeper into the run (menu→hub→map→combat)
 *   back     → moving shallower (combat→map, settings→back)
 *   modal    → opening a side panel without leaving the parent context
 *   combat   → entering a fight (drop / impact)
 */
export type TransitionDirection = "forward" | "back" | "modal" | "combat";

/** Snapshot pushed to the transition store. */
export interface TransitionSnapshot {
  /** Bumped every dispatch so AnimatePresence retriggers cleanly. */
  key: number;
  preset: TransitionPreset;
  direction: TransitionDirection;
  fromPhase: GamePhase | null;
  toPhase: GamePhase;
  /** Total duration in ms — read by the overlay component to time itself. */
  durationMs: number;
  /** Wall-clock dispatch time. */
  startedAt: number;
  /** Free-form payload slot for special presets (e.g. drop countdown text). */
  payload?: Record<string, unknown>;
}

/** Per-preset tuning — wired into transitionPresets.ts. */
export interface PresetSpec {
  durationMs: number;
  /** Page swap duration inside the preset (always ≤ durationMs). */
  swapMs: number;
  /** Hex color used for any wash/stripe/glow in the overlay. */
  accent: string;
  /** Sound hook id — looked up by playTransitionSound(). */
  soundId: TransitionSoundId;
  /** Whether the overlay should temporarily block pointer events during the animation. */
  blocking: boolean;
}

/** Named sound hooks — mapped to sfx in transitionPresets.ts. */
export type TransitionSoundId =
  | "transition_soft"
  | "transition_command_slide"
  | "drop_sequence_start"
  | "drop_sequence_impact"
  | "combat_impact_cut"
  | "reward_reveal"
  | "defeat_collapse"
  | "none";
