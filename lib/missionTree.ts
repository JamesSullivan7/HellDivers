import type { Faction, MapNode, NodeType } from "./types";
import { mulberry32 } from "@/game/engine/pure";
import { rollNodeFlavor } from "./nodeFlavor";
import { hashString } from "./seededRng";

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
  // tier 1 — 3 entry combat choices, route entrance
  { count: 3, weights: { combat: 1 } },
  // tier 2 — mid options: combat / event / cache / signal / shop
  { count: 3, weights: { combat: 0.40, event: 0.25, cache: 0.10, signal: 0.10, shop: 0.10, hazard: 0.05 } },
  // tier 3 — first hard tier with elite + hazard pressure
  { count: 3, weights: { elite: 0.30, event: 0.20, rest: 0.13, combat: 0.13, cache: 0.07, hazard: 0.10, signal: 0.04, shop: 0.03 } },
  // tier 4 — pre-boss
  { count: 3, weights: { rest: 0.25, elite: 0.22, event: 0.18, shop: 0.13, combat: 0.10, cache: 0.07, hazard: 0.05 } },
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
    ["dragonroach", "scavenger"],
    ["dragonroach", "hunter", "hunter"],
  ],
  automaton: [
    ["trooper", "trooper"],
    ["trooper", "raider"],
    ["raider", "raider"],
    ["raider", "raider", "trooper"],
    ["devastator", "raider"],
    ["berserker", "trooper"],
    ["devastator", "berserker"],
    ["scout_strider", "trooper"],
    ["scout_strider", "raider", "trooper"],
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
    ["impaler"],
    ["impaler", "hunter"],
  ],
  automaton: [
    ["devastator", "trooper"],
    ["hulk"],
    ["devastator", "berserker"],
    ["tank"],
    ["tank", "trooper"],
  ],
  illuminate: [
    ["overseer"],
    ["elevated_overseer"],
    ["harvester"],
    ["leviathan"],
    ["leviathan", "voteless"],
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
  cache?: number;
  hazard?: number;
  signal?: number;
}

export function generateTree(
  faction: Faction,
  modifiers: string[] = [],
  weightDelta: TreeWeightDelta = {},
  seed?: string,
): MapNode[] {
  // Deterministic when a seed is supplied (replayable runs).
  // Falls back to Date.now() for legacy callers / tooling.
  const seedInt = seed ? hashString(`${seed}::tree`) : Date.now() & 0xffffffff;
  const rng = mulberry32(seedInt);
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

  // Tier-1 nodes get distinct path identities — drives the per-route feel.
  // We assign one of each (safe / aggressive / unknown) to the three tier-1 columns,
  // shuffled so the column-tag mapping varies per run.
  const PATH_TAG_DECK: ("safe" | "aggressive" | "unknown")[] = ["safe", "aggressive", "unknown"];
  // Fisher-Yates shuffle
  for (let i = PATH_TAG_DECK.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [PATH_TAG_DECK[i], PATH_TAG_DECK[j]] = [PATH_TAG_DECK[j], PATH_TAG_DECK[i]];
  }

  ROUTE.forEach((spec, tier) => {
    const tierNodes: MapNode[] = [];
    for (let col = 0; col < spec.count; col++) {
      // ── Per-tier-1 path identity drives the type weights for the
      // SAFE = +rest/+cache, AGGRESSIVE = +elite/+hazard, UNKNOWN = +signal/+hidden visibility
      let weights = spec.weights;
      let pathTag: import("./types").PathTag | undefined;
      if (tier >= 1 && tier < ROUTE.length - 1) {
        pathTag = PATH_TAG_DECK[col % PATH_TAG_DECK.length];
        if (pathTag === "safe") {
          weights = applyTagWeights(weights, { rest: 0.10, cache: 0.10, elite: -0.15, hazard: -0.05 });
        } else if (pathTag === "aggressive") {
          weights = applyTagWeights(weights, { elite: 0.15, hazard: 0.10, rest: -0.10 });
        } else if (pathTag === "unknown") {
          weights = applyTagWeights(weights, { signal: 0.10, event: 0.05 });
        }
      }

      const type: NodeType =
        tier === 0
          ? "combat"
          : tier === ROUTE.length - 1
            ? "boss"
            : pickType(weights);

      let enemies: string[] = [];
      let eventId: string | undefined;
      let payload: MapNode["payload"];
      let revealRadius: number | undefined;

      if (type === "combat") {
        enemies = [...pickEnemy(FACTION_COMBAT_POOLS[faction])];
        if (extraFiller) enemies.push(FACTION_FILLER[faction]);
      } else if (type === "elite") {
        enemies = [...pickEnemy(FACTION_ELITE_POOLS[faction])];
      } else if (type === "boss") {
        enemies = [FACTION_BOSS[faction]];
      } else if (type === "event") {
        eventId = pickEvent();
      } else if (type === "cache") {
        // Stash node — small medal/sample/req drop on enter
        const roll = rng();
        if (roll < 0.5) payload = { medals: 60 + Math.floor(rng() * 60) };
        else if (roll < 0.85) payload = { samples: 1 + Math.floor(rng() * 3) };
        else payload = { requisition: 20 + Math.floor(rng() * 30) };
      } else if (type === "hazard") {
        // Hazard node — small HP penalty + may add a run modifier
        const roll = rng();
        if (roll < 0.6) payload = { hpDelta: -(4 + Math.floor(rng() * 6)) };
        else payload = { hpDelta: -3, runModifierId: "vent_burned" };
      } else if (type === "signal") {
        // Signal — reveals nearby tiers
        revealRadius = 1 + Math.floor(rng() * 2); // 1–2 tiers
      }

      // Visibility: tier 0/1 always visible. Tier 2+ has chance of being partial,
      // tier 3+ has chance of being hidden — biased by path tag.
      let visibility: import("./types").NodeVisibility = "visible";
      if (tier >= 2 && type !== "boss") {
        const r = rng();
        const isUnknownPath = pathTag === "unknown";
        const partialChance = isUnknownPath ? 0.45 : 0.20;
        const hiddenChance = isUnknownPath ? 0.20 : 0.05;
        if (tier >= 3 && r < hiddenChance) visibility = "hidden";
        else if (r < partialChance) visibility = "partial";
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
        visibility,
        pathTag,
        revealRadius,
        payload,
      });
    }
    tiers.push(tierNodes);
  });

  // Path-tag inheritance — children that descend primarily from one tier-1 column
  // adopt that column's tag (used for danger-meter rollups in the UI).
  // We do this lazily after edges are wired — see below.

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

  // Path-tag propagation: each node inherits the most common pathTag from its
  // parent(s). This enables route-aware UI rollups (Danger Meter etc.).
  // Walk tier 2..N-1; tier 0/1 already set.
  for (let t = 2; t < tiers.length; t++) {
    tiers[t].forEach((node) => {
      if (node.pathTag) return;
      // Find parents — any node in the previous tier whose children include this index.
      const parents = tiers[t - 1].filter((p) => p.children.includes(node.index));
      const tagVotes: Record<string, number> = {};
      parents.forEach((p) => {
        if (p.pathTag) tagVotes[p.pathTag] = (tagVotes[p.pathTag] ?? 0) + 1;
      });
      const winner = Object.entries(tagVotes).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (winner) node.pathTag = winner as import("./types").PathTag;
    });
  }

  return tiers.flat();
}

