/**
 * AUDIO MIXER + SOUND MANAGER
 * ──────────────────────────────────────────────────────────────────────
 * Sits on top of lib/sfx.ts (which owns the Web Audio synthesis engine).
 *
 * Responsibilities:
 *   - Master volume + per-layer volumes (UI / Combat / Ambient / Voice)
 *   - localStorage persistence so settings survive reloads
 *   - A sound-manager façade with playSound / playLoop / stopLoop / setVolume
 *   - Idempotent applyState() that pushes the state down into sfx's channel gains
 *
 * The mixer doesn't replace sfx's named functions (sfx.click, sfx.beacon, …) —
 * those remain ergonomic for callers. The mixer is the volume control layer
 * the UI talks to, and the registry the manager looks up by id.
 */

import { setChannelVolume, setMuted as sfxSetMuted, sfx } from "./sfx";

// ──────────────────────────────────────────────────────────────────────
//  TYPES
// ──────────────────────────────────────────────────────────────────────
export type AudioLayer = "ui" | "combat" | "ambient" | "voice";

export interface MixerState {
  /** 0..1 master volume scalar applied on top of layer volumes. */
  master: number;
  /** Per-layer 0..1 volumes. Pre-master. */
  layers: Record<AudioLayer, number>;
  /** Hard mute (kills all output regardless of slider values). */
  muted: boolean;
}

// ──────────────────────────────────────────────────────────────────────
//  STATE
// ──────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "helldivers_audio_mixer_v1";

const DEFAULT_STATE: MixerState = {
  master: 0.7,
  layers: { ui: 0.45, combat: 0.5, ambient: 0.35, voice: 0.6 },
  muted: false,
};

let state: MixerState = clone(DEFAULT_STATE);
let listeners: Set<(s: MixerState) => void> = new Set();

function clone(s: MixerState): MixerState {
  return { master: s.master, layers: { ...s.layers }, muted: s.muted };
}

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<MixerState>;
    state = {
      master: clamp01(parsed.master ?? DEFAULT_STATE.master),
      layers: {
        ui: clamp01(parsed.layers?.ui ?? DEFAULT_STATE.layers.ui),
        combat: clamp01(parsed.layers?.combat ?? DEFAULT_STATE.layers.combat),
        ambient: clamp01(parsed.layers?.ambient ?? DEFAULT_STATE.layers.ambient),
        voice: clamp01(parsed.layers?.voice ?? DEFAULT_STATE.layers.voice),
      },
      muted: !!parsed.muted,
    };
  } catch {
    /* ignore */
  }
}

function save() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

// ──────────────────────────────────────────────────────────────────────
//  STATE → ENGINE
// ──────────────────────────────────────────────────────────────────────
/**
 * Push the current state into sfx.ts's channel gains. Apply on:
 *   - app boot (after restoring from localStorage)
 *   - any state mutation (handled internally)
 */
function applyState() {
  // Master volume scales every layer. We multiply once at the layer level so
  // sfx's underlying master gain stays neutral; this lets us mute hard via
  // sfxSetMuted without losing the configured per-layer ratio.
  const m = state.muted ? 0 : state.master;
  setChannelVolume("ui", m * state.layers.ui);
  setChannelVolume("combat", m * state.layers.combat);
  setChannelVolume("ambient", m * state.layers.ambient);
  setChannelVolume("voice", m * state.layers.voice);
  // Hard mute also tells sfx so any cold-path direct calls go silent.
  sfxSetMuted(state.muted);
}

function emit() {
  applyState();
  save();
  for (const l of listeners) l(clone(state));
}

// ──────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ──────────────────────────────────────────────────────────────────────
export function getMixerState(): MixerState {
  return clone(state);
}

