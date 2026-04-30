import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

const PLANET_SEEDS: Array<{
  slug: string;
  name: string;
  faction: "terminid" | "automaton" | "illuminate";
  sector: string;
  biome: string;
  decayPerHour: number;
}> = [
  // Terminids — Eastern bug worlds
  { slug: "phact_bay", name: "Phact Bay", faction: "terminid", sector: "Jin Xi", biome: "Sandy Mesa", decayPerHour: 1.5 },
  { slug: "gemstone_bluffs", name: "Gemstone Bluffs", faction: "terminid", sector: "L'estrade", biome: "Grassland", decayPerHour: 1.0 },
  { slug: "omicron", name: "Omicron", faction: "terminid", sector: "L'estrade", biome: "Tundra", decayPerHour: 0.9 },
  { slug: "nabatea_secundus", name: "Nabatea Secundus", faction: "terminid", sector: "L'estrade", biome: "Swamp", decayPerHour: 1.1 },
  { slug: "nivel_43", name: "Nivel 43", faction: "terminid", sector: "Mirin", biome: "Ashland", decayPerHour: 1.4 },
  { slug: "zagon_prime", name: "Zagon Prime", faction: "terminid", sector: "Mirin", biome: "Sandy Mesa", decayPerHour: 1.6 },
  { slug: "azterra", name: "Azterra", faction: "terminid", sector: "Orion", biome: "Copper Desert", decayPerHour: 1.2 },
  { slug: "terrek", name: "Terrek", faction: "terminid", sector: "Orion", biome: "Barren Moon", decayPerHour: 1.3 },
  { slug: "cirrus", name: "Cirrus", faction: "terminid", sector: "Orion", biome: "Ashland", decayPerHour: 1.5 },

  // Automatons — Western bot strongholds
  { slug: "choohe", name: "Choohe", faction: "automaton", sector: "Lacaille", biome: "Sandy Mesa", decayPerHour: 2.0 },
  { slug: "yed_prior", name: "Yed Prior", faction: "automaton", sector: "Tanis", biome: "Ionized Grassland", decayPerHour: 1.7 },
  { slug: "clasa", name: "Clasa", faction: "automaton", sector: "Tanis", biome: "Swamp", decayPerHour: 1.5 },
  { slug: "zefia", name: "Zefia", faction: "automaton", sector: "Tanis", biome: "Ethereal Jungle", decayPerHour: 1.6 },
  { slug: "demiurg", name: "Demiurg", faction: "automaton", sector: "Tanis", biome: "Tundra", decayPerHour: 1.8 },

  // Illuminate — Recent invasion sectors
  { slug: "myrium", name: "Myrium", faction: "illuminate", sector: "Morgon", biome: "Copper Desert", decayPerHour: 2.2 },
  { slug: "hydrobius", name: "Hydrobius", faction: "illuminate", sector: "Omega", biome: "Quake Desert", decayPerHour: 2.4 },
  { slug: "setia", name: "Setia", faction: "illuminate", sector: "Omega", biome: "Foggy Swamp", decayPerHour: 2.0 },
  { slug: "senge_23", name: "Senge 23", faction: "illuminate", sector: "Omega", biome: "Copper Desert", decayPerHour: 2.1 },
  { slug: "parsh", name: "Parsh", faction: "illuminate", sector: "Rictus", biome: "Swamp", decayPerHour: 2.3 },
  { slug: "kerth_secundus", name: "Kerth Secundus", faction: "illuminate", sector: "Rictus", biome: "Tundra", decayPerHour: 2.5 },
  { slug: "grafmere", name: "Grafmere", faction: "illuminate", sector: "Rictus", biome: "Frozen Boneyard", decayPerHour: 2.2 },
  { slug: "genesis_prime", name: "Genesis Prime", faction: "illuminate", sector: "Rictus", biome: "Shadowed Jungle", decayPerHour: 2.6 },
];

const MAJOR_ORDER_TEMPLATES = [
  {
    title: "PURGE THE EASTERN HIVES",
    briefing: "Three Terminid breeding worlds threaten Mirin and Orion. Liberate them within 7 days.",
    targetSlugs: ["zagon_prime", "cirrus", "phact_bay"],
    rewardMedals: 600,
    durationHours: 168,
  },
  {
    title: "CHOOHE OFFENSIVE",
    briefing: "Liberate Choohe. The Automaton mechanized division must be broken.",
    targetSlugs: ["choohe"],
    rewardMedals: 800,
    durationHours: 96,
  },
  {
    title: "TANIS SECTOR LIBERATION",
    briefing: "Halt the Automaton expansion across Tanis. Liberate Yed Prior, Demiurg, and Clasa.",
    targetSlugs: ["yed_prior", "demiurg", "clasa"],
    rewardMedals: 700,
    durationHours: 120,
  },
  {
    title: "RICTUS PHASE PURGE",
    briefing: "The Illuminate cult is consolidating in Rictus. Push back at Genesis Prime and Kerth Secundus.",
    targetSlugs: ["genesis_prime", "kerth_secundus"],
    rewardMedals: 850,
    durationHours: 96,
  },
  {
    title: "OMEGA INCURSION RESPONSE",
    briefing: "Push the Illuminate out of Omega. Liberate Hydrobius, Setia, and Senge 23.",
    targetSlugs: ["hydrobius", "setia", "senge_23"],
    rewardMedals: 900,
    durationHours: 120,
  },
  {
    title: "GENERAL ASSAULT",
    briefing: "Strike where it hurts. Any 4 planets liberated counts.",
    targetSlugs: [] as string[],
    rewardMedals: 500,
    durationHours: 72,
  },
];