/** Apply additive deltas to a weights object, clamping at 0. */
function applyTagWeights(
  base: Partial<Record<NodeType, number>>,
  delta: Partial<Record<NodeType, number>>,
): Partial<Record<NodeType, number>> {
  const out: Partial<Record<NodeType, number>> = { ...base };
  (Object.keys(delta) as NodeType[]).forEach((k) => {
    out[k] = Math.max(0, (out[k] ?? 0) + (delta[k] ?? 0));
  });
  return out;
}

/**
 * Mutates the nodes array — when called from a Signal node, all nodes within
 * `radius` tiers ahead get their visibility upgraded one step (hidden→partial,
 * partial→visible). Safe to call multiple times.
 */
export function revealNearbyNodes(nodes: MapNode[], fromIndex: number, radius: number = 1): MapNode[] {
  const from = nodes[fromIndex];
  if (!from) return nodes;
  return nodes.map((n) => {
    if (n.index === from.index) return n;
    const tierDelta = n.tier - from.tier;
    if (tierDelta <= 0 || tierDelta > radius) return n;
    if (n.visibility === "hidden") return { ...n, visibility: "partial" as const };
    if (n.visibility === "partial") return { ...n, visibility: "visible" as const };
    return n;
  });
}

/** Mutates: marks specific nodes visible (used by event-based reveals). */
export function revealSpecificNodes(nodes: MapNode[], indices: number[]): MapNode[] {
  const set = new Set(indices);
  return nodes.map((n) =>
    set.has(n.index) ? { ...n, visibility: "visible" as const } : n
  );
}

/** Mutates: dim a path branch (used by path-lock map modifiers). */
export function lockNodeChildren(nodes: MapNode[], fromIndex: number): MapNode[] {
  const from = nodes[fromIndex];
  if (!from) return nodes;
  return nodes.map((n) =>
    from.children.includes(n.index) ? { ...n, cleared: true } : n
  );
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
  weightDelta: TreeWeightDelta = {},
  seed?: string,
): MissionTree {
  const nodes = generateTree(faction, modifiers, weightDelta, seed);
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
