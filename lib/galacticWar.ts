import { Faction } from "./types";

const WAR_KEY = "helldivers_war_v2";

export interface PlanetState {
  id: string;
  name: string;
  faction: Faction;
  sector: string;
  biome: string;
  liberation: number; // 0..100
  decayPerHour: number;
  baseLiberators: number;
  defenseEvent?: { active: boolean; deadline: number };
}

export interface MajorOrder {
  id: string;
  title: string;
  briefing: string;
  targetPlanetIds: string[];
  rewardMedals: number;
  startedAt: number;
  durationHours: number;
}

export interface WarState {
  planets: Record<string, PlanetState>;
  majorOrder: MajorOrder | null;
  lastTick: number;
  contributions: { planetId: string; victory: boolean; difficulty: number; date: number }[];
}

const PLANETS_DATA: Omit<PlanetState, "liberation" | "baseLiberators">[] = [
  // ── TERMINID — Eastern bug worlds ──
  { id: "phact_bay", name: "Phact Bay", faction: "terminid", sector: "Jin Xi", biome: "Sandy Mesa", decayPerHour: 1.5 },
  { id: "gemstone_bluffs", name: "Gemstone Bluffs", faction: "terminid", sector: "L'estrade", biome: "Grassland", decayPerHour: 1.0 },
  { id: "omicron", name: "Omicron", faction: "terminid", sector: "L'estrade", biome: "Tundra", decayPerHour: 0.9 },
  { id: "nabatea_secundus", name: "Nabatea Secundus", faction: "terminid", sector: "L'estrade", biome: "Swamp", decayPerHour: 1.1 },
  { id: "nivel_43", name: "Nivel 43", faction: "terminid", sector: "Mirin", biome: "Ashland", decayPerHour: 1.4 },
  { id: "zagon_prime", name: "Zagon Prime", faction: "terminid", sector: "Mirin", biome: "Sandy Mesa", decayPerHour: 1.6 },
  { id: "azterra", name: "Azterra", faction: "terminid", sector: "Orion", biome: "Copper Desert", decayPerHour: 1.2 },
  { id: "terrek", name: "Terrek", faction: "terminid", sector: "Orion", biome: "Barren Moon", decayPerHour: 1.3 },
  { id: "cirrus", name: "Cirrus", faction: "terminid", sector: "Orion", biome: "Ashland", decayPerHour: 1.5 },

  // ── AUTOMATON — Western bot strongholds ──
  { id: "choohe", name: "Choohe", faction: "automaton", sector: "Lacaille", biome: "Sandy Mesa", decayPerHour: 2.0 },
  { id: "yed_prior", name: "Yed Prior", faction: "automaton", sector: "Tanis", biome: "Ionized Grassland", decayPerHour: 1.7 },
  { id: "clasa", name: "Clasa", faction: "automaton", sector: "Tanis", biome: "Swamp", decayPerHour: 1.5 },
  { id: "zefia", name: "Zefia", faction: "automaton", sector: "Tanis", biome: "Ethereal Jungle", decayPerHour: 1.6 },
  { id: "demiurg", name: "Demiurg", faction: "automaton", sector: "Tanis", biome: "Tundra", decayPerHour: 1.8 },

  // ── ILLUMINATE — Recent invasion sectors ──
  { id: "myrium", name: "Myrium", faction: "illuminate", sector: "Morgon", biome: "Copper Desert", decayPerHour: 2.2 },
  { id: "hydrobius", name: "Hydrobius", faction: "illuminate", sector: "Omega", biome: "Quake Desert", decayPerHour: 2.4 },
  { id: "setia", name: "Setia", faction: "illuminate", sector: "Omega", biome: "Foggy Swamp", decayPerHour: 2.0 },
  { id: "senge_23", name: "Senge 23", faction: "illuminate", sector: "Omega", biome: "Copper Desert", decayPerHour: 2.1 },
  { id: "parsh", name: "Parsh", faction: "illuminate", sector: "Rictus", biome: "Swamp", decayPerHour: 2.3 },
  { id: "kerth_secundus", name: "Kerth Secundus", faction: "illuminate", sector: "Rictus", biome: "Tundra", decayPerHour: 2.5 },
  { id: "grafmere", name: "Grafmere", faction: "illuminate", sector: "Rictus", biome: "Frozen Boneyard", decayPerHour: 2.2 },
  { id: "genesis_prime", name: "Genesis Prime", faction: "illuminate", sector: "Rictus", biome: "Shadowed Jungle", decayPerHour: 2.6 },
];

