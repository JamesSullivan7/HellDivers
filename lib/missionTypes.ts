import type { Faction } from "./types";

export type MissionType =
  | "eliminate_target"
  | "eradicate"
  | "sabotage"
  | "geological_survey";

export interface MissionTypeSpec {
  id: MissionType;
  /** Codename shown on the map header (e.g. "OPERATION IRONCLAD"). */
  codename: (faction: Faction) => string;
  /** Short human label ("Eliminate Target"). */
  label: string;
  /** Brief HUD description for the war/map header. */
  briefing: string;
  /** Bonus reward applied at run finalize on victory. */
  bonus: {
    /** Flat bonus medals on victory. */
    medals?: number;
    /** Multiplier applied to common samples on victory. */
    samplesMul?: number;
    /** Bonus rare samples on victory. */
    rareSamples?: number;
    /** Bonus super samples on victory. */
    superSamples?: number;
  };
  /**
   * Tree generation weighting overrides. The mission tree applies these as
   * additive nudges to the base tier weights.
   */
  treeWeightDelta: {
    elite?: number;
    event?: number;
    rest?: number;
    combat?: number;
    shop?: number;
  };
}

/** Generate a faction-flavored codename for the mission. */
const TERMINID_NAMES = ["IRONCLAD", "BUG STOMP", "EASTERN PURGE", "HIVE BREAKER", "PHEROMONE TRAIL"];
const AUTOMATON_NAMES = ["IRON SWORD", "STEEL DRIVE", "FORGE BREAKER", "RUST CLEANSE", "CIRCUIT KILL"];
const ILLUMINATE_NAMES = ["VOID HUNT", "SHADOW PURGE", "MIND WAR", "OBELISK FALL", "PHASE STORM"];

function pickName(faction: Faction): string {
  const pool =
    faction === "terminid" ? TERMINID_NAMES :
    faction === "automaton" ? AUTOMATON_NAMES :
    ILLUMINATE_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const MISSION_TYPES: Record<MissionType, MissionTypeSpec> = {
  eliminate_target: {
    id: "eliminate_target",
    codename: (f) => `OPERATION ${pickName(f)}`,
    label: "Eliminate Target",
    briefing:
      "Primary objective: locate and neutralize the high-value target. Standard combat operation.",
    bonus: { medals: 150 },
    treeWeightDelta: {},
  },
  eradicate: {
    id: "eradicate",
    codename: (f) => `ERADICATE · ${pickName(f)}`,
    label: "Eradicate",
    briefing:
      "Cleanse all elite hostiles in the sector. Expect heavy resistance — extra elites in the field.",
    bonus: { medals: 250 },
    treeWeightDelta: { elite: 0.2, event: -0.1 },
  },
  sabotage: {
    id: "sabotage",
    codename: (f) => `SABOTAGE · ${pickName(f)}`,
    label: "Sabotage",
    briefing:
      "Disrupt enemy infrastructure. Heavier elite presence, denser combat. Light contact between objectives.",
    bonus: { medals: 200, rareSamples: 2 },
    treeWeightDelta: { elite: 0.15, combat: 0.1, rest: -0.05 },
  },
  geological_survey: {
    id: "geological_survey",
    codename: (f) => `GEOLOGICAL SURVEY · ${pickName(f)}`,
    label: "Geological Survey",
    briefing:
      "Sample collection mission. Lighter combat. The sector is rich with rare samples — bring them home.",
    bonus: { samplesMul: 2, rareSamples: 4, superSamples: 1 },
    treeWeightDelta: { rest: 0.1, event: 0.15, elite: -0.15, combat: -0.1 },
  },
};

/** Pick a mission type with weighted random distribution. */
export function rollMissionType(): MissionType {
  const r = Math.random();
  if (r < 0.40) return "eliminate_target";
  if (r < 0.70) return "eradicate";
  if (r < 0.88) return "sabotage";
  return "geological_survey";
}

/** Apply a mission's bonus to a base reward object. */
export function applyMissionBonus(
  reward: { medals: number; samples: number; rareSamples: number; superSamples: number },
  type: MissionType,
  victory: boolean
) {
  if (!victory) return reward;
  const spec = MISSION_TYPES[type];
  const out = { ...reward };
  if (spec.bonus.medals) out.medals += spec.bonus.medals;
  if (spec.bonus.samplesMul) out.samples = Math.round(out.samples * spec.bonus.samplesMul);
  if (spec.bonus.rareSamples) out.rareSamples += spec.bonus.rareSamples;
  if (spec.bonus.superSamples) out.superSamples += spec.bonus.superSamples;
  return out;
}
