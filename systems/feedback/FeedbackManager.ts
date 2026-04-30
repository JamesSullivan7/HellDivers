/**
 * GAME FEEL · Feedback manager
 * ──────────────────────────────────────────────────────────────────────
 * Single dispatch entry point: triggerFeedback(eventInput).
 *
 * Per event, the manager:
 *   - assigns id + at
 *   - pushes to feedback queue (drives toast feed + VFX)
 *   - fires sound hook (selectSoundHook → playSound)
 *   - applies tension delta (useTension)
 *   - schedules screen shake (queue.setShake)
 *   - schedules impact flash (queue.setFlash)
 *   - auto-removes from feed after expiry
 *   - respects prefers-reduced-motion (skips shake + flash)
 *
 * Public surface is intentionally tiny — call triggerFeedback(...) from
 * anywhere (store actions, click handlers, animation callbacks).
 */

import { useTension } from "@/lib/tension";
import {
  FEED_EXPIRY,
  getFlashProfile,
  getShakeProfile,
  getTensionDelta,
  playSound,
  selectSoundHook,
} from "./feedbackPresets";
import type { FeedbackEvent, FeedbackEventInput } from "./feedbackTypes";
import { nextFeedbackId, useFeedbackQueue } from "./feedbackQueue";

let shakeKey = 0;
let flashKey = 0;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function triggerFeedback(input: FeedbackEventInput): FeedbackEvent {
  const event: FeedbackEvent = {
    id: input.id ?? nextFeedbackId(),
    type: input.type,
    intensity: input.intensity,
    targetId: input.targetId,
    sourceId: input.sourceId,
    payload: input.payload,
    at: input.at ?? Date.now(),
  };

  const reduced = prefersReducedMotion();
  const queue = useFeedbackQueue.getState();

  // 1. SOUND HOOK
  const soundId = selectSoundHook(event.type, event.intensity, event.payload);
  if (soundId) {
    try { playSound(soundId); } catch { /* ignore */ }
  }

  // 2. TENSION DELTA
  const td = getTensionDelta(event.type, event.intensity);
  if (td) {
    const ten = useTension.getState();
    if (td.amount > 0) ten.addTension(td.amount, td.source);
    else if (td.amount < 0) ten.reduceTension(-td.amount, td.source);
  }

  // 3. EVENT FEED
  const expiry = FEED_EXPIRY[event.type] ?? 0;
  if (expiry > 0) {
    queue.pushEvent(event);
    setTimeout(() => {
      // Best-effort cleanup. If the user already cleared, this is a no-op.
      useFeedbackQueue.getState().removeEvent(event.id);
    }, expiry);
  }

  // 4. SCREEN SHAKE
  if (!reduced) {
    const sp = getShakeProfile(event.type, event.intensity);
    if (sp.amp > 0) {
      queue.setShake({
        amp: sp.amp,
        durationMs: sp.durationMs,
        startedAt: Date.now(),
        key: ++shakeKey,
      });
      window.setTimeout(() => {
        const cur = useFeedbackQueue.getState().shake;
        if (cur && cur.key === shakeKey) useFeedbackQueue.getState().setShake(null);
      }, sp.durationMs + 40);
    }
  }

  // 5. IMPACT FLASH
  if (!reduced) {
    const fp = getFlashProfile(event.type, event.intensity);
    if (fp) {
      queue.setFlash({
        color: fp.color,
        opacity: fp.opacity,
        durationMs: fp.durationMs,
        startedAt: Date.now(),
        key: ++flashKey,
      });
      window.setTimeout(() => {
        const cur = useFeedbackQueue.getState().flash;
        if (cur && cur.key === flashKey) useFeedbackQueue.getState().setFlash(null);
      }, fp.durationMs + 40);
    }
  }

  return event;
}

