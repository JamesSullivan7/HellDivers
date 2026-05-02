import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ARMORS, CARDS, ENEMIES, FACTION_MAPS, WEAPONS, getCard } from "./gameData";

const BASE_HAND_SIZE = 5;
const MAX_REQUISITION = 4;
const STARTING_HP = 60;

// ── helpers ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function difficultyScale(d: number) {
  return { hp: 1.0 + (d - 1) * 0.17, dmg: 1.0 + (d - 1) * 0.15 };
}

function instantiateEnemy(templateId: string, difficulty: number, modifiers: string[]) {
  const t = ENEMIES[templateId];
  if (!t) throw new Error("Unknown enemy " + templateId);
  const scale = difficultyScale(difficulty);
  const hp = Math.max(1, Math.round(t.hp * scale.hp));
  const armor = (t.armor ?? 0) + (modifiers.includes("enemy_armor") ? 1 : 0);
  return {
    id: `${templateId}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: t.id,
    name: t.name,
    hp,
    maxHp: hp,
    armor,
    burn: 0,
    shield: t.shield ?? 0,
    intentIndex: 0,
    enraged: false,
    isBoss: t.isBoss === true,
    faction: t.faction,
  };
}

function getCurrentIntent(enemy: { templateId: string; intentIndex: number; enraged: boolean }, dmgScale: number) {
  const tmpl = ENEMIES[enemy.templateId];
  const pattern = enemy.enraged && tmpl.enragedIntents ? tmpl.enragedIntents : tmpl.intents;
  const intent = pattern[enemy.intentIndex % pattern.length];
  return {
    ...intent,
    damage: intent.damage !== undefined ? Math.round(intent.damage * dmgScale) : undefined,
  };
}

function generateMap(faction: string, modifiers: string[]) {
  const layout = FACTION_MAPS[faction];
  if (!layout) throw new Error("Unknown faction " + faction);
  const extra = modifiers.includes("patrol_frequency");
  return layout.map((entry, i) => {
    let enemies = [...entry.enemies];
    if (extra && enemies.length > 0 && entry.type !== "boss" && entry.type !== "rest") {
      const filler = faction === "terminid" ? "scavenger" : faction === "automaton" ? "trooper" : "voteless";
      enemies.push(filler);
    }
    return {
      index: i,
      type: entry.type,
      enemyTemplateIds: enemies,
      cleared: false,
    };
  });
}

function buildPlayer(input: {
  name: string;
  ownedDeckIds: string[];
  armorId: string;
  weaponId: string;
  boosterId: string;
  modifiers: string[];
}) {
  const armor = ARMORS[input.armorId] ?? ARMORS.frontline;
  const baseHp = STARTING_HP + armor.hpMod + (input.boosterId === "vitality_enhancement" ? 15 : 0);
  let handSize = BASE_HAND_SIZE + armor.handMod;
  if (input.boosterId === "stamina_enhancement") handSize += 1;
  if (input.modifiers.includes("atmospheric_spores")) handSize -= 1;
  handSize = Math.max(3, handSize);
  return {
    name: input.name,
    hp: baseHp,
    maxHp: baseHp,
    requisition: MAX_REQUISITION,
    maxRequisition: MAX_REQUISITION,
    block: armor.startingBlock,
    handIds: [] as string[],
    deckIds: shuffle(input.ownedDeckIds),
    discardIds: [] as string[],
    exhaustedIds: [] as string[],
    ownedDeckIds: [...input.ownedDeckIds],
    weaponId: input.weaponId,
    armorId: input.armorId,
    boosterId: input.boosterId,
    handSize,
    finishedReward: false,
    rewardChoices: [] as string[],
    kills: 0,
    dead: false,
  };
}

function drawForPlayer(player: any, log: string[]) {
  for (let i = player.handIds.length; i < player.handSize; i++) {
    if (player.deckIds.length === 0) {
      if (player.discardIds.length === 0) break;
      player.deckIds = shuffle(player.discardIds);
      player.discardIds = [];
      log.push(`> ${player.name}'s deck reshuffled.`);
    }
    player.handIds.push(player.deckIds.shift());
  }
}

// ── mutations ────────────────────────────────────────────────

