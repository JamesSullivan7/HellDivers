import { ArrowKey, Card } from "./types";

function generateCode(id: string, length: number): ArrowKey[] {
  const arrows: ArrowKey[] = ["U", "D", "L", "R"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const out: ArrowKey[] = [];
  for (let i = 0; i < length; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(arrows[h % 4]);
  }
  return out;
}

const RAW: Card[] = [
  // ORBITAL
  { id: "orbital_precision", name: "Orbital Precision Strike", type: "orbital", cost: 1, target: "single", rarity: "common", description: "Deal 6 damage to one enemy.", effect: { damage: 6 } },
  { id: "orbital_railcannon", name: "Orbital Railcannon", type: "orbital", cost: 3, target: "highest_hp", rarity: "rare", description: "Deal 30 damage to the highest-HP enemy. Ignores armor.", effect: { damage: 30, ignoreArmor: true } },
  { id: "orbital_gatling", name: "Orbital Gatling", type: "orbital", cost: 1, target: "all", rarity: "common", description: "Deal 2 damage to all enemies.", effect: { damage: 2 } },
  { id: "orbital_380mm", name: "Orbital 380mm Barrage", type: "orbital", cost: 4, target: "random", rarity: "uncommon", description: "Hit random enemies 5 times for 4 damage each.", effect: { damage: 4, damageHits: 5 } },
  { id: "orbital_laser", name: "Orbital Laser", type: "orbital", cost: 4, target: "self", rarity: "rare", description: "Deal 6 damage to all enemies for 3 turns.", effect: { recurringDamage: { amount: 6, turns: 3, targetAll: true } } },
  { id: "orbital_emp", name: "Orbital EMS Strike", type: "orbital", cost: 2, target: "all", rarity: "uncommon", description: "Strip 4 shields from all enemies. Deal 2 damage.", effect: { damage: 2, stripShield: 4 } },
  { id: "orbital_gas", name: "Orbital Gas Strike", type: "orbital", cost: 2, target: "all", rarity: "uncommon", description: "Apply 3 Burn to all enemies for 2 turns.", effect: { burn: 6 } },
  { id: "orbital_walking", name: "Orbital Walking Barrage", type: "orbital", cost: 3, target: "random", rarity: "uncommon", description: "Hit random enemies 3 times for 6 damage.", effect: { damage: 6, damageHits: 3 } },
  // EAGLE
  { id: "eagle_airstrike", name: "Eagle Airstrike", type: "eagle", cost: 2, target: "all", rarity: "common", description: "Deal 5 damage to all enemies.", effect: { damage: 5 } },
  { id: "eagle_cluster", name: "Eagle Cluster Bomb", type: "eagle", cost: 2, target: "all", rarity: "uncommon", description: "Deal 3 damage and apply 2 Burn to all enemies.", effect: { damage: 3, burn: 2 } },
  { id: "eagle_500kg", name: "Eagle 500kg Bomb", type: "eagle", cost: 4, target: "single", rarity: "rare", description: "Deal 25 damage to one enemy.", effect: { damage: 25 } },
  { id: "eagle_napalm", name: "Eagle Napalm Strike", type: "eagle", cost: 2, target: "all", rarity: "uncommon", description: "Apply 4 Burn to all enemies.", effect: { burn: 4 } },
  { id: "eagle_smoke", name: "Eagle Smoke Strike", type: "eagle", cost: 1, target: "self", rarity: "common", description: "Gain 8 Block. Draw 1 card.", effect: { block: 8, draw: 1 } },
  { id: "eagle_strafe", name: "Eagle Strafing Run", type: "eagle", cost: 1, target: "all", rarity: "common", description: "Deal 3 damage to all enemies.", effect: { damage: 3 } },
  { id: "eagle_rocket", name: "Eagle Rocket Pods", type: "eagle", cost: 3, target: "highest_hp", rarity: "uncommon", description: "Deal 18 damage to the highest-HP enemy.", effect: { damage: 18 } },
  // SENTRY
  { id: "sentry_mg", name: "Machine Gun Sentry", type: "sentry", cost: 2, target: "self", rarity: "common", description: "Deal 3 damage to a random enemy each turn for 4 turns.", effect: { recurringDamage: { amount: 3, turns: 4, targetAll: false } } },
  { id: "sentry_autocannon", name: "Autocannon Sentry", type: "sentry", cost: 3, target: "self", rarity: "uncommon", description: "Deal 5 damage to a random enemy each turn for 3 turns.", effect: { recurringDamage: { amount: 5, turns: 3, targetAll: false } } },
  { id: "sentry_mortar", name: "Mortar Sentry", type: "sentry", cost: 2, target: "self", rarity: "uncommon", description: "Deal 2 damage to all enemies each turn for 3 turns.", effect: { recurringDamage: { amount: 2, turns: 3, targetAll: true } } },
  { id: "sentry_tesla", name: "Tesla Tower", type: "sentry", cost: 3, target: "self", rarity: "rare", description: "Deal 4 damage to all enemies each turn for 3 turns.", effect: { recurringDamage: { amount: 4, turns: 3, targetAll: true } } },
  { id: "sentry_rocket", name: "Rocket Sentry", type: "sentry", cost: 3, target: "self", rarity: "uncommon", description: "Deal 6 damage to highest-HP enemy each turn for 2 turns.", effect: { recurringDamage: { amount: 6, turns: 2, targetAll: false } } },
  { id: "sentry_ems", name: "EMS Mortar Sentry", type: "sentry", cost: 2, target: "self", rarity: "uncommon", description: "Strip 3 shields from all enemies each turn for 2 turns.", effect: { stripShield: 3, recurringDamage: { amount: 1, turns: 2, targetAll: true } } },
  // SUPPORT
  { id: "support_quasar", name: "Quasar Cannon", type: "support", cost: 2, target: "single", rarity: "uncommon", description: "Deal 14 damage to one enemy.", effect: { damage: 14 } },
  { id: "support_recoilless", name: "Recoilless Rifle", type: "support", cost: 2, target: "single", rarity: "common", description: "Deal 10 damage. +5 vs armored.", effect: { damage: 10, bonusVsArmor: 5 } },
  { id: "support_amr", name: "Anti-Materiel Rifle", type: "support", cost: 1, target: "single", rarity: "common", description: "Deal 7 damage. Ignores armor.", effect: { damage: 7, ignoreArmor: true } },
  { id: "support_stalwart", name: "Stalwart", type: "support", cost: 1, target: "random", rarity: "common", description: "Deal 3 damage to random enemies 3 times.", effect: { damage: 3, damageHits: 3 } },
  { id: "support_flamer", name: "Flamethrower", type: "support", cost: 2, target: "single", rarity: "uncommon", description: "Deal 4 damage and apply 6 Burn.", effect: { damage: 4, burn: 6 } },
  { id: "support_arc", name: "Arc Thrower", type: "support", cost: 1, target: "single", rarity: "uncommon", description: "Deal 3 damage, chains to up to 3 enemies. Strips 2 shields per chain.", effect: { damage: 3, chain: 3, stripShield: 2 } },
  { id: "support_eat", name: "EAT-17", type: "support", cost: 0, target: "single", rarity: "common", description: "Deal 10 damage. Exhaust.", effect: { damage: 10, exhaust: true } },
  { id: "support_hellbomb", name: "Hellbomb", type: "support", cost: 4, target: "all", rarity: "rare", description: "Deal 40 damage to all enemies.", effect: { damage: 40 } },
  { id: "support_spear", name: "Spear", type: "support", cost: 2, target: "highest_hp", rarity: "uncommon", description: "Deal 22 damage to highest-HP enemy. Ignores armor.", effect: { damage: 22, ignoreArmor: true } },
  { id: "support_rg", name: "Railgun", type: "support", cost: 2, target: "single", rarity: "uncommon", description: "Deal 12 damage. +8 vs armored.", effect: { damage: 12, bonusVsArmor: 8 } },
  { id: "support_grenade", name: "Grenade Launcher", type: "support", cost: 1, target: "all", rarity: "common", description: "Deal 4 damage to all enemies.", effect: { damage: 4 } },
  // BACKPACK / UTILITY
  { id: "util_shield", name: "Shield Generator Pack", type: "backpack", cost: 1, target: "self", rarity: "common", description: "Gain 6 Block.", effect: { block: 6 } },
  { id: "util_ballistic_shield", name: "Ballistic Shield", type: "backpack", cost: 2, target: "self", rarity: "uncommon", description: "Gain 12 Block.", effect: { block: 12 } },
  { id: "util_resupply", name: "Resupply", type: "utility", cost: 1, target: "self", rarity: "common", description: "Draw 2 cards. Gain 1 R.", effect: { draw: 2, gainRequisition: 1 } },
  { id: "util_stim", name: "Stim", type: "utility", cost: 0, target: "self", rarity: "common", description: "Heal 5 HP.", effect: { heal: 5 } },
  { id: "util_reinforce", name: "Reinforce", type: "utility", cost: 3, target: "self", rarity: "uncommon", description: "Heal 12 HP.", effect: { heal: 12 } },
  { id: "util_supply_pack", name: "Supply Pack", type: "backpack", cost: 2, target: "self", rarity: "uncommon", description: "Draw 3 cards. Gain 2 R.", effect: { draw: 3, gainRequisition: 2 } },
];

export const CARD_LIBRARY: Card[] = RAW.map((c) => ({
  ...c,
  code: generateCode(c.id, 4 + (c.cost > 2 ? 2 : c.cost > 0 ? 1 : 0)),
}));

export const STARTER_DECK_IDS: string[] = [
  "orbital_precision",
  "orbital_precision",
  "orbital_precision",
  "orbital_precision",
  "eagle_airstrike",
  "support_recoilless",
  "support_recoilless",
  "util_stim",
  "util_stim",
  "util_shield",
];

export function getCardById(id: string): Card {
  const c = CARD_LIBRARY.find((x) => x.id === id);
  if (!c) throw new Error(`Card not found: ${id}`);
  return { ...c, code: c.code ? [...c.code] : undefined };
}

export function buildStarterDeck(): Card[] {
  return STARTER_DECK_IDS.map(getCardById);
}

export function getRandomRewardCards(count: number): Card[] {
  const pool = CARD_LIBRARY.filter(
    (c) => !["util_stim", "util_shield"].includes(c.id)
  );
  const selected: Card[] = [];
  const used = new Set<string>();
  let attempts = 0;
  while (selected.length < count && attempts < 100) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const roll = Math.random();
    let allowed = false;
    if (c.rarity === "common" && roll < 0.55) allowed = true;
    else if (c.rarity === "uncommon" && roll < 0.85) allowed = true;
    else if (c.rarity === "rare" && roll < 1) allowed = true;
    if (allowed && !used.has(c.id)) {
      selected.push({ ...c, code: c.code ? [...c.code] : undefined });
      used.add(c.id);
    }
    attempts++;
  }
  while (selected.length < count) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (!used.has(c.id)) {
      selected.push({ ...c, code: c.code ? [...c.code] : undefined });
      used.add(c.id);
    }
  }
  return selected;
}
