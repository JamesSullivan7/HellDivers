/**
 * RouteTransitionManager — picks a TransitionPreset based on
 * (fromPhase, toPhase) and the current tension level.
 *
 * The mapping is *route-aware*: the same destination can use a different
 * preset depending on where the player is coming from.
 *   menu → faction               → tacticalFade
 *   loadout → map                → dropTransition (you've just deployed)
 *   map → combat                 → combatImpact
 *   event → combat               → combatImpact (heavier flavor)
 *   combat → reward              → rewardBloom
 *   combat → gameover            → failureCollapse
 *   anything → menu              → tacticalFade
 *
 * Critical-tension runs sharpen all presets a bit (faster + stronger),
 * and reduced-motion replaces everything with a flat fade.
 */

import type { GamePhase } from "@/lib/types";
import { useTension } from "@/lib/tension";
import { prefersReducedMotion } from "@/systems/feedback/FeedbackManager";
import {
  TransitionDirection,
  TransitionPreset,
} from "./transitionTypes";

interface RouteDecision {
  preset: TransitionPreset;
  direction: TransitionDirection;
}

/**
 * Authoritative phase-pair lookup. The key matches when the map is entered
 * with a from→to format. Wildcards: `*→X` covers anything-to-X.
 */
function lookupPair(from: GamePhase | null, to: GamePhase): RouteDecision | null {
  // ── Run start: loadout → map (drop-pod sequence) ──
  if (from === "loadout" && to === "map") {
    return { preset: "dropTransition", direction: "combat" };
  }

  // ── Combat entry/resolution ──
  if (to === "combat") {
    if (from === "event") return { preset: "combatImpact", direction: "combat" };
    if (from === "map") return { preset: "combatImpact", direction: "combat" };
    return { preset: "combatImpact", direction: "combat" };
  }
  if (from === "combat" && to === "reward") {
    return { preset: "rewardBloom", direction: "forward" };
  }
  if (to === "victory") {
    return { preset: "rewardBloom", direction: "forward" };
  }
  if (to === "gameover") {
    return { preset: "failureCollapse", direction: "back" };
  }

  // ── Map / event / shop / rest are sibling routes — slide between them ──
  if (from === "reward" && to === "map") {
    return { preset: "rewardBloom", direction: "back" };
  }
  if (from === "rest" && to === "map") {
    return { preset: "tacticalFade", direction: "back" };
  }
  if (from === "shop" && to === "map") {
    return { preset: "tacticalFade", direction: "back" };
  }
  if (from === "event" && to === "map") {
    return { preset: "tacticalFade", direction: "back" };
  }

  // ── Hub navigation ──
  if (from === "menu" && (to === "faction" || to === "armory" || to === "character" || to === "codex")) {
    return { preset: "commandSlide", direction: "forward" };
  }
  if (to === "faction") {
    return { preset: "commandSlide", direction: "forward" };
  }
  if (from === "faction" && to === "loadout") {
    return { preset: "commandSlide", direction: "forward" };
  }

  // ── Returning to menu ──
  if (to === "menu") {
    return { preset: "tacticalFade", direction: "back" };
  }

  // ── Squad / coop subroutes ──
  if (from === "squad_hub" || to === "squad_hub" || from === "squad_lobby" || to === "squad_lobby") {
    return { preset: "commandSlide", direction: "modal" };
  }

  return null;
}

export interface SelectPresetResult {
  preset: TransitionPreset;
  direction: TransitionDirection;
  /** True if reduced-motion is active and the manager downgraded the preset. */
  reducedMotion: boolean;
  /** True if tension is critical and the manager intensified the preset. */
  intensified: boolean;
}

/**
 * Pick the preset for a phase change. Always returns something — falls back
 * to "tacticalFade" if no specific rule matches.
 */
export function selectPreset(
  from: GamePhase | null,
  to: GamePhase,
): SelectPresetResult {
  const reducedMotion = prefersReducedMotion();
  const tensionState = useTension.getState().tensionState;

  const matched = lookupPair(from, to);
  let preset: TransitionPreset = matched?.preset ?? "tacticalFade";
  const direction = matched?.direction ?? "forward";

  let intensified = false;
  // Critical tension: harden softer transitions a tier.
  if (!reducedMotion && tensionState === "critical") {
    if (preset === "tacticalFade") {
      preset = "combatImpact";
      intensified = true;
    } else if (preset === "rewardBloom" && to === "victory") {
      // keep bloom — victory should still feel cathartic
    } else if (preset === "commandSlide") {
      preset = "combatImpact";
      intensified = true;
    }
  }

  return {
    preset,
    direction,
    reducedMotion,
    intensified,
  };
}
