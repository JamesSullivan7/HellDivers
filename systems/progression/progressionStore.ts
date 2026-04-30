/**
 * PROGRESSION SYSTEM · transient state store
 * ──────────────────────────────────────────────────────────────────────
 * The persistent player profile lives in `useGame.account` (lib/store.ts)
 * with localStorage backing via lib/account.ts.
 *
 * THIS store holds only the *transient* progression UX state:
 *
 *   pendingRewards    — RunRewards just awarded, queued for the
 *                       PostRunSummary cinematic
 *   notifications     — UnlockNotification queue (level-ups + new unlocks)
 *   unlockRevealOpen  — controls the cinematic modal
 *   activeReveal      — currently-displayed unlock id (null when hidden)
 *
 * Actions:
 *   queueReward / consumeReward          — for PostRunSummary
 *   pushNotification / dismissNotification
 *   markUnlockViewed                     — flips `viewed: true`
 *   openReveal / closeReveal
 *   clearAll                             — clean slate (e.g. new account)
 */

import { create } from "zustand";
import type {
  RunRewards,
  UnlockNotification,
} from "./progressionTypes";

// Capped queue depth — the cinematic should never play 50 in a row.
const MAX_NOTIFICATIONS = 20;

interface ProgressionStoreState {
  pendingRewards: RunRewards | null;
  notifications: UnlockNotification[];
  unlockRevealOpen: boolean;
  activeReveal: UnlockNotification | null;

  queueReward: (r: RunRewards) => void;
  consumeReward: () => RunRewards | null;

  pushNotification: (n: Omit<UnlockNotification, "id" | "at" | "viewed">) => UnlockNotification;
  dismissNotification: (id: string) => void;
  markUnlockViewed: (id: string) => void;

  openReveal: (n: UnlockNotification) => void;
  closeReveal: () => void;

  clearAll: () => void;
}

let _counter = 0;
function nextNotifId(): string {
  return `un_${Date.now().toString(36)}_${_counter++}`;
}

export const useProgressionStore = create<ProgressionStoreState>((set, get) => ({
  pendingRewards: null,
  notifications: [],
  unlockRevealOpen: false,
  activeReveal: null,

  queueReward: (r) => set({ pendingRewards: r }),

  consumeReward: () => {
    const cur = get().pendingRewards;
    set({ pendingRewards: null });
    return cur;
  },

  pushNotification: (n) => {
    const note: UnlockNotification = {
      id: nextNotifId(),
      at: Date.now(),
      viewed: false,
      ...n,
    };
    set((s) => ({
      notifications: [note, ...s.notifications].slice(0, MAX_NOTIFICATIONS),
    }));
    return note;
  },

  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  markUnlockViewed: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, viewed: true } : n,
      ),
    })),

  openReveal: (n) => set({ activeReveal: n, unlockRevealOpen: true }),
  closeReveal: () =>
    set((s) => {
      // Mark viewed on close so the same notification doesn't re-trigger.
      const id = s.activeReveal?.id;
      return {
        activeReveal: null,
        unlockRevealOpen: false,
        notifications: id
          ? s.notifications.map((n) => (n.id === id ? { ...n, viewed: true } : n))
          : s.notifications,
      };
    }),

  clearAll: () =>
    set({
      pendingRewards: null,
      notifications: [],
      unlockRevealOpen: false,
      activeReveal: null,
    }),
}));
