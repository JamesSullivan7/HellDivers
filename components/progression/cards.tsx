"use client";

/**
 * PROGRESSION CARDS
 * ──────────────────────────────────────────────────────────────────────
 *   WarbondItemCard   — renders a single WarbondItem
 *   ShipModuleCard    — renders a ShipModuleDef
 *   CosmeticPreview   — renders a CosmeticDef preview tile
 *   MissionRecordCard — renders a MissionRecord row
 */

import clsx from "clsx";
import {
  CosmeticDef,
  CosmeticRarity,
  MissionRecord,
  ShipModuleDef,
  WarbondItem,
} from "@/systems/progression/progressionTypes";
import { CURRENCY_IDENTITY } from "@/systems/progression/economy";

const RARITY_ACCENT: Record<CosmeticRarity, string> = {
  common: "var(--color-text-dim, #8a8d92)",
  uncommon: "var(--color-accent-cyan, #60c4ff)",
  rare: "var(--color-accent-orange, #ff8c2a)",
  legendary: "var(--color-accent-yellow, #f5c542)",
};

function CostPill({ medals, requisition, samples }: { medals?: number; requisition?: number; samples?: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {medals !== undefined && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[9px] tabular-nums"
          style={{ borderColor: `${CURRENCY_IDENTITY.medals.accent}66`, color: CURRENCY_IDENTITY.medals.accent, borderRadius: 1 }}
        >
          {CURRENCY_IDENTITY.medals.glyph} {medals}
        </span>
      )}
      {requisition !== undefined && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[9px] tabular-nums"
          style={{ borderColor: `${CURRENCY_IDENTITY.requisition.accent}66`, color: CURRENCY_IDENTITY.requisition.accent, borderRadius: 1 }}
        >
          {CURRENCY_IDENTITY.requisition.glyph} {requisition}
        </span>
      )}
      {samples !== undefined && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[9px] tabular-nums"
          style={{ borderColor: `${CURRENCY_IDENTITY.samples.accent}66`, color: CURRENCY_IDENTITY.samples.accent, borderRadius: 1 }}
        >
          {CURRENCY_IDENTITY.samples.glyph} {samples}
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  WarbondItemCard
// ──────────────────────────────────────────────────────────────────────
export function WarbondItemCard({
  item,
  unlocked,
  affordable,
  onUnlock,
  className,
}: {
  item: WarbondItem;
  unlocked?: boolean;
  affordable?: boolean;
  onUnlock?: () => void;
  className?: string;
}) {
  const accent = RARITY_ACCENT[item.rarity];
  const locked = !unlocked;
  return (
    <button
      type="button"
      onClick={!unlocked ? onUnlock : undefined}
      disabled={!unlocked && !affordable}
      className={clsx(
        "group relative text-left bg-bg-secondary border p-3 font-mono",
        "transition-all duration-200",
        locked ? "hover:border-accent-yellow/60" : "border-accent-yellow/40 cursor-default",
        !affordable && locked && "opacity-60 cursor-not-allowed",
        className,
      )}
      style={{ borderColor: unlocked ? accent : `${accent}55`, borderRadius: 2 }}
    >
      {/* Rarity accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: accent }} aria-hidden />

      <div className="flex items-start justify-between gap-2 mb-1">
        <span
          className="text-[10px] uppercase tracking-widest font-black"
          style={{ color: accent }}
        >
          {item.name}
        </span>
        <span className="text-[8px] uppercase tracking-widest text-text-dim shrink-0">
          {item.type}
        </span>
      </div>

      <p className="text-[10px] leading-snug text-text-primary/85 mb-2 min-h-[28px]">{item.description}</p>

      <div className="flex items-end justify-between gap-2">
        <CostPill medals={item.cost.medals} requisition={item.cost.requisition} />
        {item.levelRequired && (
          <span className="text-[8px] uppercase tracking-widest text-text-dim">
            L{item.levelRequired}
          </span>
        )}
      </div>

      {unlocked && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 65%, rgba(0,0,0,0.5))" }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-0.5 border bg-bg-secondary/80"
            style={{ color: accent, borderColor: accent, borderRadius: 1 }}
          >
            UNLOCKED
          </span>
        </div>
      )}

      {item.flavor && (
        <div className="mt-1.5 text-[8px] uppercase tracking-widest text-text-dim italic">{item.flavor}</div>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ShipModuleCard
// ──────────────────────────────────────────────────────────────────────
export function ShipModuleCard({
  module,
  unlocked,
  affordable,
  onUnlock,
  className,
}: {
  module: ShipModuleDef;
  unlocked?: boolean;
  affordable?: boolean;
  onUnlock?: () => void;
  className?: string;
}) {
  const accent = "var(--color-accent-cyan, #60c4ff)";
  return (
    <button
      type="button"
      onClick={!unlocked ? onUnlock : undefined}
      disabled={!unlocked && !affordable}
      className={clsx(
        "group relative text-left bg-bg-secondary border p-3 font-mono",
        unlocked ? "border-accent-cyan/40 cursor-default" : "hover:border-accent-yellow/60",
        !affordable && !unlocked && "opacity-60 cursor-not-allowed",
        className,
      )}
      style={{ borderColor: unlocked ? accent : "var(--color-border-subtle, #1f2937)", borderRadius: 2 }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: accent }}>
          {module.name}
        </span>
        <span className="text-[8px] uppercase tracking-widest text-text-dim">
          T{module.tier} · {module.category}
        </span>
      </div>
      <p className="text-[10px] leading-snug text-text-primary/85 mb-2 min-h-[28px]">{module.description}</p>
      <div className="flex items-end justify-between gap-2">
        <CostPill samples={module.cost.samples} />
        {module.levelRequired && (
          <span className="text-[8px] uppercase tracking-widest text-text-dim">L{module.levelRequired}</span>
        )}
      </div>
      {module.flavor && (
        <div className="mt-1.5 text-[8px] uppercase tracking-widest text-text-dim italic">{module.flavor}</div>
      )}
      {unlocked && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 65%, rgba(0,0,0,0.5))" }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-black px-2 py-0.5 border bg-bg-secondary/80"
            style={{ color: accent, borderColor: accent, borderRadius: 1 }}
          >INSTALLED</span>
        </div>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  CosmeticPreview
// ──────────────────────────────────────────────────────────────────────
export function CosmeticPreview({
  cosmetic,
  unlocked,
  equipped,
  onSelect,
  className,
}: {
  cosmetic: CosmeticDef;
  unlocked?: boolean;
  equipped?: boolean;
  onSelect?: () => void;
  className?: string;
}) {
  const accent = RARITY_ACCENT[cosmetic.rarity];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "group relative bg-bg-secondary border p-3 font-mono text-left flex flex-col gap-2",
        equipped ? "border-accent-yellow" : "hover:border-accent-yellow/60",
        className,
      )}
      style={{ borderColor: equipped ? "var(--color-accent-yellow, #f5c542)" : `${accent}55`, borderRadius: 2 }}
    >
      {/* Visual swatch */}
      <div
        className="w-full h-12 border"
        style={{
          background: cosmetic.gradient
            ? `linear-gradient(135deg, ${cosmetic.accent ?? "#fff"}, ${cosmetic.accent ?? "#000"}55)`
            : `linear-gradient(135deg, ${cosmetic.accent ?? "#444"}, transparent)`,
          borderColor: accent,
          borderRadius: 1,
        }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: accent }}>
          {cosmetic.name}
        </span>
        <span className="text-[8px] uppercase tracking-widest text-text-dim">{cosmetic.type}</span>
      </div>
      <p className="text-[10px] leading-snug text-text-primary/85">{cosmetic.description}</p>
      <div className="flex items-end justify-between gap-2 mt-auto">
        {!unlocked ? <CostPill medals={cosmetic.cost.medals} requisition={cosmetic.cost.requisition} /> : <span />}
        {equipped && (
          <span
            className="text-[8px] uppercase tracking-widest font-black"
            style={{ color: "var(--color-accent-yellow, #f5c542)" }}
          >EQUIPPED</span>
        )}
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  MissionRecordCard
// ──────────────────────────────────────────────────────────────────────
const FACTION_ACCENT: Record<MissionRecord["faction"], string> = {
  terminid: "var(--color-faction-terminid, #f59e0b)",
  automaton: "var(--color-faction-automaton, #ef4444)",
  illuminate: "var(--color-faction-illuminate, #a855f7)",
};

function fmtDuration(s: number): string {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function MissionRecordCard({
  record,
  className,
}: {
  record: MissionRecord;
  className?: string;
}) {
  const accent = FACTION_ACCENT[record.faction];
  const win = record.result === "victory";
  return (
    <div
      className={clsx(
        "border bg-bg-secondary px-3 py-2 font-mono text-text-primary flex items-center gap-3",
        className,
      )}
      style={{ borderColor: `${accent}55`, borderRadius: 2 }}
    >
      {/* Faction stripe */}
      <span
        aria-hidden
        className="self-stretch w-[3px]"
        style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
      />

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-[10px] uppercase tracking-widest font-black truncate">
            {record.planet}
          </span>
          <span
            className="text-[9px] uppercase tracking-widest font-black"
            style={{ color: win ? "#10B981" : "#EF4444" }}
          >
            {record.result}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[9px] text-text-dim uppercase tracking-wider">
          <span>{record.faction.toUpperCase()} · D{record.difficulty}</span>
          <span>{fmtDuration(record.durationSeconds)}</span>
        </div>
      </div>

      {/* Rewards */}
      <div className="flex flex-col items-end gap-0.5 text-[9px] tabular-nums">
        <span className="text-accent-yellow">+{record.rewards.medals} M</span>
        <span className="text-accent-orange">+{record.rewards.xp} XP</span>
      </div>
    </div>
  );
}
