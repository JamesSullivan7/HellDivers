"use client";

/**
 * PROGRESSION ATOMS
 * ──────────────────────────────────────────────────────────────────────
 *   XPBar               — bar + label showing 0..1 progress to next level
 *   LevelBadge          — rank abbreviation + level number badge
 *   CurrencyCounter     — pill-style readout for one currency
 *   EquippedCosmeticsPanel — compact summary of cape + title + banner
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import {
  CurrencyType,
  PlayerProfile,
} from "@/systems/progression/progressionTypes";
import { CURRENCY_IDENTITY } from "@/systems/progression/economy";
import { rankForLevel } from "@/systems/progression/xpCurve";
import { getCosmeticDef } from "@/systems/progression/data/cosmetics";

// ──────────────────────────────────────────────────────────────────────
//  XPBar
// ──────────────────────────────────────────────────────────────────────
export function XPBar({
  level,
  xp,
  xpToNextLevel,
  width = "100%",
  showLabel = true,
  className,
}: {
  level: number;
  xp: number;
  xpToNextLevel: number;
  width?: string | number;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, xpToNextLevel ? xp / xpToNextLevel : 0));
  return (
    <div className={clsx("font-mono", className)} style={{ width }}>
      {showLabel && (
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-text-dim mb-1">
          <span>L{level}</span>
          <span className="tabular-nums">{xp} / {xpToNextLevel} XP</span>
        </div>
      )}
      <div
        className="relative h-[6px] bg-bg-tertiary border border-border-subtle overflow-hidden"
        style={{ borderRadius: 1 }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={xpToNextLevel}
        aria-valuenow={xp}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          initial={false}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            background: "linear-gradient(90deg, var(--color-accent-yellow, #f5c542), var(--color-accent-orange, #ff8c2a))",
            boxShadow: "0 0 8px rgba(245,197,66,0.55)",
          }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  LevelBadge
// ──────────────────────────────────────────────────────────────────────
export function LevelBadge({
  level,
  className,
  size = "md",
}: {
  level: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const rank = rankForLevel(level);
  const dim = size === "sm" ? 32 : size === "lg" ? 56 : 44;
  const fontMain = size === "sm" ? 14 : size === "lg" ? 22 : 18;
  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center font-display font-black",
        "border-2 select-none",
        className,
      )}
      style={{
        width: dim,
        height: dim,
        borderColor: "var(--color-accent-yellow, #f5c542)",
        backgroundColor: "rgba(245,197,66,0.08)",
        boxShadow: "0 0 12px rgba(245,197,66,0.25), inset 0 0 8px rgba(245,197,66,0.18)",
        borderRadius: 2,
      }}
      title={`${rank.title} — L${level}`}
    >
      <span
        className="tabular-nums"
        style={{ fontSize: fontMain, color: "var(--color-accent-yellow, #f5c542)", lineHeight: 1 }}
      >
        {level}
      </span>
      <span
        className="absolute font-mono uppercase tracking-widest text-text-dim"
        style={{ fontSize: 7, bottom: 2, left: 0, right: 0, textAlign: "center" }}
      >
        {rank.abbr}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  CurrencyCounter
// ──────────────────────────────────────────────────────────────────────
export function CurrencyCounter({
  type,
  amount,
  delta,
  className,
}: {
  type: CurrencyType;
  amount: number;
  delta?: number;
  className?: string;
}) {
  const id = CURRENCY_IDENTITY[type];
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-1 border font-mono",
        className,
      )}
      style={{
        borderColor: `${id.accent}66`,
        backgroundColor: `${id.accent}10`,
        boxShadow: `0 0 8px ${id.accent}22 inset`,
        borderRadius: 2,
      }}
      title={id.description}
    >
      <span
        aria-hidden
        className="font-display font-black"
        style={{ color: id.accent, fontSize: 13, lineHeight: 1 }}
      >
        {id.glyph}
      </span>
      <span className="text-[8px] uppercase tracking-widest text-text-dim">{id.label}</span>
      <span
        className="font-display font-black tabular-nums"
        style={{ color: id.accent, fontSize: 14, lineHeight: 1 }}
      >
        {amount.toLocaleString()}
      </span>
      {delta !== undefined && delta !== 0 && (
        <motion.span
          key={delta + "-" + amount}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[9px] font-mono tabular-nums"
          style={{ color: delta > 0 ? "#10B981" : "#EF4444" }}
        >
          {delta > 0 ? `+${delta}` : `${delta}`}
        </motion.span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  EquippedCosmeticsPanel
// ──────────────────────────────────────────────────────────────────────
export function EquippedCosmeticsPanel({
  profile,
  className,
}: {
  profile: PlayerProfile;
  className?: string;
}) {
  const cape = getCosmeticDef(profile.equippedCosmetics.capeId);
  const title = getCosmeticDef(profile.equippedCosmetics.titleId);
  const banner = profile.equippedCosmetics.bannerId
    ? getCosmeticDef(profile.equippedCosmetics.bannerId)
    : undefined;

  return (
    <div
      className={clsx(
        "border bg-bg-secondary/80 px-3 py-2 font-mono text-text-primary",
        className,
      )}
      style={{ borderColor: "var(--color-border-subtle, #1f2937)", borderRadius: 2 }}
    >
      <div className="text-[9px] uppercase tracking-[0.25em] text-text-dim mb-2">EQUIPPED</div>

      {/* Cape */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="inline-block w-5 h-7 border"
          style={{
            background: cape?.gradient
              ? `linear-gradient(180deg, ${cape.accent}, ${cape.accent}55)`
              : "rgba(255,255,255,0.06)",
            borderColor: cape?.accent ?? "rgba(255,255,255,0.12)",
            borderRadius: 1,
          }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <div className="text-[8px] uppercase text-text-dim tracking-wider">Cape</div>
          <div className="text-[11px] truncate">{cape?.name ?? "—"}</div>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="inline-flex items-center justify-center w-5 h-5 border text-[8px] font-black"
          style={{ borderColor: "var(--color-accent-yellow, #f5c542)", color: "var(--color-accent-yellow, #f5c542)", borderRadius: 1 }}
        >T</span>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] uppercase text-text-dim tracking-wider">Title</div>
          <div className="text-[11px] truncate">{title?.name ?? "—"}</div>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-5 h-3 border"
            style={{
              background: banner.accent
                ? `linear-gradient(90deg, ${banner.accent}, ${banner.accent}55)`
                : "rgba(255,255,255,0.06)",
              borderColor: banner.accent ?? "rgba(255,255,255,0.12)",
              borderRadius: 1,
            }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <div className="text-[8px] uppercase text-text-dim tracking-wider">Banner</div>
            <div className="text-[11px] truncate">{banner.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}
