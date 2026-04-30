import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SQUAD_PREFIXES = ["BRAVO", "ALPHA", "ECHO", "DELTA", "FOXTROT", "VIKTOR", "TANGO", "SIERRA"];

function generateCode() {
  const prefix = SQUAD_PREFIXES[Math.floor(Math.random() * SQUAD_PREFIXES.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${num}`;
}

export const create = mutation({
  args: { hostName: v.string() },
  handler: async (ctx, { hostName }) => {
    let code = generateCode();
    let safety = 0;
    while (safety < 10) {
      const existing = await ctx.db
        .query("squads")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!existing) break;
      code = generateCode();
      safety++;
    }
    const id = await ctx.db.insert("squads", {
      code,
      hostName,
      status: "lobby",
      members: [
        {
          name: hostName,
          ready: false,
          isOnline: true,
          lastSeen: Date.now(),
          currentPhase: "lobby",
          currentNode: 0,
          currentHp: 60,
          currentMaxHp: 60,
          kills: 0,
        },
      ],
      difficulty: 3,
      sharedKills: 0,
      sharedVictories: 0,
      createdAt: Date.now(),
    });
    await ctx.db.insert("chatMessages", {
      squadCode: code,
      helldiverName: "SYSTEM",
      text: `Squad ${code} formed. ${hostName} is squad leader.`,
      isVoiceLine: false,
      isSystem: true,
    });
    return { id, code };
  },
});

export const join = mutation({
  args: { code: v.string(), helldiverName: v.string() },
  handler: async (ctx, { code, helldiverName }) => {
    const squad = await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!squad) throw new Error("Squad not found");
    if (squad.status === "disbanded") throw new Error("Squad disbanded");
    if (squad.members.some((m) => m.name === helldiverName)) {
      // re-online them
      const updated = squad.members.map((m) =>
        m.name === helldiverName ? { ...m, isOnline: true, lastSeen: Date.now() } : m
      );
      await ctx.db.patch(squad._id, { members: updated });
      return { code };
    }
    if (squad.members.length >= 4) throw new Error("Squad full");
    const newMember = {
      name: helldiverName,
      ready: false,
      isOnline: true,
      lastSeen: Date.now(),
      currentPhase: "lobby",
      currentNode: 0,
      currentHp: 60,
      currentMaxHp: 60,
      kills: 0,
    };
    await ctx.db.patch(squad._id, {
      members: [...squad.members, newMember],
    });
    await ctx.db.insert("chatMessages", {
      squadCode: code,
      helldiverName: "SYSTEM",
      text: `${helldiverName} joined the squad.`,
      isVoiceLine: false,
      isSystem: true,
    });
    return { code };
  },
});

export const leave = mutation({
  args: { code: v.string(), helldiverName: v.string() },
  handler: async (ctx, { code, helldiverName }) => {
    const squad = await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!squad) return;
    const remaining = squad.members.filter((m) => m.name !== helldiverName);
    if (remaining.length === 0) {
      await ctx.db.patch(squad._id, { status: "disbanded", members: [] });
      return;
    }
    let updates: Partial<typeof squad> = { members: remaining };
    if (squad.hostName === helldiverName) {
      updates.hostName = remaining[0].name;
    }
    await ctx.db.patch(squad._id, updates);
    await ctx.db.insert("chatMessages", {
      squadCode: code,
      helldiverName: "SYSTEM",
      text: `${helldiverName} left the squad.`,
      isVoiceLine: false,
      isSystem: true,
    });
  },
});

export const setReady = mutation({
  args: { code: v.string(), helldiverName: v.string(), ready: v.boolean() },
  handler: async (ctx, { code, helldiverName, ready }) => {
    const squad = await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!squad) return;
    const updated = squad.members.map((m) =>
      m.name === helldiverName ? { ...m, ready, lastSeen: Date.now() } : m
    );
    await ctx.db.patch(squad._id, { members: updated });
  },
});

export const updatePresence = mutation({
  args: {
    code: v.string(),
    helldiverName: v.string(),
    phase: v.string(),
    currentNode: v.optional(v.number()),
    currentHp: v.optional(v.number()),
    currentMaxHp: v.optional(v.number()),
    kills: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const squad = await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!squad) return;
    const updated = squad.members.map((m) => {
      if (m.name !== args.helldiverName) return m;
      return {
        ...m,
        isOnline: true,
        lastSeen: Date.now(),
        currentPhase: args.phase,
        currentNode: args.currentNode ?? m.currentNode,
        currentHp: args.currentHp ?? m.currentHp,
        currentMaxHp: args.currentMaxHp ?? m.currentMaxHp,
        kills: args.kills ?? m.kills,
      };
    });
    await ctx.db.patch(squad._id, { members: updated });
  },
});

export const setMissionConfig = mutation({
  args: {
    code: v.string(),
    helldiverName: v.string(),
    planetSlug: v.string(),
    difficulty: v.number(),
  },
  handler: async (ctx, args) => {
    const squad = await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!squad) return;
    if (squad.hostName !== args.helldiverName) return;
    await ctx.db.patch(squad._id, {
      targetPlanetSlug: args.planetSlug,
      difficulty: args.difficulty,
    });
  },
});

export const deploy = mutation({
  args: { code: v.string(), helldiverName: v.string() },
  handler: async (ctx, args) => {
    const squad = await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!squad) return;
    if (squad.hostName !== args.helldiverName) return;
    if (!squad.members.every((m) => m.ready)) return;
    await ctx.db.patch(squad._id, {
      status: "deployed",
      members: squad.members.map((m) => ({ ...m, currentPhase: "loadout" })),
    });
    await ctx.db.insert("chatMessages", {
      squadCode: args.code,
      helldiverName: "SYSTEM",
      text: `Squad deployed. Hellpods incoming.`,
      isVoiceLine: false,
      isSystem: true,
    });
  },
});

export const reportSquadVictory = mutation({
  args: {
    code: v.string(),
    helldiverName: v.string(),
    victory: v.boolean(),
  },
  handler: async (ctx, args) => {
    const squad = await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!squad) return;
    await ctx.db.patch(squad._id, {
      sharedVictories: squad.sharedVictories + (args.victory ? 1 : 0),
    });
    await ctx.db.insert("chatMessages", {
      squadCode: args.code,
      helldiverName: "SYSTEM",
      text: args.victory
        ? `${args.helldiverName} completed the mission. +${squad.difficulty * 2}% planet boost.`
        : `${args.helldiverName} KIA on the mission.`,
      isVoiceLine: false,
      isSystem: true,
    });
  },
});

export const get = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query("squads")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
  },
});

export const recentChat = query({
  args: { code: v.string(), limit: v.number() },
  handler: async (ctx, { code, limit }) => {
    const all = await ctx.db
      .query("chatMessages")
      .withIndex("by_squad", (q) => q.eq("squadCode", code))
      .order("desc")
      .take(limit);
    return all.reverse();
  },
});

export const sendChat = mutation({
  args: {
    code: v.string(),
    helldiverName: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.text.trim().length === 0) return;
    await ctx.db.insert("chatMessages", {
      squadCode: args.code,
      helldiverName: args.helldiverName,
      text: args.text.slice(0, 200),
      isVoiceLine: false,
      isSystem: false,
    });
  },
});

export const sendVoiceLine = mutation({
  args: {
    code: v.string(),
    helldiverName: v.string(),
    voiceLineId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      squadCode: args.code,
      helldiverName: args.helldiverName,
      text: args.text,
      isVoiceLine: true,
      voiceLineId: args.voiceLineId,
      isSystem: false,
    });
  },
});