export const createMission = mutation({
  args: {
    squadCode: v.string(),
    faction: v.string(),
    difficulty: v.number(),
    modifiers: v.array(v.string()),
    planetSlug: v.string(),
    helldiverName: v.string(),
    players: v.array(
      v.object({
        name: v.string(),
        ownedDeckIds: v.array(v.string()),
        armorId: v.string(),
        weaponId: v.string(),
        boosterId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Cleanup previous mission for this squad
    const prev = await ctx.db
      .query("coopMissions")
      .withIndex("by_squad", (q) => q.eq("squadCode", args.squadCode))
      .collect();
    for (const m of prev) await ctx.db.delete(m._id);

    const mapNodes = generateMap(args.faction, args.modifiers);
    const builtPlayers = args.players.map((p) =>
      buildPlayer({ ...p, modifiers: args.modifiers })
    );

    const missionId = await ctx.db.insert("coopMissions", {
      squadCode: args.squadCode,
      status: "map",
      faction: args.faction,
      difficulty: args.difficulty,
      modifiers: args.modifiers,
      planetSlug: args.planetSlug,
      map: mapNodes,
      currentNode: -1,
      enemies: [],
      sentries: [],
      turn: 0,
      endedTurns: [],
      sharedReinforcements: 3 + builtPlayers.length,
      log: [`> Squad mission begins. ${builtPlayers.length} Helldivers deployed.`],
      players: builtPlayers,
      createdAt: Date.now(),
    });
    return { missionId };
  },
});

export const enterNode = mutation({
  args: { squadCode: v.string(), nodeIndex: v.number() },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("coopMissions")
      .withIndex("by_squad", (q) => q.eq("squadCode", args.squadCode))
      .first();
    if (!mission) return;

    const node = mission.map[args.nodeIndex];
    if (!node) return;
    if (node.cleared) return;

    if (node.type === "rest") {
      const players = mission.players.map((p) => {
        const heal = Math.floor(p.maxHp * 0.4);
        return { ...p, hp: Math.min(p.maxHp, p.hp + heal) };
      });
      const newMap = mission.map.map((n, i) =>
        i === args.nodeIndex ? { ...n, cleared: true } : n
      );
      await ctx.db.patch(mission._id, {
        players,
        map: newMap,
        currentNode: args.nodeIndex,
        log: [...mission.log, `> Squad rests at extraction zone. +40% HP all members.`],
        status: "map",
      });
      return;
    }

    const enemies = node.enemyTemplateIds.map((id) =>
      instantiateEnemy(id, mission.difficulty, mission.modifiers)
    );
    const log = [
      ...mission.log,
      `> Node ${args.nodeIndex + 1} engaged.`,
      `> Hostiles: ${enemies.map((e) => e.name).join(", ")}.`,
    ];
    const players = mission.players.map((p) => {
      if (p.dead) return p;
      const armor = ARMORS[p.armorId] ?? ARMORS.frontline;
      const reqBonus = p.boosterId === "hellpod_optimization" ? 2 : 0;
      const fresh = {
        ...p,
        deckIds: shuffle([...p.ownedDeckIds]),
        discardIds: [],
        exhaustedIds: [],
        handIds: [],
        requisition: p.maxRequisition + reqBonus,
        block: armor.startingBlock,
      };
      drawForPlayer(fresh, log);
      return fresh;
    });

    await ctx.db.patch(mission._id, {
      currentNode: args.nodeIndex,
      enemies,
      sentries: [],
      turn: 1,
      endedTurns: [],
      log,
      players,
      status: "combat",
    });
  },
});

export const playCard = mutation({
  args: {
    squadCode: v.string(),
    helldiverName: v.string(),
    handIndex: v.number(),
    enemyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("coopMissions")
      .withIndex("by_squad", (q) => q.eq("squadCode", args.squadCode))
      .first();
    if (!mission || mission.status !== "combat") return;

    const playerIdx = mission.players.findIndex((p) => p.name === args.helldiverName);
    if (playerIdx < 0) return;
    const player = { ...mission.players[playerIdx] };
    if (player.dead) return;

    const cardId = player.handIds[args.handIndex];
    if (!cardId) return;
    const card = getCard(cardId);

    let actualCost = card.cost;
    if (mission.modifiers.includes("increased_air_sec") && card.type === "eagle") actualCost += 1;
    if (player.requisition < actualCost) return;

    let log = [...mission.log];
    const dmgScale = 1; // damage scaling is on enemy intents only; cards run nominal
    let multiplier = 1;
    if (mission.modifiers.includes("magnetic_storm") && card.type === "orbital") multiplier *= 0.7;

    let enemies = mission.enemies.map((e) => ({ ...e }));
    let sentries = [...mission.sentries];
    let players = mission.players.map((p, i) => (i === playerIdx ? player : { ...p }));

    player.requisition -= actualCost;
    log.push(`> [${player.name}] ${card.name} called in.`);

    const eff = card.effect;
    const m = (n: number) => Math.round(n * multiplier);

    // Self/utility effects
    if (eff.heal) {
      const h = m(eff.heal);
      player.hp = Math.min(player.maxHp, player.hp + h);
      log.push(`  ${player.name} healed ${h} HP.`);
    }
    if (eff.block) {
      player.block += m(eff.block);
      log.push(`  ${player.name} +${m(eff.block)} Block.`);
    }
    if (eff.gainRequisition) {
      player.requisition += eff.gainRequisition;
    }
    let drawCount = eff.draw ?? 0;

    const aliveIdx = () => enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.hp > 0);

    const dealTo = (idx: number, base: number) => {
      const enemy = enemies[idx];
      if (!enemy || enemy.hp <= 0) return;
      let dmg = base;
      if (enemy.armor > 0 && eff.bonusVsArmor) dmg += eff.bonusVsArmor;
      let shield = enemy.shield;
      let hp = enemy.hp;
      if (shield > 0) {
        const absorbed = Math.min(shield, dmg);
        shield -= absorbed;
        dmg -= absorbed;
      }
      if (dmg > 0) {
        const after = eff.ignoreArmor ? dmg : Math.max(0, dmg - enemy.armor);
        hp = Math.max(0, hp - after);
      }
      const dealt = enemy.hp - hp;
      enemies[idx] = { ...enemy, hp, shield };
      if (dealt > 0 || enemy.shield - shield > 0) {
        log.push(`  ${enemy.name}: -${dealt} (${hp}/${enemy.maxHp})${enemy.shield - shield > 0 ? ` shield -${enemy.shield - shield}` : ""}.`);
      }
      if (hp === 0 && enemy.hp > 0) {
        log.push(`> ${enemy.name} eliminated.`);
        player.kills += 1;
      }
    };

    const stripFrom = (idx: number, amt: number) => {
      const e = enemies[idx];
      if (!e || e.shield <= 0) return;
      const taken = Math.min(e.shield, amt);
      enemies[idx] = { ...e, shield: e.shield - taken };
    };

    if (eff.stripShield) {
      const amt = m(eff.stripShield);
      if (card.target === "single") {
        const idx = enemies.findIndex((e) => e.id === args.enemyId);
        if (idx >= 0) stripFrom(idx, amt);
      } else if (card.target === "all") {
        aliveIdx().forEach(({ i }) => stripFrom(i, amt));
      }
    }

    if (eff.damage !== undefined) {
      const baseDmg = m(eff.damage);
      const hits = eff.damageHits ?? 1;
      switch (card.target) {
        case "single": {
          const target = enemies.findIndex((e) => e.id === args.enemyId);
          if (target >= 0) {
            for (let h = 0; h < hits; h++) {
              if (eff.chain && h === 0) {
                const order = aliveIdx().map((x) => x.i);
                const ordered = [target, ...order.filter((i) => i !== target)].slice(0, eff.chain);
                ordered.forEach((idx) => {
                  if (eff.stripShield) stripFrom(idx, m(eff.stripShield));
                  dealTo(idx, baseDmg);
                });
              } else {
                dealTo(target, baseDmg);
              }
            }
          }
          break;
        }
        case "all": {
          for (let h = 0; h < hits; h++) {
            aliveIdx().forEach(({ i }) => dealTo(i, baseDmg));
          }
          break;
        }
        case "random": {
          for (let h = 0; h < hits; h++) {
            const a = aliveIdx();
            if (a.length === 0) break;
            dealTo(a[Math.floor(Math.random() * a.length)].i, baseDmg);
          }
          break;
        }
        case "highest_hp": {
          const a = aliveIdx();
          if (a.length > 0) {
            a.sort((x, y) => y.e.hp - x.e.hp);
            for (let h = 0; h < hits; h++) dealTo(a[0].i, baseDmg);
          }
          break;
        }
      }
    }

    if (eff.burn) {
      const b = m(eff.burn);
      if (card.target === "single") {
        const idx = enemies.findIndex((e) => e.id === args.enemyId);
        if (idx >= 0 && enemies[idx].hp > 0) {
          enemies[idx] = { ...enemies[idx], burn: enemies[idx].burn + b };
        }
      } else if (card.target === "all") {
        aliveIdx().forEach(({ i }) => {
          enemies[i] = { ...enemies[i], burn: enemies[i].burn + b };
        });
        log.push(`  Burn applied to all (${b}).`);
      }
    }

    if (eff.recurringDamage) {
      sentries.push({
        id: `sentry_${Math.random().toString(36).slice(2, 8)}`,
        ownerName: player.name,
        cardId: card.id,
        name: card.name,
        damage: m(eff.recurringDamage.amount),
        turnsLeft: eff.recurringDamage.turns,
        targetAll: eff.recurringDamage.targetAll ?? false,
      });
      log.push(`  ${card.name} deployed by ${player.name}.`);
    }

    // move card
    const newHand = [...player.handIds];
    newHand.splice(args.handIndex, 1);
    player.handIds = newHand;
    if (eff.exhaust) player.exhaustedIds = [...player.exhaustedIds, cardId];
    else player.discardIds = [...player.discardIds, cardId];

    // draws
    for (let i = 0; i < drawCount; i++) {
      if (player.deckIds.length === 0) {
        if (player.discardIds.length === 0) break;
        player.deckIds = shuffle(player.discardIds);
        player.discardIds = [];
      }
      player.handIds.push(player.deckIds.shift()!);
    }

    players[playerIdx] = player;

    const allDead = enemies.every((e) => e.hp <= 0);
    if (allDead) {
      log.push(`> Hostiles cleared.`);
      const node = mission.map[mission.currentNode];
      const isBoss = node?.type === "boss";
      if (isBoss) {
        await ctx.db.patch(mission._id, {
          enemies, sentries, players, log,
          status: "victory",
        });
      } else {
        const newMap = mission.map.map((n, i) =>
          i === mission.currentNode ? { ...n, cleared: true } : n
        );
        const ps = players.map((p) => ({
          ...p,
          finishedReward: false,
          rewardChoices: rewardChoicesForRarity(),
        }));
        await ctx.db.patch(mission._id, {
          enemies, sentries, players: ps, log, map: newMap,
          status: "reward",
        });
      }
      return;
    }

    await ctx.db.patch(mission._id, { enemies, sentries, players, log });
  },
});

function rewardChoicesForRarity(): string[] {
  const allCards = Object.values(CARDS).filter(
    (c) => !["util_stim", "util_shield", "orbital_precision"].includes(c.id)
  );
  const out: string[] = [];
  const used = new Set<string>();
  while (out.length < 3) {
    const c = allCards[Math.floor(Math.random() * allCards.length)];
    if (used.has(c.id)) continue;
    used.add(c.id);
    out.push(c.id);
  }
  return out;
}

export const endTurn = mutation({
  args: { squadCode: v.string(), helldiverName: v.string() },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("coopMissions")
      .withIndex("by_squad", (q) => q.eq("squadCode", args.squadCode))
      .first();
    if (!mission || mission.status !== "combat") return;

    const livePlayers = mission.players.filter((p) => !p.dead);
    let endedTurns = mission.endedTurns;
    if (!endedTurns.includes(args.helldiverName)) {
      endedTurns = [...endedTurns, args.helldiverName];
    }

    if (endedTurns.length < livePlayers.length) {
      await ctx.db.patch(mission._id, { endedTurns });
      return;
    }

    // All players ended → resolve turn
    let log = [...mission.log, `> End of turn ${mission.turn}.`];
    let enemies = mission.enemies.map((e) => ({ ...e }));
    let players = mission.players.map((p) => ({ ...p }));
    let sentries: typeof mission.sentries = [];
    let sharedReinforcements = mission.sharedReinforcements;
    const dmgScale = difficultyScale(mission.difficulty).dmg;

    // Acidic atmosphere
    if (mission.modifiers.includes("acidic_atmosphere")) {
      players = players.map((p) =>
        p.dead ? p : { ...p, hp: Math.max(0, p.hp - 1) }
      );
      log.push(`  [Acidic Atmosphere] all players -1 HP.`);
    }

    // Boss enrage
    enemies = enemies.map((e) => {
      const tmpl = ENEMIES[e.templateId];
      if (e.isBoss && !e.enraged && e.hp > 0 && e.hp <= e.maxHp / 2 && tmpl.enragedIntents) {
        log.push(`> ⚠ ${tmpl.enragedMessage ?? `${e.name} ENRAGED.`}`);
        return { ...e, enraged: true, intentIndex: 0 };
      }
      return e;
    });

    // Weapons
    for (const p of players) {
      if (p.dead) continue;
      const w = WEAPONS[p.weaponId] ?? WEAPONS.ar2_coyote;
      const fireOnce = (idx: number) => {
        const e = enemies[idx];
        if (!e || e.hp <= 0) return;
        let dmg = w.damage;
        let shield = e.shield;
        let hp = e.hp;
        if (shield > 0) {
          const ab = Math.min(shield, dmg);
          shield -= ab; dmg -= ab;
        }
        if (dmg > 0) {
          const after = w.ignoreArmor ? dmg : Math.max(0, dmg - e.armor);
          hp = Math.max(0, hp - after);
        }
        enemies[idx] = { ...e, hp, shield };
      };
      for (let h = 0; h < w.hitsPerTurn; h++) {
        const a = enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.hp > 0);
        if (a.length === 0) break;
        if (w.target === "all") { a.forEach(({ i }) => fireOnce(i)); break; }
        else if (w.target === "highest_hp") { a.sort((x, y) => y.e.hp - x.e.hp); fireOnce(a[0].i); }
        else fireOnce(a[Math.floor(Math.random() * a.length)].i);
      }
    }

    // Sentries
    for (const s of mission.sentries) {
      if (s.turnsLeft <= 0) continue;
      const a = enemies.map((e, i) => ({ e, i })).filter(({ e }) => e.hp > 0);
      if (a.length > 0) {
        if (s.targetAll) {
          a.forEach(({ e, i }) => {
            const dmg = Math.max(0, s.damage - e.armor);
            enemies[i] = { ...e, hp: Math.max(0, e.hp - dmg) };
          });
        } else {
          const pick = a[Math.floor(Math.random() * a.length)];
          const dmg = Math.max(0, s.damage - pick.e.armor);
          enemies[pick.i] = { ...pick.e, hp: Math.max(0, pick.e.hp - dmg) };
        }
        log.push(`  [${s.name}] (${s.ownerName}) hits.`);
      }
      sentries.push({ ...s, turnsLeft: s.turnsLeft - 1 });
    }

    // Burn
    enemies = enemies.map((e) => {
      if (e.hp <= 0) return e;
      if (e.burn > 0) {
        const newHp = Math.max(0, e.hp - e.burn);
        log.push(`  ${e.name} burns ${e.burn}.`);
        return { ...e, hp: newHp, burn: Math.max(0, e.burn - 1) };
      }
      return e;
    });

    // Check victory after weapon/sentry/burn
    if (enemies.every((e) => e.hp <= 0)) {
      const node = mission.map[mission.currentNode];
      const isBoss = node?.type === "boss";
      log.push(`> Hostiles cleared.`);
      if (isBoss) {
        await ctx.db.patch(mission._id, {
          enemies, sentries: sentries.filter((s) => s.turnsLeft > 0),
          players, log, sharedReinforcements,
          status: "victory",
        });
      } else {
        const newMap = mission.map.map((n, i) =>
          i === mission.currentNode ? { ...n, cleared: true } : n
        );
        const ps = players.map((p) => ({
          ...p,
          finishedReward: false,
          rewardChoices: rewardChoicesForRarity(),
        }));
        await ctx.db.patch(mission._id, {
          enemies, sentries: sentries.filter((s) => s.turnsLeft > 0),
          players: ps, log, map: newMap, sharedReinforcements,
          status: "reward",
        });
      }
      return;
    }

    // Localization confusion
    const localActive =
      players.some((p) => !p.dead && p.boosterId === "localization_confusion") &&
      mission.turn === 1;
    if (localActive) {
      log.push(`  [Localization Confusion] enemies skip action.`);
    }

    if (!localActive) {
      // Enemies attack — pick a random alive player per attack
      const alivePlayers = () => players.filter((p) => !p.dead);
      enemies.forEach((e, idx) => {
        if (e.hp <= 0) return;
        const intent = getCurrentIntent(e, dmgScale);
        switch (intent.kind) {
          case "attack": {
            const live = alivePlayers();
            if (live.length === 0) return;
            const target = live[Math.floor(Math.random() * live.length)];
            const tIdx = players.findIndex((p) => p.name === target.name);
            const dmg = intent.damage ?? 0;
            let remaining = dmg;
            if (target.block > 0) {
              const ab = Math.min(target.block, remaining);
              players[tIdx] = { ...players[tIdx], block: players[tIdx].block - ab };
              remaining -= ab;
            }
            if (remaining > 0) {
              players[tIdx] = { ...players[tIdx], hp: Math.max(0, players[tIdx].hp - remaining) };
              log.push(`  ${e.name} hits ${target.name} for ${remaining}.`);
            } else {
              log.push(`  ${e.name} blocked vs ${target.name}.`);
            }
            break;
          }
          case "attack_all": {
            const dmg = intent.damage ?? 0;
            players = players.map((p) => {
              if (p.dead) return p;
              let r = dmg;
              let block = p.block;
              if (block > 0) { const ab = Math.min(block, r); block -= ab; r -= ab; }
              const hp = Math.max(0, p.hp - r);
              return { ...p, block, hp };
            });
            log.push(`  ${e.name} AoE — All ${dmg}.`);
            break;
          }
          case "buff": {
            const tmpl = ENEMIES[e.templateId];
            const isShield = e.faction === "illuminate" && intent.text.toLowerCase().includes("shield");
            const amt = parseInt(intent.text.match(/\+(\d+)/)?.[1] ?? "1", 10);
            if (isShield) {
              enemies[idx] = { ...enemies[idx], shield: enemies[idx].shield + amt };
              log.push(`  ${e.name} +${amt} shield.`);
            } else {
              enemies[idx] = { ...enemies[idx], armor: enemies[idx].armor + amt };
              log.push(`  ${e.name} +${amt} armor.`);
            }
            break;
          }
          case "wait": {
            log.push(`  ${e.name}: ${intent.text}`);
            break;
          }
        }
        enemies[idx] = { ...enemies[idx], intentIndex: enemies[idx].intentIndex + 1 };
      });
    }

    // Check player deaths → consume reinforcements
    players = players.map((p) => {
      if (p.dead) return p;
      if (p.hp > 0) return p;
      if (sharedReinforcements > 0) {
        sharedReinforcements -= 1;
        log.push(`> REINFORCEMENT DEPLOYED for ${p.name}. (${sharedReinforcements} left)`);
        return { ...p, hp: Math.floor(p.maxHp * 0.6) };
      }
      log.push(`> ${p.name} KIA.`);
      return { ...p, dead: true };
    });

    // All dead → mission failed
    if (players.every((p) => p.dead)) {
      log.push(`> SQUAD WIPED. Mission failed.`);
      await ctx.db.patch(mission._id, {
        enemies, sentries: sentries.filter((s) => s.turnsLeft > 0),
        players, log, sharedReinforcements,
        status: "gameover",
      });
      return;
    }

    // Next turn — discard hands, draw new
    players = players.map((p) => {
      if (p.dead) return p;
      const armor = ARMORS[p.armorId] ?? ARMORS.frontline;
      const reqBonus = p.boosterId === "hellpod_optimization" ? 0 : 0; // bonus only first turn
      const fresh: any = {
        ...p,
        discardIds: [...p.discardIds, ...p.handIds],
        handIds: [],
        requisition: p.maxRequisition,
        block: 0,
      };
      drawForPlayer(fresh, log);
      return fresh;
    });

    await ctx.db.patch(mission._id, {
      enemies,
      sentries: sentries.filter((s) => s.turnsLeft > 0),
      players,
      log,
      sharedReinforcements,
      turn: mission.turn + 1,
      endedTurns: [],
    });
  },
});

