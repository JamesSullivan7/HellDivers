"use client";

/**
 * IntentTimelineNode — single node in a timeline.
 * Used by BossPatternPreview and any future "upcoming-attacks" rail.
 *
 * State drives the styling:
 *   "past"    — dimmed (already executed)
 *   "current" — highlighted (firing this turn)
 *   "future"  — normal (not yet)
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import {
  RichEnemyIntent,
  SEVERITY_ACCENT,
} from "@/systems/intent/intentTypes";
import { IntentIcon, SeverityIndicator } from "./atoms";

interface Props {
  intent: RichEnemyIntent;
  state: "past" | "current" | "future";
  stepIndex: number;
  totalSteps: number;
  className?: string;
}

export default function IntentTimelineNode({
  intent,
  state,
  stepIndex,
  totalSteps,
  className,
}: Props) {
  const accent = SEVERITY_ACCENT[intent.severity];
  const isCurrent = state === "current";
  const isPast = state === "past";

  return (
    <motion.div
      className={clsx(
        "relative flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 border",
        "min-w-[68px]",
        className,
      )}
      style={{
        borderColor: isCurrent ? accent : `${accent}55`,
        backgroundColor: isCurrent ? `${accent}1a` : "transparent",
        boxShadow: isCurrent ? `0 0 14px ${accent}55, inset 0 0 12px ${accent}22` : undefined,
        opacity: isPast ? 0.4 : 1,
        borderRadius: 2,
      }}
      initial={isCurrent ? { scale: 0.96 } : false}
      animate={isCurrent ? { scale: 1 } : { scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {/* Step pill */}
      <span
        className="text-[7px] uppercase tracking-widest"
        style={{ color: isCurrent ? accent : "var(--color-text-dim, #8a8d92)" }}
      >
        T{stepIndex + 1}/{totalSteps}
      </span>

      {/* Icon */}
      <IntentIcon
        type={intent.type}
        icon={intent.icon}
        severity={intent.severity}
        size={isCurrent ? 22 : 17}
        pulse={isCurrent && (intent.severity === "critical" || intent.type === "enrage")}
      />

      {/* Label */}
      <div
        className={clsx(
          "text-[8px] uppercase tracking-wider font-black text-center leading-tight",
          isPast ? "line-through" : "",
        )}
        style={{ color: isCurrent ? accent : "var(--color-text-primary, #e8e9ea)" }}
      >
        {intent.label}
      </div>

      {/* Damage / hits */}
      {intent.damage !== undefined && intent.damage > 0 && (
        <div
          className="font-display font-black tabular-nums text-[11px]"
          style={{ color: accent, textShadow: isCurrent ? `0 0 6px ${accent}` : undefined }}
        >
          {intent.hits && intent.hits > 1
            ? `${intent.damage}×${intent.hits}`
            : `${intent.damage}`}
        </div>
      )}

      {/* Severity ladder */}
      <SeverityIndicator severity={intent.severity} variant="bar" />

      {/* Connector line to the next node (right edge) */}
      {stepIndex < totalSteps - 1 && (
        <span
          aria-hidden
          className="absolute"
          style={{
            right: -8,
            top: "50%",
            width: 8,
            height: 1,
            backgroundColor: `${accent}55`,
          }}
        />
      )}
    </motion.div>
  );
}
