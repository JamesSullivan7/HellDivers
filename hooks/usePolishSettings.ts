"use client";

/**
 * usePolishSettings — single store for player-facing polish + accessibility
 * preferences. Persists to localStorage so the choices survive reloads.
 *
 *   reducedMotion       — overrides OS pref; suppresses heavy motion
 *   reducedFlash        — suppresses screen flashes / strobes
 *   reducedShake        — suppresses screen shake
 *   largerText          — scales body text by 110%
 *   highContrast        — bumps borders + opacity for AA contrast
 *   simplifiedVfx       — caps concurrent VFX, disables overlays
 *   masterVolume        — 0..1
 *   musicVolume         — 0..1
 *   sfxVolume           — 0..1
 *   voiceVolume         — 0..1
 *
 * The store is intentionally separate from the existing useGame account
 * so opting into accessibility doesn't pollute the run/persistence shape.
 */

import { useEffect } from "react";
import { create } from "zustand";

export interface PolishSettingsState {
  reducedMotion: boolean;
  reducedFlash: boolean;
  reducedShake: boolean;
  largerText: boolean;
  highContrast: boolean;
  simplifiedVfx: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;

  setReducedMotion: (v: boolean) => void;
  setReducedFlash: (v: boolean) => void;
  setReducedShake: (v: boolean) => void;
  setLargerText: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setSimplifiedVfx: (v: boolean) => void;
  setVolume: (kind: "master" | "music" | "sfx" | "voice", value: number) => void;

  resetToDefaults: () => void;
}

const STORAGE_KEY = "helldivers_polish_settings";

const DEFAULTS = {
  reducedMotion: false,
  reducedFlash: false,
  reducedShake: false,
  largerText: false,
  highContrast: false,
  simplifiedVfx: false,
  masterVolume: 0.85,
  musicVolume: 0.7,
  sfxVolume: 0.85,
  voiceVolume: 0.85,
};

function load(): typeof DEFAULTS {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(state: typeof DEFAULTS): void {
  if (typeof window === "undefined") return;
  try {
    const subset = {
      reducedMotion: state.reducedMotion,
      reducedFlash: state.reducedFlash,
      reducedShake: state.reducedShake,
      largerText: state.largerText,
      highContrast: state.highContrast,
      simplifiedVfx: state.simplifiedVfx,
      masterVolume: state.masterVolume,
      musicVolume: state.musicVolume,
      sfxVolume: state.sfxVolume,
      voiceVolume: state.voiceVolume,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subset));
  } catch {
    /* best-effort */
  }
}

export const usePolishSettings = create<PolishSettingsState>((set) => {
  const initial = load();
  const update = (patch: Partial<typeof DEFAULTS>) => {
    set((s) => {
      const next = { ...s, ...patch };
      save(next as typeof DEFAULTS);
      return next;
    });
  };
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return {
    ...initial,
    setReducedMotion: (v) => update({ reducedMotion: v }),
    setReducedFlash: (v) => update({ reducedFlash: v }),
    setReducedShake: (v) => update({ reducedShake: v }),
    setLargerText: (v) => update({ largerText: v }),
    setHighContrast: (v) => update({ highContrast: v }),
    setSimplifiedVfx: (v) => update({ simplifiedVfx: v }),
    setVolume: (kind, value) => {
      const v = clamp(value);
      if (kind === "master") update({ masterVolume: v });
      else if (kind === "music") update({ musicVolume: v });
      else if (kind === "sfx") update({ sfxVolume: v });
      else if (kind === "voice") update({ voiceVolume: v });
    },
    resetToDefaults: () => update({ ...DEFAULTS }),
  };
});

// ──────────────────────────────────────────────────────────────────────
//  Document-level effect: applies high-contrast / larger-text classes
//  to <html> so global CSS can react via [data-polish="..."]
// ──────────────────────────────────────────────────────────────────────
export function usePolishDocumentEffects() {
  const largerText = usePolishSettings((s) => s.largerText);
  const highContrast = usePolishSettings((s) => s.highContrast);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.polishLargerText = largerText ? "1" : "0";
    root.dataset.polishHighContrast = highContrast ? "1" : "0";
    if (largerText) root.style.fontSize = "110%";
    else root.style.fontSize = "";
    return () => {
      // Clean up if unmounted (rare).
      delete root.dataset.polishLargerText;
      delete root.dataset.polishHighContrast;
    };
  }, [largerText, highContrast]);
}
