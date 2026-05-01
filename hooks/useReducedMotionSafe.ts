"use client";

/**
 * useReducedMotionSafe — single source of truth for "should I animate?"
 *
 * Combines:
 *   1. The OS `prefers-reduced-motion` media query
 *   2. The user-facing override in usePolishSettings.reducedMotion
 *
 * Returns `true` when EITHER is set, meaning the caller should suppress
 * heavy motion. Components should use this rather than reaching for the
 * media query directly.
 *
 * Bonus exports:
 *   useReducedFlashSafe()  — same pattern for flash
 *   useReducedShakeSafe()  — same pattern for shake
 *   useSimplifiedVfxSafe() — same pattern for VFX simplification
 */

import { useEffect, useState } from "react";
import { usePolishSettings } from "./usePolishSettings";

function osPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function useOSReducedMotion(): boolean {
  const [prefers, setPrefers] = useState<boolean>(osPrefersReducedMotion);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const handler = () => setPrefers(mq.matches);
    handler();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);
  return prefers;
}

// ──────────────────────────────────────────────────────────────────────
//  Combined accessors
// ──────────────────────────────────────────────────────────────────────
export function useReducedMotionSafe(): boolean {
  const os = useOSReducedMotion();
  const userOverride = usePolishSettings((s) => s.reducedMotion);
  return os || userOverride;
}

export function useReducedFlashSafe(): boolean {
  const os = useOSReducedMotion();
  const userOverride = usePolishSettings((s) => s.reducedFlash);
  // Flash also honors reduced-motion as a coarse fallback — anyone who
  // disabled motion almost certainly wants flashes off.
  return os || userOverride || usePolishSettings.getState().reducedMotion;
}

export function useReducedShakeSafe(): boolean {
  const os = useOSReducedMotion();
  const userOverride = usePolishSettings((s) => s.reducedShake);
  return os || userOverride || usePolishSettings.getState().reducedMotion;
}

export function useSimplifiedVfxSafe(): boolean {
  const os = useOSReducedMotion();
  const userOverride = usePolishSettings((s) => s.simplifiedVfx);
  return os || userOverride || usePolishSettings.getState().reducedMotion;
}
