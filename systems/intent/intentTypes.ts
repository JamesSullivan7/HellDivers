/**
 * AI ENEMY INTENT SYSTEM · types
 * ──────────────────────────────────────────────────────────────────────
 * Authoritative shape for the *enriched* intent layer that wraps the
 * engine's lightweight `EnemyIntent` (lib/types.ts).
 *
 * The engine continues to drive enemy turns from `Enemy.intents[intentIndex]`.
 * This module derives a richer `RichEnemyIntent` per enemy at render time —
 * adding label, description, severity, interruptibility, telegraph turns,
 * and pattern previews — so the UI can communicate danger clearly.
 *
 * Naming: we call the rich type `RichEnemyIntent` (not `EnemyIntent`) to
 * avoid colliding with the engine's existing type alias.
 */

import type { Faction } from "@/lib/types";

// ──────────────────────────────────────────────────────────────────────
//  Discrete intent classes
// ──────────────────────────────────────────────────────────────────────
export type IntentType =
  | "attack"          // single-target damage
  | "multi_attack"    // multiple hits or all-target
  | "buff"            // self / ally positive effect
  | "debuff"          // negative effect on player
  | "shield"          // shield gain
  | "summon"          // spawns reinforcements
  | "charge"          // wind-up before a heavy hit
  | "prepare"         // setup for a future intent (positioning / targeting)
  | "special"         // unique faction mechanic
  | "enrage"          // boss phase shift
  | "escape";         // flee / retreat

export type IntentSeverity = "low" | "medium" | "high" | "critical";

export type IntentTarget =
  | "player"
  | "all_players"
  | "self"
  | "ally"
  | "all_enemies";

export type IntentArchetype =
  | "swarm"
  | "hunter"
  | "bruiser"
  | "tank"
  | "artillery"
  | "support"
  | "shielded"
  | "boss";

// Reasons an intent might get interrupted/cancelled
export type IntentInterruptReason =
  | "stun"          // player applied stun
  | "shield_break"  // shield-removal cancels a shield action
  | "damage_threshold" // big hit interrupts charge
  | "ems"           // EMS delays by 1
  | "kill"          // enemy died
  | "manual";       // dev / test

// ──────────────────────────────────────────────────────────────────────
//  RichEnemyIntent — what the UI consumes
// ──────────────────────────────────────────────────────────────────────
export interface RichEnemyIntent {
  /** Stable per-enemy-per-pattern-step id (templateId + step) for keying */
  id: string;
  type: IntentType;
  /** Short uppercase label for badges, e.g. "CHARGING" */
  label: string;
  /** Sentence-form description for tooltips */
  description: string;
  /** Pre-computed by the manager for this combat snapshot */
  severity: IntentSeverity;
  /** Display damage (single-hit or per-hit). undefined for non-damaging intents. */
  damage?: number;
  /** Number of hits — drives x3 / x5 badge readouts */
  hits?: number;
  target: IntentTarget;
  /** Status applied (purely cosmetic identifier the UI uses for icon routing). */
  statusEffect?: string;
  isInterruptible: boolean;
  /** 0 = resolves at end of this turn; 1 = next turn; 2 = +1 ahead */
  telegraphTurns: number;
  payload?: Record<string, unknown>;
  /** Override icon glyph if you want something other than the default */
  icon?: string;
  /** Tailwind/CSS color token for accent border / text. Optional override. */
  accent?: string;
}

// ──────────────────────────────────────────────────────────────────────
//  Behavior Profile — designer-authored per template id
// ──────────────────────────────────────────────────────────────────────
export interface EnemyBehaviorProfile {
  /** Matches lib/enemies.ts ENEMY_TEMPLATES key */
  enemyId: string;
  faction: Faction;
  archetype: IntentArchetype;
  /**
   * One rich intent per step of the engine's `intentPattern`. Indexes line up
   * 1:1 with `Enemy.intents[i]`. Used to enrich the engine's data at render.
   */
  baseIntents: RichEnemyIntent[];
  /** Optional explicit pattern preview (e.g. boss multi-turn cycle) */
  pattern?: RichEnemyIntent[];
  /** Optional enraged pattern preview, mirrors `Enemy.enragedPattern` */
  enragedPattern?: RichEnemyIntent[];
  priorityRules: IntentPriorityRule[];
  escalationRules?: EscalationRule[];
  /** One-line designer flavor string for tooltip footer */
  flavor?: string;
}

