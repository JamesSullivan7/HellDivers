"use client";

/**
 * VFX PROVIDER · feedback → VFX bridge
 * ──────────────────────────────────────────────────────────────────────
 * Listens to the global feedback queue and translates the latest
 * FeedbackEvent into one (or more) VFX dispatches via triggerVFX(). This
 * keeps the systems composable: any code path that calls feedback.* gets
 * matching visual effects "for free" — no wiring needed at call sites.
 *
 * Translation table:
 *   card_play (eagle, cost ≥ critical)   → explosion (massive)
 *   card_play (eagle)                    → explosion (medium/large)
 *   card_play (orbital, critical)        → laser_beam (massive) + explosion (large)
 *   card_play (orbital)                  → laser_beam
 *   card_play (sentry)                   → shield_ripple + fire_burst (small)
 *   card_play (backpack/utility)         → shield_ripple
 *   card_play (other)                    → card_play_flash
 *   damage_hit (medium+)                 → bullet_hit
 *   critical_hit                         → explosion (medium)
 *   shield_break                         → shield_break VFX
 *   status_apply (burn)                  → fire_burst (small)
 *   status_apply (gas)                   → gas_cloud (small)
 *   status_apply (stun)                  → electric_arc (small)
 *   boss_enrage                          → electric_arc (massive)
 *   reward_gain                          → reward_bloom
 *   victory                              → reward_bloom (massive)
 *
 * The provider mounts once near the root and renders nothing.
 */

import { useEffect, useRef } from "react";
import { useFeedbackQueue } from "@/systems/feedback/feedbackQueue";
import type { FeedbackEvent } from "@/systems/feedback/feedbackTypes";
import { vfx, triggerVFX } from "@/systems/vfx/VFXManager";
import type { VFXIntensity } from "@/systems/vfx/vfxTypes";

// Feedback intensity → VFX intensity (with caps per effect class)
function toVFXIntensity(
  level: "low" | "medium" | "high" | "critical",
  allowMassive = true,
): VFXIntensity {
  switch (level) {
    case "low":
      return "small";
    case "medium":
      return "medium";
    case "high":
      return "large";
    case "critical":
      return allowMassive ? "massive" : "large";
  }
}

// Effect-class–aware caps for the convenience helpers
type SmallToLarge = "small" | "medium" | "large";
type MediumToMassive = "medium" | "large" | "massive";

function capSmallToLarge(i: VFXIntensity): SmallToLarge {
  return i === "massive" ? "large" : i;
}
function capMediumToMassive(i: VFXIntensity): MediumToMassive {
  return i === "small" ? "medium" : i;
}

// String contains helper — case-insensitive for cardType buckets
function ct(t: unknown, needle: string): boolean {
  return typeof t === "string" && t.toLowerCase().includes(needle);
}

function dispatchForFeedback(ev: FeedbackEvent) {
  const intensity = toVFXIntensity(ev.intensity);

  switch (ev.type) {
    case "card_play": {
      const type = ev.payload?.cardType;
      if (ct(type, "eagle") || ct(type, "explosive")) {
        vfx.explosion(undefined, toVFXIntensity(ev.intensity));
        return;
      }
      if (ct(type, "orbital") || ct(type, "laser")) {
        vfx.laserBeam(
          { x: window.innerWidth / 2, y: window.innerHeight * 0.18 },
          toVFXIntensity(ev.intensity),
          { dx: 0, dy: window.innerHeight * 0.55 },
        );
        if (ev.intensity === "critical") {
          // Pair with a big impact bloom at the bottom
          vfx.explosion(
            { x: window.innerWidth / 2, y: window.innerHeight * 0.7 },
            "large",
          );
        }
        return;
      }
      if (ct(type, "sentry") || ct(type, "turret")) {
        vfx.shieldRipple(undefined, "medium");
        vfx.fireBurst(undefined, "small");
        return;
      }
      if (ct(type, "backpack") || ct(type, "utility") || ct(type, "support")) {
        vfx.shieldRipple(undefined, capSmallToLarge(toVFXIntensity(ev.intensity, false)));
        return;
      }
      // Generic — a yellow card-play flash for tempo readability
      vfx.cardFlash(undefined, capMediumToMassive(intensity));
      return;
    }

    case "damage_hit": {
      // Skip lows to keep the screen calm
      if (ev.intensity === "low") return;
      vfx.bulletHit(undefined, capSmallToLarge(intensity));
      return;
    }

    case "critical_hit": {
      vfx.explosion(undefined, capMediumToMassive(intensity));
      return;
    }

    case "shield_break": {
      // Use the dedicated shield_break preset
      triggerVFX({
        type: "impact",
        effect: "shield_break",
        intensity,
      });
      return;
    }

    case "status_apply": {
      const status = ev.payload?.status;
      if (status === "burn") {
        vfx.fireBurst(undefined, "small");
      } else if (status === "gas" || status === "poison") {
        vfx.gasCloud(undefined, "small");
      } else if (status === "stun") {
        vfx.electricArc(undefined, "small");
      } else if (status === "shield") {
        vfx.shieldRipple(undefined, "small");
      }
      return;
    }

    case "boss_enrage": {
      vfx.electricArc(undefined, "massive");
      return;
    }

    case "reward_gain": {
      vfx.rewardBloom();
      return;
    }

    case "objective_complete": {
      vfx.rewardBloom();
      return;
    }

    case "victory": {
      vfx.explosion(undefined, "massive");
      vfx.rewardBloom();
      return;
    }

    case "defeat": {
      vfx.explosion(
        { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        "large",
      );
      return;
    }

    default:
      return;
  }
}

export default function VFXProvider() {
  const feed = useFeedbackQueue((s) => s.feed);
  // Track which feedback events we've already dispatched a VFX for. The feed
  // is bounded (MAX_FEED), so this set stays small in practice; we still
  // prune entries that no longer appear.
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // The feed is ordered newest-first. Dispatch for any event we haven't seen.
    const currentIds = new Set(feed.map((e) => e.id));
    for (const ev of feed) {
      if (!seenRef.current.has(ev.id)) {
        seenRef.current.add(ev.id);
        try {
          dispatchForFeedback(ev);
        } catch {
          /* swallow — VFX must never crash the game */
        }
      }
    }
    // Prune ids no longer in the feed so the set doesn't grow unbounded.
    for (const id of seenRef.current) {
      if (!currentIds.has(id)) seenRef.current.delete(id);
    }
  }, [feed]);

  return null;
}
