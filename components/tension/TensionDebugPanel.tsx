"use client";

/**
 * TensionDebugPanel — bottom-right floating dev panel.
 *
 * Shows:
 *   - live tension level (0–100) + state badge
 *   - per-source contribution bars
 *   - intensity multiplier slider (0–2)
 *   - manual override toggle + slider (pin tension to a value for testing)
 *
 * Toggled via the URL query parameter ?tension or by clicking the small chip
 * in the corner. Hidden by default in production builds — exposed when
 * window.localStorage["helldivers_debug_tension"] === "1".
 */

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  TENSION_COLORS,
  TensionLevel,
  useTension,
} from "@/lib/tension";

const KEY = "helldivers_debug_tension";

export function isTensionDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(KEY) === "1") return true;
    if (window.location.search.includes("tension")) return true;
  } catch {}
  return false;
}

export function setTensionDebugEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {}
}

export default function TensionDebugPanel() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isTensionDebugEnabled());
  }, []);

  const level = useTension((s) => s.tensionLevel);
  const state = useTension((s) => s.tensionState);
  const sources = useTension((s) => s.sources);
  const intensity = useTension((s) => s.intensityMultiplier);
  const manual = useTension((s) => s.manualOverride);
  const setMult = useTension((s) => s.setIntensityMultiplier);
  const setManual = useTension((s) => s.setManualOverride);
  const reset = useTension((s) => s.resetTension);

  if (!enabled) return null;

  const color = TENSION_COLORS[state];
  const sortedSources = Object.entries(sources).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed bottom-4 right-4 z-[80] font-mono">
      {/* Toggle chip */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 border-2 text-[10px] uppercase tracking-[0.3em] font-display font-black mb-1 backdrop-blur-md"
        style={{
          borderColor: color,
          color: color,
          background: "rgba(11,15,20,0.85)",
        }}
      >
        T · {Math.round(level)} · {state.toUpperCase()}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="w-[300px] border-2 backdrop-blur-md p-3 text-[11px]"
            style={{
              borderColor: color,
              background: "rgba(11,15,20,0.96)",
              color: "#e8eef5",
              boxShadow: `0 0 24px ${color}40`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.4em] font-display font-black" style={{ color }}>
                ◢ Tension Debug ◣
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[10px] text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Big bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-[0.3em] text-white/50">
                  {manual !== null ? "MANUAL OVERRIDE" : "Computed"}
                </span>
                <span className="font-display font-black tabular-nums text-base" style={{ color }}>
                  {Math.round(level)}
                </span>
              </div>
              <div className="h-2 bg-black/60 border border-white/10 overflow-hidden relative">
                <motion.div
                  className="h-full"
                  style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                  animate={{ width: `${level}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                />
                {/* Threshold ticks */}
                {[20, 45, 70].map((t) => (
                  <div
                    key={t}
                    className="absolute top-0 bottom-0 w-px bg-white/15"
                    style={{ left: `${t}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/30 mt-0.5">
                <span>calm</span>
                <span>alert</span>
                <span>danger</span>
                <span>critical</span>
              </div>
            </div>

            {/* Sources breakdown */}
            <div className="mb-3">
              <div className="text-[9px] uppercase tracking-[0.3em] text-white/50 mb-1.5">
                Sources ({sortedSources.length})
              </div>
              {sortedSources.length === 0 ? (
                <div className="text-[10px] text-white/30 italic">— none —</div>
              ) : (
                <div className="space-y-1">
                  {sortedSources.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="flex-1 text-white/70 truncate">{k}</span>
                      <span className="tabular-nums w-7 text-right" style={{ color }}>+{v}</span>
                      <div className="w-12 h-1 bg-black/60 border border-white/10">
                        <div
                          className="h-full"
                          style={{ width: `${Math.min(100, v * 4)}%`, background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Intensity multiplier */}
            <div className="mb-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-[0.3em] text-white/50">Intensity ×</span>
                <span className="tabular-nums font-display font-black text-white/80">{intensity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={intensity}
                onChange={(e) => setMult(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: color }}
              />
            </div>

            {/* Manual override */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-[0.3em] text-white/50">
                  Manual Override
                </span>
                <button
                  onClick={() => setManual(manual === null ? 50 : null)}
                  className={clsx(
                    "px-1.5 py-0.5 text-[9px] uppercase tracking-widest border",
                    manual !== null ? "border-helldiver-red text-helldiver-red" : "border-white/20 text-white/50"
                  )}
                >
                  {manual !== null ? "ON" : "OFF"}
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={manual ?? 0}
                disabled={manual === null}
                onChange={(e) => setManual(parseInt(e.target.value, 10))}
                className={clsx("w-full", manual === null && "opacity-30")}
                style={{ accentColor: color }}
              />
            </div>

            <button
              onClick={reset}
              className="w-full mt-2 py-1 border border-white/15 text-[9px] uppercase tracking-widest text-white/50 hover:text-helldiver-yellow hover:border-helldiver-yellow"
            >
              ↺ Reset
            </button>

            <div className="mt-2 text-[8px] text-white/25 leading-snug">
              Toggle: <code className="text-white/40">localStorage.setItem("{KEY}","1")</code> or append <code>?tension</code> to URL.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
