"use client";

/**
 * Consequence HUD components — three small pieces that subscribe to
 * useConsequence and render in the MapView sidebar:
 *
 *   RunModifierBadgeStrip      → pills for active run-scoped modifiers
 *   PendingConsequenceIndicator→ countdown chips for delayed/queued effects
 *   ConsequenceHistoryPanel    → expandable log of past decisions + resolutions
 */

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useConsequence } from "@/lib/consequenceStore";
import HudFrame from "../HudFrame";

const FLAVOR_BORDER = {
  positive: "border-emerald-400",
  neutral: "border-helldiver-yellow",
  negative: "border-helldiver-red",
} as const;

const FLAVOR_TEXT = {
  positive: "text-emerald-300",
  neutral: "text-helldiver-yellow",
  negative: "text-helldiver-red",
} as const;

// ──────────────────────────────────────────────────────────────────────
//  RunModifierBadgeStrip
// ──────────────────────────────────────────────────────────────────────
export function RunModifierBadgeStrip() {
  const mods = useConsequence((s) => s.activeRunModifiers);
  if (mods.length === 0) return null;

  return (
    <HudFrame label="Run Modifiers" accent="steel" className="p-3">
      <div className="space-y-2">
        {mods.map((m) => (
          <div
            key={m.id}
            className={clsx(
              "border-l-2 pl-2 py-1",
              FLAVOR_BORDER[m.flavor]
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={clsx("text-[11px] font-display font-bold", FLAVOR_TEXT[m.flavor])}>
                {m.name}
              </span>
              <span className="text-[8px] uppercase tracking-widest text-white/30">
                {m.scope === "next_combat" ? "1 fight" : "run"}
              </span>
            </div>
            <div className="text-[10px] text-gray-300 leading-snug">{m.description}</div>
          </div>
        ))}
      </div>
    </HudFrame>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  PendingConsequenceIndicator
//  Shows queued delayed consequences with their countdown.
// ──────────────────────────────────────────────────────────────────────
export function PendingConsequenceIndicator() {
  const pending = useConsequence((s) => s.pendingConsequences);
  if (pending.length === 0) return null;

  return (
    <HudFrame label="Pending" accent="steel" className="p-3">
      <div className="space-y-1.5">
        {pending.map((c) => {
          // PendingConsequence has a `countdown` field added by the store
          const countdown = (c as any).countdown as number | undefined;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 border-l-2 border-purple-400 pl-2 py-1"
            >
              <span className="text-[10px] uppercase tracking-widest font-bold text-purple-300 shrink-0">
                {countdown !== undefined
                  ? `${countdown}↓`
                  : c.trigger === "next_combat"
                  ? "NXT"
                  : c.trigger === "next_node"
                  ? "NXT"
                  : "·"}
              </span>
              <span className="text-[10px] text-gray-300 leading-snug flex-1">
                {c.displayText}
              </span>
            </motion.div>
          );
        })}
      </div>
    </HudFrame>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ConsequenceHistoryPanel
//  Expandable log of past decisions + their resolutions.
// ──────────────────────────────────────────────────────────────────────
export function ConsequenceHistoryPanel() {
  const history = useConsequence((s) => s.consequenceHistory);
  const flags = useConsequence((s) => s.narrativeFlags);
  const [open, setOpen] = useState(false);

  const flagList = Array.from(flags);
  if (history.length === 0 && flagList.length === 0) return null;

  return (
    <HudFrame label="Decision Log" accent="steel" className="p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest text-helldiver-dim hover:text-helldiver-yellow transition-colors"
      >
        <span>{open ? "▼" : "▶"} {history.length} decision{history.length !== 1 ? "s" : ""}</span>
        <span className="text-[9px]">{flagList.length} flag{flagList.length !== 1 ? "s" : ""}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mt-2"
          >
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {history.map((h) => (
                <div key={h.id} className="border-l-2 border-helldiver-yellow/60 pl-2 py-1">
                  <div className="text-[10px] uppercase tracking-widest text-helldiver-yellow font-bold">
                    {h.source}
                  </div>
                  <div className="text-[10px] text-white">{h.decision}</div>
                  {h.resolved.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {h.resolved.map((r, i) => (
                        <div key={i} className="text-[9px] text-helldiver-dim leading-snug">
                          ↳ {r.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {flagList.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mb-1">
                  Narrative flags
                </div>
                <div className="flex flex-wrap gap-1">
                  {flagList.map((f) => (
                    <span
                      key={f}
                      className="px-1.5 py-0.5 border border-cyan-400/50 text-cyan-300 text-[9px] uppercase tracking-widest font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </HudFrame>
  );
}
