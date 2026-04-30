"use client";

/**
 * BossPatternPreview — full pattern timeline for a boss enemy.
 * Shows the pattern as a horizontal sequence of nodes; the current step
 * is highlighted, completed steps are dimmed, future steps are normal.
 *
 * Above 50% HP: shows base pattern.
 * Once enraged: shows enraged pattern with a phase-shift banner.
 *
 * Designed to live above the combat bar or pinned to the boss card.
 */

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { Enemy } from "@/lib/types";
import { useEnemyIntent } from "@/hooks/useEnemyIntent";
import { useIntentQueue } from "@/systems/intent/intentQueue";
import { SEVERITY_ACCENT } from "@/systems/intent/intentTypes";
import IntentTimelineNode from "./IntentTimelineNode";

interface Props {
  enemy: Enemy;
  className?: string;
}

export default function BossPatternPreview({ enemy, className }: Props) {
  const view = useEnemyIntent(enemy);
  const recentEnrage = useIntentQueue((s) => s.hasRecentEnrage(enemy.id));
  if (!enemy.isBoss) return null;

  const pattern = view.pattern;
  const enraged = !!enemy.enraged;
  const currentStep = enemy.intentIndex % Math.max(1, pattern.length);
  const accent = enraged ? SEVERITY_ACCENT.critical : SEVERITY_ACCENT.high;

  // HP ratio for the threshold marker
  const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

  return (
    <div
      className={clsx(
        "border bg-bg-secondary/80 backdrop-blur-sm font-mono text-text-primary",
        "px-3 py-2 flex flex-col gap-2",
        className,
      )}
      style={{
        borderColor: `${accent}88`,
        boxShadow: enraged ? `0 0 24px ${accent}55, inset 0 0 20px ${accent}22` : undefined,
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-[0.25em] font-black"
            style={{ color: accent, textShadow: `0 0 6px ${accent}` }}
          >
            {enraged ? "PHASE 2 · ENRAGED" : "BOSS PATTERN"}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-text-dim">
            {enemy.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-text-dim">
          <span>HP</span>
          <span className="font-display font-black tabular-nums" style={{ color: accent }}>
            {enemy.hp} / {enemy.maxHp}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-stretch gap-2 overflow-x-auto">
        {pattern.map((step, i) => {
          const state =
            i === currentStep ? "current" : i < currentStep ? "past" : "future";
          return (
            <IntentTimelineNode
              key={step.id + i}
              intent={step}
              state={state}
              stepIndex={i}
              totalSteps={pattern.length}
            />
          );
        })}
      </div>

      {/* Threshold marker (only useful pre-enrage) */}
      {!enraged && enemy.enragedPattern && enemy.enragedPattern.length > 0 && (
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-text-dim">
          <span>Enrage Threshold</span>
          <div className="flex-1 mx-3 h-[3px] bg-border-subtle relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${hpPct * 100}%`,
                background: `linear-gradient(90deg, ${SEVERITY_ACCENT.high}, ${SEVERITY_ACCENT.critical})`,
              }}
            />
            {/* 50% marker */}
            <div
              className="absolute inset-y-0"
              style={{
                left: "50%",
                width: 1,
                backgroundColor: SEVERITY_ACCENT.critical,
                boxShadow: `0 0 6px ${SEVERITY_ACCENT.critical}`,
              }}
            />
          </div>
          <span style={{ color: SEVERITY_ACCENT.critical }}>50%</span>
        </div>
      )}

      {/* Recent-enrage cinematic banner */}
      <AnimatePresence>
        {recentEnrage && enraged && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[10px] uppercase tracking-[0.3em] font-black text-center"
            style={{ color: SEVERITY_ACCENT.critical, textShadow: `0 0 8px ${SEVERITY_ACCENT.critical}` }}
          >
            ◢ {enemy.enragedMessage ?? "PHASE SHIFT"} ◣
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
