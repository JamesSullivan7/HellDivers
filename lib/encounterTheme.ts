/**
 * ENCOUNTER VARIATION SYSTEM
 * ──────────────────────────────────────────────────────────────────────
 * Three modular layers combined into a single visual theme bundle:
 *
 *   1. FACTION    — color accents, particle color, audio cue
 *      terminid · automaton · illuminate · super_earth
 *
 *   2. TYPE       — mood, background overlay, blur, scanline density
 *      combat · civilian · risk · reward · hazard · command
 *
 *   3. INTENSITY  — effect strength scalar
 *      low · medium · high · critical
 *
 * `getEncounterTheme(faction, type, intensity)` returns a fully resolved
 * EncounterTheme that the EventScreen can plug straight into its render.
 *
 * Backgrounds use a per-combo manifest with a graceful fallback to the
 * universal SEAF backdrop already in the repo. As you drop more art into
 * /public/art/backgrounds/, register the path in BACKDROP_BY_COMBO and the
 * matching encounters will pick it up automatically — no other code changes.
 */

import type { Faction } from "./types";

// ──────────────────────────────────────────────────────────────────────
//  TYPES
// ──────────────────────────────────────────────────────────────────────
export type EncounterFaction = Faction | "super_earth";
export type EncounterType =
  | "combat"
  | "civilian"
  | "risk"
  | "reward"
  | "hazard"
  | "command";
export type EncounterIntensity = "low" | "medium" | "high" | "critical";

export interface EncounterTheme {
  // Identifying tuple
  faction: EncounterFaction;
  type: EncounterType;
  intensity: EncounterIntensity;

  // Color accents
  accent: string;       // primary UI accent (CSS color)
  secondary: string;    // hover / secondary tint
  glow: string;         // box-shadow color value

  // Background
  backgroundImage: string;
  backgroundFallback: string;
  backgroundBlur: number;     // px
  backgroundOpacity: number;  // 0–1, BEFORE intensity scaling
  backgroundOverlay: string;  // CSS gradient placed over the backdrop

  // Particle drift
  particleColor: string;
  particleDensity: number;    // count of floating dust particles
  particleSpeed: number;      // base duration in seconds (lower = faster)

  // Effect strength
  glowIntensity: number;      // 0–2 multiplier on panel glow
  flickerAmplitude: number;   // 0–1 panel flicker amount
  scanlineOpacity: number;    // 0–0.2 horizontal scanline opacity

  // Display
  typeLabel: string;          // e.g. "CIVILIAN ENCOUNTER"
  typeIcon: string;           // small glyph for the header

  // Audio
  audioBeacon: "default" | "terminid" | "automaton" | "illuminate" | "super_earth";
}

// ──────────────────────────────────────────────────────────────────────
//  FACTION PALETTES
// ──────────────────────────────────────────────────────────────────────
const FACTION = {
  terminid: {
    accent: "#ff8a28",
    secondary: "#a3e635",
    glow: "rgba(255,138,40,0.55)",
    particleColor: "rgba(255,180,80,0.65)",
    audioBeacon: "terminid" as const,
  },
  automaton: {
    accent: "#ff4d4d",
    secondary: "#ff8a28",
    glow: "rgba(255,77,77,0.55)",
    particleColor: "rgba(255,90,90,0.65)",
    audioBeacon: "automaton" as const,
  },
  illuminate: {
    accent: "#a78bfa",
    secondary: "#4da6ff",
    glow: "rgba(167,139,250,0.55)",
    particleColor: "rgba(180,150,255,0.65)",
    audioBeacon: "illuminate" as const,
  },
  super_earth: {
    accent: "#f5c542",
    secondary: "#4da6ff",
    glow: "rgba(245,197,66,0.55)",
    particleColor: "rgba(245,197,66,0.55)",
    audioBeacon: "super_earth" as const,
  },
} as const;

