import { Armor, Booster, Weapon } from "./types";

// Authentic Helldivers 2 armors and passives (from helldivers.wiki.gg).
// Weight class drives silhouette; passiveName names the canon passive.
export const ARMORS: Armor[] = [
  {
    id: "scout",
    name: "SC-30 Trailblazer Scout",
    passive: "Reduced enemy detection range · +1 hand size · -10 max HP",
    passiveName: "Scout",
    weightClass: "scout",
    hpMod: -10,
    handMod: 1,
    startingBlock: 0,
    reqMod: 0,
  },
  {
    id: "frontline",
    name: "B-01 Tactical Frontline",
    passive: "Standard issue. Balanced loadout for any sector.",
    passiveName: "Tactical",
    weightClass: "frontline",
    hpMod: 0,
    handMod: 0,
    startingBlock: 0,
    reqMod: 0,
  },
  {
    id: "fortified",
    name: "FS-37 Ravager Fortified",
    passive: "+20 max HP · +3 starting Block · -1 hand size",
    passiveName: "Fortified",
    weightClass: "fortified",
    hpMod: 20,
    handMod: -1,
    startingBlock: 3,
    reqMod: 0,
  },
  {
    id: "champion",
    name: "DP-11 Champion of the People",
    passive: "Med-Kit · 2 extra Stim cards in your starting deck",
    passiveName: "Med-Kit",
    weightClass: "scout",
    hpMod: 0,
    handMod: 0,
    startingBlock: 0,
    reqMod: 0,
    bonusStims: 2,
  },
  {
    id: "ground_breaker",
    name: "CE-27 Ground Breaker",
    passive: "Engineering Kit · +1 max Requisition every combat",
    passiveName: "Engineering Kit",
    weightClass: "frontline",
    hpMod: 5,
    handMod: 0,
    startingBlock: 0,
    reqMod: 1,
  },
  {
    id: "hard_liner",
    name: "GS-32 Hard-Liner",
    passive: "Siege-Ready · +30 max HP · +5 starting Block · -1 hand size",
    passiveName: "Siege-Ready",
    weightClass: "fortified",
    hpMod: 30,
    handMod: -1,
    startingBlock: 5,
    reqMod: 0,
  },
];

// Authentic Helldivers 2 primary weapons (from helldivers.wiki.gg).
export const WEAPONS: Weapon[] = [
  {
    id: "ar23_liberator",
    name: "AR-23 Liberator",
    description: "Auto-fires 3 dmg at the highest-HP enemy each turn.",
    damage: 3,
    hitsPerTurn: 1,
    target: "highest_hp",
  },
  {
    id: "sg225_breaker",
    name: "SG-225 Breaker",
    description: "Auto-fires 2 dmg to all enemies each turn.",
    damage: 2,
    hitsPerTurn: 1,
    target: "all",
  },
  {
    id: "r63_diligence",
    name: "R-63 Diligence",
    description: "Auto-fires 7 dmg at the highest-HP enemy. Ignores armor.",
    damage: 7,
    hitsPerTurn: 1,
    target: "highest_hp",
    ignoreArmor: true,
  },
  {
    id: "mp98_knight",
    name: "MP-98 Knight",
    description: "Auto-fires 1 dmg at random enemies 4 times each turn.",
    damage: 1,
    hitsPerTurn: 4,
    target: "random",
  },
  {
    id: "las16_sickle",
    name: "LAS-16 Sickle",
    description: "Laser auto-fires 4 dmg at the highest-HP enemy. Ignores armor.",
    damage: 4,
    hitsPerTurn: 1,
    target: "highest_hp",
    ignoreArmor: true,
  },
  {
    id: "plas1_scorcher",
    name: "PLAS-1 Scorcher",
    description: "Plasma auto-fires 3 dmg to all enemies. Ignites armor weak points.",
    damage: 3,
    hitsPerTurn: 1,
    target: "all",
  },
  {
    id: "sg8_punisher",
    name: "SG-8 Punisher",
    description: "Pump shotgun auto-fires 6 dmg at the highest-HP enemy.",
    damage: 6,
    hitsPerTurn: 1,
    target: "highest_hp",
  },
];

// Authentic Helldivers 2 boosters (from helldivers.wiki.gg).
export const BOOSTERS: Booster[] = [
  {
    id: "hellpod_optimization",
    name: "Hellpod Space Optimization",
    description: "+2 starting Requisition every combat.",
  },
  {
    id: "vitality_enhancement",
    name: "Vitality Enhancement",
    description: "+15 max HP for the entire run.",
  },
  {
    id: "stamina_enhancement",
    name: "Stamina Enhancement",
    description: "Draw 1 extra card each turn.",
  },
  {
    id: "localization_confusion",
    name: "Localization Confusion",
    description: "First turn of every combat: enemies skip their actions.",
  },
  {
    id: "muscle_enhancement",
    name: "Muscle Enhancement",
    description: "+2 starting Block every combat.",
  },
  {
    id: "increased_reinforcement",
    name: "Increased Reinforcement Budget",
    description: "Start every run with +1 reinforcement.",
  },
  {
    id: "firebomb_hellpods",
    name: "Firebomb Hellpods",
    description: "Enemies start every combat with 2 Burn applied.",
  },
];

