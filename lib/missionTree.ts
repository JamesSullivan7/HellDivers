import type { Faction, MapNode, NodeType } from "./types";
import { mulberry32 } from "@/game/engine/pure";
import { rollNodeFlavor } from "./nodeFlavor";

/**
 * Branching mission tree generator (Slay-the-Spire style).
 *
 * Layout:
 *   tier 0: 1 drop point (auto-cleared, hidden)
 *   tier 1: 3 combat nodes (entry choices)
 *   tier 2: 3 mixed (combat + event)
 *   tier 3: 3 mixed (elite + event + rest)
 *   tier 4: 3 mixed (rest + elite + event)
 *   tier 5: 1 boss
 *
 * Total: 14 nodes, ~6 visited per run.
 *
 * Nodes are stored flat in MapNode[] but each carries its tier, col, and
 * `children` (indices of next-tier nodes it connects to).
 */

interface TierSpec {
  count: number;
  /** Probability distribution per node slot. Sums to 1. */
  weights: Partial<Record<NodeType, number>>;
}

const ROUTE: TierSpec[] = [
  // tier 0 — drop (always combat for tutorial fight)
  { count: 1, weights: { combat: 1 } },
  // tier 1 — 3 entry combat choices
  { count: 3, weights: { combat: 1 } },
  // tier 2 — easier-mid options (chance for shop appearance)
  { count: 3, weights: { combat: 0.55, event: 0.35, shop: 0.1 } },
  // tier 3 — first hard tier
  { count: 3, weights: { elite: 0.35, event: 0.3, rest: 0.15, combat: 0.15, shop: 0.05 } },
  // tier 4 — pre-boss (rest, elite, shop most likely)
  { count: 3, weights: { rest: 0.3, elite: 0.25, event: 0.2, shop: 0.15, combat: 0.1 } },
  // tier 5 — boss
  { count: 1, weights: { boss: 1 } },
];

const FACTION_BOSS: Record<Faction, string> = {
  terminid: "bile_titan",
  automaton: "factory_strider",
  illuminate: "monolith",
};

const FACTION_FILLER: Record<Faction, string> = {
  terminid: "scavenger",
  automaton: "trooper",
  illuminate: "voteless",
};

const FACTION_COMBAT_POOLS: Record<Faction, string[][]> = {
  terminid: [
    ["scavenger", "scavenger"],
    ["scavenger", "hunter"],
    ["hunter", "hunter"],
    ["hunter", "hunter", "scavenger"],
    ["bile_spewer", "hunter"],
    ["brood_commander", "hunter"],
    ["stalker", "warrior"],
  ],
  automaton: [
    ["trooper", "trooper"],
    ["trooper", "raider"],
    ["raider", "raider"],
    ["raider", "raider", "trooper"],
    ["devastator", "raider"],
    ["berserker", "trooper"],
    ["devastator", "berserker"],
  ],
  illuminate: [
    ["voteless", "voteless"],
    ["voteless", "watcher"],
    ["watcher", "voteless", "voteless"],
    ["overseer", "voteless"],
    ["watcher", "watcher", "voteless"],
    ["harvester"],
  ],
};

const FACTION_ELITE_POOLS: Record<Faction, string[][]> = {
  terminid: [
    ["warrior", "scavenger"],
    ["charger"],
    ["brood_commander", "warrior"],
  ],
  automaton: [
    ["devastator", "trooper"],
    ["hulk"],
    ["devastator", "berserker"],
  ],
  illuminate: [
    ["overseer"],
    ["elevated_overseer"],
    ["harvester"],
  ],
};

// Universal events (work for any faction)
const UNIVERSAL_EVENT_IDS = [
  "civilian_truck",
  "dem_officer",
  "stim_cache",
  "sos_beacon",
  "patrol_warning",
];

// Faction-themed events. Mixed in with universals on a faction-matched run.
const FACTION_EVENT_IDS: Record<Faction, string[]> = {
  terminid: ["acidic_vent", "spore_field", "bug_breach", "bug_carcass"],
  automaton: ["eagle_pilot_down", "stratagem_cache", "derelict_factory", "scrap_dealer", "jammer_tower"],
  illuminate: ["void_rift", "obelisk_resonance", "voteless_shrine"],
};

export interface TreeWeightDelta {
  elite?: number;
  event?: number;
  rest?: number;
  combat?: number;
  shop?: number;
}

