import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  planets: defineTable({
    slug: v.string(),
    name: v.string(),
    faction: v.union(
      v.literal("terminid"),
      v.literal("automaton"),
      v.literal("illuminate")
    ),
    sector: v.string(),
    biome: v.optional(v.string()),
    liberation: v.number(),
    decayPerHour: v.number(),
    activeLiberators: v.number(),
    lastTick: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_faction", ["faction"]),

  contributions: defineTable({
    planetSlug: v.string(),
    planetName: v.string(),
    helldiverName: v.string(),
    victory: v.boolean(),
    difficulty: v.number(),
    nodesCleared: v.number(),
    squadCode: v.optional(v.string()),
  }).index("by_planet", ["planetSlug"]),

  majorOrder: defineTable({
    title: v.string(),
    briefing: v.string(),
    targetSlugs: v.array(v.string()),
    rewardMedals: v.number(),
    startedAt: v.number(),
    durationHours: v.number(),
    active: v.boolean(),
  }),

  leaderboard: defineTable({
    helldiverName: v.string(),
    victories: v.number(),
    bestDifficulty: v.number(),
    medalsTotal: v.number(),
  }).index("by_helldiver", ["helldiverName"]),

  squads: defineTable({
    code: v.string(),
    hostName: v.string(),
    status: v.union(
      v.literal("lobby"),
      v.literal("deployed"),
      v.literal("disbanded")
    ),
    members: v.array(
      v.object({
        name: v.string(),
        ready: v.boolean(),
        isOnline: v.boolean(),
        lastSeen: v.number(),
        currentPhase: v.string(), // "lobby" | "loadout" | "map" | "combat" | "victory" | "gameover"
        currentNode: v.number(),
        currentHp: v.number(),
        currentMaxHp: v.number(),
        kills: v.number(),
      })
    ),
    targetPlanetSlug: v.optional(v.string()),
    difficulty: v.number(),
    sharedKills: v.number(),
    sharedVictories: v.number(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  chatMessages: defineTable({
    squadCode: v.string(),
    helldiverName: v.string(),
    text: v.string(),
    isVoiceLine: v.boolean(),
    voiceLineId: v.optional(v.string()),
    isSystem: v.boolean(),
  }).index("by_squad", ["squadCode"]),

  coopMissions: defineTable({
    squadCode: v.string(),
    status: v.union(
      v.literal("map"),
      v.literal("combat"),
      v.literal("reward"),
      v.literal("rest"),
      v.literal("victory"),
      v.literal("gameover")
    ),
    faction: v.string(),
    difficulty: v.number(),
    modifiers: v.array(v.string()),
    planetSlug: v.string(),
    map: v.array(
      v.object({
        index: v.number(),
        type: v.string(),
        enemyTemplateIds: v.array(v.string()),
        cleared: v.boolean(),
      })
    ),
    currentNode: v.number(),
    enemies: v.array(
      v.object({
        id: v.string(),
        templateId: v.string(),
        name: v.string(),
        hp: v.number(),
        maxHp: v.number(),
        armor: v.number(),
        burn: v.number(),
        shield: v.number(),
        intentIndex: v.number(),
        enraged: v.boolean(),
        isBoss: v.boolean(),
        faction: v.string(),
      })
    ),
    sentries: v.array(
      v.object({
        id: v.string(),
        ownerName: v.string(),
        cardId: v.string(),
        name: v.string(),
        damage: v.number(),
        turnsLeft: v.number(),
        targetAll: v.boolean(),
      })
    ),
    turn: v.number(),
    endedTurns: v.array(v.string()),
    sharedReinforcements: v.number(),
    log: v.array(v.string()),
    players: v.array(
      v.object({
        name: v.string(),
        hp: v.number(),
        maxHp: v.number(),
        requisition: v.number(),
        maxRequisition: v.number(),
        block: v.number(),
        handIds: v.array(v.string()),
        deckIds: v.array(v.string()),
        discardIds: v.array(v.string()),
        exhaustedIds: v.array(v.string()),
        ownedDeckIds: v.array(v.string()),
        weaponId: v.string(),
        armorId: v.string(),
        boosterId: v.string(),
        handSize: v.number(),
        finishedReward: v.boolean(),
        rewardChoices: v.array(v.string()),
        kills: v.number(),
        dead: v.boolean(),
      })
    ),
    createdAt: v.number(),
  }).index("by_squad", ["squadCode"]),
});
