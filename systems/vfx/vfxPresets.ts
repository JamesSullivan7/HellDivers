/**
 * VFX SYSTEM · per-effect + intensity tuning specs
 * ──────────────────────────────────────────────────────────────────────
 * Designers tune VFX feel here without touching the manager / components.
 *
 *   durationMs : how long the effect renders before auto-removal
 *   scale      : multiplier on visual radius / particle count / line thickness
 *   layer      : z-stack layer
 *   triggersShake: whether the manager should also dispatch a screen shake
 */

import type { VFXEffect, VFXIntensity, VFXSpec } from "./vfxTypes";

const SPECS: Record<VFXEffect, Record<VFXIntensity, VFXSpec>> = {
  // ── IMPACT ──────────────────────────────────────────────────────
  bullet_hit: {
    small:   { durationMs: 220, scale: 0.7, layer: "battlefield" },
    medium:  { durationMs: 280, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 320, scale: 1.3, layer: "battlefield" },
    massive: { durationMs: 360, scale: 1.6, layer: "battlefield" },
  },
  explosion: {
    small:   { durationMs: 320, scale: 0.65, layer: "battlefield" },
    medium:  { durationMs: 440, scale: 1.0,  layer: "battlefield", triggersShake: true },
    large:   { durationMs: 600, scale: 1.45, layer: "battlefield", triggersShake: true },
    massive: { durationMs: 900, scale: 2.0,  layer: "overlay",     triggersShake: true },
  },
  laser_beam: {
    small:   { durationMs: 220, scale: 0.7, layer: "battlefield" },
    medium:  { durationMs: 360, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 540, scale: 1.4, layer: "battlefield" },
    massive: { durationMs: 720, scale: 1.8, layer: "overlay" },
  },
  shield_ripple: {
    small:   { durationMs: 320, scale: 0.7, layer: "battlefield", suppressOnReducedMotion: false },
    medium:  { durationMs: 420, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 540, scale: 1.3, layer: "battlefield" },
    massive: { durationMs: 720, scale: 1.7, layer: "battlefield" },
  },
  shield_break: {
    small:   { durationMs: 360, scale: 0.7, layer: "battlefield", triggersShake: true },
    medium:  { durationMs: 460, scale: 1.0, layer: "battlefield", triggersShake: true },
    large:   { durationMs: 620, scale: 1.3, layer: "battlefield", triggersShake: true },
    massive: { durationMs: 820, scale: 1.6, layer: "battlefield", triggersShake: true },
  },

  // ── STATUS ──────────────────────────────────────────────────────
  fire_burst: {
    small:   { durationMs: 480, scale: 0.7, layer: "battlefield" },
    medium:  { durationMs: 700, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 900, scale: 1.4, layer: "battlefield" },
    massive: { durationMs: 1200, scale: 1.8, layer: "battlefield" },
  },
  gas_cloud: {
    small:   { durationMs: 1200, scale: 0.7, layer: "battlefield" },
    medium:  { durationMs: 1600, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 2000, scale: 1.4, layer: "battlefield" },
    massive: { durationMs: 2400, scale: 1.8, layer: "battlefield" },
  },
  electric_arc: {
    small:   { durationMs: 280, scale: 0.7, layer: "battlefield" },
    medium:  { durationMs: 380, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 520, scale: 1.4, layer: "battlefield", triggersShake: true },
    massive: { durationMs: 720, scale: 1.8, layer: "overlay",     triggersShake: true },
  },
  armor_break: {
    small:   { durationMs: 320, scale: 0.7, layer: "battlefield" },
    medium:  { durationMs: 440, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 540, scale: 1.3, layer: "battlefield" },
    massive: { durationMs: 720, scale: 1.6, layer: "battlefield" },
  },

  // ── STRATAGEM ───────────────────────────────────────────────────
  orbital_beam: {
    small:   { durationMs: 600, scale: 0.7, layer: "overlay" },
    medium:  { durationMs: 900, scale: 1.0, layer: "overlay", triggersShake: true },
    large:   { durationMs: 1100, scale: 1.4, layer: "overlay", triggersShake: true },
    massive: { durationMs: 1400, scale: 1.8, layer: "overlay", triggersShake: true },
  },
  eagle_strafe: {
    small:   { durationMs: 380, scale: 0.7, layer: "overlay" },
    medium:  { durationMs: 520, scale: 1.0, layer: "overlay" },
    large:   { durationMs: 680, scale: 1.4, layer: "overlay" },
    massive: { durationMs: 880, scale: 1.8, layer: "overlay" },
  },
  sentry_deploy: {
    small:   { durationMs: 560, scale: 0.7, layer: "battlefield" },
    medium:  { durationMs: 720, scale: 1.0, layer: "battlefield" },
    large:   { durationMs: 880, scale: 1.4, layer: "battlefield" },
    massive: { durationMs: 1080, scale: 1.7, layer: "battlefield" },
  },

  // ── UI ──────────────────────────────────────────────────────────
  reward_bloom: {
    small:   { durationMs: 400, scale: 0.7, layer: "ui" },
    medium:  { durationMs: 540, scale: 1.0, layer: "ui" },
    large:   { durationMs: 720, scale: 1.3, layer: "ui" },
    massive: { durationMs: 900, scale: 1.6, layer: "ui" },
  },
  card_play_flash: {
    small:   { durationMs: 200, scale: 0.7, layer: "ui" },
    medium:  { durationMs: 280, scale: 1.0, layer: "ui" },
    large:   { durationMs: 380, scale: 1.3, layer: "ui" },
    massive: { durationMs: 480, scale: 1.6, layer: "ui" },
  },
};

export function getVFXSpec(effect: VFXEffect, intensity: VFXIntensity): VFXSpec {
  return SPECS[effect][intensity];
}

/** Hard cap on simultaneous active VFX — prevents jank under stratagem spam. */
export const VFX_CONCURRENCY_CAP = 14;

/** Reduced-motion concurrency cap — keeps everything calm. */
export const VFX_CONCURRENCY_CAP_REDUCED = 4;
