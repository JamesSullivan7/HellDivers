"use client";

import { useVFXQueue } from "@/systems/vfx/vfxQueue";
import { triggerVFX, clearVFX, clearAllVFX, vfx } from "@/systems/vfx/VFXManager";

/** Bundled hook for components that want VFX dispatch + queue subscription. */
export function useVFX() {
  const active = useVFXQueue((s) => s.active);
  return { active, trigger: triggerVFX, clear: clearVFX, clearAll: clearAllVFX, ...vfx };
}
