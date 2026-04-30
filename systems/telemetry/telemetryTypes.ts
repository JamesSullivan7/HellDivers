/**
 * TELEMETRY & BALANCING SYSTEM · types
 * ──────────────────────────────────────────────────────────────────────
 * Authoritative shape for in-flight gameplay events, the metrics computed
 * from them, and the balance-report scaffolding.
 *
 * Privacy contract (enforced at the client layer, surfaced here as types):
 *   - sessionId / runId / playerId are random opaque ids, never tied to
 *     a real identity
 *   - payloads accept a `Record<string, unknown>` but the client strips
 *     any keys that look like PII (email, name, ip, etc.)
 *   - events are never sent off-device unless an endpoint is configured
 */

// ──────────────────────────────────────────────────────────────────────
//  Event taxonomy
// ──────────────────────────────────────────────────────────────────────
export type TelemetryCategory =
  | "run"
  | "combat"
  | "progression"
  | "map"
  | "encounter"
  | "economy"
  | "ui";

export type TelemetryEventType =
  // Run
  | "run_started"
  | "run_completed"
  | "run_failed"
  | "run_abandoned"
  // Combat
  | "combat_started"
  | "combat_completed"
  | "combat_failed"
  | "turn_started"
  | "card_played"
  | "damage_dealt"
  | "damage_taken"
  | "status_applied"
  | "enemy_killed"
  | "player_death"
  // Progression
  | "xp_gained"
  | "level_up"
  | "currency_gained"
  | "stratagem_unlocked"
  | "module_unlocked"
  | "cosmetic_unlocked"
  // Map
  | "node_selected"
  | "route_chosen"
  | "node_completed"
  | "hidden_node_revealed"
  // Encounter
  | "encounter_started"
  | "decision_selected"
  | "consequence_triggered"
  | "consequence_resolved"
  // UI / settings
  | "telemetry_enabled"
  | "telemetry_disabled";

export const EVENT_CATEGORY: Record<TelemetryEventType, TelemetryCategory> = {
  // Run
  run_started: "run",
  run_completed: "run",
  run_failed: "run",
  run_abandoned: "run",
  // Combat
  combat_started: "combat",
  combat_completed: "combat",
  combat_failed: "combat",
  turn_started: "combat",
  card_played: "combat",
  damage_dealt: "combat",
  damage_taken: "combat",
  status_applied: "combat",
  enemy_killed: "combat",
  player_death: "combat",
  // Progression
  xp_gained: "progression",
  level_up: "progression",
  currency_gained: "economy",
  stratagem_unlocked: "progression",
  module_unlocked: "progression",
  cosmetic_unlocked: "progression",
  // Map
  node_selected: "map",
  route_chosen: "map",
  node_completed: "map",
  hidden_node_revealed: "map",
  // Encounter
  encounter_started: "encounter",
  decision_selected: "encounter",
  consequence_triggered: "encounter",
  consequence_resolved: "encounter",
  // UI / settings
  telemetry_enabled: "ui",
  telemetry_disabled: "ui",
};

// ──────────────────────────────────────────────────────────────────────
//  TelemetryEvent — what every trackEvent() call produces
// ──────────────────────────────────────────────────────────────────────
export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  category: TelemetryCategory;
  /** Wall-clock at dispatch (ms since epoch). */
  timestamp: number;
  sessionId: string;
  runId?: string;
  playerId?: string;
  /** Free-form data — payloads should be flat & primitive-only. */
  payload: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────────────────
//  Per-event payload hint types — soft contract for callers + dashboards
//  These are not enforced (payloads are loose Records) but document the
//  expected shape per event type.
// ──────────────────────────────────────────────────────────────────────
export interface PayloadHints {
  run_started: { faction: string; difficulty: number };
  run_completed: { faction: string; difficulty: number; durationSeconds: number; nodesCleared: number };
  run_failed: { faction: string; difficulty: number; failedAtNode?: string; reason?: string };
  run_abandoned: { faction: string; difficulty: number; nodesCleared: number };

