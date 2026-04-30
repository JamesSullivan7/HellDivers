/**
 * Transition store — current snapshot of an in-flight transition.
 * Drives the overlay components and the page wrapper.
 */

import { create } from "zustand";
import type { TransitionSnapshot } from "./transitionTypes";

interface TransitionState {
  active: TransitionSnapshot | null;
  begin: (s: TransitionSnapshot) => void;
  end: () => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  active: null,
  begin: (s) => set({ active: s }),
  end: () => set({ active: null }),
}));

let _key = 0;
export function nextTransitionKey(): number {
  return ++_key;
}
