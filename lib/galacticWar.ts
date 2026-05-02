import { Faction } from "./types";

const WAR_KEY = "helldivers_war_v3_solo";

/**
 * SOLO WAR TUNING
 * ---------------
 * The galactic war runs entirely from this player's localStorage. No live
 * server, no leaderboard, no community decay. A single Helldiver can liberate
 * the galaxy by themselves over a few sessions of play.
 *
 * Liberation gain per victory: ~12-32% scaling with difficulty.
 * Decay: zero — planets stay where the player left them.
 * Major Orders: persist until completed; no time expiry.
 */
const SOLO_LIBERATION_BASE = 12;
const SOLO_LIBERATION_PER_DIFFICULTY = 2;
const SOLO_DECAY_PER_HOUR = 0;
const SOLO_INITIAL_LIBERATION_MIN = 0;
const SOLO_INITIAL_LIBERATION_MAX = 12;

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
  /** Solo: this is informational only; orders persist until completed. */
  durationHours: number;
}

export interface WarState {
  planets: Record<string, PlanetState>;
  majorOrder: MajorOrder | null;
  lastTick: number;
  contributions: { planetId: string; victory: boolean; difficulty: number; date: number }[];
  /** Solo: track completed Major Order ids so we don't repeat them. */
  completedOrderIds: string[];
  /** Solo: total medals earned from completed Major Orders (informational). */
  ordersClaimedMedals: number;
}

const PLANETS_DATA: Omit<PlanetState, "liberation" | "baseLiberators" | "decayPerHour">[] = [
  // ── TERMINID — Eastern bug worlds ──
  { id: "phact_bay", name: "Phact Bay", faction: "terminid", sector: "Jin Xi", biome: "Sandy Mesa" },
  { id: "gemstone_bluffs", name: "Gemstone Bluffs", faction: "terminid", sector: "L'estrade", biome: "Grassland" },
  { id: "omicron", name: "Omicron", faction: "terminid", sector: "L'estrade", biome: "Tundra" },
  { id: "nabatea_secundus", name: "Nabatea Secundus", faction: "terminid", sector: "L'estrade", biome: "Swamp" },
  { id: "nivel_43", name: "Nivel 43", faction: "terminid", sector: "Mirin", biome: "Ashland" },
  { id: "zagon_prime", name: "Zagon Prime", faction: "terminid", sector: "Mirin", biome: "Sandy Mesa" },
  { id: "azterra", name: "Azterra", faction: "terminid", sector: "Orion", biome: "Copper Desert" },
  { id: "terrek", name: "Terrek", faction: "terminid", sector: "Orion", biome: "Barren Moon" },
  { id: "cirrus", name: "Cirrus", faction: "terminid", sector: "Orion", biome: "Ashland" },

  // ── AUTOMATON — Western bot strongholds ──
  { id: "choohe", name: "Choohe", faction: "automaton", sector: "Lacaille", biome: "Sandy Mesa" },
  { id: "yed_prior", name: "Yed Prior", faction: "automaton", sector: "Tanis", biome: "Ionized Grassland" },
  { id: "clasa", name: "Clasa", faction: "automaton", sector: "Tanis", biome: "Swamp" },
  { id: "zefia", name: "Zefia", faction: "automaton", sector: "Tanis", biome: "Ethereal Jungle" },
  { id: "demiurg", name: "Demiurg", faction: "automaton", sector: "Tanis", biome: "Tundra" },

  // ── ILLUMINATE — Recent invasion sectors ──
  { id: "myrium", name: "Myrium", faction: "illuminate", sector: "Morgon", biome: "Copper Desert" },
  { id: "hydrobius", name: "Hydrobius", faction: "illuminate", sector: "Omega", biome: "Quake Desert" },
  { id: "setia", name: "Setia", faction: "illuminate", sector: "Omega", biome: "Foggy Swamp" },
  { id: "senge_23", name: "Senge 23", faction: "illuminate", sector: "Omega", biome: "Copper Desert" },
  { id: "parsh", name: "Parsh", faction: "illuminate", sector: "Rictus", biome: "Swamp" },
  { id: "kerth_secundus", name: "Kerth Secundus", faction: "illuminate", sector: "Rictus", biome: "Tundra" },
  { id: "grafmere", name: "Grafmere", faction: "illuminate", sector: "Rictus", biome: "Frozen Boneyard" },
  { id: "genesis_prime", name: "Genesis Prime", faction: "illuminate", sector: "Rictus", biome: "Shadowed Jungle" },
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
    // Solo: planets start near-occupied so the player has something to liberate.
    const lib =
      SOLO_INITIAL_LIBERATION_MIN +
      Math.random() * (SOLO_INITIAL_LIBERATION_MAX - SOLO_INITIAL_LIBERATION_MIN);
    planets[p.id] = {
      ...p,
      decayPerHour: SOLO_DECAY_PER_HOUR,
      liberation: lib,
      // Solo: just the player
      baseLiberators: 1,
    };
  });
  const orderTemplate = MAJOR_ORDERS[Math.floor(Math.random() * MAJOR_ORDERS.length)];
  return {
    planets,
    majorOrder: { ...orderTemplate, startedAt: Date.now() },
    lastTick: Date.now(),
    contributions: [],
    completedOrderIds: [],
    ordersClaimedMedals: 0,
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
    // Defensive: backfill new solo fields on older saves
    if (!parsed.completedOrderIds) parsed.completedOrderIds = [];
    if (parsed.ordersClaimedMedals === undefined) parsed.ordersClaimedMedals = 0;
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
  // Solo: no decay, no Major Order expiry. The orders persist until the
  // player completes them. The only thing this function does now is keep
  // the timestamp fresh so future logic can hook in.
  return { ...state, lastTick: Date.now() };
}

