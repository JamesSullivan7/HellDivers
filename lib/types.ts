export type CardType =
  | "eagle"
  | "orbital"
  | "sentry"
  | "support"
  | "backpack"
  | "utility";

export type Rarity = "common" | "uncommon" | "rare";

export type TargetMode = "single" | "all" | "self" | "random" | "highest_hp";

export interface CardEffect {
  damage?: number;
  damageHits?: number;
  burn?: number;
  block?: number;
  heal?: number;
  draw?: number;
  gainRequisition?: number;
  ignoreArmor?: boolean;
  bonusVsArmor?: number;
  recurringDamage?: { amount: number; turns: number; targetAll?: boolean };
  exhaust?: boolean;
  selfDamage?: number;
  chain?: number;
  stripShield?: number;
}

export type ArrowKey = "U" | "D" | "L" | "R";

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  target: TargetMode;
  description: string;
  rarity: Rarity;
  effect: CardEffect;
  code?: ArrowKey[];
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  requisition: number;
  maxRequisition: number;
  block: number;
  reinforcements: number;
}

export interface EnemyIntent {
  kind: "attack" | "attack_all" | "buff" | "armor" | "wait";
  damage?: number;
  text: string;
}

export type Faction = "terminid" | "automaton" | "illuminate";

export interface Enemy {
  id: string;
  templateId: string;
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  burn: number;
  shield: number;
  intents: EnemyIntent[];
  intentIndex: number;
  enraged?: boolean;
  enragedPattern?: EnemyIntent[];
  enragedMessage?: string;
  isBoss?: boolean;
  faction: Faction;
}

export interface EnemyTemplate {
  id: string;
  name: string;
  hp: number;
  armor: number;
  shield?: number;
  intentPattern: EnemyIntent[];
  enragedPattern?: EnemyIntent[];
  enragedMessage?: string;
  isBoss?: boolean;
  faction: Faction;
}

export interface ActiveSentry {
  id: string;
  cardId: string;
  name: string;
  damage: number;
  turnsLeft: number;
  targetAll: boolean;
}

export type NodeType = "combat" | "elite" | "rest" | "boss" | "shop";

export interface MapNode {
  index: number;
  type: NodeType;
  enemyTemplateIds: string[];
  cleared: boolean;
}

export type GamePhase =
  | "menu"
  | "armory"
  | "squad_hub"
  | "squad_lobby"
  | "coop_combat"
  | "faction"
  | "loadout"
  | "map"
  | "combat"
  | "reward"
  | "rest"
  | "gameover"
  | "victory";

export type ArmorClass = "scout" | "frontline" | "fortified";

export interface Armor {
  id: ArmorClass;
  name: string;
  passive: string;
  hpMod: number;
  handMod: number;
  startingBlock: number;
  reqMod: number;
}

export interface Weapon {
  id: string;
  name: string;
  description: string;
  damage: number;
  hitsPerTurn: number;
  target: "highest_hp" | "random" | "all";
  cooldown?: number; // 0 = every turn, 1 = every other turn
  ignoreArmor?: boolean;
}

export interface Booster {
  id: string;
  name: string;
  description: string;
}

export interface CombatState {
  enemies: Enemy[];
  deck: Card[];
  hand: Card[];
  discard: Card[];
  exhausted: Card[];
  sentries: ActiveSentry[];
  turn: number;
  selectedCardIndex: number | null;
  log: string[];
}
