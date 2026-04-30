import type { MissionObjective } from "./types";

interface ObjectiveTemplate {
  id: string;
  description: (target: number) => string;
  rewardMedals: number;
  kind: MissionObjective["kind"];
  target: number;
}

export const OBJECTIVE_POOL: ObjectiveTemplate[] = [
  {
    id: "kill_elites",
    description: (n) => `Eliminate ${n} elite enemies`,
    rewardMedals: 150,
    kind: "kill_elites",
    target: 2,
  },
  {
    id: "deal_damage_in_turn",
    description: (n) => `Deal ${n}+ damage in a single turn`,
    rewardMedals: 100,
    kind: "deal_damage_in_turn",
    target: 50,
  },
  {
    id: "high_hp_finish",
    description: (n) => `End boss combat with ≥${n}% max HP`,
    rewardMedals: 200,
    kind: "high_hp_finish",
    target: 50,
  },
  {
    id: "no_exhaust",
    description: () => `Complete mission with 0 exhausted cards`,
    rewardMedals: 120,
    kind: "no_exhaust",
    target: 0,
  },
  {
    id: "win_in_turns",
    description: (n) => `Beat the boss in ≤${n} turns`,
    rewardMedals: 250,
    kind: "win_in_turns",
    target: 6,
  },
  {
    id: "no_block_used",
    description: () => `Win mission without gaining any Block`,
    rewardMedals: 180,
    kind: "no_block_used",
    target: 0,
  },
  {
    id: "complete_events",
    description: (n) => `Resolve ${n} choice events`,
    rewardMedals: 100,
    kind: "complete_events",
    target: 2,
  },
];

export function rollObjectives(count = 2): MissionObjective[] {
  const pool = [...OBJECTIVE_POOL];
  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((t) => ({
    id: t.id,
    description: t.description(t.target),
    rewardMedals: t.rewardMedals,
    kind: t.kind,
    target: t.target,
    progress: 0,
    completed: false,
  }));
}

/** Helper: try to mark progress on an objective by kind. Returns updated objectives. */
export function bumpObjective(
  list: MissionObjective[],
  kind: MissionObjective["kind"],
  amount: number = 1
): MissionObjective[] {
  return list.map((o) => {
    if (o.kind !== kind || o.completed) return o;
    const progress = o.progress + amount;
    return {
      ...o,
      progress,
      completed: progress >= o.target,
    };
  });
}

/** Set a value (for objectives that track a max-of, e.g. damage in turn). */
export function setObjective(
  list: MissionObjective[],
  kind: MissionObjective["kind"],
  value: number
): MissionObjective[] {
  return list.map((o) => {
    if (o.kind !== kind || o.completed) return o;
    const progress = Math.max(o.progress, value);
    return {
      ...o,
      progress,
      completed: progress >= o.target,
    };
  });
}

/** Compute total bonus medals from completed objectives. */
export function objectiveBonus(list: MissionObjective[]): number {
  return list.filter((o) => o.completed).reduce((sum, o) => sum + o.rewardMedals, 0);
}