// ──────────────────────────────────────────────────────────────────────
//  ENCOUNTER TYPE MOODS
// ──────────────────────────────────────────────────────────────────────
const TYPE = {
  combat: {
    typeLabel: "COMBAT MOMENT",
    typeIcon: "⚔",
    backgroundBlur: 22,
    backgroundOpacity: 0.62,
    backgroundOverlay:
      "linear-gradient(180deg, rgba(11,15,20,0.78) 0%, rgba(11,15,20,0.42) 35%, rgba(11,15,20,0.95) 100%)",
    scanlineOpacity: 0.08,
  },
  civilian: {
    typeLabel: "CIVILIAN ENCOUNTER",
    typeIcon: "⚐",
    backgroundBlur: 28,
    backgroundOpacity: 0.55,
    backgroundOverlay:
      "linear-gradient(180deg, rgba(11,15,20,0.72) 0%, rgba(40,30,20,0.40) 50%, rgba(11,15,20,0.92) 100%)",
    scanlineOpacity: 0.05,
  },
  risk: {
    typeLabel: "RISK · GAMBLE",
    typeIcon: "⚠",
    backgroundBlur: 24,
    backgroundOpacity: 0.55,
    backgroundOverlay:
      "linear-gradient(180deg, rgba(40,10,10,0.65) 0%, rgba(11,15,20,0.40) 40%, rgba(40,10,10,0.85) 100%)",
    scanlineOpacity: 0.10,
  },
  reward: {
    typeLabel: "REWARD · DISCOVERY",
    typeIcon: "✦",
    backgroundBlur: 26,
    backgroundOpacity: 0.5,
    backgroundOverlay:
      "linear-gradient(180deg, rgba(11,15,20,0.7) 0%, rgba(40,35,15,0.35) 50%, rgba(11,15,20,0.85) 100%)",
    scanlineOpacity: 0.04,
  },
  hazard: {
    typeLabel: "HAZARD · ENVIRONMENTAL",
    typeIcon: "☣",
    backgroundBlur: 32,
    backgroundOpacity: 0.65,
    backgroundOverlay:
      "linear-gradient(180deg, rgba(20,30,15,0.78) 0%, rgba(11,15,20,0.50) 40%, rgba(20,30,15,0.95) 100%)",
    scanlineOpacity: 0.10,
  },
  command: {
    typeLabel: "COMMAND DIRECTIVE",
    typeIcon: "◈",
    backgroundBlur: 30,
    backgroundOpacity: 0.50,
    backgroundOverlay:
      "linear-gradient(180deg, rgba(11,15,30,0.78) 0%, rgba(11,15,20,0.55) 40%, rgba(11,15,30,0.95) 100%)",
    scanlineOpacity: 0.04,
  },
} as const;

// ──────────────────────────────────────────────────────────────────────
//  INTENSITY SCALES
// ──────────────────────────────────────────────────────────────────────
const INTENSITY = {
  low:      { glowIntensity: 0.6, flickerAmplitude: 0.00, particleDensity: 8,  particleSpeed: 22 },
  medium:   { glowIntensity: 1.0, flickerAmplitude: 0.04, particleDensity: 14, particleSpeed: 18 },
  high:     { glowIntensity: 1.4, flickerAmplitude: 0.10, particleDensity: 22, particleSpeed: 13 },
  critical: { glowIntensity: 1.8, flickerAmplitude: 0.18, particleDensity: 32, particleSpeed: 9 },
} as const;

// ──────────────────────────────────────────────────────────────────────
//  BACKGROUND MANIFEST
// ──────────────────────────────────────────────────────────────────────
/** Universal fallback — already in the repo. */
export const FALLBACK_BG = "/art/backgrounds/battlefield_seaf.png";

/**
 * Per-combo backdrop registry. Add entries here as art lands in the repo.
 * Format keys as "faction:type". Anything not registered falls back to
 * the universal SEAF backdrop above, gracefully.
 *
 * Suggested art pipeline (drop into /public/art/backgrounds/):
 *   terminid_hazard.png        terminid_combat.png
 *   automaton_combat.png       automaton_industrial.png
 *   illuminate_alien.png       illuminate_void.png
 *   super_earth_command.png    super_earth_civilian.png
 */
const BACKDROP_BY_COMBO: Partial<Record<string, string>> = {
  // "terminid:hazard": "/art/backgrounds/terminid_hazard.png",
  // "terminid:combat": "/art/backgrounds/terminid_combat.png",
  // "automaton:combat": "/art/backgrounds/automaton_combat.png",
  // "automaton:reward": "/art/backgrounds/automaton_industrial.png",
  // "illuminate:risk": "/art/backgrounds/illuminate_alien.png",
  // "super_earth:command": "/art/backgrounds/super_earth_command.png",
  // "super_earth:civilian": "/art/backgrounds/super_earth_civilian.png",
};

function getBackgroundPath(faction: EncounterFaction, type: EncounterType): string {
  return BACKDROP_BY_COMBO[`${faction}:${type}`] ?? FALLBACK_BG;
}

// ──────────────────────────────────────────────────────────────────────
//  GENERATOR
// ──────────────────────────────────────────────────────────────────────
export function getEncounterTheme(
  faction: EncounterFaction = "super_earth",
  type: EncounterType = "civilian",
  intensity: EncounterIntensity = "medium"
): EncounterTheme {
  const f = FACTION[faction];
  const t = TYPE[type];
  const i = INTENSITY[intensity];

  return {
    faction,
    type,
    intensity,

    accent: f.accent,
    secondary: f.secondary,
    glow: f.glow,

    backgroundImage: getBackgroundPath(faction, type),
    backgroundFallback: FALLBACK_BG,
    backgroundBlur: t.backgroundBlur,
    backgroundOpacity: t.backgroundOpacity,
    backgroundOverlay: t.backgroundOverlay,

    particleColor: f.particleColor,
    particleDensity: i.particleDensity,
    particleSpeed: i.particleSpeed,

    glowIntensity: i.glowIntensity,
    flickerAmplitude: i.flickerAmplitude,
    scanlineOpacity: t.scanlineOpacity,

    typeLabel: t.typeLabel,
    typeIcon: t.typeIcon,

    audioBeacon: f.audioBeacon,
  };
}
