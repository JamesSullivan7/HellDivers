/**
 * AI ENEMY INTENT SYSTEM · severity calculator
 * ──────────────────────────────────────────────────────────────────────
 * Computes a severity bucket for a rich intent given a live combat
 * snapshot. Severity is what drives:
 *
 *   - the badge accent color (yellow → orange → red)
 *   - the danger pulse animation
 *   - tension-system contribution
 *   - sound + screen-shake intensity at fire time
 *
 * Rules (rough):
 *   damage ≥ player.hp                    → critical
 *   damage ≥ 0.6 × player.hp              → high
 *   damage ≥ 0.3 × player.hp              → medium
 *   else                                   → low
 *
 *   multi_attack: total = damage * hits, then bumped one rung if hits ≥ 2
 *   summon (≥4 alive enemies):            → high
 *   shield/buff: low; medium on bosses
 *   enrage:                                → critical, always
 *   stun debuff with no player block:      → bumped one rung
 *
 * This function is pure — no side effects, no store reads. Pass the
 * predicate context in.
 */

import type {
  IntentContext,
  IntentSeverity,
  RichEnemyIntent,
} from "./intentTypes";

const LADDER: IntentSeverity[] = ["low", "medium", "high", "critical"];

function bumpUp(s: IntentSeverity, by: number = 1): IntentSeverity {
  const idx = LADDER.indexOf(s);
  return LADDER[Math.min(LADDER.length - 1, Math.max(0, idx + by))];
}

function damageSeverity(rawDamage: number, ctx: IntentContext): IntentSeverity {
  const playerHp = Math.max(1, ctx.player.hp);
  const effective = Math.max(0, rawDamage - ctx.player.block);
  if (effective >= playerHp) return "critical";
  if (effective >= playerHp * 0.6) return "high";
  if (effective >= playerHp * 0.3) return "medium";
  return "low";
}

export function calculateIntentSeverity(
  intent: Pick<RichEnemyIntent, "type" | "damage" | "hits" | "statusEffect" | "target">,
  ctx: IntentContext,
): IntentSeverity {
  // Hard rules first — these always win over math.
  if (intent.type === "enrage") return "critical";
  if (intent.type === "escape") return "low";

  // Damaging intents drive severity off effective damage vs. player HP.
  if (intent.type === "attack") {
    const dmg = intent.damage ?? 0;
    return damageSeverity(dmg, ctx);
  }

  if (intent.type === "multi_attack") {
    const hits = Math.max(1, intent.hits ?? 1);
    const dmg = (intent.damage ?? 0) * hits;
    let sev = damageSeverity(dmg, ctx);
    // Multi-target hits feel heavier even at small per-hit numbers
    if (intent.target === "all_players" && hits >= 2) {
      sev = bumpUp(sev);
    }
    return sev;
  }

  if (intent.type === "summon") {
    if (ctx.combat.aliveEnemies >= 4) return "high";
    if (ctx.combat.aliveEnemies >= 2) return "medium";
    return "low";
  }

  if (intent.type === "shield" || intent.type === "buff") {
    if (ctx.enemy.isBoss) return "medium";
    return "low";
  }

  if (intent.type === "debuff") {
    let sev: IntentSeverity = "medium";
    if (intent.statusEffect === "stun" && ctx.player.block === 0) sev = bumpUp(sev);
    if (ctx.player.hasBuffs) sev = bumpUp(sev);
    return sev;
  }

  if (intent.type === "charge" || intent.type === "prepare") {
    // The follow-up matters more than the wind-up itself.
    return ctx.enemy.isBoss ? "high" : "medium";
  }

  if (intent.type === "special") {
    return ctx.enemy.isBoss ? "critical" : "high";
  }

  // Fallback
  return "low";
}

// ──────────────────────────────────────────────────────────────────────
//  Tension delta — how much an intent should add to the tension meter
//  when it APPEARS (not when it resolves). Resolution still goes through
//  feedback.* dispatches in the engine.
// ──────────────────────────────────────────────────────────────────────
export const SEVERITY_TENSION_DELTA: Record<IntentSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 4,
};
