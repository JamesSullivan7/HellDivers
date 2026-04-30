"use client";

/**
 * EnemyIntentPanel — drop-in replacement for the legacy EnemyIntent display.
 *
 * Slot dimensions are intentionally identical to the existing component
 * (same 64px height, same horizontal layout) so EnemyCard stays visually
 * consistent. The new panel adds:
 *
 *   - severity-driven accent border + glow
 *   - icon glyph that pulses on critical
 *   - damage badge (e.g. "ATTACK 14" / "BILE WAVE 6×3")
 *   - tiny next-intent peek when pattern length > 1
 *   - interruptible marker when applicable
 *   - hover tooltip with full detail + lethal-warning + priority hints
 *   - fog-of-war fallback identical to legacy behavior
 *
 * The combat engine is NOT modified — this panel reads the rich-derived
 * view via useEnemyIntent(enemy).
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Enemy } from "@/lib/types";
import { useEnemyIntent } from "@/hooks/useEnemyIntent";
import { SEVERITY_ACCENT } from "@/systems/intent/intentTypes";
import {
  IntentBadge,
  IntentIcon,
  InterruptibleMarker,
  SeverityIndicator,
} from "./atoms";
import IntentTooltip from "./IntentTooltip";

interface Props {
  enemy: Enemy;
  /** When true, renders the fog-of-war placeholder (heavy_fog modifier). */
  fogged?: boolean;
}

export default function EnemyIntentPanel({ enemy, fogged }: Props) {
  const intent = useEnemyIntent(enemy);
  const [open, setOpen] = useState(false);

  // Fog placeholder — preserve legacy behavior
  if (fogged) {
    return (
      <div
        className="border-t border-border-subtle px-tok-3 flex items-center gap-tok-2 text-text-dim font-mono"
        style={{ height: "64px" }}
      >
        <span style={{ fontSize: 18 }}>?</span>
        <div className="text-[8px] uppercase tracking-widest">??? — Heavy Fog</div>
      </div>
    );
  }

  const { current, next, resolution, priorityHints, interruptedReason } = intent;
  const accent = SEVERITY_ACCENT[current.severity];
  const lethal = resolution.willCripple;

  return (
    <div
      className="relative border-t flex items-stretch font-mono select-none"
      style={{
        height: "64px",
        borderColor: `${accent}55`,
        // Subtle severity-tinted backdrop that sits behind the existing card bg.
        background: `linear-gradient(90deg, ${accent}10, transparent 60%)`,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {/* Left rail — severity bar */}
      <div
        className="self-stretch w-[3px]"
        style={{
          backgroundColor: accent,
          boxShadow: lethal ? `0 0 12px ${accent}` : `0 0 6px ${accent}88`,
        }}
        aria-hidden
      />

      {/* Body */}
      <div className="flex-1 min-w-0 px-tok-3 py-1.5 flex flex-col justify-between">
        {/* Top row: NEXT MOVE label + severity ladder */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] uppercase tracking-[0.2em] text-text-dim">
              {interruptedReason ? "INTERRUPTED" : "NEXT MOVE"}
            </span>
            <SeverityIndicator severity={current.severity} variant="bar" />
          </div>
          {current.isInterruptible && <InterruptibleMarker withLabel={false} />}
        </div>

        {/* Middle row: badge */}
        <div className="flex items-center gap-1.5 min-w-0">
          {interruptedReason ? (
            <div className="flex items-center gap-1.5 opacity-60">
              <IntentIcon type="prepare" severity="low" size={14} />
              <span className="text-[10px] uppercase tracking-wider text-text-dim">
                {current.label} · {interruptedReason.toUpperCase()}
              </span>
            </div>
          ) : (
            <IntentBadge intent={current} compact />
          )}
        </div>

        {/* Bottom row: next-intent peek */}
        <div className="flex items-center gap-1.5 text-[9px] text-text-dim uppercase tracking-wider min-w-0">
          {next ? (
            <>
              <span className="shrink-0">THEN</span>
              <span
                className="truncate"
                style={{ color: SEVERITY_ACCENT[next.severity] }}
              >
                {next.label}
                {typeof next.damage === "number" && next.damage > 0 ? ` ${next.damage}` : ""}
              </span>
            </>
          ) : (
            <span className="opacity-60">SINGLE-ACTION PATTERN</span>
          )}
        </div>
      </div>

      {/* Lethal-pulse overlay */}
      {lethal && !interruptedReason && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ border: `1px solid ${accent}`, boxShadow: `inset 0 0 18px ${accent}55` }}
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Hover tooltip */}
      <AnimatePresence>
        {open && (
          <IntentTooltip
            intent={current}
            resolution={resolution}
            hints={priorityHints}
            align="left"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
