/**
 * AI ENEMY INTENT SYSTEM · manager
 * ──────────────────────────────────────────────────────────────────────
 * Single entry point for the rich-intent layer.
 *
 * Public API:
 *   buildIntentContext(enemy, player, combat) → IntentContext
 *   deriveRichIntent(enemy, player, combat) → RichEnemyIntent     (current)
 *   derivePatternPreview(enemy, player, combat) → RichEnemyIntent[]
 *   generateEnemyIntent(enemy, player, combat) → RichEnemyIntent  (alias)
 *   resolveEnemyIntent(enemy, player, combat) → ResolvedIntent
 *     (no engine side-effects — describes what would happen)
 *   advanceEnemyPattern(enemy) → number   (next intentIndex)
 *   interruptIntent(enemyId, reason) → void
 *
 * The manager NEVER mutates the engine's combat store. It's a read +
 * derivation layer the UI consumes via useEnemyIntent().
 */

import type {
  Enemy,
  PlayerState,
  CombatState,
} from "@/lib/types";

import {
  EngineIntent,
  IntentContext,
  IntentInterruptReason,
  IntentTarget,
  IntentType,
  RichEnemyIntent,
  DEFAULT_INTENT_ICON,
} from "./intentTypes";
import { calculateIntentSeverity } from "./intentSeverity";
import {
  ENEMY_BEHAVIOR_PROFILES,
  getBehaviorProfile,
} from "./intentProfiles";
import { useIntentQueue } from "./intentQueue";

