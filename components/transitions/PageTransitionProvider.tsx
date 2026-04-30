"use client";

/**
 * PageTransitionProvider — watches useGame.phase, picks a preset on each
 * change, fires sound hooks, pushes a TransitionSnapshot to the store, and
 * schedules an end-of-transition cleanup. Renders nothing.
 */

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store";
import { selectPreset } from "@/systems/transitions/RouteTransitionManager";
import {
  PRESET_SPECS,
  REDUCED_MOTION_SPEC,
  playTransitionSound,
} from "@/systems/transitions/transitionPresets";
import {
  nextTransitionKey,
  useTransitionStore,
} from "@/systems/transitions/transitionStore";

export default function PageTransitionProvider() {
  const phase = useGame((s) => s.phase);
  const lastPhaseRef = useRef<typeof phase | null>(null);
  const endTimer = useRef<number | null>(null);

  useEffect(() => {
    const from = lastPhaseRef.current;
    lastPhaseRef.current = phase;

    // Skip the very first paint — there's no "from" to transition out of.
    if (from === null || from === phase) return;

    const decision = selectPreset(from, phase);
    const spec = decision.reducedMotion
      ? REDUCED_MOTION_SPEC
      : PRESET_SPECS[decision.preset];

    // Push snapshot for overlays to render
    useTransitionStore.getState().begin({
      key: nextTransitionKey(),
      preset: decision.preset,
      direction: decision.direction,
      fromPhase: from,
      toPhase: phase,
      durationMs: spec.durationMs,
      startedAt: Date.now(),
    });

    // Sound hook (skipped if reduced-motion)
    if (!decision.reducedMotion) {
      playTransitionSound(spec.soundId);
    }

    // Schedule cleanup
    if (endTimer.current !== null) window.clearTimeout(endTimer.current);
    endTimer.current = window.setTimeout(() => {
      useTransitionStore.getState().end();
      endTimer.current = null;
    }, spec.durationMs + 60);

    return () => {
      if (endTimer.current !== null) {
        window.clearTimeout(endTimer.current);
        endTimer.current = null;
      }
    };
  }, [phase]);

  return null;
}
