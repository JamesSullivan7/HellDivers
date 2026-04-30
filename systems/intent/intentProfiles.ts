/**
 * AI ENEMY INTENT SYSTEM · behavior profiles
 * ──────────────────────────────────────────────────────────────────────
 * Designer-authored metadata per enemy template. Each profile's
 * `baseIntents[i]` corresponds 1:1 with the engine's `intentPattern[i]` in
 * lib/enemies.ts — when the engine sets `enemy.intentIndex` to N, the
 * matching `baseIntents[N]` is used to enrich the UI.
 *
 * If a profile is missing for a given templateId, the IntentManager falls
 * back to a heuristic enrichment from the engine's lightweight intent.
 *
 * Each profile carries:
 *   - faction + archetype           (for tone, color, and grouping)
 *   - baseIntents                    (rich version of the engine pattern)
 *   - enragedPattern (optional)      (rich version of the boss pattern)
 *   - priorityRules                  (data only — UI surfaces them as hints)
 *   - escalationRules (optional)
 *   - flavor                         (one-line designer note)
 *
 * Priority rules are intentionally NOT executed by the engine yet — they're
 * authored data that surfaces as "WILL ESCAPE BELOW 30% HP" tooltips and
 * is ready for a dynamic AI hook later.
 */

import type {
  EnemyBehaviorProfile,
  RichEnemyIntent,
} from "./intentTypes";

// ──────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────
function ri(intent: Omit<RichEnemyIntent, "severity"> & { severity?: RichEnemyIntent["severity"] }): RichEnemyIntent {
  return { severity: "medium", ...intent };
}

// ──────────────────────────────────────────────────────────────────────
//  TERMINIDS — overwhelming biological swarm
// ──────────────────────────────────────────────────────────────────────
const HUNTER: EnemyBehaviorProfile = {
  enemyId: "hunter",
  faction: "terminid",
  archetype: "hunter",
  flavor: "Pack-hunter. Closes distance fast — kill on sight or be flanked.",
  baseIntents: [
    ri({ id: "hunter_pounce", type: "attack", label: "POUNCE", description: "Leaps at the lowest-block helldiver for direct damage.", damage: 4, target: "player", isInterruptible: false, telegraphTurns: 0 }),
    ri({ id: "hunter_slash", type: "attack", label: "SLASH", description: "Quick chitin slash. Lower damage, fast windup.", damage: 3, target: "player", isInterruptible: false, telegraphTurns: 0 }),
  ],
  priorityRules: [
    {
      id: "hunter_low_hp_flee",
      description: "Flees and re-enters cover when wounded.",
      intentRef: 1,
      weight: 1.4,
      condition: (ctx) => ctx.enemy.hp < ctx.enemy.maxHp * 0.4,
    },
  ],
};

const CHARGER: EnemyBehaviorProfile = {
  enemyId: "charger",
  faction: "terminid",
  archetype: "bruiser",
  flavor: "Heavy frontal armor. Wind-up telegraphs a kill-shot — interrupt or sidestep with block.",
  baseIntents: [
    ri({ id: "charger_winding", type: "charge", label: "WINDING UP", description: "Locking in a charge target. NEXT TURN it slams for heavy damage.", target: "self", isInterruptible: true, telegraphTurns: 1 }),
    ri({ id: "charger_charge", type: "attack", label: "CHARGE", description: "Full-body charge. Devastating if it connects.", damage: 12, target: "player", isInterruptible: false, telegraphTurns: 0 }),
    ri({ id: "charger_stomp", type: "attack", label: "STOMP", description: "Recovery stomp. Reduced damage while it resets.", damage: 5, target: "player", isInterruptible: false, telegraphTurns: 0 }),
  ],
  priorityRules: [
    {
      id: "charger_interrupt_resets",
      description: "If interrupted during wind-up, resets to wind-up next turn.",
      intentRef: 0,
      weight: 2.0,
      condition: (ctx) => ctx.enemy.intentIndex === 1 && ctx.enemy.hp < ctx.enemy.maxHp * 0.7,
    },
  ],
};

