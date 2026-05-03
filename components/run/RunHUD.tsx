"use client";

/**
 * Run HUD — three small UI pieces that read from useRunStore:
 *
 *   RunIdentityBanner      → top-of-map banner with identity name + briefing
 *   FactionPressureMeter   → sidebar bar chart of current pressure per faction
 *   RunSeedDisplay         → tiny chip showing the run seed (for replays)
 *
 * All three render only when a run is active. Outside a run, they return null.
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import HudFrame from "../HudFrame";
import { useRunStore } from "@/lib/runStore";

// ──────────────────────────────────────────────────────────────────────
//  Run Identity Banner
// ──────────────────────────────────────────────────────────────────────
export function RunIdentityBanner() {
  const identity = useRunStore((s) => s.identity);
  if (!identity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative border-2 p-3 mb-4 overflow-hidden"
      style={{
        borderColor: identity.accent,
        background: "linear-gradient(135deg, rgba(11,15,20,0.85) 0%, rgba(17,24,33,0.92) 100%)",
        boxShadow: `0 0 20px ${identity.accent}33`,
      }}
    >
      {/* Accent stripe down the left edge */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: identity.accent }}
      />
      {/* Faint diagonal pattern */}
      <span
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, ${identity.accent} 0 1px, transparent 1px 12px)`,
        }}
      />

      <div className="relative flex items-center gap-3">
        <div
          className="text-3xl font-display font-black w-10 h-10 flex items-center justify-center border-2"
          style={{ color: identity.accent, borderColor: identity.accent }}
        >
          {identity.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-[0.4em] text-helldiver-dim">
            Run Identity · {identity.riskFlavor.toUpperCase()}
          </div>
          <div
            className="font-display font-black text-lg tracking-tight leading-tight"
            style={{ color: identity.accent }}
          >
            {identity.name.toUpperCase()}
          </div>
          <div className="text-[11px] text-gray-300 italic mt-0.5 line-clamp-1">
            {identity.briefing}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Faction Pressure Meter
// ──────────────────────────────────────────────────────────────────────
const PRESSURE_COLOR: Record<"terminids" | "automatons" | "illuminate", string> = {
  terminids: "#ff8a28",
  automatons: "#ff4d4d",
  illuminate: "#a78bfa",
};

const PRESSURE_LABEL: Record<"terminids" | "automatons" | "illuminate", string> = {
  terminids: "Terminid",
  automatons: "Automaton",
  illuminate: "Illuminate",
};

export function FactionPressureMeter({ bare = false }: { bare?: boolean } = {}) {
  const identity = useRunStore((s) => s.identity);
  const pressure = useRunStore((s) => s.factionPressure);
  if (!identity) return null;

  const factions: ("terminids" | "automatons" | "illuminate")[] = [
    "terminids",
    "automatons",
    "illuminate",
  ];

  const list = (
    <div className="space-y-2">
      {factions.map((f) => {
          const v = pressure[f];
          const isCritical = v >= 80;
          const isHigh = v >= 60;
          return (
            <div key={f}>
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className="text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: PRESSURE_COLOR[f] }}
                >
                  {PRESSURE_LABEL[f]}
                </span>
                <span
                  className={clsx(
                    "text-[10px] tabular-nums font-display font-black",
                    isCritical && "animate-pulse",
                  )}
                  style={{ color: PRESSURE_COLOR[f] }}
                >
                  {v}
                </span>
              </div>
              <div className="h-1.5 bg-black border border-helldiver-steel/40 overflow-hidden relative">
                <motion.div
                  className="h-full"
                  style={{
                    background: PRESSURE_COLOR[f],
                    boxShadow: isHigh ? `0 0 8px ${PRESSURE_COLOR[f]}` : undefined,
                  }}
                  animate={{ width: `${v}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22 }}
                />
                {/* Critical threshold marker at 80% */}
                <span
                  className="absolute top-0 bottom-0 w-px bg-white/20"
                  style={{ left: "80%" }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );

  const footnote = (
    <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-helldiver-dim uppercase tracking-widest leading-snug">
      High pressure → ambushes & reinforced encounters
    </div>
  );

  // Bare = no HudFrame wrap; the parent handles the section heading.
  if (bare) {
    return (
      <>
        {list}
        {footnote}
      </>
    );
  }

  return (
    <HudFrame label="Faction Pressure" accent="steel" className="p-3">
      {list}
      {footnote}
    </HudFrame>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Run Seed Display
// ──────────────────────────────────────────────────────────────────────
export function RunSeedDisplay() {
  const seed = useRunStore((s) => s.seed);
  if (!seed) return null;

  return (
    <button
      onClick={() => {
        try {
          navigator.clipboard?.writeText(seed);
        } catch {}
      }}
      className="px-2 py-0.5 border border-helldiver-steel text-helldiver-dim hover:text-helldiver-yellow hover:border-helldiver-yellow text-[9px] uppercase tracking-[0.3em] font-mono transition-colors"
      title="Click to copy run seed"
    >
      SEED · {seed}
    </button>
  );
}
