/**
 * GAME FEEL · Feedback presets
 * ──────────────────────────────────────────────────────────────────────
 * Timing tokens, motion curves, sound mappings, tension deltas, and
 * screen-shake amplitudes — all keyed by FeedbackEventType + intensity.
 *
 * Designers tune the game feel by editing this file. Manager logic stays
 * untouched.
 */

import { sfx } from "@/lib/sfx";
import type { FeedbackEventType, FeedbackIntensity } from "./feedbackTypes";

// ──────────────────────────────────────────────────────────────────────
//  TIMING TOKENS
// ──────────────────────────────────────────────────────────────────────
export const TIMING = {
  instant: 60,
  fast: 120,
  medium: 220,
  heavy: 360,
  cinematic: 600,
} as const;

export type TimingKey = keyof typeof TIMING;

// ──────────────────────────────────────────────────────────────────────
//  MOTION PRESETS — cubic-bezier curves
// ──────────────────────────────────────────────────────────────────────
export const MOTION_PRESETS = {
  /** Snappy, responsive — default for card movement. */
  snap: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  /** Heavy, weighty — for impact landings. */
  heavy: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Sharp acceleration — for warning anims. */
  warning: "cubic-bezier(0.7, 0, 0.84, 0)",
  /** Gentle ease — for tension fades. */
  gentle: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// ──────────────────────────────────────────────────────────────────────
//  EVENT FEED · color tokens by event type
// ──────────────────────────────────────────────────────────────────────
export const FEED_COLORS: Partial<Record<FeedbackEventType, string>> = {
  card_play: "#f5c542",
  damage_hit: "#ff8c1a",
  critical_hit: "#ff4d4d",
  blocked_hit: "#4da6ff",
  enemy_attack: "#ff4d4d",
  shield_break: "#a78bfa",
  boss_enrage: "#ff4d4d",
  reward_gain: "#34d399",
  status_apply: "#a78bfa",
  end_turn: "rgba(232,238,245,0.5)",
  choice_select: "#f5c542",
  objective_complete: "#34d399",
  victory: "#34d399",
  defeat: "#ff4d4d",
};

// ──────────────────────────────────────────────────────────────────────
//  EVENT FEED · default expiry per event type (ms before fade-out)
// ──────────────────────────────────────────────────────────────────────
export const FEED_EXPIRY: Record<FeedbackEventType, number> = {
  card_hover: 0,                     // never appears in feed
  card_play: 2200,
  target_select: 0,
  damage_hit: 2000,
  critical_hit: 3000,
  blocked_hit: 2000,
  status_apply: 2200,
  shield_break: 2400,
  enemy_attack: 2400,
  end_turn: 1500,
  boss_enrage: 4000,
  reward_gain: 3000,
  choice_select: 2400,
  objective_complete: 3500,
  victory: 5000,
  defeat: 5000,
};

// ──────────────────────────────────────────────────────────────────────
//  SCREEN SHAKE — amplitude in pixels per event/intensity
//  Strict caps: never exceed 6px even on critical.
// ──────────────────────────────────────────────────────────────────────
export type ShakeProfile = { amp: number; durationMs: number };

const NO_SHAKE: ShakeProfile = { amp: 0, durationMs: 0 };

export function getShakeProfile(
  type: FeedbackEventType,
  intensity: FeedbackIntensity
): ShakeProfile {
  // Most UI events don't shake at all.
  switch (type) {
    case "damage_hit":
      if (intensity === "critical") return { amp: 4, durationMs: 280 };
      if (intensity === "high") return { amp: 3, durationMs: 240 };
      if (intensity === "medium") return { amp: 2, durationMs: 200 };
      return { amp: 1, durationMs: 160 };
    case "critical_hit":
      return { amp: 4, durationMs: 320 };
    case "enemy_attack":
      if (intensity === "critical") return { amp: 6, durationMs: 380 };
      if (intensity === "high") return { amp: 5, durationMs: 320 };
      if (intensity === "medium") return { amp: 3, durationMs: 240 };
      return { amp: 2, durationMs: 200 };
    case "boss_enrage":
      return { amp: 6, durationMs: 500 };
    case "shield_break":
      return { amp: 3, durationMs: 220 };
    case "card_play":
      // Card plays only shake on heavy stratagems
      if (intensity === "critical") return { amp: 3, durationMs: 220 };
      if (intensity === "high") return { amp: 2, durationMs: 180 };
      return NO_SHAKE;
    default:
      return NO_SHAKE;
  }
}

// ──────────────────────────────────────────────────────────────────────
//  TENSION DELTA — how much the tension level should bump per event
//  Positive = adds tension. Negative = relieves.
// ──────────────────────────────────────────────────────────────────────
export interface TensionDelta {
  source: string;
  amount: number;
}

export function getTensionDelta(
  type: FeedbackEventType,
  intensity: FeedbackIntensity
): TensionDelta | null {
  switch (type) {
    case "critical_hit":
      return { source: "fb_critical_hit", amount: -8 }; // satisfying — relieves
    case "damage_hit":
      if (intensity === "critical") return { source: "fb_damage_critical", amount: -4 };
      return null;
    case "enemy_attack":
      if (intensity === "critical") return { source: "fb_player_hit_crit", amount: 18 };
      if (intensity === "high") return { source: "fb_player_hit_hi", amount: 10 };
      if (intensity === "medium") return { source: "fb_player_hit_med", amount: 5 };
      return null;
    case "boss_enrage":
      return { source: "fb_boss_enrage", amount: 35 };
    case "reward_gain":
      return { source: "fb_reward", amount: -6 };
    case "objective_complete":
      return { source: "fb_objective", amount: -10 };
    case "shield_break":
      return { source: "fb_shield_break", amount: 6 };
    case "victory":
      return { source: "fb_victory", amount: -100 }; // collapse to calm
    case "defeat":
      return { source: "fb_defeat", amount: 30 };
    default:
      return null;
  }
}

// ──────────────────────────────────────────────────────────────────────
//  SOUND HOOKS — named hooks the manager forwards to sfx
//  Each event/intensity maps to a fire() function.
// ──────────────────────────────────────────────────────────────────────
type SoundHookId =
  | "card_hover"
  | "card_play_eagle"
  | "card_play_orbital"
  | "card_play_support"
  | "card_play_sentry"
  | "card_play_backpack"
  | "card_play_default"
  | "impact_light"
  | "impact_heavy"
  | "critical"
  | "shield_block"
  | "shield_break"
  | "boss_enrage"
  | "reward_gain"
  | "objective_complete"
  | "end_turn"
  | "enemy_hit_player"
  | "victory"
  | "defeat"
  | "choice_lock";

/** Fire a named sound hook through the existing synthesized engine. */
export function playSound(id: SoundHookId): void {
  switch (id) {
    case "card_hover": sfx.hover(); break;
    case "card_play_eagle": sfx.bigExplosion(); break;
    case "card_play_orbital": sfx.explosion(); break;
    case "card_play_support": sfx.laser(); break;
    case "card_play_sentry": sfx.sentryDeploy(); break;
    case "card_play_backpack": sfx.shield(); break;
    case "card_play_default": sfx.cardPlay(); break;
    case "impact_light": sfx.weakHit(); break;
    case "impact_heavy": sfx.hit(); break;
    case "critical": sfx.crit(); break;
    case "shield_block": sfx.shieldGlassy(); break;
    case "shield_break": sfx.shatter(); break;
    case "boss_enrage": sfx.bossEnrage(); break;
    case "reward_gain": sfx.heal(); sfx.beacon(); break;
    case "objective_complete": sfx.beacon(); sfx.heal(); break;
    case "end_turn": sfx.endTurn(); break;
    case "enemy_hit_player": sfx.hit(); break;
    case "victory": sfx.victory(); break;
    case "defeat": sfx.defeat(); break;
    case "choice_lock": sfx.cardSelect(); sfx.beacon(); break;
  }
}

/** Pick the sound hook for a given event + payload (e.g. card type routing). */
export function selectSoundHook(
  type: FeedbackEventType,
  intensity: FeedbackIntensity,
  payload?: { cardType?: string }
): SoundHookId | null {
  switch (type) {
    case "card_hover":
      return "card_hover";
    case "card_play": {
      switch (payload?.cardType) {
        case "eagle": return "card_play_eagle";
        case "orbital": return "card_play_orbital";
        case "support": return "card_play_support";
        case "sentry": return "card_play_sentry";
        case "backpack": return "card_play_backpack";
        default: return "card_play_default";
      }
    }
    case "damage_hit":
      if (intensity === "critical" || intensity === "high") return "impact_heavy";
      return "impact_light";
    case "critical_hit":
      return "critical";
    case "blocked_hit":
      return "shield_block";
    case "shield_break":
      return "shield_break";
    case "enemy_attack":
      return "enemy_hit_player";
    case "end_turn":
      return "end_turn";
    case "boss_enrage":
      return "boss_enrage";
    case "reward_gain":
      return "reward_gain";
    case "objective_complete":
      return "objective_complete";
    case "choice_select":
      return "choice_lock";
    case "victory":
      return "victory";
    case "defeat":
      return "defeat";
    default:
      return null;
  }
}

// ──────────────────────────────────────────────────────────────────────
//  IMPACT FLASH — full-screen tinted flash on critical events
// ──────────────────────────────────────────────────────────────────────
export interface FlashProfile {
  color: string;
  opacity: number;
  durationMs: number;
}

export function getFlashProfile(
  type: FeedbackEventType,
  intensity: FeedbackIntensity
): FlashProfile | null {
  switch (type) {
    case "critical_hit":
      return { color: "#ff4d4d", opacity: 0.18, durationMs: 220 };
    case "boss_enrage":
      return { color: "#ff4d4d", opacity: 0.35, durationMs: 380 };
    case "enemy_attack":
      if (intensity === "critical") return { color: "#ff4d4d", opacity: 0.25, durationMs: 280 };
      if (intensity === "high") return { color: "#ff4d4d", opacity: 0.18, durationMs: 220 };
      return null;
    case "shield_break":
      return { color: "#a78bfa", opacity: 0.22, durationMs: 280 };
    case "victory":
      return { color: "#f5c542", opacity: 0.30, durationMs: 700 };
    case "defeat":
      return { color: "#ff4d4d", opacity: 0.45, durationMs: 900 };
    default:
      return null;
  }
}
