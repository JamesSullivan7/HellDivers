import { Faction } from "./types";
import { CARD_LIBRARY } from "./cards";
import { LEGACY_WEAPON_ID_MAP } from "./loadout";

const ACCOUNT_KEY = "helldivers_account";

export interface RunRecord {
  date: number;
  faction: Faction;
  planet: string;
  outcome: "victory" | "defeat";
  nodesCleared: number;
  medalsEarned: number;
  xpEarned: number;
  difficulty?: number;
}

export interface Account {
  level: number;
  xp: number;
  medals: number;
  /** Common Samples — drop on most combats, used for low-tier upgrades. */
  samples: number;
  /** Rare Samples (green) — drop on elite kills + most bosses, mid-tier upgrades. */
  rareSamples: number;
  /** Super Samples (orange) — drop only on Helldive+ boss kills (D7+). */
  superSamples: number;
  requisition: number; // for cosmetics (was: superCredits)
  unlockedCards: string[];
  unlockedModules: string[];
  unlockedCapes: string[];
  unlockedTitles: string[];
  equippedCape: string;
  equippedTitle: string;
  totalKills: number;
  totalRuns: number;
  victories: number;
  history: RunRecord[];
  helldiverName?: string;
  /** Armor IDs the Helldiver has purchased and can deploy with. */
  ownedArmors: string[];
  /** Weapon IDs the Helldiver has purchased. */
  ownedWeapons: string[];
  /** Booster IDs the Helldiver has purchased. */
  ownedBoosters: string[];
  /** Per-armor upgrade tier (1..3). Missing entries default to 1. */
  armorTiers: Record<string, number>;
  /** Per-weapon upgrade tier (1..3). */
  weaponTiers: Record<string, number>;
  /** Per-booster upgrade tier (1..3). */
  boosterTiers: Record<string, number>;
}

const HELLDIVER_PREFIXES = [
  "Major", "Captain", "Sergeant", "Diver", "Patriot", "Liberty", "Eagle",
  "Reinforcement", "Officer", "Star", "Iron", "Freedom",
];