// ──────────────────────────────────────────────────────────────────────
//  Priority + Escalation rules
//  (the engine doesn't currently call into these — they're queued for the
//   future dynamic-AI hook. Defining them now keeps the data complete and
//   lets the UI surface "WILL DO X IF Y" hints.)
// ──────────────────────────────────────────────────────────────────────
export interface IntentPriorityRule {
  id: string;
  /** Human-readable trigger condition for tooltips/devtools. */
  description: string;
  /** Which baseIntents index to bias toward when condition holds. */
  intentRef: number;
  /** Multiplicative weight applied to the chosen intent's selection prob. */
  weight: number;
  /** Pure predicate over the snapshot context. No side effects. */
  condition: (ctx: IntentContext) => boolean;
}

export interface EscalationRule {
  id: string;
  description: string;
  /** When this returns true, swap the active pattern to `pattern`. */
  condition: (ctx: IntentContext) => boolean;
  pattern: RichEnemyIntent[];
}

// ──────────────────────────────────────────────────────────────────────
//  IntentContext — read-only snapshot fed to predicates
// ──────────────────────────────────────────────────────────────────────
export interface IntentContext {
  enemy: {
    id: string;
    templateId: string;
    name: string;
    hp: number;
    maxHp: number;
    armor: number;
    shield: number;
    burn: number;
    isBoss: boolean;
    enraged: boolean;
    intentIndex: number;
  };
  player: {
    hp: number;
    maxHp: number;
    block: number;
    requisition: number;
    /** Loose flag set by callers — true if player has any active buff/shield. */
    hasBuffs: boolean;
  };
  combat: {
    turn: number;
    aliveEnemies: number;
    totalEnemies: number;
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Engine-bridge type — the existing simple intent shape from lib/types.
//  Re-exported here so callers can import a single module.
// ──────────────────────────────────────────────────────────────────────
export type EngineIntentKind =
  | "attack"
  | "attack_all"
  | "buff"
  | "armor"
  | "wait";

export interface EngineIntent {
  kind: EngineIntentKind;
  damage?: number;
  text: string;
}

// ──────────────────────────────────────────────────────────────────────
//  Telegraph state — tracked per-enemy in the intent queue store
// ──────────────────────────────────────────────────────────────────────
export interface TelegraphEntry {
  enemyId: string;
  /** Current intent for this turn. */
  current: RichEnemyIntent;
  /** Next intent (one step ahead) — undefined if pattern length === 1. */
  next?: RichEnemyIntent;
  /** Two-step preview if the manager can resolve it. */
  afterNext?: RichEnemyIntent;
  /** Set when an interrupt has been recorded but not yet consumed. */
  interruptedReason?: IntentInterruptReason;
  /** Wall-clock the entry was last refreshed. */
  refreshedAt: number;
}

// Severity → accent color mapping (single source of truth for UI)
export const SEVERITY_ACCENT: Record<IntentSeverity, string> = {
  low: "var(--color-text-dim, #8a8d92)",
  medium: "var(--color-accent-yellow, #f5c542)",
  high: "var(--color-accent-orange, #ff8c2a)",
  critical: "var(--color-accent-red, #ff4d4d)",
};

// Default glyphs per intent type (overridable per-intent via `icon`)
export const DEFAULT_INTENT_ICON: Record<IntentType, string> = {
  attack: "⚔",
  multi_attack: "⚔⚔",
  buff: "▲",
  debuff: "▼",
  shield: "⛨",
  summon: "⊕",
  charge: "⚡",
  prepare: "◇",
  special: "✦",
  enrage: "☠",
  escape: "→",
};
