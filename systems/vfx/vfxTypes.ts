/**
 * VFX SYSTEM · types
 * ──────────────────────────────────────────────────────────────────────
 * Authoritative shape for visual effects. The VFX manager queues these,
 * the VFXLayer renders them, and feedback / engine / UI fire them.
 */

export type VFXIntensity = "small" | "medium" | "large" | "massive";

export type VFXLayer = "background" | "battlefield" | "character" | "ui" | "overlay";

export type VFXType = "impact" | "status" | "stratagem" | "ui" | "environment";

/**
 * Discrete effect ids — each maps to a renderable component.
 * Add new effects by extending this union and the EffectRegistry below.
 */
export type VFXEffect =
  // Impact
  | "bullet_hit"
  | "explosion"
  | "laser_beam"
  | "shield_ripple"
  | "shield_break"
  // Status
  | "fire_burst"
  | "gas_cloud"
  | "electric_arc"
  | "armor_break"
  // Stratagem
  | "orbital_beam"
  | "eagle_strafe"
  | "sentry_deploy"
  // UI
  | "reward_bloom"
  | "card_play_flash";

export interface VFXPosition {
  x: number;
  y: number;
}

export interface VFXEvent {
  /** Unique id — manager fills if omitted on dispatch. */
  id: string;
  type: VFXType;
  effect: VFXEffect;
  intensity: VFXIntensity;
  /** Optional source (originating entity / card / sentry). */
  sourceId?: string;
  /** Optional target (enemy id, etc.). */
  targetId?: string;
  /** Screen-space position. If omitted, the effect renders at viewport center. */
  position?: VFXPosition;
  /** Override duration in ms. If omitted, uses preset for effect+intensity. */
  duration?: number;
  /** Free-form payload — beam endpoints, rotation, etc. */
  payload?: Record<string, unknown>;
  /** Wall-clock dispatch — manager fills. */
  startedAt: number;
}

export type VFXEventInput = Omit<VFXEvent, "id" | "startedAt"> & {
  id?: string;
  startedAt?: number;
};

/** Per-effect+intensity tuning block. */
export interface VFXSpec {
  /** Duration in ms. */
  durationMs: number;
  /** Scale factor for size (radius / line thickness / etc.). */
  scale: number;
  /** Render layer this effect lives on. */
  layer: VFXLayer;
  /** True if this effect should also fire a screen shake via feedback. */
  triggersShake?: boolean;
  /** True if reduced-motion should suppress this effect entirely. */
  suppressOnReducedMotion?: boolean;
}
