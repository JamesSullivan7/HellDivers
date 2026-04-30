/**
 * Combat events — discriminated union of every meaningful state change.
 *
 * RULES:
 *   - UI never mutates state directly. UI calls `dispatch(event)`.
 *   - The reducer (game/engine/combatReducer) interprets each event purely.
 *   - Side effects (sound, animations) are derived by middleware observing
 *     state changes, not from inside the reducer.
 *
 * This file is the public contract between UI and game logic. It is also
 * imported by Convex coop functions so client + server agree on shapes.
 */

import type { Card } from "@/lib/types";

// ── HIGH-LEVEL EVENTS (player / system intentions) ──

export interface PlayCardEvent {
  type: "PLAY_CARD";
  handIndex: number;
  enemyId?: string;
  /** Damage/heal/effect multiplier (e.g. 1.3 from stratagem code crit). */
  multiplier: number;
}

export interface EndTurnEvent {
  type: "END_TURN";
}

export interface EnterNodeEvent {
  type: "ENTER_NODE";
  nodeIndex: number;
}

export interface SelectCardEvent {
  type: "SELECT_CARD";
  handIndex: number | null;
}

export interface BeginPlayCardEvent {
  type: "BEGIN_PLAY_CARD";
  handIndex: number;
  enemyId?: string;
}

export interface ResolvePendingPlayEvent {
  type: "RESOLVE_PENDING_PLAY";
  multiplier: number;
}

export interface CancelPendingPlayEvent {
  type: "CANCEL_PENDING_PLAY";
}

export interface TakeRewardEvent {
  type: "TAKE_REWARD";
  card: Card | null;
}

export interface TakeRestEvent {
  type: "TAKE_REST";
}

// ── ATOMIC EVENTS (used internally by reducer or for fine-grained dispatch) ──

export interface ApplyDamageEvent {
  type: "APPLY_DAMAGE";
  targetId: string;
  amount: number;
  ignoreArmor?: boolean;
  bonusVsArmor?: number;
}

export interface ApplyBurnEvent {
  type: "APPLY_BURN";
  targetId: string;
  amount: number;
}

export interface StripShieldEvent {
  type: "STRIP_SHIELD";
  targetId: string;
  amount: number;
}

export interface DrawCardEvent {
  type: "DRAW_CARD";
  count: number;
}

export interface GainEnergyEvent {
  type: "GAIN_ENERGY";
  amount: number;
}

export interface GainBlockEvent {
  type: "GAIN_BLOCK";
  amount: number;
}

export interface HealEvent {
  type: "HEAL";
  amount: number;
}

export interface EnemyKiaEvent {
  type: "ENEMY_KIA";
  enemyId: string;
}

export interface BossEnragedEvent {
  type: "BOSS_ENRAGED";
  enemyId: string;
}

export interface PlayerKiaEvent {
  type: "PLAYER_KIA";
  reinforcementLeft: number;
}

// ── UNION ──

export type CombatEvent =
  | PlayCardEvent
  | EndTurnEvent
  | EnterNodeEvent
  | SelectCardEvent
  | BeginPlayCardEvent
  | ResolvePendingPlayEvent
  | CancelPendingPlayEvent
  | TakeRewardEvent
  | TakeRestEvent
  | ApplyDamageEvent
  | ApplyBurnEvent
  | StripShieldEvent
  | DrawCardEvent
  | GainEnergyEvent
  | GainBlockEvent
  | HealEvent
  | EnemyKiaEvent
  | BossEnragedEvent
  | PlayerKiaEvent;

export type CombatEventType = CombatEvent["type"];

/** Type-narrow helper. */
export function isCombatEvent(value: unknown): value is CombatEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
