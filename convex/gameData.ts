// Game data mirrored from /lib for use in Convex server functions.
// Keep in sync with lib/cards.ts, lib/enemies.ts, lib/loadout.ts, lib/modifiers.ts

export interface CardData {
  id: string;
  name: string;
  type: "eagle" | "orbital" | "sentry" | "support" | "backpack" | "utility";
  cost: number;
  target: "single" | "all" | "self" | "random" | "highest_hp";
  rarity: "common" | "uncommon" | "rare";
  effect: {
    damage?: number;
    damageHits?: number;
    burn?: number;
    block?: number;
    heal?: number;
    draw?: number;
    gainRequisition?: number;
    ignoreArmor?: boolean;
    bonusVsArmor?: number;
    recurringDamage?: { amount: number; turns: number; targetAll?: boolean };
    exhaust?: boolean;
    selfDamage?: number;
    chain?: number;
    stripShield?: number;
  };
}

const RAW_CARDS: CardData[] = [
  { id: "orbital_precision", name: "Orbital Precision Strike", type: "orbital", cost: 1, target: "single", rarity: "common", effect: { damage: 6 } },
  { id: "orbital_railcannon", name: "Orbital Railcannon", type: "orbital", cost: 3, target: "highest_hp", rarity: "rare", effect: { damage: 30, ignoreArmor: true } },
  { id: "orbital_gatling", name: "Orbital Gatling", type: "orbital", cost: 1, target: "all", rarity: "common", effect: { damage: 2 } },
  { id: "orbital_380mm", name: "Orbital 380mm Barrage", type: "orbital", cost: 4, target: "random", rarity: "uncommon", effect: { damage: 4, damageHits: 5 } },
  { id: "orbital_laser", name: "Orbital Laser", type: "orbital", cost: 4, target: "self", rarity: "rare", effect: { recurringDamage: { amount: 6, turns: 3, targetAll: true } } },
  { id: "orbital_emp", name: "Orbital EMS Strike", type: "orbital", cost: 2, target: "all", rarity: "uncommon", effect: { damage: 2, stripShield: 4 } },
  { id: "orbital_gas", name: "Orbital Gas Strike", type: "orbital", cost: 2, target: "all", rarity: "uncommon", effect: { burn: 6 } },
  { id: "orbital_walking", name: "Orbital Walking Barrage", type: "orbital", cost: 3, target: "random", rarity: "uncommon", effect: { damage: 6, damageHits: 3 } },
  { id: "eagle_airstrike", name: "Eagle Airstrike", type: "eagle", cost: 2, target: "all", rarity: "common", effect: { damage: 5 } },
  { id: "eagle_cluster", name: "Eagle Cluster Bomb", type: "eagle", cost: 2, target: "all", rarity: "uncommon", effect: { damage: 3, burn: 2 } },
  { id: "eagle_500kg", name: "Eagle 500kg Bomb", type: "eagle", cost: 4, target: "single", rarity: "rare", effect: { damage: 25 } },
  { id: "eagle_napalm", name: "Eagle Napalm Strike", type: "eagle", cost: 2, target: "all", rarity: "uncommon", effect: { burn: 4 } },
  { id: "eagle_smoke", name: "Eagle Smoke Strike", type: "eagle", cost: 1, target: "self", rarity: "common", effect: { block: 8, draw: 1 } },
  { id: "eagle_strafe", name: "Eagle Strafing Run", type: "eagle", cost: 1, target: "all", rarity: "common", effect: { damage: 3 } },
  { id: "eagle_rocket", name: "Eagle Rocket Pods", type: "eagle", cost: 3, target: "highest_hp", rarity: "uncommon", effect: { damage: 18 } },
  { id: "sentry_mg", name: "Machine Gun Sentry", type: "sentry", cost: 2, target: "self", rarity: "common", effect: { recurringDamage: { amount: 3, turns: 4, targetAll: false } } },
  { id: "sentry_autocannon", name: "Autocannon Sentry", type: "sentry", cost: 3, target: "self", rarity: "uncommon", effect: { recurringDamage: { amount: 5, turns: 3, targetAll: false } } },
  { id: "sentry_mortar", name: "Mortar Sentry", type: "sentry", cost: 2, target: "self", rarity: "uncommon", effect: { recurringDamage: { amount: 2, turns: 3, targetAll: true } } },
  { id: "sentry_tesla", name: "Tesla Tower", type: "sentry", cost: 3, target: "self", rarity: "rare", effect: { recurringDamage: { amount: 4, turns: 3, targetAll: true } } },
  { id: "sentry_rocket", name: "Rocket Sentry", type: "sentry", cost: 3, target: "self", rarity: "uncommon", effect: { recurringDamage: { amount: 6, turns: 2, targetAll: false } } },
  { id: "sentry_ems", name: "EMS Mortar Sentry", type: "sentry", cost: 2, target: "self", rarity: "uncommon", effect: { stripShield: 3, recurringDamage: { amount: 1, turns: 2, targetAll: true } } },
  { id: "support_quasar", name: "Quasar Cannon", type: "support", cost: 2, target: "single", rarity: "uncommon", effect: { damage: 14 } },
  { id: "support_recoilless", name: "Recoilless Rifle", type: "support", cost: 2, target: "single", rarity: "common", effect: { damage: 10, bonusVsArmor: 5 } },
  { id: "support_amr", name: "Anti-Materiel Rifle", type: "support", cost: 1, target: "single", rarity: "common", effect: { damage: 7, ignoreArmor: true } },
  { id: "support_stalwart", name: "Stalwart", type: "support", cost: 1, target: "random", rarity: "common", effect: { damage: 3, damageHits: 3 } },
  { id: "support_flamer", name: "Flamethrower", type: "support", cost: 2, target: "single", rarity: "uncommon", effect: { damage: 4, burn: 6 } },
  { id: "support_arc", name: "Arc Thrower", type: "support", cost: 1, target: "single", rarity: "uncommon", effect: { damage: 3, chain: 3, stripShield: 2 } },
  { id: "support_eat", name: "EAT-17", type: "support", cost: 0, target: "single", rarity: "common", effect: { damage: 10, exhaust: true } },
  { id: "support_hellbomb", name: "Hellbomb", type: "support", cost: 4, target: "all", rarity: "rare", effect: { damage: 40 } },
  { id: "support_spear", name: "Spear", type: "support", cost: 2, target: "highest_hp", rarity: "uncommon", effect: { damage: 22, ignoreArmor: true } },
  { id: "support_rg", name: "Railgun", type: "support", cost: 2, target: "single", rarity: "uncommon", effect: { damage: 12, bonusVsArmor: 8 } },
  { id: "support_grenade", name: "Grenade Launcher", type: "support", cost: 1, target: "all", rarity: "common", effect: { damage: 4 } },
  { id: "util_shield", name: "Shield Generator Pack", type: "backpack", cost: 1, target: "self", rarity: "common", effect: { block: 6 } },
  { id: "util_ballistic_shield", name: "Ballistic Shield", type: "backpack", cost: 2, target: "self", rarity: "uncommon", effect: { block: 12 } },
  { id: "util_resupply", name: "Resupply", type: "utility", cost: 1, target: "self", rarity: "common", effect: { draw: 2, gainRequisition: 1 } },
  { id: "util_stim", name: "Stim", type: "utility", cost: 0, target: "self", rarity: "common", effect: { heal: 5 } },
  { id: "util_reinforce", name: "Reinforce", type: "utility", cost: 3, target: "self", rarity: "uncommon", effect: { heal: 12 } },
  { id: "util_supply_pack", name: "Supply Pack", type: "backpack", cost: 2, target: "self", rarity: "uncommon", effect: { draw: 3, gainRequisition: 2 } },
];

