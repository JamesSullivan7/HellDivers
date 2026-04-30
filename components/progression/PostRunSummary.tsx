"use client";

/**
 * PostRunSummary — animated, sequenced reveal of run rewards.
 *
 * Sequence (orchestrated via framer-motion staggered children):
 *   1. Mission result banner (VICTORY / DEFEAT — colored)
 *   2. XP bar fills toward next level — current level pip flashes on level-up
 *   3. Currency tally rolls each line in (medals → samples → req)
 *   4. Bonus banner slides in (if any)
 *   5. "Continue" button revealed — fires onContinue
 *
 * The component is presentational. It expects:
 *   - rewards: RunRewards
 *   - profile: PlayerProfile (for the level/XP context BEFORE rewards)
 *
 * It does not call claimRunRewards itself — wire the parent to call
 * useProgression().claimRunRewards before mounting this.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlayerProfile,
  RunRewards,
} from "@/systems/progression/progressionTypes";
import { CURRENCY_IDENTITY } from "@/systems/progression/economy";
import { xpToNextLevel } from "@/systems/progression/xpCurve";
import { XPBar, LevelBadge } from "./atoms";

interface Props {
  result: "victory" | "defeat";
  rewards: RunRewards;
  /** Profile snapshot BEFORE rewards — drives the XP-bar fill animation. */
  beforeProfile: Pick<PlayerProfile, "level" | "xp">;
  /** Profile snapshot AFTER rewards — for the post-fill state. */
  afterProfile: Pick<PlayerProfile, "level" | "xp">;
  onContinue: () => void;
  className?: string;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function PostRunSummary({
  result,
  rewards,
  beforeProfile,
  afterProfile,
  onContinue,
  className,
}: Props) {
  const win = result === "victory";
  const accent = win ? "var(--color-accent-yellow, #f5c542)" : "var(--color-accent-red, #ff4d4d)";
  // Level-up detection — was the level different before/after?
  const leveledUp = afterProfile.level > beforeProfile.level;

  useEffect(() => {
    // Lock body scroll while summary is shown — purely cosmetic.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
      role="dialog"
      aria-label="Post-run summary"
    >
      <div
        className="bg-bg-secondary/95 border font-mono px-6 py-5 flex flex-col gap-4 max-w-[520px]"
        style={{
          borderColor: accent,
          boxShadow: `0 0 28px ${accent}55, inset 0 0 24px ${accent}22`,
          borderRadius: 2,
        }}
      >
        {/* Result banner */}
        <motion.div
          variants={rowVariants}
          className="text-center text-lg uppercase tracking-[0.35em] font-display font-black"
          style={{ color: accent, textShadow: `0 0 12px ${accent}88` }}
        >
          ◢ {win ? "MISSION ACCOMPLISHED" : "HELLDIVER KIA"} ◣
        </motion.div>

        {/* XP row */}
        <motion.div variants={rowVariants} className="flex items-center gap-3">
          <LevelBadge level={afterProfile.level} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-widest text-text-dim mb-1">
              {leveledUp
                ? `LEVEL UP · ${beforeProfile.level} → ${afterProfile.level}`
                : "EXPERIENCE GAINED"}
            </div>
            <XPBar
              level={afterProfile.level}
              xp={afterProfile.xp}
              xpToNextLevel={xpToNextLevel(afterProfile.level)}
              showLabel={false}
            />
            <div className="text-[10px] uppercase tracking-wider text-text-dim mt-1">
              +{rewards.xp.toLocaleString()} XP
            </div>
          </div>
        </motion.div>

        {/* Currency tally */}
        <motion.div variants={rowVariants} className="flex flex-col gap-1.5">
          <RewardLine label={CURRENCY_IDENTITY.medals.label} amount={rewards.medals} accent={CURRENCY_IDENTITY.medals.accent} glyph={CURRENCY_IDENTITY.medals.glyph} />
          <RewardLine
            label={CURRENCY_IDENTITY.samples.label}
            amount={rewards.samples + (rewards.rareSamples ?? 0) + (rewards.superSamples ?? 0)}
            accent={CURRENCY_IDENTITY.samples.accent}
            glyph={CURRENCY_IDENTITY.samples.glyph}
            secondary={
              rewards.rareSamples || rewards.superSamples
                ? `(${rewards.samples} common · ${rewards.rareSamples ?? 0} rare · ${rewards.superSamples ?? 0} super)`
                : undefined
            }
          />
          <RewardLine label={CURRENCY_IDENTITY.requisition.label} amount={rewards.requisition} accent={CURRENCY_IDENTITY.requisition.accent} glyph={CURRENCY_IDENTITY.requisition.glyph} />
        </motion.div>

        {/* Bonus banner */}
        {rewards.bonusLabel && (
          <motion.div
            variants={rowVariants}
            className="text-[10px] uppercase tracking-[0.3em] text-center font-black"
            style={{ color: "var(--color-accent-orange, #ff8c2a)" }}
          >
            {rewards.bonusLabel}
          </motion.div>
        )}

        {/* Continue */}
        <motion.div variants={rowVariants} className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onContinue}
            className="px-6 py-2 border-2 font-display font-black uppercase tracking-[0.3em] text-[11px] hover:bg-accent-yellow/10 transition-colors"
            style={{
              color: "var(--color-accent-yellow, #f5c542)",
              borderColor: "var(--color-accent-yellow, #f5c542)",
              boxShadow: "0 0 12px rgba(245,197,66,0.35)",
              borderRadius: 1,
            }}
          >
            Continue
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function RewardLine({
  label,
  amount,
  accent,
  glyph,
  secondary,
}: {
  label: string;
  amount: number;
  accent: string;
  glyph: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-1 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="font-display font-black" style={{ color: accent, fontSize: 14, lineHeight: 1 }}>{glyph}</span>
        <span className="text-[10px] uppercase tracking-widest text-text-dim">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        {secondary && <span className="text-[8px] uppercase tracking-widest text-text-dim">{secondary}</span>}
        <span
          className="font-display font-black tabular-nums"
          style={{ color: accent, fontSize: 16, lineHeight: 1, textShadow: `0 0 6px ${accent}55` }}
        >
          +{amount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