const MAJOR_ORDERS: Omit<MajorOrder, "startedAt">[] = [
  {
    id: "mo_terminid_purge",
    title: "PURGE THE EASTERN HIVES",
    briefing: "Three Terminid breeding worlds threaten the Mirin and Orion sectors. Liberate them within 7 days.",
    targetPlanetIds: ["zagon_prime", "cirrus", "phact_bay"],
    rewardMedals: 600,
    durationHours: 168,
  },
  {
    id: "mo_choohe_offensive",
    title: "CHOOHE OFFENSIVE",
    briefing: "Liberate Choohe. The Automaton mechanized division must be broken.",
    targetPlanetIds: ["choohe"],
    rewardMedals: 800,
    durationHours: 96,
  },
  {
    id: "mo_tanis_purge",
    title: "TANIS SECTOR LIBERATION",
    briefing: "Halt the Automaton expansion across Tanis. Liberate Yed Prior, Demiurg, and Clasa.",
    targetPlanetIds: ["yed_prior", "demiurg", "clasa"],
    rewardMedals: 700,
    durationHours: 120,
  },
  {
    id: "mo_illuminate_purge",
    title: "RICTUS PHASE PURGE",
    briefing: "The Illuminate cult is consolidating in Rictus. Push back at Genesis Prime and Kerth Secundus.",
    targetPlanetIds: ["genesis_prime", "kerth_secundus"],
    rewardMedals: 850,
    durationHours: 96,
  },
  {
    id: "mo_omega_assault",
    title: "OMEGA INCURSION RESPONSE",
    briefing: "Push the Illuminate out of Omega. Liberate Hydrobius, Setia, and Senge 23.",
    targetPlanetIds: ["hydrobius", "setia", "senge_23"],
    rewardMedals: 900,
    durationHours: 120,
  },
  {
    id: "mo_general_assault",
    title: "GENERAL ASSAULT",
    briefing: "Strike where it hurts. Any 4 planets liberated counts.",
    targetPlanetIds: [],
    rewardMedals: 500,
    durationHours: 72,
  },
];

function defaultWarState(): WarState {
  const planets: Record<string, PlanetState> = {};
  PLANETS_DATA.forEach((p) => {
    const lib = 20 + Math.random() * 60;
    planets[p.id] = {
      ...p,
      liberation: lib,
      baseLiberators: 100 + Math.floor(Math.random() * 4000),
    };
  });
  const orderTemplate = MAJOR_ORDERS[Math.floor(Math.random() * MAJOR_ORDERS.length)];
  return {
    planets,
    majorOrder: { ...orderTemplate, startedAt: Date.now() },
    lastTick: Date.now(),
    contributions: [],
  };
}

export function loadWarState(): WarState {
  if (typeof window === "undefined") return defaultWarState();
  try {
    const raw = localStorage.getItem(WAR_KEY);
    if (!raw) {
      const fresh = defaultWarState();
      saveWarState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as WarState;
    return tickWar(parsed);
  } catch {
    return defaultWarState();
  }
}

export function saveWarState(s: WarState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WAR_KEY, JSON.stringify(s));
  } catch {}
}

export function tickWar(state: WarState): WarState {
  const now = Date.now();
  const hours = (now - state.lastTick) / (1000 * 60 * 60);
  if (hours <= 0) return state;
  const planets = { ...state.planets };
  Object.keys(planets).forEach((id) => {
    const p = planets[id];
    const newLib = Math.max(0, p.liberation - p.decayPerHour * hours);
    planets[id] = { ...p, liberation: newLib };
  });
  let majorOrder = state.majorOrder;
  if (majorOrder) {
    const elapsed = (now - majorOrder.startedAt) / (1000 * 60 * 60);
    if (elapsed > majorOrder.durationHours) {
      const t = MAJOR_ORDERS[Math.floor(Math.random() * MAJOR_ORDERS.length)];
      majorOrder = { ...t, startedAt: now };
    }
  }
  return { ...state, planets, lastTick: now, majorOrder };
}