export function contributeVictory(
  state: WarState,
  planetId: string,
  difficulty: number
): WarState {
  const p = state.planets[planetId];
  if (!p) return state;
  // Solo tuning: a single victory liberates a meaningful chunk.
  // D1 ≈ 14%, D5 ≈ 22%, D10 ≈ 32% — 4-5 wins per planet at mid difficulty.
  const boost = SOLO_LIBERATION_BASE + difficulty * SOLO_LIBERATION_PER_DIFFICULTY;
  const newLib = Math.min(100, p.liberation + boost);
  const planets = {
    ...state.planets,
    [planetId]: { ...p, liberation: newLib },
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
  complete: boolean;
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
  // Solo: time is informational. The order doesn't expire.
  const elapsed = (Date.now() - order.startedAt) / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, order.durationHours - elapsed);
  return { liberated, total, pct, hoursRemaining, complete: liberated >= total };
}

/**
 * If the current Major Order is complete, mark it claimed, return the medal
 * payout, and roll a fresh order from the unused pool. Idempotent: calling
 * twice without progress is a no-op.
 *
 * Returns { state, medalsAwarded }.
 */
export function claimMajorOrderIfComplete(
  state: WarState
): { state: WarState; medalsAwarded: number } {
  if (!state.majorOrder) return { state, medalsAwarded: 0 };
  const progress = getMajorOrderProgress(state);
  if (!progress?.complete) return { state, medalsAwarded: 0 };

  const claimedId = state.majorOrder.id;
  const completedOrderIds = [...state.completedOrderIds, claimedId];
  const medalsAwarded = state.majorOrder.rewardMedals;

  // Pick next uncompleted order, or fall back to a random one if all done.
  const remaining = MAJOR_ORDERS.filter((o) => !completedOrderIds.includes(o.id));
  const nextTemplate = remaining.length > 0
    ? remaining[Math.floor(Math.random() * remaining.length)]
    : null;

  return {
    state: {
      ...state,
      completedOrderIds,
      ordersClaimedMedals: state.ordersClaimedMedals + medalsAwarded,
      majorOrder: nextTemplate
        ? { ...nextTemplate, startedAt: Date.now() }
        : null,
    },
    medalsAwarded,
  };
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
  "soloed a Leviathan",
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