export function generateTree(
  faction: Faction,
  modifiers: string[] = [],
  weightDelta: TreeWeightDelta = {}
): MapNode[] {
  // Lightly seeded by Date.now() for variety; not deterministic across reloads.
  const rng = mulberry32(Date.now() & 0xffffffff);
  const usedEvents = new Set<string>();

  const pickEnemy = (pool: string[][]) =>
    pool[Math.floor(rng() * pool.length)];

  const pickType = (weights: Partial<Record<NodeType, number>>): NodeType => {
    // Apply mission-type weight delta — additive on top of tier base weights,
    // clamped at 0 so a strong negative doesn't flip into negative probability.
    const adjusted: Partial<Record<NodeType, number>> = {};
    (Object.keys(weights) as NodeType[]).forEach((k) => {
      const base = weights[k] ?? 0;
      const delta = (weightDelta as any)[k] ?? 0;
      adjusted[k] = Math.max(0, base + delta);
    });
    const total = Object.values(adjusted).reduce((a: number, b) => a + (b ?? 0), 0);
    if (total <= 0) return "combat";
    let r = rng() * total;
    for (const [type, w] of Object.entries(adjusted) as [NodeType, number][]) {
      r -= w;
      if (r <= 0) return type;
    }
    return "combat";
  };

  const pickEvent = () => {
    // Build a weighted pool: universals + faction-themed events for this run.
    // Faction events appear ~2× as often as universals on their home faction
    // by being added to the pool twice.
    const factionEvents = FACTION_EVENT_IDS[faction] ?? [];
    const pool: string[] = [
      ...UNIVERSAL_EVENT_IDS,
      ...factionEvents,
      ...factionEvents, // double-weight faction-themed
    ];
    const remaining = pool.filter((id) => !usedEvents.has(id));
    const id = remaining.length > 0
      ? remaining[Math.floor(rng() * remaining.length)]
      : pool[Math.floor(rng() * pool.length)];
    usedEvents.add(id);
    return id;
  };

  // Apply patrol_frequency: bump filler enemy in combat lists
  const extraFiller = modifiers.includes("patrol_frequency");

  // Build flat nodes per tier
  const tiers: MapNode[][] = [];
  let nodeIndex = 0;

  ROUTE.forEach((spec, tier) => {
    const tierNodes: MapNode[] = [];
    for (let col = 0; col < spec.count; col++) {
      const type =
        tier === 0
          ? "combat"
          : tier === ROUTE.length - 1
            ? "boss"
            : pickType(spec.weights);

      let enemies: string[] = [];
      let eventId: string | undefined;

      if (type === "combat") {
        enemies = [...pickEnemy(FACTION_COMBAT_POOLS[faction])];
        if (extraFiller) enemies.push(FACTION_FILLER[faction]);
      } else if (type === "elite") {
        enemies = [...pickEnemy(FACTION_ELITE_POOLS[faction])];
      } else if (type === "boss") {
        enemies = [FACTION_BOSS[faction]];
      } else if (type === "event") {
        eventId = pickEvent();
      }

      tierNodes.push({
        index: nodeIndex++,
        tier,
        col,
        type,
        enemyTemplateIds: enemies,
        eventId,
        children: [],
        cleared: tier === 0, // drop point starts cleared
        flavor: tier === 0 ? undefined : rollNodeFlavor(type, faction),
      });
    }
    tiers.push(tierNodes);
  });

  // Wire edges between adjacent tiers
  for (let t = 0; t < tiers.length - 1; t++) {
    const cur = tiers[t];
    const next = tiers[t + 1];

    cur.forEach((node, i) => {
      // Each node connects to 1–2 adjacent next-tier nodes.
      const connections = new Set<number>();
      // Always connect to the same column if possible
      const same = next[Math.min(i, next.length - 1)];
      if (same) connections.add(same.index);
      // Add a neighbor with bias toward i±1
      const offset = rng() < 0.5 ? -1 : 1;
      const neighborCol = Math.max(0, Math.min(next.length - 1, i + offset));
      const neighbor = next[neighborCol];
      if (neighbor) connections.add(neighbor.index);
      node.children = [...connections].sort((a, b) => a - b);
    });

    // Ensure every next-tier node is reachable from at least one current-tier node.
    next.forEach((nNode) => {
      const reachable = cur.some((c) => c.children.includes(nNode.index));
      if (!reachable) {
        // Link the closest current-tier node by column to this orphan.
        const closest = cur.reduce((best, c) =>
          Math.abs(c.col - nNode.col) < Math.abs(best.col - nNode.col) ? c : best
        );
        closest.children = [...new Set([...closest.children, nNode.index])].sort((a, b) => a - b);
      }
    });
  }

  return tiers.flat();
}

export interface MissionTree {
  nodes: MapNode[];
  /** Index of the drop / starting node (tier 0). */
  rootIndex: number;
  /** Index of the boss node (last tier). */
  bossIndex: number;
}

export function buildMissionTree(
  faction: Faction,
  modifiers: string[] = [],
  weightDelta: TreeWeightDelta = {}
): MissionTree {
  const nodes = generateTree(faction, modifiers, weightDelta);
  const rootIndex = nodes.find((n) => n.tier === 0)!.index;
  const bossIndex = nodes.find((n) => n.type === "boss")!.index;
  return { nodes, rootIndex, bossIndex };
}

/** Indices of nodes the player can move to from the current position. */
export function reachableFrom(nodes: MapNode[], currentIndex: number): number[] {
  const cur = nodes[currentIndex];
  if (!cur) return [];
  return cur.children.filter((i) => nodes[i] && !nodes[i].cleared);
}