export function generateHelldiverName(): string {
  const prefix = HELLDIVER_PREFIXES[Math.floor(Math.random() * HELLDIVER_PREFIXES.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}_${num}`;
}

export interface ShipModule {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export const SHIP_MODULES: ShipModule[] = [
  {
    id: "eagle_storm",
    name: "Eagle Storm Rearm",
    description: "Eagle cards deal +1 damage.",
    cost: 250,
  },
  {
    id: "orbital_targeting",
    name: "Targeting Software",
    description: "Orbital cards deal +1 damage.",
    cost: 250,
  },
  {
    id: "sentry_calibration",
    name: "Sentry Calibration",
    description: "Sentry damage +1 per tick.",
    cost: 300,
  },
  {
    id: "hellpod_storage",
    name: "Hellpod Optimization",
    description: "+1 max Requisition.",
    cost: 400,
  },
  {
    id: "streamlined_launch",
    name: "Streamlined Launch Process",
    description: "+1 hand size each combat.",
    cost: 500,
  },
  {
    id: "plasma_cutters",
    name: "Plasma Cutters",
    description: "Support weapons deal +1 damage.",
    cost: 250,
  },
  {
    id: "ammunition_priming",
    name: "Liquid-Fueled Engines",
    description: "Stratagems +5% effect (compounds with crit).",
    cost: 350,
  },
  {
    id: "vitamin_d3",
    name: "Vitamin D3 Supplements",
    description: "Start each run with +20 max HP.",
    cost: 400,
  },
];

export function getCardCost(rarity: "common" | "uncommon" | "rare"): number {
  if (rarity === "common") return 60;
  if (rarity === "uncommon") return 120;
  return 250;
}

export function defaultAccount(): Account {
  const startingUnlocked = CARD_LIBRARY.filter((c) => c.rarity === "common").map((c) => c.id);
  return {
    level: 1,
    xp: 0,
    medals: 0,
    samples: 0,
    rareSamples: 0,
    superSamples: 0,
    requisition: 100,
    unlockedCards: startingUnlocked,
    unlockedModules: [],
    unlockedCapes: ["patriot_yellow", "freedom_red", "snowfall_white"],
    unlockedTitles: [""],
    equippedCape: "patriot_yellow",
    equippedTitle: "",
    totalKills: 0,
    totalRuns: 0,
    victories: 0,
    history: [],
    helldiverName: generateHelldiverName(),
    // Outfitter: every Helldiver starts with the standard issue kit.
    ownedArmors: ["frontline"],
    ownedWeapons: ["ar2_coyote"],
    ownedBoosters: ["hellpod_optimization"],
    armorTiers: { frontline: 1 },
    weaponTiers: { ar2_coyote: 1 },
    boosterTiers: { hellpod_optimization: 1 },
  };
}

export function loadAccount(): Account {
  if (typeof window === "undefined") return defaultAccount();
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) {
      const fresh = defaultAccount();
      saveAccount(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<Account>;
    const def = defaultAccount();
    // Merge defensively — make sure all array fields are arrays even if stored value is wrong
    // Migration: legacy "slips" -> "samples", legacy "superCredits" -> "requisition"
    const legacy = parsed as any;
    const samples = typeof parsed.samples === "number"
      ? parsed.samples
      : typeof legacy.slips === "number"
        ? legacy.slips
        : def.samples;
    const requisition = typeof parsed.requisition === "number"
      ? parsed.requisition
      : typeof legacy.superCredits === "number"
        ? legacy.superCredits
        : def.requisition;
    const merged: Account = {
      ...def,
      ...parsed,
      samples,
      rareSamples: typeof parsed.rareSamples === "number" ? parsed.rareSamples : def.rareSamples,
      superSamples: typeof parsed.superSamples === "number" ? parsed.superSamples : def.superSamples,
      requisition,
      unlockedCards: Array.isArray(parsed.unlockedCards) ? parsed.unlockedCards : def.unlockedCards,
      unlockedModules: Array.isArray(parsed.unlockedModules) ? parsed.unlockedModules : def.unlockedModules,
      unlockedCapes: Array.isArray(parsed.unlockedCapes) ? parsed.unlockedCapes : def.unlockedCapes,
      unlockedTitles: Array.isArray(parsed.unlockedTitles) ? parsed.unlockedTitles : def.unlockedTitles,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      equippedCape: typeof parsed.equippedCape === "string" ? parsed.equippedCape : def.equippedCape,
      equippedTitle: typeof parsed.equippedTitle === "string" ? parsed.equippedTitle : def.equippedTitle,
      ownedArmors: Array.isArray(parsed.ownedArmors) ? parsed.ownedArmors : def.ownedArmors,
      ownedWeapons: Array.isArray(parsed.ownedWeapons)
        ? migrateWeaponIds(parsed.ownedWeapons)
        : def.ownedWeapons,
      ownedBoosters: Array.isArray(parsed.ownedBoosters) ? parsed.ownedBoosters : def.ownedBoosters,
      armorTiers: parsed.armorTiers && typeof parsed.armorTiers === "object" ? parsed.armorTiers : def.armorTiers,
      weaponTiers: parsed.weaponTiers && typeof parsed.weaponTiers === "object"
        ? migrateWeaponTiers(parsed.weaponTiers as Record<string, number>)
        : def.weaponTiers,
      boosterTiers: parsed.boosterTiers && typeof parsed.boosterTiers === "object" ? parsed.boosterTiers : def.boosterTiers,
    };
    delete (merged as any).slips;
    delete (merged as any).superCredits;
    if (!merged.helldiverName) merged.helldiverName = generateHelldiverName();
    return merged;
  } catch {
    return defaultAccount();
  }
}

export function saveAccount(a: Account) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  } catch {}
}

/**
 * Map any pre-art-pass weapon IDs (e.g. "ar23_liberator") onto their
 * modern equivalents from the new 12-weapon roster. Dedupes the result
 * so a player who owned both an old + new ID doesn't end up with a
 * duplicate after migration.
 */
function migrateWeaponIds(ids: string[]): string[] {
  const out = new Set<string>();
  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    out.add(LEGACY_WEAPON_ID_MAP[raw] ?? raw);
  }
  return Array.from(out);
}

/**
 * Mirror of migrateWeaponIds for the per-weapon tier dictionary. If an
 * old + new key collide we keep the higher tier so the player never
 * regresses.
 */
function migrateWeaponTiers(tiers: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(tiers)) {
    if (typeof v !== "number") continue;
    const mapped = LEGACY_WEAPON_ID_MAP[k] ?? k;
    out[mapped] = Math.max(out[mapped] ?? 0, v);
  }
  return out;
}

export function xpToLevelUp(level: number): number {
  return level * 1000;
}

/**
 * Helldivers 2 canonical rank progression. Pulled from helldivers.wiki.gg.
 * Each entry is the minimum level for the rank.
 */
export const HELLDIVER_RANKS: { level: number; title: string; abbr: string }[] = [
  { level: 1,   title: "Cadet",                      abbr: "CDT" },
  { level: 2,   title: "Space Cadet",                abbr: "SCDT" },
  { level: 5,   title: "Sergeant",                   abbr: "SGT" },
  { level: 10,  title: "Master Sergeant",            abbr: "MSGT" },
  { level: 15,  title: "Chief",                      abbr: "CHF" },
  { level: 20,  title: "Space Chief Prime",          abbr: "SCP" },
  { level: 25,  title: "Death Captain",              abbr: "DCPT" },
  { level: 30,  title: "Marshal",                    abbr: "MSL" },
  { level: 40,  title: "Star Marshal",               abbr: "SMSL" },
  { level: 50,  title: "Admiral",                    abbr: "ADM" },
  { level: 60,  title: "Skull Admiral",              abbr: "SKADM" },
  { level: 70,  title: "Fleet Admiral",              abbr: "FADM" },
  { level: 80,  title: "Admirable Admiral",          abbr: "AADM" },
  { level: 90,  title: "Commander",                  abbr: "CDR" },
  { level: 100, title: "5-Star General",             abbr: "5GEN" },
  { level: 125, title: "10-Star General",            abbr: "10GEN" },
  { level: 150, title: "Hero of the Federation",     abbr: "HOTF" },
];

/** Find the canonical rank title for a Helldiver's account level. */
export function getHelldiverRank(level: number): { title: string; abbr: string; nextAt: number | null } {
  let current = HELLDIVER_RANKS[0];
  let nextAt: number | null = null;
  for (let i = 0; i < HELLDIVER_RANKS.length; i++) {
    if (HELLDIVER_RANKS[i].level <= level) {
      current = HELLDIVER_RANKS[i];
      nextAt = HELLDIVER_RANKS[i + 1]?.level ?? null;
    }
  }
  return { title: current.title, abbr: current.abbr, nextAt };
}

export function applyXp(a: Account, amount: number): Account {
  let xp = a.xp + amount;
  let level = a.level;
  while (xp >= xpToLevelUp(level)) {
    xp -= xpToLevelUp(level);
    level += 1;
  }
  return { ...a, xp, level };
}

export interface RunReward {
  medals: number;
  xp: number;
  samples: number;
  rareSamples: number;
  superSamples: number;
  requisition: number;
}

export function calcRunReward(opts: {
  victory: boolean;
  nodesCleared: number;
  faction: Faction;
  difficulty: number;
}): RunReward {
  const factionMultiplier =
    opts.faction === "automaton" ? 1.2 : opts.faction === "illuminate" ? 1.4 : 1;
  // diff 1 → 0.8, diff 5 → 1.4, diff 10 → 2.5
  const diffMultiplier = 0.8 + (opts.difficulty - 1) * 0.18;
  const total = factionMultiplier * diffMultiplier;
  const baseMedals = opts.nodesCleared * 12;
  const winBonus = opts.victory ? 200 : 0;
  const baseSamples = opts.nodesCleared * 6;
  const baseReq = opts.nodesCleared * 4 + (opts.victory ? 35 : 0);
  // Rare samples: only on victory, and scaled with difficulty (~D5+ start seeing them).
  // Difficulty 1 → 0, 5 → ~3, 10 → ~10.
  const rareSamples = opts.victory
    ? Math.max(0, Math.round((opts.difficulty - 2) * 1.4 * factionMultiplier))
    : 0;
  // Super samples: only at D7+ on victory. D7 → 1, D10 → 4.
  const superSamples = opts.victory && opts.difficulty >= 7
    ? Math.max(0, Math.round((opts.difficulty - 6) * 1.1))
    : 0;
  return {
    medals: Math.round((baseMedals + winBonus) * total),
    xp: Math.round((opts.nodesCleared * 80 + (opts.victory ? 600 : 0)) * total),
    samples: Math.round((baseSamples + (opts.victory ? 80 : 0)) * total),
    rareSamples,
    superSamples,
    requisition: Math.round(baseReq * total),
  };
}

export function isCardUnlocked(account: Account, cardId: string): boolean {
  return account.unlockedCards.includes(cardId);
}
