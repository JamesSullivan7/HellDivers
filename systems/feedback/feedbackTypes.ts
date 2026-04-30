/**
 * GAME FEEL · Feedback type model
 * ──────────────────────────────────────────────────────────────────────
 * Authoritative event shape for every UI/combat feedback dispatch. The
 * FeedbackManager uses these to fan out to sound, tension, screen shake,
 * the toast feed, and any subscribed VFX components.
 *
 * Rule: event types are the *user-facing intent*. The manager decides how
 * to translate that into sound/tension/visual deltas via feedbackPresets.
 */

export type FeedbackEventType =
  | "card_hover"
  | "card_play"
  | "target_select"
  | "damage_hit"
  | "critical_hit"
  | "blocked_hit"
  | "status_apply"
  | "shield_break"
  | "enemy_attack"
  | "end_turn"
  | "boss_enrage"
  | "reward_gain"
  | "choice_select"
  | "objective_complete"
  | "victory"
  | "defeat";

export type FeedbackIntensity = "low" | "medium" | "high" | "critical";

export type StatusKind = "burn" | "stun" | "gas" | "shield" | "poison";

/**
 * Optional payload — additional context per event. Each event type uses
 * a subset; consumers should treat unknown fields as ignorable.
 */
export interface FeedbackPayload {
  /** For damage events: the amount of damage. */
  damage?: number;
  /** For status events: which status was applied. */
  status?: StatusKind;
  /** For card events: the card name/id. */
  cardId?: string;
  cardName?: string;
  /** For card events: rough card category (eagle/orbital/etc.) for sfx routing. */
  cardType?: string;
  /** Free-form display text used by the event feed when present. */
  text?: string;
  /** Currency-style payloads for reward events. */
  medals?: number;
  samples?: number;
  requisition?: number;
  /** Catch-all for ad-hoc data — kept loose by spec. */
  [key: string]: unknown;
}

export interface FeedbackEvent {
  /** Unique id — auto-assigned by the manager if omitted on dispatch. */
  id: string;
  type: FeedbackEventType;
  intensity: FeedbackIntensity;
  /** Entity receiving the action (enemy id, player, etc.). */
  targetId?: string;
  /** Entity originating the action (card id, enemy id, etc.). */
  sourceId?: string;
  payload?: FeedbackPayload;
  /** Wall-clock at dispatch — set by manager. */
  at: number;
}

/** Input shape passed to triggerFeedback() — id + at are filled in by the manager. */
export type FeedbackEventInput = Omit<FeedbackEvent, "id" | "at"> & {
  id?: string;
  at?: number;
};
