import { Enemy, EnemyTemplate, Faction, MapNode } from "./types";

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
  // ───── TERMINIDS ─────
  scavenger: {
    id: "scavenger",
    name: "Scavenger",
    hp: 6,
    armor: 0,
    faction: "terminid",
    intentPattern: [
      { kind: "attack", damage: 2, text: "Bite 2" },
      { kind: "attack", damage: 3, text: "Lunge 3" },
    ],
  },
  hunter: {
    id: "hunter",
    name: "Hunter",
    hp: 9,
    armor: 0,
    faction: "terminid",
    intentPattern: [
      { kind: "attack", damage: 4, text: "Pounce 4" },
      { kind: "attack", damage: 3, text: "Slash 3" },
    ],
  },
  warrior: {
    id: "warrior",
    name: "Terminid Warrior",
    hp: 14,
    armor: 1,
    faction: "terminid",
    intentPattern: [
      { kind: "attack", damage: 5, text: "Charge 5" },
      { kind: "buff", text: "Roar (Armor +1)" },
      { kind: "attack", damage: 4, text: "Slash 4" },
    ],
  },
  brood_commander: {
    id: "brood_commander",
    name: "Brood Commander",
    hp: 22,
    armor: 1,
    faction: "terminid",
    intentPattern: [
      { kind: "attack", damage: 6, text: "Cleave 6" },
      { kind: "attack", damage: 4, text: "Bite 4" },
      { kind: "attack_all", damage: 2, text: "Roar — All 2" },
    ],
  },
  charger: {
    id: "charger",
    name: "Charger",
    hp: 32,
    armor: 3,
    faction: "terminid",
    intentPattern: [
      { kind: "wait", text: "Winding up..." },
      { kind: "attack", damage: 12, text: "Charge! 12" },
      { kind: "attack", damage: 5, text: "Stomp 5" },
    ],
  },
  bile_spewer: {
    id: "bile_spewer",
    name: "Bile Spewer",
    hp: 18,
    armor: 0,
    faction: "terminid",
    intentPattern: [
      { kind: "attack_all", damage: 3, text: "Bile — All 3" },
      { kind: "attack", damage: 5, text: "Spit 5" },
    ],
  },
  stalker: {
    id: "stalker",
    name: "Stalker",
    hp: 16,
    armor: 0,
    faction: "terminid",
    intentPattern: [
      { kind: "attack", damage: 7, text: "Ambush 7" },
      { kind: "wait", text: "Cloaking..." },
    ],
  },
  impaler: {
    id: "impaler",
    name: "Impaler",
    hp: 36,
    armor: 2,
    faction: "terminid",
    intentPattern: [
      { kind: "wait", text: "Burrowing..." },
      { kind: "attack_all", damage: 4, text: "Tentacle Strike — All 4" },
      { kind: "attack", damage: 9, text: "Impale 9" },
      { kind: "buff", text: "Carapace (+1 Armor)" },
    ],
  },
  dragonroach: {
    id: "dragonroach",
    name: "Dragonroach",
    hp: 28,
    armor: 1,
    faction: "terminid",
    intentPattern: [
      { kind: "attack", damage: 7, text: "Dive Strike 7" },
      { kind: "attack_all", damage: 3, text: "Acid Spew — All 3" },
      { kind: "attack", damage: 5, text: "Slash 5" },
    ],
  },
  bile_titan: {
    id: "bile_titan",
    name: "Bile Titan",
    hp: 80,
    armor: 4,
    faction: "terminid",
    isBoss: true,
    intentPattern: [
      { kind: "attack", damage: 12, text: "Stomp 12" },
      { kind: "attack_all", damage: 6, text: "Bile Geyser — All 6" },
      { kind: "buff", text: "Carapace (Armor +2)" },
      { kind: "attack", damage: 14, text: "Crush 14" },
    ],
    enragedMessage: "BILE TITAN ENRAGED. SHE IS FURIOUS.",
    enragedPattern: [
      { kind: "attack", damage: 18, text: "Frenzy! 18" },
      { kind: "attack_all", damage: 10, text: "Bile Wave — All 10" },
      { kind: "attack", damage: 16, text: "Crush! 16" },
    ],
  },

  // ───── AUTOMATONS ─────
  trooper: {
    id: "trooper",
    name: "Automaton Trooper",
    hp: 8,
    armor: 0,
    faction: "automaton",
    intentPattern: [
      { kind: "attack", damage: 3, text: "Rifle 3" },
      { kind: "attack", damage: 2, text: "Burst 2" },
    ],
  },
  scout_strider: {
    id: "scout_strider",
    name: "Scout Strider",
    hp: 16,
    armor: 1,
    faction: "automaton",
    intentPattern: [
      { kind: "attack", damage: 5, text: "MG Burst 5" },
      { kind: "attack_all", damage: 2, text: "Suppress — All 2" },
      { kind: "buff", text: "Plating (+1 Armor)" },
    ],
  },
  devastator: {
    id: "devastator",
    name: "Devastator",
    hp: 20,
    armor: 2,
    faction: "automaton",
    intentPattern: [
      { kind: "attack", damage: 6, text: "Mortar 6" },
      { kind: "buff", text: "Armor +1" },
      { kind: "attack", damage: 4, text: "Burst 4" },
    ],
  },
  berserker: {
    id: "berserker",
    name: "Berserker",
    hp: 24,
    armor: 1,
    faction: "automaton",
    intentPattern: [
      { kind: "attack", damage: 8, text: "Chainsaw 8" },
      { kind: "attack", damage: 5, text: "Slam 5" },
    ],
  },
  hulk: {
    id: "hulk",
    name: "Hulk Scorcher",
    hp: 38,
    armor: 4,
    faction: "automaton",
    intentPattern: [
      { kind: "attack_all", damage: 5, text: "Flamer — All 5" },
      { kind: "attack", damage: 8, text: "Stomp 8" },
      { kind: "wait", text: "Charging..." },
    ],
  },
  tank: {
    id: "tank",
    name: "Annihilator Tank",
    hp: 50,
    armor: 5,
    faction: "automaton",
    intentPattern: [
      { kind: "wait", text: "Aiming..." },
      { kind: "attack", damage: 14, text: "Cannon 14" },
      { kind: "buff", text: "Stabilizers (+2 Armor)" },
    ],
  },
  factory_strider: {
    id: "factory_strider",
    name: "Factory Strider",
    hp: 100,
    armor: 5,
    faction: "automaton",
    isBoss: true,
    intentPattern: [
      { kind: "attack_all", damage: 6, text: "Belly Cannons — All 6" },
      { kind: "attack", damage: 14, text: "Eye Laser 14" },
      { kind: "buff", text: "Reinforce (+2 Armor)" },
      { kind: "attack", damage: 10, text: "Rocket Pods 10" },
    ],
    enragedMessage: "FACTORY STRIDER OVERLOAD. TURRETS ENGAGING.",
    enragedPattern: [
      { kind: "attack_all", damage: 10, text: "Cannons — All 10" },
      { kind: "attack", damage: 18, text: "Plasma Lance 18" },
      { kind: "attack_all", damage: 6, text: "Mortars — All 6" },
    ],
  },

  // ───── ILLUMINATE ─────
  voteless: {
    id: "voteless",
    name: "Voteless",
    hp: 7,
    armor: 0,
    faction: "illuminate",
    intentPattern: [
      { kind: "attack", damage: 2, text: "Swarm 2" },
      { kind: "attack", damage: 3, text: "Claw 3" },
    ],
  },
  watcher: {
    id: "watcher",
    name: "Watcher",
    hp: 10,
    armor: 0,
    shield: 4,
    faction: "illuminate",
    intentPattern: [
      { kind: "attack", damage: 3, text: "Beacon 3" },
      { kind: "wait", text: "Calling reinforcements..." },
    ],
  },
  overseer: {
    id: "overseer",
    name: "Overseer",
    hp: 18,
    armor: 1,
    shield: 6,
    faction: "illuminate",
    intentPattern: [
      { kind: "attack", damage: 5, text: "Plasma 5" },
      { kind: "buff", text: "Shielding (+3 Shield)" },
      { kind: "attack_all", damage: 3, text: "Pulse — All 3" },
    ],
  },
  harvester: {
    id: "harvester",
    name: "Harvester",
    hp: 42,
    armor: 2,
    shield: 8,
    faction: "illuminate",
    intentPattern: [
      { kind: "attack_all", damage: 5, text: "Beam Sweep — All 5" },
      { kind: "attack", damage: 10, text: "Plasma Cannon 10" },
      { kind: "wait", text: "Charging..." },
    ],
  },
  leviathan: {
    id: "leviathan",
    name: "Leviathan",
    hp: 95,
    armor: 3,
    shield: 18,
    faction: "illuminate",
    isBoss: true,
    intentPattern: [
      { kind: "attack", damage: 13, text: "Tractor Beam 13" },
      { kind: "attack_all", damage: 8, text: "Plasma Bombardment — All 8" },
      { kind: "buff", text: "Void Shield (+8)" },
      { kind: "attack", damage: 11, text: "Lance Volley 11" },
    ],
    enragedMessage: "LEVIATHAN BREACH. ALL HANDS — BRACE.",
    enragedPattern: [
      { kind: "attack", damage: 18, text: "Annihilation Beam 18" },
      { kind: "attack_all", damage: 12, text: "Orbital Strike — All 12" },
      { kind: "buff", text: "Void Shield (+12)" },
    ],
  },
};