export const getWar = query({
  args: {},
  handler: async (ctx) => {
    const planets = await ctx.db.query("planets").collect();
    const order = await ctx.db
      .query("majorOrder")
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    return { planets, majorOrder: order };
  },
});

export const recentActivity = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    return await ctx.db.query("contributions").order("desc").take(limit);
  },
});

export const reportRun = mutation({
  args: {
    planetSlug: v.string(),
    helldiverName: v.string(),
    victory: v.boolean(),
    difficulty: v.number(),
    nodesCleared: v.number(),
  },
  handler: async (ctx, args) => {
    const planet = await ctx.db
      .query("planets")
      .withIndex("by_slug", (q) => q.eq("slug", args.planetSlug))
      .first();
    if (!planet) return;

    if (args.victory) {
      const boost = 0.4 + args.difficulty * 0.12;
      await ctx.db.patch(planet._id, {
        liberation: Math.min(100, planet.liberation + boost),
        activeLiberators: planet.activeLiberators + 1,
      });
    }

    await ctx.db.insert("contributions", {
      planetSlug: args.planetSlug,
      planetName: planet.name,
      helldiverName: args.helldiverName,
      victory: args.victory,
      difficulty: args.difficulty,
      nodesCleared: args.nodesCleared,
    });

    // Update leaderboard
    const existing = await ctx.db
      .query("leaderboard")
      .withIndex("by_helldiver", (q) => q.eq("helldiverName", args.helldiverName))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        victories: existing.victories + (args.victory ? 1 : 0),
        bestDifficulty: Math.max(existing.bestDifficulty, args.difficulty),
      });
    } else {
      await ctx.db.insert("leaderboard", {
        helldiverName: args.helldiverName,
        victories: args.victory ? 1 : 0,
        bestDifficulty: args.difficulty,
        medalsTotal: 0,
      });
    }
  },
});

export const reseed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("planets").collect();
    for (const p of existing) await ctx.db.delete(p._id);
    const orders = await ctx.db.query("majorOrder").collect();
    for (const o of orders) await ctx.db.delete(o._id);
    const now = Date.now();
    for (const p of PLANET_SEEDS) {
      await ctx.db.insert("planets", {
        ...p,
        liberation: 25 + Math.random() * 50,
        activeLiberators: 100 + Math.floor(Math.random() * 4000),
        lastTick: now,
      });
    }
    const t = MAJOR_ORDER_TEMPLATES[Math.floor(Math.random() * MAJOR_ORDER_TEMPLATES.length)];
    await ctx.db.insert("majorOrder", { ...t, startedAt: now, active: true });
    return { reseeded: true, count: PLANET_SEEDS.length };
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("planets").first();
    if (existing) return { seeded: false, reason: "already seeded" };

    const now = Date.now();
    for (const p of PLANET_SEEDS) {
      await ctx.db.insert("planets", {
        ...p,
        liberation: 20 + Math.random() * 60,
        activeLiberators: 100 + Math.floor(Math.random() * 4000),
        lastTick: now,
      });
    }

    // Insert a starting Major Order
    const t = MAJOR_ORDER_TEMPLATES[Math.floor(Math.random() * MAJOR_ORDER_TEMPLATES.length)];
    await ctx.db.insert("majorOrder", {
      ...t,
      startedAt: now,
      active: true,
    });

    return { seeded: true };
  },
});

export const tickDecay = internalMutation({
  args: {},
  handler: async (ctx) => {
    const planets = await ctx.db.query("planets").collect();
    const now = Date.now();
    for (const p of planets) {
      const hours = (now - p.lastTick) / (1000 * 60 * 60);
      if (hours <= 0) continue;
      await ctx.db.patch(p._id, {
        liberation: Math.max(0, p.liberation - p.decayPerHour * hours),
        lastTick: now,
      });
    }

    // Rotate expired Major Order
    const order = await ctx.db
      .query("majorOrder")
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    if (order) {
      const elapsed = (now - order.startedAt) / (1000 * 60 * 60);
      if (elapsed > order.durationHours) {
        await ctx.db.patch(order._id, { active: false });
        const t = MAJOR_ORDER_TEMPLATES[Math.floor(Math.random() * MAJOR_ORDER_TEMPLATES.length)];
        await ctx.db.insert("majorOrder", {
          ...t,
          startedAt: now,
          active: true,
        });
      }
    }
  },
});

export const leaderboardTop = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("leaderboard")
      .withIndex("by_helldiver")
      .order("desc")
      .take(limit);
  },
});
