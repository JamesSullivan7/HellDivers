/**
 * VFX MANAGER · single dispatch entry point.
 *
 *   triggerVFX(event)   → push to queue, schedule auto-remove, optional shake
 *   clearVFX(id)        → manually remove a specific effect
 *   clearAllVFX()       → wipe (used on phase change)
 *
 * Reduced-motion: suppresses long/heavy effects (massive intensity, gas clouds)
 * and lowers the concurrency cap. The system never goes fully silent — small
 * effects still play so gameplay-essential feedback (a hit happened HERE)
 * isn't lost.
 */

import { prefersReducedMotion } from "@/systems/feedback/FeedbackManager";
import { useFeedbackQueue } from "@/systems/feedback/feedbackQueue";
import {
  VFX_CONCURRENCY_CAP,
  VFX_CONCURRENCY_CAP_REDUCED,
  getVFXSpec,
} from "./vfxPresets";
import {
  VFXEvent,
  VFXEventInput,
} from "./vfxTypes";
import { nextVfxId, useVFXQueue } from "./vfxQueue";

let shakeKey = 0;

export function triggerVFX(input: VFXEventInput): VFXEvent {
  const id = input.id ?? nextVfxId();
  const startedAt = input.startedAt ?? Date.now();

  const reduced = prefersReducedMotion();
  const spec = getVFXSpec(input.effect, input.intensity);

  // Reduced-motion: drop effects flagged to suppress, OR cap intensity at "small"
  if (reduced) {
    if (spec.suppressOnReducedMotion) {
      return { ...input, id, startedAt };
    }
    if (input.intensity === "massive" || input.intensity === "large") {
      input.intensity = "medium";
    }
  }

  const event: VFXEvent = {
    id,
    type: input.type,
    effect: input.effect,
    intensity: input.intensity,
    sourceId: input.sourceId,
    targetId: input.targetId,
    position: input.position,
    duration: input.duration ?? spec.durationMs,
    payload: input.payload,
    startedAt,
  };

  // Concurrency cap — drop the oldest effect if over cap
  const queue = useVFXQueue.getState();
  const cap = reduced ? VFX_CONCURRENCY_CAP_REDUCED : VFX_CONCURRENCY_CAP;
  if (queue.active.length >= cap) {
    queue.remove(queue.active[0].id);
  }

  queue.push(event);

  // Trigger shake via feedback queue if the spec calls for it.
  if (!reduced && spec.triggersShake) {
    const fq = useFeedbackQueue.getState();
    const amp = input.intensity === "massive" ? 5 : input.intensity === "large" ? 4 : 2;
    fq.setShake({
      amp,
      durationMs: 280,
      startedAt: Date.now(),
      key: ++shakeKey,
    });
    window.setTimeout(() => {
      const cur = useFeedbackQueue.getState().shake;
      if (cur && cur.key === shakeKey) useFeedbackQueue.getState().setShake(null);
    }, 320);
  }

  // Auto-remove after duration
  window.setTimeout(() => {
    useVFXQueue.getState().remove(id);
  }, (event.duration ?? spec.durationMs) + 50);

  return event;
}

export function clearVFX(id: string) {
  useVFXQueue.getState().remove(id);
}

export function clearAllVFX() {
  useVFXQueue.getState().clearAll();
}

/**
 * Convenience helpers for common VFX patterns.
 * Components should use these where possible to stay DRY.
 */
export const vfx = {
  bulletHit: (position?: { x: number; y: number }, intensity: "small" | "medium" | "large" = "small") =>
    triggerVFX({ type: "impact", effect: "bullet_hit", intensity, position }),
  explosion: (position?: { x: number; y: number }, intensity: "small" | "medium" | "large" | "massive" = "medium") =>
    triggerVFX({ type: "impact", effect: "explosion", intensity, position }),
  laserBeam: (
    position: { x: number; y: number },
    intensity: "small" | "medium" | "large" | "massive" = "medium",
    payload?: { dx?: number; dy?: number; length?: number }
  ) => triggerVFX({ type: "impact", effect: "laser_beam", intensity, position, payload }),
  shieldRipple: (position?: { x: number; y: number }, intensity: "small" | "medium" | "large" = "medium") =>
    triggerVFX({ type: "impact", effect: "shield_ripple", intensity, position }),
  shieldBreak: (position?: { x: number; y: number }, intensity: "small" | "medium" | "large" = "medium") =>
    triggerVFX({ type: "impact", effect: "shield_break", intensity, position }),
  fireBurst: (position?: { x: number; y: number }, intensity: "small" | "medium" | "large" | "massive" = "medium") =>
    triggerVFX({ type: "status", effect: "fire_burst", intensity, position }),
  gasCloud: (position?: { x: number; y: number }, intensity: "small" | "medium" | "large" = "medium") =>
    triggerVFX({ type: "status", effect: "gas_cloud", intensity, position }),
  electricArc: (
    position?: { x: number; y: number },
    intensity: "small" | "medium" | "large" | "massive" = "medium",
  ) => triggerVFX({ type: "status", effect: "electric_arc", intensity, position }),
  rewardBloom: (position?: { x: number; y: number }) =>
    triggerVFX({ type: "ui", effect: "reward_bloom", intensity: "medium", position }),
  cardFlash: (position?: { x: number; y: number }, intensity: "medium" | "large" | "massive" = "medium") =>
    triggerVFX({ type: "ui", effect: "card_play_flash", intensity, position }),
};