/** Convenience helpers for the most common dispatches. */
export const feedback = {
  cardHover: () =>
    triggerFeedback({ type: "card_hover", intensity: "low" }),
  cardPlay: (
    cardName: string,
    cardType: string,
    intensity: "low" | "medium" | "high" | "critical" = "medium",
    cardId?: string,
  ) => {
    // Push the snapshot so the center stage flies the card in.
    if (cardId) {
      useFeedbackQueue.getState().pushPlayedCard({
        cardId, cardName, cardType, kind: "play",
      });
    }
    return triggerFeedback({
      type: "card_play",
      intensity,
      payload: { cardName, cardType, cardId, text: `${cardName.toUpperCase()} deployed` },
    });
  },
  /**
   * Tick — a persistent stratagem (sentry, recurring orbital, etc.) firing on
   * its scheduled turn. Shows the card on the center stage with a subtler
   * "ACTIVATING" treatment instead of "DEPLOYED".
   */
  cardTick: (cardId: string, cardName: string, cardType: string) => {
    useFeedbackQueue.getState().pushPlayedCard({
      cardId, cardName, cardType, kind: "tick",
    });
    // Add a compact toast entry — easier to read than the log
    triggerFeedback({
      type: "card_play",
      intensity: "low",
      payload: { cardName, cardType, cardId, text: `${cardName.toUpperCase()} · ACTIVATING` },
    });
  },
  damage: (amount: number, targetName: string, intensity: "low" | "medium" | "high" | "critical" = "medium") =>
    triggerFeedback({
      type: amount >= 18 ? "critical_hit" : "damage_hit",
      intensity: amount >= 18 ? "critical" : intensity,
      payload: { damage: amount, text: `${targetName.toUpperCase()} takes ${amount} damage` },
    }),
  blocked: (amount: number, targetName: string) =>
    triggerFeedback({
      type: "blocked_hit",
      intensity: "low",
      payload: { damage: amount, text: `${targetName.toUpperCase()} · BLOCKED` },
    }),
  shieldBreak: (targetName: string) =>
    triggerFeedback({
      type: "shield_break",
      intensity: "high",
      payload: { text: `${targetName.toUpperCase()} · SHIELD BROKEN` },
    }),
  enemyAttack: (amount: number, attackerName: string) =>
    triggerFeedback({
      type: "enemy_attack",
      intensity:
        amount >= 14 ? "critical" :
        amount >= 8  ? "high" :
        amount >= 4  ? "medium" : "low",
      payload: { damage: amount, text: `${attackerName.toUpperCase()} hits for ${amount}` },
    }),
  endTurn: () =>
    triggerFeedback({ type: "end_turn", intensity: "low", payload: { text: "TURN ENDED" } }),
  bossEnrage: (bossName: string) =>
    triggerFeedback({
      type: "boss_enrage",
      intensity: "critical",
      payload: { text: `${bossName.toUpperCase()} · ENRAGED` },
    }),
  reward: (amount: number, kind: "medals" | "samples" | "requisition" = "medals") =>
    triggerFeedback({
      type: "reward_gain",
      intensity: amount >= 200 ? "high" : "medium",
      payload: {
        text: `+${amount} ${kind.toUpperCase()}`,
        ...(kind === "medals" ? { medals: amount } : kind === "samples" ? { samples: amount } : { requisition: amount }),
      },
    }),
  objectiveComplete: (label: string, medalsBonus: number) =>
    triggerFeedback({
      type: "objective_complete",
      intensity: "high",
      payload: { text: `OBJECTIVE · ${label.toUpperCase()} · +${medalsBonus}M` },
    }),
  choiceSelect: (label: string) =>
    triggerFeedback({
      type: "choice_select",
      intensity: "medium",
      payload: { text: `${label.toUpperCase()} · LOGGED` },
    }),
  victory: () =>
    triggerFeedback({ type: "victory", intensity: "critical", payload: { text: "VICTORY · MISSION ACCOMPLISHED" } }),
  defeat: () =>
    triggerFeedback({ type: "defeat", intensity: "critical", payload: { text: "HELLDIVER KIA" } }),
};
