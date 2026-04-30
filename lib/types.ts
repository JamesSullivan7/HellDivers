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

export type NodeType = "combat" | "elite" | "rest" | "boss" | "shop" | "event";

export interface MapNode {
  index: number;
  /** Tier in the branching tree (0 = drop, 5 = boss). */
  tier: number;
  /** X position within the tier — drives layout column. */
  col: number;
  type: NodeType;
  enemyTemplateIds: string[];
  /** Event id when type === "event". Resolved against EVENTS dict. */
  eventId?: string;
  /** Indices of nodes in the next tier this node connects to. */
  children: number[];
  cleared: boolean;
  /** Procedurally-generated atmospheric flavor text shown on hover/entry. */
  flavor?: string;
}

/** Run-wide buffs applied by choice events. */
export interface RunBuff {
  id: string;
  name: string;
  description: string;
  /** Lifetime: "run" persists for whole mission, "next_combat" expires after one combat. */
  lifetime: "run" | "next_combat";
  /** Effect kind handled by the combat reducer. */
  kind:
    | "extra_starting_block"
    | "max_hp_delta"
    | "extra_starting_r"
    | "eagle_cost_delta"
    | "free_card"
    | "draw_bonus"
    | "weapon_dmg_delta"
    | "starting_burn";
  amount: number;
  /** For "free_card", the card id to add. */
  payload?: string;
}

export interface MissionObjective {
  id: string;
  /** Display name shown to player. */
  description: string;
  /** Bonus medals on completion. */
  rewardMedals: number;
  /** What the objective tracks. */
  kind:
    | "kill_elites"
    | "deal_damage_in_turn"
    | "high_hp_finish"
    | "no_exhaust"
    | "win_in_turns"
    | "no_block_used"
    | "complete_events";
  /** Target value. */
  target: number;
  /** Current tracked value. */
  progress: number;
  completed: boolean;
}

export type GamePhase =
  | "menu"
  | "armory"
  | "character"
  | "codex"
  | "squad_hub"
  | "squad_lobby"
  | "coop_combat"
  | "faction"
  | "loadout"
  | "map"
  | "combat"
  | "reward"
  | "rest"
  | "event"
  | "shop"
  | "gameover"
  | "victory";

/** Armor weight class drives base passive/silhouette. */
export type ArmorClass = "scout" | "frontline" | "fortified";

export interface Armor {
  id: string;
  name: string;
  passive: string;
  /** Weight class — light / medium / heavy silhouette. */
  weightClass: ArmorClass;
  /** Helldivers-canonical passive name (Engineering Kit, Servo-Assisted, etc.) */
  passiveName?: string;
  hpMod: number;
  handMod: number;
  startingBlock: number;
  reqMod: number;
  /** Reinforcement bonus — used by Scout passive. */
  reinforcementBonus?: number;
  /** Bonus stim cards added to the run deck — used by Med-Kit. */
  bonusStims?: number;
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