export const chooseReward = mutation({
  args: { squadCode: v.string(), helldiverName: v.string(), cardId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("coopMissions")
      .withIndex("by_squad", (q) => q.eq("squadCode", args.squadCode))
      .first();
    if (!mission || mission.status !== "reward") return;

    const players = mission.players.map((p) => {
      if (p.name !== args.helldiverName) return p;
      const updated = { ...p, finishedReward: true };
      if (args.cardId) {
        updated.ownedDeckIds = [...p.ownedDeckIds, args.cardId];
      }
      return updated;
    });

    const allDone = players.filter((p) => !p.dead).every((p) => p.finishedReward);
    await ctx.db.patch(mission._id, {
      players,
      status: allDone ? "map" : "reward",
    });
  },
});

export const get = query({
  args: { squadCode: v.string() },
  handler: async (ctx, { squadCode }) => {
    return await ctx.db
      .query("coopMissions")
      .withIndex("by_squad", (q) => q.eq("squadCode", squadCode))
      .first();
  },
});

export const finalizeAndDelete = mutation({
  args: { squadCode: v.string() },
  handler: async (ctx, { squadCode }) => {
    const m = await ctx.db
      .query("coopMissions")
      .withIndex("by_squad", (q) => q.eq("squadCode", squadCode))
      .first();
    if (m) await ctx.db.delete(m._id);
  },
});
