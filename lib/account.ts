import { Faction } from "./types";
import { CARD_LIBRARY } from "./cards";

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
  samples: number;     // for ship modules (was: slips)
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
      requisition,
      unlockedCards: Array.isArray(parsed.unlockedCards) ? parsed.unlockedCards : def.unlockedCards,
      unlockedModules: Array.isArray(parsed.unlockedModules) ? parsed.unlockedModules : def.unlockedModules,
      unlockedCapes: Array.isArray(parsed.unlockedCapes) ? parsed.unlockedCapes : def.unlockedCapes,
      unlockedTitles: Array.isArray(parsed.unlockedTitles) ? parsed.unlockedTitles : def.unlockedTitles,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      equippedCape: typeof parsed.equippedCape === "string" ? parsed.equippedCape : def.equippedCape,
      equippedTitle: typeof parsed.equippedTitle === "string" ? parsed.equippedTitle : def.equippedTitle,
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

export function xpToLevelUp(level: number): number {
  return level * 1000;
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
  return {
    medals: Math.round((baseMedals + winBonus) * total),
    xp: Math.round((opts.nodesCleared * 80 + (opts.victory ? 600 : 0)) * total),
    samples: Math.round((baseSamples + (opts.victory ? 80 : 0)) * total),
    requisition: Math.round(baseReq * total),
  };
}

export function isCardUnlocked(account: Account, cardId: string): boolean {
  return account.unlockedCards.includes(cardId);
}