  combat_started: { combatId: string; enemyTemplateIds: string[]; difficulty: number };
  combat_completed: { combatId: string; turns: number; durationSeconds: number };
  combat_failed: { combatId: string; turns: number; killerTemplateId?: string };
  turn_started: { combatId: string; turn: number };
  card_played: {
    cardId: string;
    cardType: string;
    cost: number;
    targetCount?: number;
    damageDealt?: number;
    combatTurn?: number;
  };
  damage_dealt: { sourceCardId?: string; targetTemplateId: string; amount: number; ignoredArmor?: boolean };
  damage_taken: { fromTemplateId?: string; amount: number; blocked?: number };
  status_applied: { statusId: string; targetTemplateId?: string; stacks?: number };
  enemy_killed: { templateId: string; turns: number; killBlowCardId?: string };
  player_death: { atNodeId?: string; combatId?: string; killerTemplateId?: string };

  xp_gained: { amount: number };
  level_up: { newLevel: number };
  currency_gained: { type: "medals" | "samples" | "requisition"; amount: number };
  stratagem_unlocked: { stratagemId: string };
  module_unlocked: { moduleId: string };
  cosmetic_unlocked: { cosmeticId: string };

  node_selected: { nodeId: string; nodeType: string };
  route_chosen: { fromNodeId: string; toNodeId: string };
  node_completed: { nodeId: string; outcome: "victory" | "defeat" | "skipped" };
  hidden_node_revealed: { nodeId: string };

  encounter_started: { encounterId: string };
  decision_selected: { encounterId: string; optionId: string; riskLevel?: string; rewardLevel?: string };
  consequence_triggered: { encounterId: string; consequenceId: string };
  consequence_resolved: { encounterId: string; consequenceId: string };

  telemetry_enabled: Record<string, never>;
  telemetry_disabled: Record<string, never>;
}

// ──────────────────────────────────────────────────────────────────────
//  Balance metrics — outputs of balanceMetrics.ts
// ──────────────────────────────────────────────────────────────────────
export interface RunMetrics {
  totalRuns: number;
  victories: number;
  defeats: number;
  abandons: number;
  winRateOverall: number;
  winRateByDifficulty: Record<number, { runs: number; wins: number; rate: number }>;
  averageRunSeconds: number;
  abandonRate: number;
  deathsByNodeId: Record<string, number>;
  deathsByEnemyTemplate: Record<string, number>;
}

export interface CardMetric {
  cardId: string;
  picks: number;          // times added to deck via reward / loadout
  plays: number;          // times card_played fired
  damage: number;         // sum of damageDealt where sourceCardId === cardId
  averageDamagePerPlay: number;
  pickRate: number;       // picks / runs that saw the card offered (approx via runs)
  playRate: number;       // plays / total card_played events
  winRateWhenPicked: number;
}

export interface EnemyMetric {
  templateId: string;
  encountered: number;
  kills: number;
  deathsCaused: number;
  damageDealt: number;
  averageDamageDealt: number;
  killRate: number;
}

export interface EncounterOptionMetric {
  encounterId: string;
  optionId: string;
  selectedCount: number;
  shareWithinEncounter: number;
}

export interface EncounterMetric {
  encounterId: string;
  totalDecisions: number;
  options: EncounterOptionMetric[];
  /** Largest single-option share — the bias value used for flags. */
  maxShare: number;
}

export interface EconomyMetrics {
  averageMedalsPerRun: number;
  averageSamplesPerRun: number;
  averageRequisitionPerRun: number;
  modulesPurchased: number;
  cosmeticsPurchased: number;
  unlocksPerRun: number;
}

export interface DifficultyCurvePoint {
  difficulty: number;
  runs: number;
  wins: number;
  winRate: number;
  averageDurationSeconds: number;
}

// ──────────────────────────────────────────────────────────────────────
//  Balance flags — outputs of balanceReport.ts
// ──────────────────────────────────────────────────────────────────────
export type FlagSeverity = "info" | "warning" | "critical";

