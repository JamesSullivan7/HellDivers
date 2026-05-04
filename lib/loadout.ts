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

/**
 * PRIMARY WEAPON ROSTER — Helldivers 2 canon (from helldivers.wiki.gg).
 *
 * Each entry's `description` is the in-engine ability text shown on the
 * combat HUD. The Codex Weapons tab reads richer metadata (type, rarity,
 * keyword tags, flavor) from `WEAPON_META` in CodexScreen.tsx so the
 * Weapon contract stays focused on engine math.
 *
 * Order is intentional — broadly progresses from basic auto-fire rifles
 * → DMR / sniper precision → explosive → energy/plasma → shotguns →
 * specials. The first entry is the default starter loadout.
 */
export const WEAPONS: Weapon[] = [
  // ── ASSAULT / RIFLES ──
  {
    id: "ar2_coyote",
    name: "AR-2 Coyote",
    description: "Burst-fires 2 dmg at 2 random enemies each turn.",
    damage: 2,
    hitsPerTurn: 2,
    target: "random",
  },
  {
    id: "ar23p_liberator_penetrator",
    name: "AR-23P Liberator Penetrator",
    description: "Armor-piercing burst: 3 dmg at the highest-HP enemy. Ignores armor.",
    damage: 3,
    hitsPerTurn: 1,
    target: "highest_hp",
    ignoreArmor: true,
  },
  {
    id: "r2124_constitution",
    name: "R-2124 Constitution",
    description: "Heavy bolt-rifle: 5 dmg at the highest-HP enemy each turn.",
    damage: 5,
    hitsPerTurn: 1,
    target: "highest_hp",
  },

  // ── DMR / SNIPER ──
  {
    id: "r6_deadeye",
    name: "R-6 Deadeye",
    description: "Precision shot: 8 dmg at the highest-HP enemy. Ignores armor.",
    damage: 8,
    hitsPerTurn: 1,
    target: "highest_hp",
    ignoreArmor: true,
  },

  // ── EXPLOSIVE ──
  {
    id: "r36_eruptor",
    name: "R-36 Eruptor",
    description: "Explosive auto-fire: 4 dmg to all enemies each turn.",
    damage: 4,
    hitsPerTurn: 1,
    target: "all",
  },
  {
    id: "jar5_dominator",
    name: "JAR-5 Dominator",
    description: "Explosive slug: 6 dmg at the highest-HP enemy each turn.",
    damage: 6,
    hitsPerTurn: 1,
    target: "highest_hp",
  },
  {
    id: "cb9_exploding_crossbow",
    name: "CB-9 Exploding Crossbow",
    description: "Detonating bolt: 7 dmg at the highest-HP enemy each turn.",
    damage: 7,
    hitsPerTurn: 1,
    target: "highest_hp",
  },

  // ── ENERGY / PLASMA / ARC ──
  {
    id: "sg8p_punisher_plasma",
    name: "SG-8P Punisher Plasma",
    description: "Plasma blast: 3 dmg to all enemies each turn.",
    damage: 3,
    hitsPerTurn: 1,
    target: "all",
  },
  {
    id: "arc12_blitzer",
    name: "ARC-12 Blitzer",
    description: "Chain lightning: arcs 2 dmg across 3 random enemies each turn.",
    damage: 2,
    hitsPerTurn: 3,
    target: "random",
  },

  // ── SHOTGUNS ──
  {
    id: "sg20_halt",
    name: "SG-20 HALT",
    description: "Sonic blast: 3 dmg + stagger at the highest-HP enemy each turn.",
    damage: 3,
    hitsPerTurn: 1,
    target: "highest_hp",
  },
  {
    id: "sg451_cookout",
    name: "SG-451 Cookout",
    description: "Incendiary spray: 2 dmg at 2 random enemies each turn. Ignites.",
    damage: 2,
    hitsPerTurn: 2,
    target: "random",
  },

  // ── ADAPTIVE / SPECIAL ──
  {
    id: "vg70_variable",
    name: "VG-70 Variable",
    description: "Dual-mode: 4 dmg precision + 4 dmg burst each turn. Ignores armor.",
    damage: 4,
    hitsPerTurn: 2,
    target: "highest_hp",
    ignoreArmor: true,
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
export const DEFAULT_WEAPON = "ar2_coyote";
export const DEFAULT_BOOSTER = "hellpod_optimization";

/**
 * Weapon ID migration map. Old roster (pre-art-pass) → new roster.
 * Used by account.ts when loading saves so existing players don't lose
 * their unlocked weapons / tier progress when the IDs were renamed.
 */
export const LEGACY_WEAPON_ID_MAP: Record<string, string> = {
  ar23_liberator: "ar23p_liberator_penetrator",
  sg225_breaker: "sg8p_punisher_plasma",
  r63_diligence: "r6_deadeye",
  mp98_knight: "ar2_coyote",
  las16_sickle: "r6_deadeye",
  plas1_scorcher: "sg8p_punisher_plasma",
  sg8_punisher: "sg20_halt",
};

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
  // util_resupply and util_reinforce removed - they're now run-wide
  // utility charges (UtilityTray), not pickable stratagems.
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

/**
 * Cards every helldiver gets in their starting deck on top of their
 * 4 stratagem picks. Stim and Resupply USED to live here as in-deck
 * cards but are now run/combat-charge utilities (see RUN_UTILITY_INITIAL
 * + STIM_CHARGES_PER_COMBAT below) and are no longer drawn into the
 * hand. Three Orbital Precision Strikes + one Shield generator stay.
 */
export const FIXED_BASICS = [
  "orbital_precision",
  "orbital_precision",
  "orbital_precision",
  "util_shield",
];

export const STRATAGEM_PICKS_REQUIRED = 4;

/**
 * Run-wide utility charges granted on new run. Don't refill between
 * combats — once spent, gone for the rest of the run.
 */
export const RUN_UTILITY_INITIAL: { resupply: number; reinforce: number } = {
  resupply: 2,
  reinforce: 1,
};

/**
 * Stim is the only utility that resets per encounter. Each combat
 * start refills the player's stim charges to this value.
 */
export const STIM_CHARGES_PER_COMBAT = 2;

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