// ──────────────────────────────────────────────────────────────────────
//  Context builder — assembles the read-only snapshot for predicates
// ──────────────────────────────────────────────────────────────────────
export function buildIntentContext(
  enemy: Enemy,
  player: PlayerState,
  combat: CombatState,
): IntentContext {
  const aliveEnemies = combat.enemies.filter((e) => e.hp > 0).length;
  return {
    enemy: {
      id: enemy.id,
      templateId: enemy.templateId,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      armor: enemy.armor,
      shield: enemy.shield,
      burn: enemy.burn,
      isBoss: !!enemy.isBoss,
      enraged: !!enemy.enraged,
      intentIndex: enemy.intentIndex,
    },
    player: {
      hp: player.hp,
      maxHp: player.maxHp,
      block: player.block,
      requisition: player.requisition,
      // Loose flag — we don't model player buffs explicitly yet
      hasBuffs: player.block > 0,
    },
    combat: {
      turn: combat.turn,
      aliveEnemies,
      totalEnemies: combat.enemies.length,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Engine kind → IntentType mapping for the heuristic fallback path
// ──────────────────────────────────────────────────────────────────────
const ENGINE_TO_TYPE: Record<EngineIntent["kind"], IntentType> = {
  attack: "attack",
  attack_all: "multi_attack",
  buff: "buff",
  armor: "buff",
  wait: "charge",
};

const ENGINE_TO_TARGET: Record<EngineIntent["kind"], IntentTarget> = {
  attack: "player",
  attack_all: "all_players",
  buff: "self",
  armor: "self",
  wait: "self",
};

// Heuristic enrichment when a profile hasn't been authored.
function fallbackRichFromEngine(
  engine: EngineIntent,
  enemy: Enemy,
  step: number,
): RichEnemyIntent {
  const type = ENGINE_TO_TYPE[engine.kind];
  const target = ENGINE_TO_TARGET[engine.kind];
  const label = (engine.text || engine.kind).toUpperCase();

  return {
    id: `${enemy.templateId}_step${step}`,
    type,
    label,
    description: engine.text,
    severity: "medium", // recomputed below
    damage: engine.damage,
    hits: engine.kind === "attack_all" ? 1 : undefined,
    target,
    isInterruptible: engine.kind === "wait" || engine.kind === "buff" || engine.kind === "armor",
    telegraphTurns: engine.kind === "wait" ? 1 : 0,
    icon: DEFAULT_INTENT_ICON[type],
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Core derivation — picks the right rich intent for an enemy + step
// ──────────────────────────────────────────────────────────────────────
function pickPattern(enemy: Enemy): EngineIntent[] {
  if (enemy.enraged && enemy.enragedPattern && enemy.enragedPattern.length > 0) {
    return enemy.enragedPattern;
  }
  return enemy.intents;
}

function pickRichPattern(enemy: Enemy): RichEnemyIntent[] | undefined {
  const profile = getBehaviorProfile(enemy.templateId);
  if (!profile) return undefined;
  if (enemy.enraged && profile.enragedPattern && profile.enragedPattern.length > 0) {
    return profile.enragedPattern;
  }
  return profile.baseIntents;
}

function rawAt(enemy: Enemy, step: number): RichEnemyIntent {
  const enginePattern = pickPattern(enemy);
  const engineLen = Math.max(1, enginePattern.length);
  const engine = enginePattern[step % engineLen];

  // Try profile lookup first — gives full designer copy
  const richPattern = pickRichPattern(enemy);
  if (richPattern && richPattern.length > 0) {
    const rich = richPattern[step % richPattern.length];
    // Merge engine damage scaling onto profile metadata (engine is source of truth for numbers)
    return {
      ...rich,
      damage: engine.damage ?? rich.damage,
      // Keep profile's hits if defined; otherwise default to 1 for multi
      hits: rich.hits ?? (engine.kind === "attack_all" ? 1 : undefined),
    };
  }

  // Heuristic fallback — no profile authored
  return fallbackRichFromEngine(engine, enemy, step);
}

// ──────────────────────────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────────────────────────

/** Returns the rich version of an enemy's CURRENT intent. */
export function deriveRichIntent(
  enemy: Enemy,
  player: PlayerState,
  combat: CombatState,
): RichEnemyIntent {
  const ctx = buildIntentContext(enemy, player, combat);
  const base = rawAt(enemy, enemy.intentIndex);
  const severity = calculateIntentSeverity(base, ctx);

  // Apply telegraph countdown — if it's a charge with telegraphTurns > 0,
  // the *next* tick will fire the heavy follow-up. We surface the wind-up
  // here as-is; the next intent is computed via deriveNextRichIntent.
  return {
    ...base,
    severity,
    icon: base.icon ?? DEFAULT_INTENT_ICON[base.type],
  };
}

/** Returns the rich version of an enemy's NEXT intent (one step ahead). */
export function deriveNextRichIntent(
  enemy: Enemy,
  player: PlayerState,
  combat: CombatState,
): RichEnemyIntent | undefined {
  const enginePattern = pickPattern(enemy);
  if (enginePattern.length <= 1) return undefined;
  const ctx = buildIntentContext(enemy, player, combat);
  const next = rawAt(enemy, enemy.intentIndex + 1);
  return {
    ...next,
    severity: calculateIntentSeverity(next, ctx),
    icon: next.icon ?? DEFAULT_INTENT_ICON[next.type],
  };
}

/** Returns the +2 step intent if the pattern is long enough. */
export function deriveAfterNextRichIntent(
  enemy: Enemy,
  player: PlayerState,
  combat: CombatState,
): RichEnemyIntent | undefined {
  const enginePattern = pickPattern(enemy);
  if (enginePattern.length <= 2) return undefined;
  const ctx = buildIntentContext(enemy, player, combat);
  const after = rawAt(enemy, enemy.intentIndex + 2);
  return {
    ...after,
    severity: calculateIntentSeverity(after, ctx),
    icon: after.icon ?? DEFAULT_INTENT_ICON[after.type],
  };
}

/** Returns the full rich pattern for boss preview (or undefined for non-boss/no-profile). */
export function derivePatternPreview(
  enemy: Enemy,
  player: PlayerState,
  combat: CombatState,
): RichEnemyIntent[] {
  const richPattern = pickRichPattern(enemy);
  if (!richPattern) {
    // Fallback: enrich each engine step heuristically
    const enginePattern = pickPattern(enemy);
    const ctx = buildIntentContext(enemy, player, combat);
    return enginePattern.map((eng, step) => {
      const rich = fallbackRichFromEngine(eng, enemy, step);
      return { ...rich, severity: calculateIntentSeverity(rich, ctx) };
    });
  }
  const ctx = buildIntentContext(enemy, player, combat);
  return richPattern.map((rich, step) => ({
    ...rich,
    damage: enemy.intents[step % enemy.intents.length]?.damage ?? rich.damage,
    severity: calculateIntentSeverity(rich, ctx),
    icon: rich.icon ?? DEFAULT_INTENT_ICON[rich.type],
  }));
}

/** Alias matching the spec's nomenclature. Same as deriveRichIntent. */
export const generateEnemyIntent = deriveRichIntent;

// ──────────────────────────────────────────────────────────────────────
//  Resolution preview — what WOULD happen if this intent fires now
//  (does not mutate combat state — pure projection)
// ──────────────────────────────────────────────────────────────────────
export interface ResolvedIntentPreview {
  intent: RichEnemyIntent;
  appliedDamage: number;          // damage AFTER block
  willCripple: boolean;           // appliedDamage >= player.hp
  followUp?: RichEnemyIntent;     // the next intent for telegraphing
}

export function resolveEnemyIntent(
  enemy: Enemy,
  player: PlayerState,
  combat: CombatState,
): ResolvedIntentPreview {
  const intent = deriveRichIntent(enemy, player, combat);
  const raw = (intent.damage ?? 0) * (intent.hits ?? 1);
  const appliedDamage = Math.max(0, raw - player.block);
  return {
    intent,
    appliedDamage,
    willCripple: appliedDamage >= player.hp && raw > 0,
    followUp: deriveNextRichIntent(enemy, player, combat),
  };
}

/** Returns the pattern step the enemy will move to AFTER resolution. */
export function advanceEnemyPattern(enemy: Enemy): number {
  return enemy.intentIndex + 1;
}

/**
 * Records that an intent should be treated as interrupted. Tracked only in
 * the queue store — the engine stays authoritative for state. UIs can read
 * the entry to show an "INTERRUPTED" treatment.
 */
export function interruptIntent(enemyId: string, reason: IntentInterruptReason): void {
  useIntentQueue.getState().markInterrupted(enemyId, reason);
}

// ──────────────────────────────────────────────────────────────────────
//  Priority hints — surfaces "WILL DO X IF Y" for tooltips
// ──────────────────────────────────────────────────────────────────────
export interface PriorityHint {
  description: string;
  active: boolean;
}

export function getPriorityHints(
  enemy: Enemy,
  player: PlayerState,
  combat: CombatState,
): PriorityHint[] {
  const profile = getBehaviorProfile(enemy.templateId);
  if (!profile || profile.priorityRules.length === 0) return [];
  const ctx = buildIntentContext(enemy, player, combat);
  return profile.priorityRules.map((rule) => ({
    description: rule.description,
    active: (() => {
      try {
        return rule.condition(ctx);
      } catch {
        return false;
      }
    })(),
  }));
}

/** Convenience — every enemy currently has an authored profile? Useful for tooling. */
export function isProfiled(templateId: string): boolean {
  return Boolean(ENEMY_BEHAVIOR_PROFILES[templateId]);
}