export interface BalanceFlag {
  id: string;
  severity: FlagSeverity;
  category: TelemetryCategory | "balance";
  /** Short headline shown in the dashboard list. */
  headline: string;
  /** Long-form explanation surfaced on hover/expand. */
  detail: string;
  /** Numeric value driving the flag (e.g. pick rate 0.82). */
  value?: number;
  /** Lower/upper bound the value violated. */
  expected?: { min?: number; max?: number };
  /** Anchor key — card id, enemy templateId, encounter id, etc. */
  anchorId?: string;
}

// ──────────────────────────────────────────────────────────────────────
//  Target ranges — single source of truth for "what's healthy"
// ──────────────────────────────────────────────────────────────────────
export const TARGET_WIN_RATE_BY_DIFFICULTY: Record<number, { min: number; max: number }> = {
  1: { min: 0.75, max: 0.95 },
  2: { min: 0.75, max: 0.95 },
  3: { min: 0.50, max: 0.70 },
  4: { min: 0.50, max: 0.70 },
  5: { min: 0.50, max: 0.70 },
  6: { min: 0.25, max: 0.45 },
  7: { min: 0.25, max: 0.45 },
  8: { min: 0.25, max: 0.45 },
  9: { min: 0.05, max: 0.20 },
  10: { min: 0.05, max: 0.20 },
};

export const TARGET_CARD_PICK_RATE = {
  /** A card with pick rate > this is over-picked (potentially OP). */
  overpickThreshold: 0.70,
  /** A card with play rate < this is dead weight. */
  deadCardThreshold: 0.05,
  common: { min: 0.20, max: 0.45 },
  rare: { min: 0.05, max: 0.20 },
  utility: { min: 0.10, max: 0.30 },
};

export const TARGET_ENCOUNTER_OPTION = {
  healthyMaxShare: 0.65,
  problematicMaxShare: 0.85,
};

export const TARGET_ENEMY_DEATH_SHARE = {
  /** Enemy template causing > this share of all deaths is over-tuned. */
  overTunedThreshold: 0.30,
};

export const MIN_SAMPLE_SIZE = {
  card: 30,
  enemy: 30,
  encounter: 20,
  difficulty: 20,
};

// ──────────────────────────────────────────────────────────────────────
//  Balance report — top-level render shape
// ──────────────────────────────────────────────────────────────────────
export interface BalanceReportSection<T = unknown> {
  id: string;
  title: string;
  /** Tabular rows for the dashboard table. */
  rows: T[];
  flags: BalanceFlag[];
  /** Optional summary line under the section heading. */
  summary?: string;
}

export interface BalanceReport {
  generatedAt: number;
  totalEvents: number;
  totalRuns: number;
  flags: BalanceFlag[];
  sections: {
    run: BalanceReportSection<DifficultyCurvePoint>;
    cards: BalanceReportSection<CardMetric>;
    enemies: BalanceReportSection<EnemyMetric>;
    encounters: BalanceReportSection<EncounterMetric>;
    economy: BalanceReportSection<{ key: string; value: number }>;
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Telemetry config — runtime knobs
// ──────────────────────────────────────────────────────────────────────
export interface TelemetryConfig {
  /** When set, batched events POST here. When undefined, events stay local. */
  endpoint?: string;
  /** Max events held in the buffer before forced flush. */
  batchSize: number;
  /** Periodic flush interval in ms (only fires if endpoint is set). */
  flushIntervalMs: number;
  /** Hard cap on the local buffer to bound memory / localStorage. */
  bufferCap: number;
  /** PII keys we always strip before storing/sending. */
  piiKeyDenylist: readonly string[];
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  endpoint: undefined,
  batchSize: 50,
  flushIntervalMs: 30_000,
  bufferCap: 5000,
  piiKeyDenylist: [
    "email",
    "name",
    "fullName",
    "realName",
    "phone",
    "address",
    "ip",
    "ipAddress",
    "userAgent",
    "ssn",
    "creditCard",
    "password",
    "token",
    "auth",
  ],
};