function difficultyScale(difficulty: number) {
  // 1 → 1.0, 5 → 1.7, 10 → 2.55 (much steeper)
  const hp = 1.0 + (difficulty - 1) * 0.17;
  const dmg = 1.0 + (difficulty - 1) * 0.15;
  return { hp, dmg };
}

export function instantiateEnemy(templateId: string, difficulty: number = 3): Enemy {
  const t = ENEMY_TEMPLATES[templateId];
  if (!t) throw new Error(`Unknown enemy: ${templateId}`);
  const scale = difficultyScale(difficulty);
  const hp = Math.max(1, Math.round(t.hp * scale.hp));

  const scaleIntents = (intents = t.intentPattern) =>
    intents.map((i) => ({
      ...i,
      damage: i.damage !== undefined ? Math.round(i.damage * scale.dmg) : i.damage,
    }));

  return {
    id: `${templateId}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: t.id,
    name: t.name,
    hp,
    maxHp: hp,
    armor: t.armor,
    burn: 0,
    shield: t.shield ?? 0,
    intents: scaleIntents(),
    intentIndex: 0,
    enraged: false,
    enragedPattern: t.enragedPattern ? scaleIntents(t.enragedPattern) : undefined,
    enragedMessage: t.enragedMessage,
    isBoss: t.isBoss,
    faction: t.faction,
  };
}

interface MapEntry {
  type: MapNode["type"];
  enemies: string[];
}

const MAPS: Record<Faction, MapEntry[]> = {
  terminid: [
    { type: "combat", enemies: ["scavenger", "scavenger"] },
    { type: "combat", enemies: ["scavenger", "hunter"] },
    { type: "combat", enemies: ["hunter", "hunter", "scavenger"] },
    { type: "elite", enemies: ["warrior", "scavenger"] },
    { type: "rest", enemies: [] },
    { type: "combat", enemies: ["bile_spewer", "hunter"] },
    { type: "combat", enemies: ["brood_commander", "hunter"] },
    { type: "elite", enemies: ["charger"] },
    { type: "combat", enemies: ["stalker", "warrior"] },
    { type: "rest", enemies: [] },
    { type: "boss", enemies: ["bile_titan"] },
  ],
  automaton: [
    { type: "combat", enemies: ["trooper", "trooper"] },
    { type: "combat", enemies: ["trooper", "scout_strider"] },
    { type: "combat", enemies: ["scout_strider", "scout_strider", "trooper"] },
    { type: "elite", enemies: ["devastator", "trooper"] },
    { type: "rest", enemies: [] },
    { type: "combat", enemies: ["berserker", "trooper"] },
    { type: "combat", enemies: ["devastator", "scout_strider"] },
    { type: "elite", enemies: ["hulk"] },
    { type: "combat", enemies: ["devastator", "berserker"] },
    { type: "rest", enemies: [] },
    { type: "boss", enemies: ["factory_strider"] },
  ],
  illuminate: [
    { type: "combat", enemies: ["voteless", "voteless"] },
    { type: "combat", enemies: ["voteless", "watcher"] },
    { type: "combat", enemies: ["watcher", "voteless", "voteless"] },
    { type: "elite", enemies: ["overseer"] },
    { type: "rest", enemies: [] },
    { type: "combat", enemies: ["overseer", "voteless"] },
    { type: "combat", enemies: ["watcher", "watcher", "voteless"] },
    { type: "elite", enemies: ["overseer", "watcher"] },
    { type: "combat", enemies: ["harvester"] },
    { type: "rest", enemies: [] },
    { type: "boss", enemies: ["leviathan"] },
  ],
};

export function generateMap(faction: Faction = "terminid", modifiers: string[] = []): MapNode[] {
  const layout = MAPS[faction];
  const extraEnemy = modifiers.includes("patrol_frequency");
  return layout.map((entry, i) => {
    let enemies = [...entry.enemies];
    if (extraEnemy && enemies.length > 0 && entry.type !== "boss" && entry.type !== "rest") {
      // add a basic enemy of the same faction
      const filler = faction === "terminid" ? "scavenger" : faction === "automaton" ? "trooper" : "voteless";
      enemies.push(filler);
    }
    return {
      index: i,
      tier: 0,
      col: 0,
      type: entry.type,
      enemyTemplateIds: enemies,
      children: [],
      cleared: false,
    };
  });
}

export const PLANETS: Record<Faction, { name: string; biome: string; description: string }> = {
  terminid: {
    name: "ZAGON PRIME",
    biome: "Sandy Mesa · Mirin Sector",
    description: "Heavy Terminid presence. Bile Titans confirmed at the hive cluster.",
  },
  automaton: {
    name: "CHOOHE",
    biome: "Sandy Mesa · Lacaille Sector",
    description: "Heavy Automaton armor entrenched. Factory Strider sighted. Anti-tank essential.",
  },
  illuminate: {
    name: "GENESIS PRIME",
    biome: "Shadowed Jungle · Rictus Sector",
    description: "Illuminate cult stronghold. Phase shields prevalent. Shield-piercing recommended.",
  },
};
