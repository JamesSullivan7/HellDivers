/**
 * UX TENSION SYSTEM
 * ──────────────────────────────────────────────────────────────────────
 * Global emotion-state machine that drives:
 *   - background atmosphere (vignette, edge glow, warning bar)
 *   - decision card interaction weight
 *   - combat urgency cues
 *   - audio escalation hooks
 *
 * Tension is a derived value — it's recomputed from authoritative game
 * state by useCombatTension() / useDecisionTension() / TensionProvider.
 * The store itself is a thin write-through container so subscribers can
 * read with fine-grained selectors and avoid re-render storms.
 *
 * Categories (derived from tensionLevel):
 *   calm     0–20
 *   alert    21–45
 *   danger   46–70
 *   critical 71–100
 *
 * Strict rule: every increment is keyed to a named source so you can
 * audit "why is it 78?" via the debug panel. No anonymous bumps.
 */

import { create } from "zustand";
import { sfx } from "./sfx";
import type { EventEffect } from "./events";

// ──────────────────────────────────────────────────────────────────────
//  TYPES
// ──────────────────────────────────────────────────────────────────────
export type TensionLevel = "calm" | "alert" | "danger" | "critical";

export type TensionSource =
  | "low_hp"
  | "boss_alive"
  | "lethal_intent"
  | "ganged_up"
  | "no_plays"
  | "hazard_active"
  | "low_reinforcements"
  | "no_reinforcements"
  | "difficulty"
  | "decision_hover_safe"
  | "decision_hover_neutral"
  | "decision_hover_risky"
  | "decision_hover_dangerous"
  | "decision_lock"
  | "manual_override"
  | string; // accept ad-hoc sources for adapters

export type DecisionRiskLevel = "safe" | "neutral" | "risky" | "dangerous";
export type DecisionRewardLevel = "none" | "minor" | "major";

export interface TensionAnimationPreset {
  /** seconds — used for transition durations on tension-bound elements */
  transitionDuration: number;
  /** 0..1 — used for shake intensity multipliers */
  shakeStrength: number;
  /** Hz-ish — used for pulse loop frequencies (cycles per ~second) */
  pulseFreq: number;
  /** scale on hover, e.g. 1.02 calm, 1.04 critical */
  hoverScale: number;
  /** multiplier on particle drift speed */
  particleSpeed: number;
}

interface TensionStore {
  /** 0–100 smoothed tension value */
  tensionLevel: number;
  /** Categorical bucket derived from tensionLevel */
  tensionState: TensionLevel;
  /** Per-source contribution map (sums to tensionLevel × intensityMultiplier⁻¹) */
  sources: Record<string, number>;
  /** Source most recently updated (debug aid) */
  activeSource: string | null;
  /** Global multiplier (0–2) — used by debug panel + accessibility settings */
  intensityMultiplier: number;
  /** When non-null, manual override pins tensionLevel to this value */
  manualOverride: number | null;

  // Mutators
  setTension: (value: number) => void;
  addTension: (amount: number, source: TensionSource) => void;
  reduceTension: (amount: number, source: TensionSource) => void;
  resetTension: () => void;
  setIntensityMultiplier: (m: number) => void;
  setManualOverride: (value: number | null) => void;
  /** Replace the entire sources map atomically (used by calculators). */
  applyComputedTension: (sources: Record<string, number>) => void;
}

