"use client";

/**
 * Hooks for components that need to know about an in-flight transition.
 *
 *   usePageTransition() → current snapshot or null
 *   useRouteTransition() → composed bundle for components that want
 *                          finer-grained access (snapshot + isActive +
 *                          remaining ms estimate)
 */

import { useTransitionStore } from "@/systems/transitions/transitionStore";

export function usePageTransition() {
  return useTransitionStore((s) => s.active);
}

export function useRouteTransition() {
  const active = useTransitionStore((s) => s.active);
  if (!active) {
    return { isActive: false, snapshot: null, remainingMs: 0 } as const;
  }
  const elapsed = Date.now() - active.startedAt;
  const remainingMs = Math.max(0, active.durationMs - elapsed);
  return { isActive: true, snapshot: active, remainingMs } as const;
}
