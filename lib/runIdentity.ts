/**
 * RUN IDENTITY SYSTEM
 * ──────────────────────────────────────────────────────────────────────
 * High-level "what kind of run is this" tag that biases:
 *   - encounter pool weights
 *   - node-type weights on the map generator
 *   - faction pressure starting values
 *   - mission flavor / banner text / sound profile
 *
 * Identities are SELECTED at run start by examining the chosen faction,
 * difficulty, mission type, and a seeded coin flip. Each run gets ONE
 * identity that drives the rest of the run.
 *
 * Identities don't replace mission types — they layer ABOVE them. So you
 * can have a "Terminid Infestation · Eradicate" run, where the identity
 * supplies world flavor and the mission type supplies the objective.
 */

import type { Faction } from "./types";
import type { TreeWeightDelta } from "./missionTree";
import { rngFromSeed, rngPickWeighted } from "./seededRng";

export type RunIdentityId =
  | "terminid_infestation"
  | "automaton_siege"
  | "illuminate_signal_hunt"
  | "mixed_emergency"
  | "hazard_planet"
  | "elite_suppression";

export interface RunIdentity {
  id: RunIdentityId;
  /** Display name shown on the map banner. */
  name: string;
  /** One-line briefing for the banner. */
  briefing: string;
  /** Single-glyph icon. */
  icon: string;
  /** UI accent color (CSS string). */
  accent: string;
  /** Weight bias added to the missionTree generator's node-type weights. */
  treeWeightDelta: TreeWeightDelta;
  /** Per-faction pressure to seed at run start (0–100). */
  startingPressure: { terminids: number; automatons: number; illuminate: number };
  /** Modifier IDs to *prefer* drawing for this identity (additive bias). */
  preferredModifiers?: string[];
  /** Tag describing the run's overall risk character. */
  riskFlavor: "balanced" | "high_risk" | "exploration" | "siege";
}

/**
 * Identity catalog. Add more here as content expands.
 * Tree weight deltas use the same shape as TreeWeightDelta in missionTree.ts.
 */
export const RUN_IDENTITIES: Record<RunIdentityId, RunIdentity> = {
  terminid_infestation: {
    id: "terminid_infestation",
    name: "Terminid Infestation",
    briefing: "The hive is awake. Multiple breeding sites detected — expect heavy pressure.",
    icon: "✦",
    accent: "#ff8a28",
    treeWeightDelta: { combat: 0.10, elite: 0.05 },
    startingPressure: { terminids: 50, automatons: 8, illuminate: 0 },
    preferredModifiers: ["patrol_frequency", "atmospheric_spores"],
    riskFlavor: "siege",
  },
  automaton_siege: {
    id: "automaton_siege",
    name: "Automaton Siege",
    briefing: "Mechanized columns are advancing. Reinforced units, jammer support.",
    icon: "⚙",
    accent: "#ff4d4d",
    treeWeightDelta: { elite: 0.15, combat: 0.05, rest: -0.05 },
    startingPressure: { terminids: 0, automatons: 55, illuminate: 8 },
    preferredModifiers: ["enemy_armor", "increased_air_sec"],
    riskFlavor: "high_risk",
  },
  illuminate_signal_hunt: {
    id: "illuminate_signal_hunt",
    name: "Illuminate Signal Hunt",
    briefing: "Anomalous signals across the sector. The unknown is advancing.",
    icon: "◈",
    accent: "#a78bfa",
    treeWeightDelta: { signal: 0.10, event: 0.05, combat: -0.05 },
    startingPressure: { terminids: 0, automatons: 0, illuminate: 60 },
    preferredModifiers: ["atmospheric_spores"],
    riskFlavor: "exploration",
  },
  mixed_emergency: {
    id: "mixed_emergency",
    name: "Mixed Faction Emergency",
    briefing: "Multiple factions converging. Expect chaos.",
    icon: "⚠",
    accent: "#f5c542",
    treeWeightDelta: { event: 0.05, combat: 0.05 },
    startingPressure: { terminids: 25, automatons: 25, illuminate: 25 },
    preferredModifiers: [],
    riskFlavor: "balanced",
  },
  hazard_planet: {
    id: "hazard_planet",
    name: "Hazard Planet Operation",
    briefing: "Volatile environment. Watch your atmospheric warnings.",
    icon: "☣",
    accent: "#a3e635",
    treeWeightDelta: { hazard: 0.15, rest: 0.05 },
    startingPressure: { terminids: 15, automatons: 15, illuminate: 15 },
    preferredModifiers: ["atmospheric_spores", "acidic_atmosphere"],
    riskFlavor: "high_risk",
  },
  elite_suppression: {
    id: "elite_suppression",
    name: "Elite Suppression Campaign",
    briefing: "High-value targets identified. Reinforced enemy presence on every front.",
    icon: "☠",
    accent: "#ff8a28",
    treeWeightDelta: { elite: 0.20, hazard: 0.05, rest: -0.05 },
    startingPressure: { terminids: 30, automatons: 30, illuminate: 30 },
    preferredModifiers: ["enemy_armor"],
    riskFlavor: "high_risk",
  },
};

/**
 * Select a run identity for the given context. Faction-matched identities
 * are heavily preferred, but the seed can pick a weirder option (e.g. a
 * Hazard Planet run on a Terminid sector) about 15-25% of the time.
 */
export function selectRunIdentity(
  faction: Faction,
  difficulty: number,
  seed: string
): RunIdentity {
  const rng = rngFromSeed(`${seed}::identity`);
  const candidates: { value: RunIdentityId; weight: number }[] = [];

  // Faction-matched primary identity always heavily weighted
  switch (faction) {
    case "terminid":
      candidates.push({ value: "terminid_infestation", weight: 60 });
      candidates.push({ value: "hazard_planet", weight: 15 });
      candidates.push({ value: "elite_suppression", weight: difficulty >= 6 ? 18 : 10 });
      candidates.push({ value: "mixed_emergency", weight: 8 });
      break;
    case "automaton":
      candidates.push({ value: "automaton_siege", weight: 60 });
      candidates.push({ value: "elite_suppression", weight: difficulty >= 6 ? 18 : 10 });
      candidates.push({ value: "mixed_emergency", weight: 10 });
      candidates.push({ value: "hazard_planet", weight: 8 });
      break;
    case "illuminate":
      candidates.push({ value: "illuminate_signal_hunt", weight: 55 });
      candidates.push({ value: "mixed_emergency", weight: 12 });
      candidates.push({ value: "elite_suppression", weight: difficulty >= 6 ? 18 : 10 });
      candidates.push({ value: "hazard_planet", weight: 10 });
      break;
  }

  const pick = rngPickWeighted(rng, candidates);
  return RUN_IDENTITIES[pick];
}