export const CARDS: Record<string, CardData> = Object.fromEntries(RAW_CARDS.map((c) => [c.id, c]));

export function getCard(id: string): CardData {
  const c = CARDS[id];
  if (!c) throw new Error(`Unknown card: ${id}`);
  return c;
}

export interface EnemyIntent {
  kind: "attack" | "attack_all" | "buff" | "wait" | "armor";
  damage?: number;
  text: string;
}

export interface EnemyTemplate {
  id: string;
  name: string;
  hp: number;
  armor: number;
  shield?: number;
  intents: EnemyIntent[];
  enragedIntents?: EnemyIntent[];
  enragedMessage?: string;
  isBoss?: boolean;
  faction: "terminid" | "automaton" | "illuminate";
}

export const ENEMIES: Record<string, EnemyTemplate> = {
  scavenger: { id: "scavenger", name: "Scavenger", hp: 6, armor: 0, faction: "terminid", intents: [{ kind: "attack", damage: 2, text: "Bite 2" }, { kind: "attack", damage: 3, text: "Lunge 3" }] },
  hunter: { id: "hunter", name: "Hunter", hp: 9, armor: 0, faction: "terminid", intents: [{ kind: "attack", damage: 4, text: "Pounce 4" }, { kind: "attack", damage: 3, text: "Slash 3" }] },
  warrior: { id: "warrior", name: "Terminid Warrior", hp: 14, armor: 1, faction: "terminid", intents: [{ kind: "attack", damage: 5, text: "Charge 5" }, { kind: "buff", text: "Roar (Armor +1)" }, { kind: "attack", damage: 4, text: "Slash 4" }] },
  brood_commander: { id: "brood_commander", name: "Brood Commander", hp: 22, armor: 1, faction: "terminid", intents: [{ kind: "attack", damage: 6, text: "Cleave 6" }, { kind: "attack", damage: 4, text: "Bite 4" }, { kind: "attack_all", damage: 2, text: "Roar — All 2" }] },
  charger: { id: "charger", name: "Charger", hp: 32, armor: 3, faction: "terminid", intents: [{ kind: "wait", text: "Winding up..." }, { kind: "attack", damage: 12, text: "Charge! 12" }, { kind: "attack", damage: 5, text: "Stomp 5" }] },
  bile_spewer: { id: "bile_spewer", name: "Bile Spewer", hp: 18, armor: 0, faction: "terminid", intents: [{ kind: "attack_all", damage: 3, text: "Bile — All 3" }, { kind: "attack", damage: 5, text: "Spit 5" }] },
  stalker: { id: "stalker", name: "Stalker", hp: 16, armor: 0, faction: "terminid", intents: [{ kind: "attack", damage: 7, text: "Ambush 7" }, { kind: "wait", text: "Cloaking..." }] },
  bile_titan: {
    id: "bile_titan", name: "Bile Titan", hp: 80, armor: 4, faction: "terminid", isBoss: true,
    intents: [{ kind: "attack", damage: 12, text: "Stomp 12" }, { kind: "attack_all", damage: 6, text: "Bile Geyser — All 6" }, { kind: "buff", text: "Carapace (Armor +2)" }, { kind: "attack", damage: 14, text: "Crush 14" }],
    enragedMessage: "BILE TITAN ENRAGED.",
    enragedIntents: [{ kind: "attack", damage: 18, text: "Frenzy! 18" }, { kind: "attack_all", damage: 10, text: "Bile Wave — All 10" }, { kind: "attack", damage: 16, text: "Crush! 16" }],
  },
  trooper: { id: "trooper", name: "Automaton Trooper", hp: 8, armor: 0, faction: "automaton", intents: [{ kind: "attack", damage: 3, text: "Rifle 3" }, { kind: "attack", damage: 2, text: "Burst 2" }] },
  raider: { id: "raider", name: "Raider", hp: 12, armor: 0, faction: "automaton", intents: [{ kind: "attack", damage: 5, text: "Volley 5" }, { kind: "attack_all", damage: 2, text: "Suppress All 2" }] },
  devastator: { id: "devastator", name: "Devastator", hp: 20, armor: 2, faction: "automaton", intents: [{ kind: "attack", damage: 6, text: "Mortar 6" }, { kind: "buff", text: "Armor +1" }, { kind: "attack", damage: 4, text: "Burst 4" }] },
  berserker: { id: "berserker", name: "Berserker", hp: 24, armor: 1, faction: "automaton", intents: [{ kind: "attack", damage: 8, text: "Chainsaw 8" }, { kind: "attack", damage: 5, text: "Slam 5" }] },
  hulk: { id: "hulk", name: "Hulk Scorcher", hp: 38, armor: 4, faction: "automaton", intents: [{ kind: "attack_all", damage: 5, text: "Flamer — All 5" }, { kind: "attack", damage: 8, text: "Stomp 8" }, { kind: "wait", text: "Charging..." }] },
  tank: { id: "tank", name: "Annihilator Tank", hp: 50, armor: 5, faction: "automaton", intents: [{ kind: "wait", text: "Aiming..." }, { kind: "attack", damage: 14, text: "Cannon 14" }, { kind: "buff", text: "Stabilizers (+2 Armor)" }] },
  factory_strider: {
    id: "factory_strider", name: "Factory Strider", hp: 100, armor: 5, faction: "automaton", isBoss: true,
    intents: [{ kind: "attack_all", damage: 6, text: "Belly Cannons — All 6" }, { kind: "attack", damage: 14, text: "Eye Laser 14" }, { kind: "buff", text: "Reinforce (+2 Armor)" }, { kind: "attack", damage: 10, text: "Rocket Pods 10" }],
    enragedMessage: "FACTORY STRIDER OVERLOAD.",
    enragedIntents: [{ kind: "attack_all", damage: 10, text: "Cannons — All 10" }, { kind: "attack", damage: 18, text: "Plasma Lance 18" }, { kind: "attack_all", damage: 6, text: "Mortars — All 6" }],
  },
  voteless: { id: "voteless", name: "Voteless", hp: 7, armor: 0, faction: "illuminate", intents: [{ kind: "attack", damage: 2, text: "Swarm 2" }, { kind: "attack", damage: 3, text: "Claw 3" }] },
  watcher: { id: "watcher", name: "Watcher", hp: 10, armor: 0, shield: 4, faction: "illuminate", intents: [{ kind: "attack", damage: 3, text: "Beacon 3" }, { kind: "wait", text: "Calling reinforcements..." }] },
  overseer: { id: "overseer", name: "Overseer", hp: 18, armor: 1, shield: 6, faction: "illuminate", intents: [{ kind: "attack", damage: 5, text: "Plasma 5" }, { kind: "buff", text: "Shielding (+3 Shield)" }, { kind: "attack_all", damage: 3, text: "Pulse — All 3" }] },
  elevated_overseer: { id: "elevated_overseer", name: "Elevated Overseer", hp: 28, armor: 1, shield: 10, faction: "illuminate", intents: [{ kind: "attack", damage: 7, text: "Lance 7" }, { kind: "attack_all", damage: 4, text: "Shockwave — All 4" }, { kind: "buff", text: "Reinforce Shield (+5)" }] },
  harvester: { id: "harvester", name: "Harvester", hp: 42, armor: 2, shield: 8, faction: "illuminate", intents: [{ kind: "attack_all", damage: 5, text: "Beam Sweep — All 5" }, { kind: "attack", damage: 10, text: "Plasma Cannon 10" }, { kind: "wait", text: "Charging..." }] },
  monolith: {
    id: "monolith", name: "Crescent Monolith", hp: 90, armor: 3, shield: 20, faction: "illuminate", isBoss: true,
    intents: [{ kind: "attack", damage: 14, text: "Annihilate 14" }, { kind: "attack_all", damage: 7, text: "Reality Tear — All 7" }, { kind: "buff", text: "Phase Shield (+8)" }, { kind: "attack", damage: 10, text: "Lance 10" }],
    enragedMessage: "MONOLITH PHASE-SHIFT.",
    enragedIntents: [{ kind: "attack", damage: 18, text: "Reality Lance 18" }, { kind: "attack_all", damage: 12, text: "Phase Wave — All 12" }, { kind: "buff", text: "Phase Shield (+12)" }],
  },
};

