import { Armor, Booster, Weapon } from "./types";

export const ARMORS: Armor[] = [
  {
    id: "scout",
    name: "SC-30 Trailblazer Scout",
    passive: "+1 hand size · -10 max HP · faster mobility",
    hpMod: -10,
    handMod: 1,
    startingBlock: 0,
    reqMod: 0,
  },
  {
    id: "frontline",
    name: "B-01 Tactical Frontline",
    passive: "Balanced loadout · standard issue",
    hpMod: 0,
    handMod: 0,
    startingBlock: 0,
    reqMod: 0,
  },
  {
    id: "fortified",
    name: "FS-37 Ravager Fortified",
    passive: "+20 max HP · +3 starting Block · -1 hand size",
    hpMod: 20,
    handMod: -1,
    startingBlock: 3,
    reqMod: 0,
  },
];

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
];

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
];

export const FIXED_BASICS = [
  "orbital_precision",
  "orbital_precision",
  "orbital_precision",
  "util_stim",
  "util_shield",
];

export const STRATAGEM_PICKS_REQUIRED = 5;
