/**
 * AI ENEMY INTENT SYSTEM · queue store
 * ──────────────────────────────────────────────────────────────────────
 * Lightweight Zustand store for transient telegraph state — interrupts,
 * "boss enraged this turn" flashes, and last-seen intent cache for the
 * timeline component.
 *
 * The combat engine (lib/store.ts) remains the source of truth for
 * `Enemy.intentIndex` and HP. This store only holds *display-only*
 * adornments derived per-turn.
 */

import { create } from "zustand";
import type {
  IntentInterruptReason,
  TelegraphEntry,
  RichEnemyIntent,
} from "./intentTypes";

interface IntentQueueState {
  /** Per-enemy telegraph cache, keyed by enemy.id */
  telegraphs: Record<string, TelegraphEntry>;
  /** Recent enrage flashes — used to play the cinematic banner once. */
  enragedRecent: Record<string, number>; // enemyId → wall-clock

  setTelegraph: (
    enemyId: string,
    current: RichEnemyIntent,
    next?: RichEnemyIntent,
    afterNext?: RichEnemyIntent,
  ) => void;
  markInterrupted: (enemyId: string, reason: IntentInterruptReason) => void;
  clearInterrupt: (enemyId: string) => void;
  recordEnrage: (enemyId: string) => void;
  hasRecentEnrage: (enemyId: string, withinMs?: number) => boolean;
  clearAll: () => void;
}

export const useIntentQueue = create<IntentQueueState>((set, get) => ({
  telegraphs: {},
  enragedRecent: {},

  setTelegraph: (enemyId, current, next, afterNext) =>
    set((s) => ({
      telegraphs: {
        ...s.telegraphs,
        [enemyId]: {
          enemyId,
          current,
          next,
          afterNext,
          interruptedReason: s.telegraphs[enemyId]?.interruptedReason,
          refreshedAt: Date.now(),
        },
      },
    })),

  markInterrupted: (enemyId, reason) =>
    set((s) => {
      const existing = s.telegraphs[enemyId];
      if (!existing) return {};
      return {
        telegraphs: {
          ...s.telegraphs,
          [enemyId]: { ...existing, interruptedReason: reason, refreshedAt: Date.now() },
        },
      };
    }),

  clearInterrupt: (enemyId) =>
    set((s) => {
      const existing = s.telegraphs[enemyId];
      if (!existing || !existing.interruptedReason) return {};
      const { interruptedReason: _ignored, ...rest } = existing;
      void _ignored;
      return {
        telegraphs: { ...s.telegraphs, [enemyId]: { ...rest, refreshedAt: Date.now() } },
      };
    }),

  recordEnrage: (enemyId) =>
    set((s) => ({ enragedRecent: { ...s.enragedRecent, [enemyId]: Date.now() } })),

  hasRecentEnrage: (enemyId, withinMs = 1500) => {
    const t = get().enragedRecent[enemyId];
    if (!t) return false;
    return Date.now() - t < withinMs;
  },

  clearAll: () => set({ telegraphs: {}, enragedRecent: {} }),
}));
