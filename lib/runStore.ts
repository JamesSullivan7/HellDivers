/**
 * RUN STORE
 * ──────────────────────────────────────────────────────────────────────
 * Run-scoped Zustand store. Lives alongside useGame (the authoritative
 * gameplay store) but holds metadata that doesn't belong in the engine:
 *
 *   - runId, seed, identity, generated timestamp
 *   - faction pressure (per-faction 0–100)
 *   - active mission modifiers (already rolled by lib/modifiers.ts)
 *   - reward + encounter history per run
 *
 * Reset on run start / run end.
 */

import { create } from "zustand";
import type { RunIdentity } from "./runIdentity";

export interface FactionPressure {
  terminids: number;
  automatons: number;
  illuminate: number;
}

export interface RewardHistoryEntry {
  at: number;
  source: "combat" | "cache" | "event" | "objective" | "boss";
  description: string;
  /** Currency deltas if applicable. */
  medals?: number;
  samples?: number;
  requisition?: number;
  /** New card added, if applicable. */
  cardId?: string;
}

export interface EncounterHistoryEntry {
  at: number;
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
}

export type MissionLength = "short" | "standard" | "long";

interface RunState {
  /** Stable id for this run (different from seed — seed regenerates same map; runId is unique per run). */
  runId: string | null;
  /** String seed used to generate the map. */
  seed: string | null;
  /** Wall-clock when the run started. */
  generatedAt: number | null;
  /** Selected run identity — drives banner + flavor + biases. */
  identity: RunIdentity | null;
  /** Faction pressure 0–100 each. Affects future spawns and event flavor. */
  factionPressure: FactionPressure;
  /** Mission length — drives # of tiers in the map (future expansion). */
  missionLength: MissionLength;
  /** Recorded rewards earned this run. */
  rewardHistory: RewardHistoryEntry[];
  /** Recorded encounter resolutions this run. */
  encounterHistory: EncounterHistoryEntry[];

  // Actions
  startRun: (args: {
    runId: string;
    seed: string;
    identity: RunIdentity;
    missionLength?: MissionLength;
  }) => void;
  updateFactionPressure: (
    faction: keyof FactionPressure,
    delta: number,
  ) => void;
  setFactionPressure: (next: Partial<FactionPressure>) => void;
  recordReward: (entry: Omit<RewardHistoryEntry, "at">) => void;
  recordEncounter: (entry: Omit<EncounterHistoryEntry, "at">) => void;
  endRun: () => void;
}

const ZERO_PRESSURE: FactionPressure = { terminids: 0, automatons: 0, illuminate: 0 };

function clampPressure(p: Partial<FactionPressure>, base: FactionPressure): FactionPressure {
  return {
    terminids: Math.max(0, Math.min(100, p.terminids ?? base.terminids)),
    automatons: Math.max(0, Math.min(100, p.automatons ?? base.automatons)),
    illuminate: Math.max(0, Math.min(100, p.illuminate ?? base.illuminate)),
  };
}

export const useRunStore = create<RunState>((set, get) => ({
  runId: null,
  seed: null,
  generatedAt: null,
  identity: null,
  factionPressure: ZERO_PRESSURE,
  missionLength: "standard",
  rewardHistory: [],
  encounterHistory: [],

  startRun: ({ runId, seed, identity, missionLength = "standard" }) =>
    set({
      runId,
      seed,
      generatedAt: Date.now(),
      identity,
      factionPressure: clampPressure(identity.startingPressure, ZERO_PRESSURE),
      missionLength,
      rewardHistory: [],
      encounterHistory: [],
    }),

  updateFactionPressure: (faction, delta) =>
    set((s) => ({
      factionPressure: clampPressure(
        { ...s.factionPressure, [faction]: s.factionPressure[faction] + delta },
        s.factionPressure,
      ),
    })),

  setFactionPressure: (next) =>
    set((s) => ({ factionPressure: clampPressure(next, s.factionPressure) })),

  recordReward: (entry) =>
    set((s) => ({
      rewardHistory: [{ ...entry, at: Date.now() }, ...s.rewardHistory].slice(0, 80),
    })),

  recordEncounter: (entry) =>
    set((s) => ({
      encounterHistory: [{ ...entry, at: Date.now() }, ...s.encounterHistory].slice(0, 60),
    })),

  endRun: () =>
    set({
      runId: null,
      seed: null,
      generatedAt: null,
      identity: null,
      factionPressure: ZERO_PRESSURE,
      rewardHistory: [],
      encounterHistory: [],
    }),
}));