const BILE_TITAN: EnemyBehaviorProfile = {
  enemyId: "bile_titan",
  faction: "terminid",
  archetype: "boss",
  flavor: "Behemoth. Below 50% she ENRAGES and enters a faster pattern.",
  baseIntents: [
    ri({ id: "titan_stomp", type: "attack", label: "STOMP", description: "Massive forefoot stomp.", damage: 12, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
    ri({ id: "titan_geyser", type: "multi_attack", label: "BILE GEYSER", description: "Acidic geyser hits the whole squad.", damage: 6, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
    ri({ id: "titan_carapace", type: "buff", label: "CARAPACE", description: "Hardens chitin. +2 armor.", target: "self", isInterruptible: true, telegraphTurns: 0 }),
    ri({ id: "titan_crush", type: "attack", label: "CRUSH", description: "Mandible crush — heaviest single-target hit.", damage: 14, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
  ],
  enragedPattern: [
    ri({ id: "titan_frenzy", type: "attack", label: "FRENZY", description: "Enraged hyper-strike.", damage: 18, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "titan_wave", type: "multi_attack", label: "BILE WAVE", description: "Tidal wave of bile across the squad.", damage: 10, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "titan_crush_e", type: "attack", label: "CRUSH!", description: "Enraged crush. Lethal.", damage: 16, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
  ],
  priorityRules: [],
  escalationRules: [
    {
      id: "titan_enrage_50",
      description: "ENRAGES at 50% HP. Pattern shifts.",
      condition: (ctx) => ctx.enemy.hp <= ctx.enemy.maxHp * 0.5,
      pattern: [], // populated by manager from enragedPattern
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//  AUTOMATONS — organized mechanical firepower
// ──────────────────────────────────────────────────────────────────────
const DEVASTATOR: EnemyBehaviorProfile = {
  enemyId: "devastator",
  faction: "automaton",
  archetype: "artillery",
  flavor: "Heavy chassis with mortar + laser. Buffs its own armor mid-fight.",
  baseIntents: [
    ri({ id: "dev_mortar", type: "attack", label: "MORTAR", description: "High-arc mortar shell.", damage: 6, target: "player", isInterruptible: false, telegraphTurns: 0 }),
    ri({ id: "dev_armor", type: "buff", label: "ARMOR LOCK", description: "Reinforces plating. +1 armor.", target: "self", isInterruptible: true, telegraphTurns: 0 }),
    ri({ id: "dev_burst", type: "attack", label: "AUTO BURST", description: "Suppression burst.", damage: 4, target: "player", isInterruptible: false, telegraphTurns: 0 }),
  ],
  priorityRules: [
    {
      id: "dev_armor_when_low",
      description: "Buffs armor when below 50% HP.",
      intentRef: 1,
      weight: 1.6,
      condition: (ctx) => ctx.enemy.hp < ctx.enemy.maxHp * 0.5,
    },
  ],
};

const HULK: EnemyBehaviorProfile = {
  enemyId: "hulk",
  faction: "automaton",
  archetype: "tank",
  flavor: "Walking flamethrower. AOE flamer + heavy stomp + delayed charge.",
  baseIntents: [
    ri({ id: "hulk_flamer", type: "multi_attack", label: "FLAMER", description: "Sweeps all helldivers with a wide flame cone.", damage: 5, hits: 1, target: "all_players", statusEffect: "burn", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
    ri({ id: "hulk_stomp", type: "attack", label: "STOMP", description: "Full-weight stomp.", damage: 8, target: "player", isInterruptible: false, telegraphTurns: 0 }),
    ri({ id: "hulk_charging", type: "charge", label: "CHARGING", description: "Vents fuel and charges plasma. Next attack will hit harder.", target: "self", isInterruptible: true, telegraphTurns: 1 }),
  ],
  priorityRules: [],
};

const FACTORY_STRIDER: EnemyBehaviorProfile = {
  enemyId: "factory_strider",
  faction: "automaton",
  archetype: "boss",
  flavor: "Mobile factory boss. Belly cannons → eye laser → reinforce → rocket pods. Enrages at 50%.",
  baseIntents: [
    ri({ id: "fs_belly", type: "multi_attack", label: "BELLY CANNONS", description: "Quad chin-cannons sweep the squad.", damage: 6, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
    ri({ id: "fs_eye", type: "attack", label: "EYE LASER", description: "Concentrated laser cuts a single helldiver.", damage: 14, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "fs_reinforce", type: "buff", label: "REINFORCE", description: "Re-plates damaged sections. +2 armor.", target: "self", isInterruptible: true, telegraphTurns: 0 }),
    ri({ id: "fs_rockets", type: "attack", label: "ROCKET PODS", description: "Twin rocket pods volley.", damage: 10, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
  ],
  enragedPattern: [
    ri({ id: "fs_cannons", type: "multi_attack", label: "CANNONS", description: "All cannons fire — squad-wide barrage.", damage: 10, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "fs_lance", type: "attack", label: "PLASMA LANCE", description: "Overcharged lance — single-target obliteration.", damage: 18, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "fs_mortars", type: "multi_attack", label: "MORTARS", description: "Full mortar barrage on the squad.", damage: 6, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
  ],
  priorityRules: [],
};

// ──────────────────────────────────────────────────────────────────────
//  ILLUMINATE — advanced energy control
// ──────────────────────────────────────────────────────────────────────
const OVERSEER: EnemyBehaviorProfile = {
  enemyId: "overseer",
  faction: "illuminate",
  archetype: "shielded",
  flavor: "Plasma caster behind a shield. Disrupt the shield to break the cycle.",
  baseIntents: [
    ri({ id: "ov_plasma", type: "attack", label: "PLASMA", description: "Single plasma bolt.", damage: 5, target: "player", isInterruptible: false, telegraphTurns: 0 }),
    ri({ id: "ov_shield", type: "shield", label: "SHIELDING", description: "Generates a shield. +3 shield.", target: "self", isInterruptible: true, telegraphTurns: 0 }),
    ri({ id: "ov_pulse", type: "multi_attack", label: "PULSE", description: "Pulse blast hits the whole squad.", damage: 3, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0 }),
  ],
  priorityRules: [
    {
      id: "ov_shield_priority",
      description: "Reinforces shield if it has been broken.",
      intentRef: 1,
      weight: 1.5,
      condition: (ctx) => ctx.enemy.shield === 0,
    },
  ],
};

const HARVESTER: EnemyBehaviorProfile = {
  enemyId: "harvester",
  faction: "illuminate",
  archetype: "artillery",
  flavor: "Tripod walker. Beam sweep → cannon → charge. Disrupt during the wind-up to lock its plasma.",
  baseIntents: [
    ri({ id: "hv_sweep", type: "multi_attack", label: "BEAM SWEEP", description: "Sweeping energy beam across the squad.", damage: 5, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
    ri({ id: "hv_plasma", type: "attack", label: "PLASMA CANNON", description: "Concentrated plasma cannon — heavy single-target.", damage: 10, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
    ri({ id: "hv_charging", type: "charge", label: "CHARGING", description: "Capacitors winding up. Disrupt to delay its next shot.", target: "self", isInterruptible: true, telegraphTurns: 1 }),
  ],
  priorityRules: [],
};

const MONOLITH: EnemyBehaviorProfile = {
  enemyId: "monolith",
  faction: "illuminate",
  archetype: "boss",
  flavor: "Crescent Monolith — phase-shifting reality engine. Enrages at 50%.",
  baseIntents: [
    ri({ id: "mn_anni", type: "attack", label: "ANNIHILATE", description: "Reality-tearing single-target lance.", damage: 14, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "mn_tear", type: "multi_attack", label: "REALITY TEAR", description: "Phase-shift wave hits the squad.", damage: 7, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
    ri({ id: "mn_phase", type: "shield", label: "PHASE SHIELD", description: "Phases out partially. +8 shield.", target: "self", isInterruptible: true, telegraphTurns: 0 }),
    ri({ id: "mn_lance", type: "attack", label: "LANCE", description: "Energy lance.", damage: 10, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "high" }),
  ],
  enragedPattern: [
    ri({ id: "mn_lance_e", type: "attack", label: "REALITY LANCE", description: "Reality lance — devastating.", damage: 18, target: "player", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "mn_wave", type: "multi_attack", label: "PHASE WAVE", description: "Phase wave consumes the squad.", damage: 12, hits: 1, target: "all_players", isInterruptible: false, telegraphTurns: 0, severity: "critical" }),
    ri({ id: "mn_phase_e", type: "shield", label: "PHASE SHIELD+", description: "Reinforced phase shield. +12 shield.", target: "self", isInterruptible: true, telegraphTurns: 0 }),
  ],
  priorityRules: [],
};

// ──────────────────────────────────────────────────────────────────────
//  Registry
// ──────────────────────────────────────────────────────────────────────
export const ENEMY_BEHAVIOR_PROFILES: Record<string, EnemyBehaviorProfile> = {
  // Terminids
  hunter: HUNTER,
  charger: CHARGER,
  bile_titan: BILE_TITAN,
  // Automatons
  devastator: DEVASTATOR,
  hulk: HULK,
  factory_strider: FACTORY_STRIDER,
  // Illuminate
  overseer: OVERSEER,
  harvester: HARVESTER,
  monolith: MONOLITH,
};

export function getBehaviorProfile(templateId: string): EnemyBehaviorProfile | undefined {
  return ENEMY_BEHAVIOR_PROFILES[templateId];
}
