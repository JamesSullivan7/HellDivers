import { create } from "zustand";
import { AnimationEvent } from "./animationTypes";

interface QueueState {
  /** Events waiting to play. FIFO. */
  queue: AnimationEvent[];
  /** Currently playing event. Components subscribe to this to render effects. */
  active: AnimationEvent | null;

  /** Push a new animation event. */
  push: (event: Omit<AnimationEvent, "id"> & { id?: string }) => void;
  /** Mark current `active` as complete and advance to the next event. */
  advance: () => void;
  /** Drop everything (called on combat end / unmount). */
  clear: () => void;
}

let counter = 0;
const nextId = () => `anim_${Date.now().toString(36)}_${counter++}`;

export const useAnimationQueue = create<QueueState>((set, get) => ({
  queue: [],
  active: null,

  push: (event) => {
    const full: AnimationEvent = {
      id: event.id ?? nextId(),
      kind: event.kind,
      payload: event.payload,
      duration: event.duration,
    };
    set((s) => {
      // If nothing is active, start this immediately.
      if (!s.active) {
        return { active: { ...full, startedAt: Date.now() } };
      }
      return { queue: [...s.queue, full] };
    });
  },

  advance: () => {
    set((s) => {
      const [next, ...rest] = s.queue;
      if (!next) return { active: null, queue: [] };
      return { active: { ...next, startedAt: Date.now() }, queue: rest };
    });
  },

  clear: () => set({ active: null, queue: [] }),
}));