export const DEFAULT_ARMOR = "frontline";
export const DEFAULT_WEAPON = "ar23_liberator";
export const DEFAULT_BOOSTER = "hellpod_optimization";

export function getArmor(id: string): Armor {
  return ARMORS.find((a) => a.id === id) ?? ARMORS[1];
}
export function getWeapon(id: string): Weapon {
  return WEAPONS.find((w) => w.id === id) ?? WEAPONS[0];
}
export function getBooster(id: string): Booster {
  return BOOSTERS.find((b) => b.id === id) ?? BOOSTERS[0];
}

// Stratagems player can pick at loadout (excludes the basics that are always given)
export const STRATAGEM_PICK_POOL = [
  "orbital_railcannon",
  "orbital_gatling",
  "orbital_380mm",
  "orbital_laser",
  "orbital_emp",
  "orbital_gas",
  "orbital_walking",
  "eagle_airstrike",
  "eagle_cluster",
  "eagle_500kg",
  "eagle_napalm",
  "eagle_strafe",
  "eagle_rocket",
  "sentry_mg",
  "sentry_autocannon",
  "sentry_mortar",
  "sentry_tesla",
  "sentry_rocket",
  "sentry_ems",
  "support_quasar",
  "support_recoilless",
  "support_amr",
  "support_stalwart",
  "support_flamer",
  "support_arc",
  "support_eat",
  "support_hellbomb",
  "support_spear",
  "support_rg",
  "support_grenade",
  "util_resupply",
  "util_reinforce",
  "util_supply_pack",
  "util_ballistic_shield",
  // ── EXPANSION pool ──
  "sentry_laser",
  "sentry_flame",
  "sentry_gas_mortar",
  "sentry_at_emplacement",
  "sentry_hmg_emplacement",
  "sentry_grenadier",
  "sentry_shield_relay",
  "support_autocannon",
  "support_machine_gun",
  "support_hmg",
  "support_laser_cannon",
  "support_airburst",
  "support_breaching_hammer",
  "util_guard_dog",
  "util_las_rover",
  "util_jump_pack",
  "orbital_napalm",
  "orbital_smoke",
  "eagle_ap_mines",
  "eagle_incendiary_mines",
  "orbital_at_mines",
  "support_exosuit",
];

export const FIXED_BASICS = [
  "orbital_precision",
  "orbital_precision",
  "orbital_precision",
  "util_stim",
  "util_shield",
];

export const STRATAGEM_PICKS_REQUIRED = 4;

/**
 * Resupply is a free stratagem every Helldiver carries onto the field —
 * the player picks 4 stratagems and resupply is automatically added on
 * top, giving them 5 stratagem cards in the starting deck.
 */
export const FREE_STRATAGEM_ID = "util_resupply";

// ──────────────────────────────────────────────────────────────────────────
// OUTFITTER · purchase + upgrade costs
// ──────────────────────────────────────────────────────────────────────────

/** Medals cost to purchase a non-default armor. */
export const ARMOR_PURCHASE_COST = 250;
/** Medals cost to purchase a non-default weapon. */
export const WEAPON_PURCHASE_COST = 280;
/** Requisition cost to purchase a non-default booster. */
export const BOOSTER_PURCHASE_COST = 220;

export const MAX_TIER = 3;

/** Samples required to upgrade armor from current tier to the next. */
export function armorUpgradeCost(currentTier: number): number {
  if (currentTier === 1) return 25;
  if (currentTier === 2) return 70;
  return Infinity;
}
export function weaponUpgradeCost(currentTier: number): number {
  if (currentTier === 1) return 30;
  if (currentTier === 2) return 80;
  return Infinity;
}
export function boosterUpgradeCost(currentTier: number): number {
  if (currentTier === 1) return 50;
  if (currentTier === 2) return 120;
  return Infinity;
}

/**
 * Apply armor tier bonuses. Tier 2 = +1 starting block + ⌈hpMod×0.25⌉,
 * tier 3 = +2 starting block + ⌈hpMod×0.5⌉. handMod and reqMod are unaffected.
 */
export function getArmorEffective(id: string, tier: number = 1): Armor {
  const base = getArmor(id);
  const t = Math.max(1, Math.min(MAX_TIER, tier));
  if (t === 1) return base;
  const blockBonus = t - 1;
  const hpMul = t === 2 ? 0.25 : 0.5;
  const hpBonus = base.hpMod > 0 ? Math.ceil(base.hpMod * hpMul) : 0;
  return {
    ...base,
    startingBlock: base.startingBlock + blockBonus,
    hpMod: base.hpMod + hpBonus,
  };
}

/** Apply weapon tier bonus: +1 damage per tier above 1. */
export function getWeaponEffective(id: string, tier: number = 1): Weapon {
  const base = getWeapon(id);
  const t = Math.max(1, Math.min(MAX_TIER, tier));
  if (t === 1) return base;
  return {
    ...base,
    damage: base.damage + (t - 1),
  };
}

/**
 * Booster effects are applied case-by-case in the engine, but the engine can
 * read the tier from this helper to scale them. Returns a "potency" multiplier
 * for amounts (1.0 / 1.5 / 2.0 for tiers 1/2/3).
 */
export function getBoosterPotency(tier: number = 1): number {
  if (tier >= 3) return 2.0;
  if (tier >= 2) return 1.5;
  return 1.0;
}
