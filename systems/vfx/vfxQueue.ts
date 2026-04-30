/**
 * VFX queue — Zustand store of currently-active visual effects.
 * The VFXLayer subscribes and renders each entry; the manager pushes
 * + auto-removes after each entry's duration.
 */

import { create } from "zustand";
import type { VFXEvent } from "./vfxTypes";

interface VFXQueueState {
  active: VFXEvent[];
  push: (e: VFXEvent) => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

export const useVFXQueue = create<VFXQueueState>((set) => ({
  active: [],
  push: (e) => set((s) => ({ active: [...s.active, e] })),
  remove: (id) => set((s) => ({ active: s.active.filter((x) => x.id !== id) })),
  clearAll: () => set({ active: [] }),
}));

let _counter = 0;
export function nextVfxId(): string {
  return `vfx_${Date.now().toString(36)}_${_counter++}`;
}
