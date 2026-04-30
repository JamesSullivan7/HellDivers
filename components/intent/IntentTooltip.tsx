"use client";

/**
 * IntentTooltip — hover/focus tooltip showing the rich detail for an intent:
 *   - label + severity bar
 *   - one-sentence description
 *   - damage breakdown (raw → after block) when applicable
 *   - status effect, target group, interruptibility
 *   - any active priority hints surfaced for this turn
 *
 * Mounted via portal-style absolute positioning relative to the parent.
 * The component is purely presentational — pass it the data.
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import {
  IntentTarget,
  RichEnemyIntent,
  SEVERITY_ACCENT,
} from "@/systems/intent/intentTypes";
import type { ResolvedIntentPreview } from "@/systems/intent/IntentManager";
import { SeverityIndicator, InterruptibleMarker } from "./atoms";

const TARGET_LABEL: Record<IntentTarget, string> = {
  player: "TARGET · YOU",
  all_players: "TARGET · ALL HELLDIVERS",
  self: "TARGET · SELF",
  ally: "TARGET · ALLY",
  all_enemies: "TARGET · ALL ENEMIES",
};

interface Props {
  intent: RichEnemyIntent;
  resolution?: ResolvedIntentPreview;
  hints?: { description: string; active: boolean }[];
  align?: "left" | "right";
  className?: string;
}

export default function IntentTooltip({
  intent,
  resolution,
  hints = [],
  align = "left",
  className,
}: Props) {
  const color = SEVERITY_ACCENT[intent.severity];
  const dmg = intent.damage ?? 0;
  const hits = Math.max(1, intent.hits ?? 1);
  const totalDmg = dmg * hits;
  const applied = resolution?.appliedDamage ?? totalDmg;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className={clsx(
        "absolute z-overlay min-w-[220px] max-w-[280px] pointer-events-none",
        "border bg-bg-secondary/95 backdrop-blur-sm font-mono text-text-primary",
        align === "left" ? "left-0" : "right-0",
        className,
      )}
      style={{
        top: "calc(100% + 6px)",
        borderColor: `${color}aa`,
        boxShadow: `0 0 20px ${color}33, 0 6px 22px rgba(0,0,0,0.6)`,
        borderRadius: 2,
      }}
      role="tooltip"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b"
        style={{ borderColor: `${color}55`, backgroundColor: `${color}10` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-black" style={{ color }}>
            {intent.label}
          </span>
          <SeverityIndicator severity={intent.severity} variant="bar" />
        </div>
        {intent.isInterruptible && <InterruptibleMarker withLabel={false} />}
      </div>

      {/* Body */}
      <div className="px-2 py-1.5 space-y-1.5">
        <p className="text-[10px] leading-snug text-text-primary/90">{intent.description}</p>

        {/* Damage line (only when there's damage) */}
        {totalDmg > 0 && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-dim uppercase tracking-wider">Damage</span>
            <span className="font-display font-black tabular-nums" style={{ color }}>
              {hits > 1 ? `${dmg}×${hits} → ${totalDmg}` : `${totalDmg}`}
              {resolution && applied !== totalDmg && (
                <span className="text-text-dim ml-1.5 text-[9px]">
                  (after block · {applied})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Status effect */}
        {intent.statusEffect && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-dim uppercase tracking-wider">Status</span>
            <span className="uppercase tracking-wider text-accent-orange">{intent.statusEffect}</span>
          </div>
        )}

        {/* Target row */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-text-dim uppercase tracking-wider">{TARGET_LABEL[intent.target]}</span>
          {intent.telegraphTurns > 0 && (
            <span className="text-accent-yellow uppercase tracking-wider">
              T+{intent.telegraphTurns}
            </span>
          )}
        </div>

        {/* Will-cripple warning */}
        {resolution?.willCripple && (
          <div className="border-t border-accent-red/40 pt-1 text-[10px] text-accent-red font-black tracking-wider uppercase">
            ⚠ LETHAL — REDUCE DAMAGE OR DIE
          </div>
        )}

        {/* Priority hints (active only) */}
        {hints.filter((h) => h.active).length > 0 && (
          <div className="border-t border-border-subtle pt-1">
            <div className="text-[8px] uppercase text-text-dim tracking-widest mb-0.5">Active Behavior</div>
            <ul className="text-[10px] leading-snug space-y-0.5 text-accent-cyan">
              {hints
                .filter((h) => h.active)
                .map((h, i) => (
                  <li key={i}>· {h.description}</li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
