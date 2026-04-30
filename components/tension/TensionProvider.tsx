"use client";

/**
 * TensionProvider — derives tension from authoritative game state and pushes
 * the result into useTension. Renders nothing.
 *
 * This is the only component that calls calculateTensionFromGameState() in
 * the live app. Mount it once near the root (e.g. inside any in-run phase).
 *
 * Also fires faction-agnostic audio cues on level transitions:
 *   calm    → alert    : "alert_enter"
 *   alert   → danger   : "danger_enter"
 *   any     → critical : "critical_enter"
 *   critical → lower   : "relief"
 */

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store";
import {
  TensionLevel,
  calculateTensionFromGameState,
  playTensionCue,
  useTension,
} from "@/lib/tension";

export default function TensionProvider() {
  const apply = useTension((s) => s.applyComputedTension);

  // Subscribe to JUST the game-state slices that matter for tension. Avoid
  // subscribing to the whole store so unrelated changes (UI hover state,
  // event resolution, etc.) don't recompute.
  const player = useGame((s) => s.player);
  const enemies = useGame((s) => s.combat.enemies);
  const hand = useGame((s) => s.combat.hand);
  const modifiers = useGame((s) => s.modifiers);
  const difficulty = useGame((s) => s.difficulty);
  const phase = useGame((s) => s.phase);

  // Recompute on every relevant change
  useEffect(() => {
    const sources = calculateTensionFromGameState({
      player,
      combat: { enemies, hand },
      modifiers,
      difficulty,
    });
    apply(sources);
  }, [player, enemies, hand, modifiers, difficulty, phase, apply]);

  // Reset tension when leaving the run (back to menu/hub)
  useEffect(() => {
    if (phase === "menu" || phase === "victory" || phase === "gameover") {
      useTension.getState().resetTension();
    }
  }, [phase]);

  // Fire transition cues when state crosses thresholds
  const lastStateRef = useRef<TensionLevel>("calm");
  const tensionState = useTension((s) => s.tensionState);

  useEffect(() => {
    const prev = lastStateRef.current;
    if (prev === tensionState) return;
    lastStateRef.current = tensionState;

    // Going UP — escalation cue
    if (rank(tensionState) > rank(prev)) {
      if (tensionState === "alert") playTensionCue("alert_enter");
      else if (tensionState === "danger") playTensionCue("danger_enter");
      else if (tensionState === "critical") playTensionCue("critical_enter");
    } else if (prev === "critical" && tensionState !== "critical") {
      // Coming down off a critical moment
      playTensionCue("relief");
    }
  }, [tensionState]);

  return null;
}

function rank(s: TensionLevel): number {
  return s === "calm" ? 0 : s === "alert" ? 1 : s === "danger" ? 2 : 3;
}
