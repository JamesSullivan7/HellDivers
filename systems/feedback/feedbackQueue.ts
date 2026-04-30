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

interface QueueState {
  feed: FeedbackEvent[];
  shake: QueueShake | null;
  flash: QueueFlash | null;

  pushEvent: (e: FeedbackEvent) => void;
  removeEvent: (id: string) => void;
  setShake: (s: QueueShake | null) => void;
  setFlash: (f: QueueFlash | null) => void;
  clearAll: () => void;
}

let counter = 0;
export function nextFeedbackId(): string {
  return `fb_${Date.now().toString(36)}_${counter++}`;
}

export const useFeedbackQueue = create<QueueState>((set) => ({
  feed: [],
  shake: null,
  flash: null,

  pushEvent: (e) =>
    set((s) => ({
      feed: [e, ...s.feed].slice(0, MAX_FEED),
    })),
  removeEvent: (id) =>
    set((s) => ({ feed: s.feed.filter((e) => e.id !== id) })),
  setShake: (sh) => set({ shake: sh }),
  setFlash: (fl) => set({ flash: fl }),
  clearAll: () => set({ feed: [], shake: null, flash: null }),
}));
