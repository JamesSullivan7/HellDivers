// Animation event types — UI-side, derived from state changes by middleware/observers.
// Pure data. No React. No DOM.

export type AnimationKind =
  | "card_play"
  | "damage"
  | "enemy_attack"
  | "enemy_death"
  | "status_apply"
  | "boss_enrage"
  | "boss_big_attack";

export interface AnimationEvent<P = Record<string, unknown>> {
  /** Stable id for keying. */
  id: string;
  /** Kind of animation. */
  kind: AnimationKind;
  /** Payload — references to actors (enemyId, cardId, etc). */
  payload: P;
  /** Duration in ms. After this elapses, the runner advances the queue. */
  duration: number;
  /** Optional epoch ms when the runner started this event. */
  startedAt?: number;
}

export interface DamagePayload {
  targetId: string;
  amount: number;
  isCrit?: boolean;
  isBurn?: boolean;
}

export interface CardPlayPayload {
  cardId: string;
  handIndex: number;
  cardType: string;
}

export interface EnemyDeathPayload {
  enemyId: string;
}

export interface EnemyAttackPayload {
  enemyId: string;
  damage: number;
}

export interface StatusApplyPayload {
  targetId: string;
  status: string;
  stacks?: number;
}

export interface BossEnragePayload {
  enemyId: string;
}
