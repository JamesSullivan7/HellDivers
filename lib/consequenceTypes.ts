/**
 * DECISION CONSEQUENCE SYSTEM · types
 * ──────────────────────────────────────────────────────────────────────
 * Authoritative shape of a Consequence — the data emitted by encounter
 * choices (and other systems) that the engine resolves over time.
 *
 *   immediate   → applied now (write to game state directly)
 *   delayed     → queued and ticked per node-enter or per-combat
 *   run_modifier→ active until run end (visible in MapView sidebar)
 *   map_modifier→ mutates upcoming map nodes (reveal/lock/convert/danger)
 *   combat_modifier→ pulled by next combat init and consumed
 *   resource    → currency/HP/stim deltas
 *   narrative_flag → string flag stored for future events
 */

export type ConsequenceType =
  | "immediate"
  | "delayed"
  | "run_modifier"
  | "map_modifier"
  | "combat_modifier"
  | "resource"
  | "narrative_flag";

export type ConsequenceTrigger =
  | "now"
  | "next_node"
  | "next_combat"
  | "after_nodes"
  | "on_boss"
  | "on_reward"
  | "run_end";

export interface Consequence {
  id: string;
  type: ConsequenceType;
  trigger: ConsequenceTrigger;
  /** For trigger:"after_nodes" — how many node-enters until this fires. */
  delayNodes?: number;
  /** Free-form payload describing what to apply. Schema depends on type. */
  payload: Record<string, unknown>;
  /** Player-facing summary for HUD components. */
  displayText: string;
}

/** Risk classification for hover-tinting the encounter screen. */
export type DecisionRisk = "safe" | "neutral" | "risky" | "dangerous";
export type DecisionReward = "none" | "minor" | "major";

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  riskLevel: DecisionRisk;
  rewardLevel: DecisionReward;
  consequences: Consequence[];
}

/** A run-scoped modifier — visible to the player as a HUD pill. */
export interface RunModifier {
  id: string;
  name: string;
  description: string;
  /** Drives the badge accent color: positive (green), neutral (yellow), negative (red). */
  flavor: "positive" | "neutral" | "negative";
  /** Free-form payload — engine reads this where the modifier is consumed. */
  payload?: Record<string, unknown>;
  /** Whether this modifier is consumed on use (next combat) or persists for the run. */
  scope: "run" | "next_combat";
}

/** A combat modifier pulled by the engine on combat init. */
export interface CombatModifier {
  id: string;
  /** Engine reads payload to decide what to do. */
  payload: Record<string, unknown>;
  /** Description for HUD display. */
  displayText: string;
  /** Whether to clear this modifier after one combat. */
  consumeAfterCombat: boolean;
}

export interface ConsequenceHistoryEntry {
  id: string;
  /** Source encounter title. */
  source: string;
  /** Choice label. */
  decision: string;
  at: number;
  /** Display lines for what fired immediately. */
  immediate: string[];
  /** Display lines for delayed effects that have since resolved. */
  resolved: { at: number; description: string }[];
}