export function contributeVictory(
  state: WarState,
  planetId: string,
  difficulty: number
): WarState {
  const p = state.planets[planetId];
  if (!p) return state;
  const boost = 4 + difficulty * 1.2;
  const newLib = Math.min(100, p.liberation + boost);
  const planets = {
    ...state.planets,
    [planetId]: { ...p, liberation: newLib, baseLiberators: p.baseLiberators + 1 },
  };
  return {
    ...state,
    planets,
    contributions: [
      { planetId, victory: true, difficulty, date: Date.now() },
      ...state.contributions,
    ].slice(0, 50),
  };
}

export function contributeDefeat(
  state: WarState,
  planetId: string,
  difficulty: number
): WarState {
  return {
    ...state,
    contributions: [
      { planetId, victory: false, difficulty, date: Date.now() },
      ...state.contributions,
    ].slice(0, 50),
  };
}

export function listPlanets(state: WarState): PlanetState[] {
  return Object.values(state.planets);
}

export function getMajorOrderProgress(state: WarState): {
  liberated: number;
  total: number;
  pct: number;
  hoursRemaining: number;
} | null {
  if (!state.majorOrder) return null;
  const order = state.majorOrder;
  const targetIds =
    order.targetPlanetIds.length > 0
      ? order.targetPlanetIds
      : Object.keys(state.planets);
  const targets = targetIds.map((id) => state.planets[id]).filter(Boolean);
  const liberated = targets.filter((p) => p.liberation >= 100).length;
  const total = order.targetPlanetIds.length || 4;
  const pct = (liberated / total) * 100;
  const elapsed = (Date.now() - order.startedAt) / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, order.durationHours - elapsed);
  return { liberated, total, pct, hoursRemaining };
}

const HELLDIVER_NAMES = [
  "Helldiver_5421", "DemocracyOfficer", "Eagle-1", "SES_Star_of_Iron",
  "FreedomFist", "Patriot_77", "BugStomper", "AutomatonHunter",
  "DivePilot", "Captain_Liberty", "Major_Order", "Reinforcement_88",
  "Helldiver_Alpha", "Helldiver_Bravo", "ThePunisher", "VanguardSix",
];

const VICTORY_VERBS = ["liberated", "secured", "purged", "scoured", "extracted from", "neutralized"];
const DEATH_VERBS = ["KIA at", "extracted under fire from", "lost on", "depleted reinforcements at"];
const KILL_PHRASES = [
  "crit a Bile Titan with Eagle 500kg",
  "called in 3 sentries simultaneously",
  "completed a Helldive on D9",
  "earned the Iron Sword medal",
  "achieved 100% objective rate",
  "dropped a Hellbomb on a Factory Strider",
  "soloed a Crescent Monolith",
  "executed a perfect stratagem combo",
  "liberated 5 nodes in record time",
];

export function generateActivity(planets: PlanetState[]): string {
  const r = Math.random();
  const name = HELLDIVER_NAMES[Math.floor(Math.random() * HELLDIVER_NAMES.length)];
  if (planets.length === 0) return `${name} reporting for duty.`;
  const planet = planets[Math.floor(Math.random() * planets.length)];
  const diff = 1 + Math.floor(Math.random() * 10);
  if (r < 0.55) {
    const verb = VICTORY_VERBS[Math.floor(Math.random() * VICTORY_VERBS.length)];
    return `${name} ${verb} ${planet.name.toUpperCase()} (D${diff})`;
  } else if (r < 0.85) {
    const verb = DEATH_VERBS[Math.floor(Math.random() * DEATH_VERBS.length)];
    return `${name} ${verb} ${planet.name.toUpperCase()} (D${diff})`;
  } else {
    return `${name} — ${KILL_PHRASES[Math.floor(Math.random() * KILL_PHRASES.length)]}`;
  }
}

export function resetWar(): WarState {
  const fresh = defaultWarState();
  saveWarState(fresh);
  return fresh;
}