export function subscribeMixer(fn: (s: MixerState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setMaster(v: number) {
  state.master = clamp01(v);
  emit();
}

export function setLayerVolume(layer: AudioLayer, v: number) {
  state.layers[layer] = clamp01(v);
  emit();
}

export function setMuted(v: boolean) {
  state.muted = v;
  emit();
}

/**
 * Initialize the mixer from localStorage and apply to the engine.
 * Safe to call multiple times — second call is a no-op once state is loaded.
 */
let initialized = false;
export function initAudioMixer() {
  if (initialized) return;
  initialized = true;
  load();
  applyState();
}

// ──────────────────────────────────────────────────────────────────────
//  SOUND MANAGER (thin façade over sfx)
// ──────────────────────────────────────────────────────────────────────
type SoundId =
  | "click"
  | "hover"
  | "beacon"
  | "alert"
  | "cardSelect"
  | "cardPlay"
  | "draw"
  | "endTurn"
  | "explosion"
  | "bigExplosion"
  | "laser"
  | "shield"
  | "shieldGlassy"
  | "shatter"
  | "heal"
  | "hit"
  | "crit"
  | "weakHit"
  | "victory"
  | "defeat"
  | "combatStart"
  | "bossEnrage"
  | "sentryDeploy";

type LoopId =
  | "ambient"
  | "boss_rumble"
  | "faction_terminid"
  | "faction_automaton"
  | "faction_illuminate"
  | "faction_super_earth"
  | "encounter_combat"
  | "encounter_civilian"
  | "encounter_risk"
  | "encounter_reward"
  | "encounter_hazard"
  | "encounter_command";

const ONE_SHOT_MAP: Record<SoundId, () => void> = {
  click: sfx.click,
  hover: sfx.hover,
  beacon: sfx.beacon,
  alert: sfx.alert,
  cardSelect: sfx.cardSelect,
  cardPlay: sfx.cardPlay,
  draw: sfx.draw,
  endTurn: sfx.endTurn,
  explosion: sfx.explosion,
  bigExplosion: sfx.bigExplosion,
  laser: sfx.laser,
  shield: sfx.shield,
  shieldGlassy: sfx.shieldGlassy,
  shatter: sfx.shatter,
  heal: sfx.heal,
  hit: sfx.hit,
  crit: sfx.crit,
  weakHit: sfx.weakHit,
  victory: sfx.victory,
  defeat: sfx.defeat,
  combatStart: sfx.combatStart,
  bossEnrage: sfx.bossEnrage,
  sentryDeploy: sfx.sentryDeploy,
};

/** Sound manager façade. Use this from UI components instead of sfx.X directly when you want a stable, name-mapped contract. */
export const audio = {
  playSound(id: SoundId) {
    ONE_SHOT_MAP[id]?.();
  },
  playLoop(id: LoopId) {
    // Loops live in sfx's loop manager. We delegate via named starters.
    switch (id) {
      case "ambient": return sfx.ambientStart();
      case "boss_rumble": return sfx.bossRumbleStart();
      case "faction_terminid": return sfx.factionAmbienceStart?.("terminid");
      case "faction_automaton": return sfx.factionAmbienceStart?.("automaton");
      case "faction_illuminate": return sfx.factionAmbienceStart?.("illuminate");
      case "faction_super_earth": return sfx.factionAmbienceStart?.("super_earth");
      case "encounter_combat": return sfx.encounterAmbienceStart?.("combat");
      case "encounter_civilian": return sfx.encounterAmbienceStart?.("civilian");
      case "encounter_risk": return sfx.encounterAmbienceStart?.("risk");
      case "encounter_reward": return sfx.encounterAmbienceStart?.("reward");
      case "encounter_hazard": return sfx.encounterAmbienceStart?.("hazard");
      case "encounter_command": return sfx.encounterAmbienceStart?.("command");
    }
  },
  stopLoop(id: LoopId) {
    switch (id) {
      case "ambient": return sfx.ambientStop();
      case "boss_rumble": return sfx.bossRumbleStop();
      case "faction_terminid":
      case "faction_automaton":
      case "faction_illuminate":
      case "faction_super_earth":
        return sfx.factionAmbienceStop?.();
      case "encounter_combat":
      case "encounter_civilian":
      case "encounter_risk":
      case "encounter_reward":
      case "encounter_hazard":
      case "encounter_command":
        return sfx.encounterAmbienceStop?.();
    }
  },
  setVolume(layer: AudioLayer, v: number) {
    setLayerVolume(layer, v);
  },
  setMaster,
  setMuted,
  getState: getMixerState,
};