export const FACTION_MAPS: Record<string, Array<{ type: string; enemies: string[] }>> = {
  terminid: [
    { type: "combat", enemies: ["scavenger", "scavenger"] },
    { type: "combat", enemies: ["scavenger", "hunter"] },
    { type: "combat", enemies: ["hunter", "hunter", "scavenger"] },
    { type: "elite", enemies: ["warrior", "scavenger"] },
    { type: "rest", enemies: [] },
    { type: "combat", enemies: ["bile_spewer", "hunter"] },
    { type: "combat", enemies: ["brood_commander", "hunter"] },
    { type: "elite", enemies: ["charger"] },
    { type: "combat", enemies: ["stalker", "warrior"] },
    { type: "rest", enemies: [] },
    { type: "boss", enemies: ["bile_titan"] },
  ],
  automaton: [
    { type: "combat", enemies: ["trooper", "trooper"] },
    { type: "combat", enemies: ["trooper", "raider"] },
    { type: "combat", enemies: ["raider", "raider", "trooper"] },
    { type: "elite", enemies: ["devastator", "trooper"] },
    { type: "rest", enemies: [] },
    { type: "combat", enemies: ["berserker", "trooper"] },
    { type: "combat", enemies: ["devastator", "raider"] },
    { type: "elite", enemies: ["hulk"] },
    { type: "combat", enemies: ["devastator", "berserker"] },
    { type: "rest", enemies: [] },
    { type: "boss", enemies: ["factory_strider"] },
  ],
  illuminate: [
    { type: "combat", enemies: ["voteless", "voteless"] },
    { type: "combat", enemies: ["voteless", "watcher"] },
    { type: "combat", enemies: ["watcher", "voteless", "voteless"] },
    { type: "elite", enemies: ["overseer"] },
    { type: "rest", enemies: [] },
    { type: "combat", enemies: ["overseer", "voteless"] },
    { type: "combat", enemies: ["watcher", "watcher", "voteless"] },
    { type: "elite", enemies: ["elevated_overseer"] },
    { type: "combat", enemies: ["harvester"] },
    { type: "rest", enemies: [] },
    { type: "boss", enemies: ["monolith"] },
  ],
};

export const ARMORS: Record<string, { id: string; hpMod: number; handMod: number; startingBlock: number }> = {
  scout: { id: "scout", hpMod: -10, handMod: 1, startingBlock: 0 },
  frontline: { id: "frontline", hpMod: 0, handMod: 0, startingBlock: 0 },
  fortified: { id: "fortified", hpMod: 20, handMod: -1, startingBlock: 3 },
};

export const WEAPONS: Record<string, { damage: number; hitsPerTurn: number; target: "highest_hp" | "random" | "all"; ignoreArmor?: boolean }> = {
  ar23_liberator: { damage: 3, hitsPerTurn: 1, target: "highest_hp" },
  sg225_breaker: { damage: 2, hitsPerTurn: 1, target: "all" },
  r63_diligence: { damage: 7, hitsPerTurn: 1, target: "highest_hp", ignoreArmor: true },
  mp98_knight: { damage: 1, hitsPerTurn: 4, target: "random" },
};
