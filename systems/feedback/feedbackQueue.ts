/**
 * GAME FEEL · Feedback queue
 * ──────────────────────────────────────────────────────────────────────
 * Zustand store of recent feedback events. The toast-style EventFeed +
 * VFX components subscribe to this and render based on the live queue.
 *
 *   - feed:   visible event list (capped, ordered newest-first)
 *   - shake:  active screen-shake amplitude (one effect at a time, latest wins)
 *   - flash:  active full-screen flash (latest wins)
 *
 * Items auto-expire after their preset's expiry duration.
 */

import { create } from "zustand";
import type { FeedbackEvent, FeedbackEventType } from "./feedbackTypes";

const MAX_FEED = 8;

export interface QueueShake {
  /** Pixels of shake amplitude. */
  amp: number;
  /** Wall clock when shake started. */
  startedAt: number;
  /** Total duration in ms. */
  durationMs: number;
  /** Token to retrigger the wrapper component. */
  key: number;
}

export interface QueueFlash {
  color: string;
  opacity: number;
  startedAt: number;
  durationMs: number;
  key: number;
}

/**
 * Snapshot of a card that should fly to the center stage.
 *   kind = "play" → first deployment (full glow + DEPLOYED tag, longer hold)
 *   kind = "tick" → subsequent activation (subtler glow + ACTIVATING tag, shorter hold)
 */
export interface PlayedCardSnapshot {
  cardId: string;
  cardName: string;
  cardType: string;
  kind: "play" | "tick";
  key: number;
}

interface QueueState {
  feed: FeedbackEvent[];
  shake: QueueShake | null;
  flash: QueueFlash | null;
  /** The snapshot currently being shown center-stage. */
  playedCard: PlayedCardSnapshot | null;
  /** FIFO queue of pending snapshots waiting for their turn. */
  playedCardQueue: PlayedCardSnapshot[];

  pushEvent: (e: FeedbackEvent) => void;
  removeEvent: (id: string) => void;
  setShake: (s: QueueShake | null) => void;
  setFlash: (f: QueueFlash | null) => void;
  /** Push a card snapshot onto the played-card queue. */
  pushPlayedCard: (snapshot: Omit<PlayedCardSnapshot, "key">) => void;
  /** Pop the head and promote the next pending snapshot (called when hold expires). */
  advancePlayedCard: () => void;
  clearAll: () => void;
}

let counter = 0;
export function nextFeedbackId(): string {
  return `fb_${Date.now().toString(36)}_${counter++}`;
}

let playedCardKey = 0;

export const useFeedbackQueue = create<QueueState>((set) => ({
  feed: [],
  shake: null,
  flash: null,
  playedCard: null,
  playedCardQueue: [],

  pushEvent: (e) =>
    set((s) => ({
      feed: [e, ...s.feed].slice(0, MAX_FEED),
    })),
  removeEvent: (id) =>
    set((s) => ({ feed: s.feed.filter((e) => e.id !== id) })),
  setShake: (sh) => set({ shake: sh }),
  setFlash: (fl) => set({ flash: fl }),
  pushPlayedCard: (snapshot) =>
    set((s) => {
      const fullSnapshot: PlayedCardSnapshot = { ...snapshot, key: ++playedCardKey };
      // If nothing is on stage, promote immediately. Otherwise queue.
      if (!s.playedCard) {
        return { playedCard: fullSnapshot };
      }
      return { playedCardQueue: [...s.playedCardQueue, fullSnapshot] };
    }),
  advancePlayedCard: () =>
    set((s) => {
      if (s.playedCardQueue.length > 0) {
        const [next, ...rest] = s.playedCardQueue;
        return { playedCard: next, playedCardQueue: rest };
      }
      return { playedCard: null };
    }),
  clearAll: () =>
    set({ feed: [], shake: null, flash: null, playedCard: null, playedCardQueue: [] }),
}));