// ──────────────────────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────────────────────
export function classifyTension(level: number): TensionLevel {
  if (level <= 20) return "calm";
  if (level <= 45) return "alert";
  if (level <= 70) return "danger";
  return "critical";
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function sumSources(sources: Record<string, number>): number {
  return Object.values(sources).reduce((a, b) => a + b, 0);
}

// ──────────────────────────────────────────────────────────────────────
//  STORE
// ──────────────────────────────────────────────────────────────────────
export const useTension = create<TensionStore>((set, get) => ({
  tensionLevel: 0,
  tensionState: "calm",
  sources: {},
  activeSource: null,
  intensityMultiplier: 1,
  manualOverride: null,

  setTension: (value) => {
    const lvl = clamp(value);
    set({ tensionLevel: lvl, tensionState: classifyTension(lvl) });
  },

  addTension: (amount, source) => {
    const { sources, intensityMultiplier, manualOverride } = get();
    if (manualOverride !== null) return;
    const next = { ...sources, [source]: (sources[source] ?? 0) + amount };
    const lvl = clamp(sumSources(next) * intensityMultiplier);
    set({
      sources: next,
      activeSource: source,
      tensionLevel: lvl,
      tensionState: classifyTension(lvl),
    });
  },

  reduceTension: (amount, source) => {
    const { sources, intensityMultiplier, manualOverride } = get();
    if (manualOverride !== null) return;
    const next = { ...sources };
    const cur = next[source] ?? 0;
    const new_ = Math.max(0, cur - amount);
    if (new_ === 0) delete next[source];
    else next[source] = new_;
    const lvl = clamp(sumSources(next) * intensityMultiplier);
    set({
      sources: next,
      activeSource: source,
      tensionLevel: lvl,
      tensionState: classifyTension(lvl),
    });
  },

  resetTension: () =>
    set({
      tensionLevel: 0,
      tensionState: "calm",
      sources: {},
      activeSource: null,
    }),

  setIntensityMultiplier: (m) => {
    const mult = clamp(m, 0, 2);
    const { sources, manualOverride } = get();
    if (manualOverride !== null) {
      set({ intensityMultiplier: mult });
      return;
    }
    const lvl = clamp(sumSources(sources) * mult);
    set({
      intensityMultiplier: mult,
      tensionLevel: lvl,
      tensionState: classifyTension(lvl),
    });
  },

  setManualOverride: (value) => {
    if (value === null) {
      const { sources, intensityMultiplier } = get();
      const lvl = clamp(sumSources(sources) * intensityMultiplier);
      set({
        manualOverride: null,
        tensionLevel: lvl,
        tensionState: classifyTension(lvl),
      });
    } else {
      const lvl = clamp(value);
      set({
        manualOverride: lvl,
        tensionLevel: lvl,
        tensionState: classifyTension(lvl),
        activeSource: "manual_override",
      });
    }
  },

  applyComputedTension: (sourcesIn) => {
    const { intensityMultiplier, manualOverride } = get();
    if (manualOverride !== null) return;
    const lvl = clamp(sumSources(sourcesIn) * intensityMultiplier);
    set({
      sources: sourcesIn,
      tensionLevel: lvl,
      tensionState: classifyTension(lvl),
    });
  },
}));

// ──────────────────────────────────────────────────────────────────────
//  GAME STATE → TENSION CALCULATOR
//  Pure function. Inputs are everything that should influence tension.
// ──────────────────────────────────────────────────────────────────────
export interface TensionInputs {
  player: { hp: number; maxHp: number; reinforcements: number; requisition: number };
  combat: {
    enemies: Array<{
      hp: number;
      isBoss?: boolean;
      intents: Array<{ kind: string; damage?: number }>;
      intentIndex: number;
    }>;
    hand: Array<{ cost: number }>;
  };
  modifiers: string[];
  difficulty: number;
}

export function calculateTensionFromGameState(inputs: TensionInputs): Record<string, number> {
  const out: Record<string, number> = {};
  const { player, combat, modifiers, difficulty } = inputs;

  // ── HP loss factor (up to +25)
  if (player.maxHp > 0) {
    const lostPct = 1 - player.hp / player.maxHp;
    if (lostPct > 0.05) {
      out.low_hp = Math.round(lostPct * 25);
    }
  }

  // ── Boss alive on field (+20)
  const hasBossAlive = combat.enemies.some((e) => e.isBoss && e.hp > 0);
  if (hasBossAlive) out.boss_alive = 20;

  // ── Lethal incoming intent — any single attack ≥ 30% maxHP (+15)
  const lethal = combat.enemies.some((e) => {
    if (e.hp <= 0) return false;
    const intent = e.intents[e.intentIndex % Math.max(1, e.intents.length)];
    return intent && (intent.damage ?? 0) >= player.maxHp * 0.3;
  });
  if (lethal) out.lethal_intent = 15;

  // ── Multiple attackers preparing (+10)
  const attackers = combat.enemies.filter((e) => {
    if (e.hp <= 0) return false;
    const intent = e.intents[e.intentIndex % Math.max(1, e.intents.length)];
    return intent && (intent.kind === "attack" || intent.kind === "attack_all");
  }).length;
  if (attackers >= 3) out.ganged_up = 10;

  // ── Stuck — no playable cards in hand (+10)
  if (combat.hand.length > 0) {
    const playable = combat.hand.filter((c) => player.requisition >= c.cost).length;
    if (playable === 0) out.no_plays = 10;
  }

  // ── Hazards active (+4 per modifier)
  if (modifiers.length > 0) {
    out.hazard_active = Math.min(20, modifiers.length * 4);
  }

  // ── Reinforcements low (+12 if 0, +6 if 1)
  if (player.reinforcements <= 0) out.no_reinforcements = 12;
  else if (player.reinforcements === 1) out.low_reinforcements = 6;

  // ── Difficulty floor
  if (difficulty >= 9) out.difficulty = 15;
  else if (difficulty >= 7) out.difficulty = 8;
  else if (difficulty >= 5) out.difficulty = 3;

  return out;
}

// ──────────────────────────────────────────────────────────────────────
//  DECISION RISK CLASSIFIER (for hover behavior)
// ──────────────────────────────────────────────────────────────────────
export function getRiskLevelFromEffects(effects: EventEffect[]): DecisionRiskLevel {
  let risks = 0;
  let rewards = 0;
  let severeRisks = 0;

  for (const e of effects) {
    switch (e.kind) {
      case "noop":
        break;
      case "damage":
        risks++;
        if (e.amount >= 10) severeRisks++;
        break;
      case "modifyMaxHp":
        if (e.amount < 0) {
          risks++;
          if (e.amount <= -8) severeRisks++;
        } else if (e.amount > 0) {
          rewards++;
        }
        break;
      case "heal":
      case "addCard":
      case "gainReinforcement":
        rewards++;
        break;
      case "removeOneCard":
        risks++;
        severeRisks++;
        break;
      case "loseReinforcement":
        risks++;
        severeRisks++;
        break;
      case "gainCurrency": {
        const m = e.medals ?? 0;
        const s = e.samples ?? 0;
        const r = e.requisition ?? 0;
        if (m > 0 || s > 0 || r > 0) rewards++;
        if (m < 0 || r < 0) risks++;
        break;
      }
      case "applyRunBuff":
        rewards++;
        break;
    }
  }

  if (severeRisks >= 2) return "dangerous";
  if (severeRisks >= 1 && risks >= rewards) return "dangerous";
  if (risks > rewards) return "risky";
  if (rewards > 0 && risks === 0) return "safe";
  return "neutral";
}

export function getRewardLevelFromEffects(effects: EventEffect[]): DecisionRewardLevel {
  let weight = 0;
  for (const e of effects) {
    switch (e.kind) {
      case "heal":
        weight += e.amount > 15 ? 2 : 1;
        break;
      case "addCard":
      case "gainReinforcement":
        weight += 2;
        break;
      case "applyRunBuff":
        weight += e.buff.lifetime === "run" ? 2 : 1;
        break;
      case "modifyMaxHp":
        if (e.amount > 0) weight += e.amount > 5 ? 2 : 1;
        break;
      case "gainCurrency": {
        const total = (e.medals ?? 0) + (e.samples ?? 0) * 30 + (e.requisition ?? 0);
        if (total > 100) weight += 2;
        else if (total > 0) weight += 1;
        break;
      }
    }
  }
  if (weight >= 3) return "major";
  if (weight >= 1) return "minor";
  return "none";
}

// ──────────────────────────────────────────────────────────────────────
//  ANIMATION PRESETS PER STATE
// ──────────────────────────────────────────────────────────────────────
export const TENSION_PRESETS: Record<TensionLevel, TensionAnimationPreset> = {
  calm:     { transitionDuration: 0.6, shakeStrength: 0,    pulseFreq: 0,    hoverScale: 1.020, particleSpeed: 1.0 },
  alert:    { transitionDuration: 0.4, shakeStrength: 0,    pulseFreq: 2.0,  hoverScale: 1.025, particleSpeed: 1.2 },
  danger:   { transitionDuration: 0.3, shakeStrength: 0.5,  pulseFreq: 1.4,  hoverScale: 1.030, particleSpeed: 1.5 },
  critical: { transitionDuration: 0.2, shakeStrength: 1.0,  pulseFreq: 0.9,  hoverScale: 1.040, particleSpeed: 2.0 },
};

export function getTensionAnimationPreset(state: TensionLevel): TensionAnimationPreset {
  return TENSION_PRESETS[state];
}

// ──────────────────────────────────────────────────────────────────────
//  DESIGN TOKENS
// ──────────────────────────────────────────────────────────────────────
export const TENSION_COLORS: Record<TensionLevel, string> = {
  calm: "#4da6ff",
  alert: "#f5c542",
  danger: "#ff8c1a",
  critical: "#ff4d4d",
};

/** rgba string with custom alpha for the level color. */
export function tensionColorAlpha(state: TensionLevel, alpha: number): string {
  const hex = TENSION_COLORS[state];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ──────────────────────────────────────────────────────────────────────
//  AUDIO CUE MAPPER
//  Forwards named tension events into the synthesized sfx engine.
// ──────────────────────────────────────────────────────────────────────
export type TensionCue =
  | "alert_enter"
  | "danger_enter"
  | "critical_enter"
  | "risk_hover"
  | "safe_hover"
  | "choice_lock"
  | "relief";

export function playTensionCue(cue: TensionCue): void {
  switch (cue) {
    case "alert_enter":
      sfx.beacon();
      break;
    case "danger_enter":
      sfx.alert();
      break;
    case "critical_enter":
      sfx.bossEnrage();
      break;
    case "risk_hover":
      sfx.hoverRisk();
      break;
    case "safe_hover":
      sfx.hoverReward();
      break;
    case "choice_lock":
      sfx.cardSelect();
      sfx.beacon();
      break;
    case "relief":
      sfx.heal();
      break;
  }
}
