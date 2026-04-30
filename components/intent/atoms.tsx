"use client";

/**
 * INTENT ATOMS
 * ──────────────────────────────────────────────────────────────────────
 * Tiny, reusable building blocks for the intent UI:
 *
 *   IntentIcon          — glyph derived from intent.type, optionally pulses
 *   IntentBadge         — pill showing label + damage/hits readout
 *   SeverityIndicator   — color-coded dot or bar driven by severity
 *   InterruptibleMarker — small ◊ indicator when intent is interruptible
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import {
  DEFAULT_INTENT_ICON,
  IntentSeverity,
  IntentType,
  RichEnemyIntent,
  SEVERITY_ACCENT,
} from "@/systems/intent/intentTypes";

// ──────────────────────────────────────────────────────────────────────
//  IntentIcon
// ──────────────────────────────────────────────────────────────────────
export function IntentIcon({
  type,
  icon,
  severity,
  size = 18,
  pulse = false,
  className,
}: {
  type: IntentType;
  icon?: string;
  severity?: IntentSeverity;
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  const glyph = icon ?? DEFAULT_INTENT_ICON[type];
  const color = severity ? SEVERITY_ACCENT[severity] : "currentColor";
  return (
    <motion.span
      className={clsx("inline-block leading-none font-display font-black tabular-nums", className)}
      style={{ fontSize: size, color, lineHeight: 1, textShadow: `0 0 6px ${color}` }}
      aria-hidden
      animate={pulse ? { scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] } : undefined}
      transition={pulse ? { duration: 1.0, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {glyph}
    </motion.span>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  SeverityIndicator
//  - "dot" (default)  — single colored dot
//  - "bar"            — 4-segment ladder filled per severity
// ──────────────────────────────────────────────────────────────────────
const SEV_LADDER: IntentSeverity[] = ["low", "medium", "high", "critical"];

export function SeverityIndicator({
  severity,
  variant = "dot",
  className,
}: {
  severity: IntentSeverity;
  variant?: "dot" | "bar";
  className?: string;
}) {
  const color = SEVERITY_ACCENT[severity];
  if (variant === "bar") {
    const filled = SEV_LADDER.indexOf(severity) + 1;
    return (
      <div className={clsx("flex gap-[2px] items-center", className)} aria-label={`severity-${severity}`}>
        {SEV_LADDER.map((s, i) => (
          <span
            key={s}
            className="block"
            style={{
              width: 8,
              height: 4,
              backgroundColor: i < filled ? SEVERITY_ACCENT[s] : "rgba(255,255,255,0.12)",
              boxShadow: i < filled ? `0 0 4px ${SEVERITY_ACCENT[s]}` : undefined,
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={clsx("inline-block rounded-full", className)}
      style={{
        width: 8,
        height: 8,
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`,
      }}
      aria-label={`severity-${severity}`}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────
//  IntentBadge
//  Compact pill with icon + label + damage readout.
//  - "ATTACK 14"
//  - "BILE WAVE x4"
//  - "SHIELD +30"
//  - "CHARGING 2T"
// ──────────────────────────────────────────────────────────────────────
function damageText(intent: Pick<RichEnemyIntent, "type" | "damage" | "hits" | "telegraphTurns">): string | null {
  if (intent.type === "charge" || intent.type === "prepare") {
    if (intent.telegraphTurns > 0) return `${intent.telegraphTurns}T`;
    return null;
  }
  if (intent.type === "shield" || intent.type === "buff") {
    return null;
  }
  if (intent.type === "summon") return null;
  if (intent.type === "enrage") return "PHASE!";
  if (intent.type === "escape") return null;
  if (intent.damage === undefined || intent.damage === 0) return null;
  if (intent.hits && intent.hits > 1) return `${intent.damage}×${intent.hits}`;
  return `${intent.damage}`;
}

export function IntentBadge({
  intent,
  compact = false,
  className,
}: {
  intent: RichEnemyIntent;
  compact?: boolean;
  className?: string;
}) {
  const color = SEVERITY_ACCENT[intent.severity];
  const dmg = damageText(intent);
  const pulse = intent.severity === "critical" || intent.type === "enrage";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-mono font-black uppercase",
        "border tabular-nums whitespace-nowrap",
        compact ? "px-1.5 py-[2px] text-[10px]" : "px-2 py-1 text-[11px]",
        className,
      )}
      style={{
        color,
        borderColor: `${color}99`,
        backgroundColor: `${color}14`,
        boxShadow: `0 0 8px ${color}33 inset`,
        letterSpacing: "0.08em",
        borderRadius: 2,
      }}
    >
      <IntentIcon type={intent.type} icon={intent.icon} severity={intent.severity} size={compact ? 11 : 13} pulse={pulse} />
      <span>{intent.label}</span>
      {dmg && (
        <span
          className="font-display font-black"
          style={{ color, textShadow: `0 0 6px ${color}` }}
        >
          {dmg}
        </span>
      )}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  InterruptibleMarker
//  Small diamond glyph + "INTERRUPTIBLE" label. Tucks into the corner of
//  EnemyIntentPanel.
// ──────────────────────────────────────────────────────────────────────
export function InterruptibleMarker({
  className,
  withLabel = true,
}: {
  className?: string;
  withLabel?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-mono uppercase tracking-widest",
        "text-[8px] text-accent-cyan",
        className,
      )}
      style={{ textShadow: "0 0 4px rgba(96,196,255,0.7)" }}
      title="This action can be interrupted with stun / shield-break / heavy damage."
    >
      <span style={{ fontSize: 10, lineHeight: 1 }}>◊</span>
      {withLabel && <span>INTERRUPTIBLE</span>}
    </span>
  );
}
