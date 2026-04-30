"use client";

/**
 * VFX LAYER · the renderer
 * ──────────────────────────────────────────────────────────────────────
 * Subscribes to useVFXQueue.active and renders each VFXEvent through the
 * matching effect component. Events are bucketed by their preset layer so
 * we get correct z-ordering across the screen:
 *
 *   background  →  battlefield  →  character  →  ui  →  overlay
 *
 * Every layer is full-screen, fixed, and pointer-events:none — VFX never
 * intercept clicks. AnimatePresence is intentionally NOT used here:
 * VFXManager already schedules removal at duration+50ms, so the keyed
 * mount/unmount alone cleans up cleanly without exit flicker.
 */

import { useMemo } from "react";
import { useVFXQueue } from "@/systems/vfx/vfxQueue";
import { getVFXSpec } from "@/systems/vfx/vfxPresets";
import type { VFXEvent, VFXEffect, VFXLayer as VFXLayerName } from "@/systems/vfx/vfxTypes";
import {
  ExplosionVFX,
  BulletHitVFX,
  LaserBeamVFX,
  ElectricArcVFX,
  GasCloudVFX,
  ShieldRippleVFX,
  ShieldBreakVFX,
  FireBurstVFX,
  RewardBloomVFX,
  CardPlayFlashVFX,
} from "./effects";

// z-index per layer — keep aligned with other system overlays
const LAYER_Z: Record<VFXLayerName, number> = {
  background: 5,
  battlefield: 25,
  character: 45,
  ui: 75,
  overlay: 95,
};

const LAYER_ORDER: VFXLayerName[] = [
  "background",
  "battlefield",
  "character",
  "ui",
  "overlay",
];

// ──────────────────────────────────────────────────────────────────────
//  Effect dispatch — switch on the event.effect to the right component.
// ──────────────────────────────────────────────────────────────────────
function renderEffect(event: VFXEvent) {
  switch (event.effect) {
    case "explosion":
      return <ExplosionVFX event={event} />;
    case "bullet_hit":
      return <BulletHitVFX event={event} />;
    case "laser_beam":
      return <LaserBeamVFX event={event} />;
    case "electric_arc":
      return <ElectricArcVFX event={event} />;
    case "gas_cloud":
      return <GasCloudVFX event={event} />;
    case "shield_ripple":
      return <ShieldRippleVFX event={event} />;
    case "shield_break":
      return <ShieldBreakVFX event={event} />;
    case "fire_burst":
      return <FireBurstVFX event={event} />;
    case "reward_bloom":
      return <RewardBloomVFX event={event} />;
    case "card_play_flash":
      return <CardPlayFlashVFX event={event} />;
    // ── Stratagem & status fall-throughs — reuse closest existing visuals ──
    case "orbital_beam":
      return <LaserBeamVFX event={event} />;
    case "eagle_strafe":
      return <ExplosionVFX event={event} />;
    case "sentry_deploy":
      return <ShieldRippleVFX event={event} />;
    case "armor_break":
      return <ShieldBreakVFX event={event} />;
    default: {
      // exhaustiveness guard
      const _exhaustive: never = event.effect;
      void _exhaustive;
      return null;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
//  VFXLayer — subscribes & renders
// ──────────────────────────────────────────────────────────────────────
export default function VFXLayer() {
  const active = useVFXQueue((s) => s.active);

  // Bucket events by their preset.layer so we can render each layer in its
  // own fixed container with the correct z-index.
  const bucketed = useMemo(() => {
    const buckets: Record<VFXLayerName, VFXEvent[]> = {
      background: [],
      battlefield: [],
      character: [],
      ui: [],
      overlay: [],
    };
    for (const ev of active) {
      const spec = getVFXSpec(ev.effect, ev.intensity);
      buckets[spec.layer].push(ev);
    }
    return buckets;
  }, [active]);

  return (
    <>
      {LAYER_ORDER.map((layer) => {
        const events = bucketed[layer];
        if (events.length === 0) return null;
        return (
          <div
            key={layer}
            aria-hidden
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: LAYER_Z[layer], overflow: "hidden" }}
          >
            {events.map((ev) => (
              <div key={ev.id} className="absolute inset-0">
                {renderEffect(ev)}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
