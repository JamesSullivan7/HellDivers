"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { MapNode, NodeType } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import { PLANETS, ENEMY_TEMPLATES } from "@/lib/enemies";
import { getArmor, getBooster, getWeapon } from "@/lib/loadout";
import { getModifier } from "@/lib/modifiers";
import { reachableFrom } from "@/lib/missionTree";
import { EVENTS } from "@/lib/events";
import { MISSION_TYPES } from "@/lib/missionTypes";
import StarField from "./StarField";
import HudFrame from "./HudFrame";
import SquadStatusPanel from "./SquadStatusPanel";
import ObjectivePanel from "./ObjectivePanel";
import {
  RunModifierBadgeStrip,
  PendingConsequenceIndicator,
  ConsequenceHistoryPanel,
} from "./consequences/ConsequenceHUD";
import {
  RunIdentityBanner,
  FactionPressureMeter,
  RunSeedDisplay,
} from "./run/RunHUD";
import { HellpodIcon, FactionIcon } from "@/lib/icons";

const NODE_GLYPH: Record<NodeType, string> = {
  combat: "✦",
  elite: "☠",
  rest: "✚",
  shop: "$",
  boss: "★",
  event: "?",
  cache: "◆",
  hazard: "☣",
  signal: "◈",
};

const NODE_LABELS: Record<NodeType, string> = {
  combat: "PATROL",
  elite: "ELITE",
  rest: "RESUPPLY",
  shop: "MARKET",
  boss: "PRIMARY OBJECTIVE",
  event: "ENCOUNTER",
  cache: "CACHE",
  hazard: "HAZARD",
  signal: "SIGNAL",
};

const NODE_BORDER: Record<NodeType, string> = {
  combat: "border-helldiver-yellow",
  elite: "border-helldiver-orange",
  rest: "border-emerald-500",
  shop: "border-sky-500",
  boss: "border-helldiver-red",
  event: "border-purple-400",
  cache: "border-amber-300",
  hazard: "border-lime-500",
  signal: "border-cyan-400",
};

const NODE_TEXT: Record<NodeType, string> = {
  combat: "text-helldiver-yellow",
  elite: "text-helldiver-orange",
  rest: "text-emerald-400",
  shop: "text-sky-400",
  boss: "text-helldiver-red",
  event: "text-purple-300",
  cache: "text-amber-300",
  hazard: "text-lime-400",
  signal: "text-cyan-300",
};

const NODE_GLOW: Record<NodeType, string> = {
  combat: "shadow-[0_0_18px_rgba(255,211,77,0.55)]",
  elite: "shadow-[0_0_18px_rgba(255,138,40,0.55)]",
  rest: "shadow-[0_0_18px_rgba(16,185,129,0.5)]",
  shop: "shadow-[0_0_18px_rgba(56,189,248,0.5)]",
  boss: "shadow-[0_0_24px_rgba(239,68,68,0.6)]",
  event: "shadow-[0_0_18px_rgba(192,132,252,0.55)]",
  cache: "shadow-[0_0_18px_rgba(252,211,77,0.55)]",
  hazard: "shadow-[0_0_18px_rgba(132,204,22,0.55)]",
  signal: "shadow-[0_0_18px_rgba(34,211,238,0.55)]",
};

// Visual layout constants for the SVG tree
const TIER_HEIGHT = 110; // px between tiers (vertical)
const NODE_SIZE = 56; // px box size
const COL_GUTTER = 130; // px between cols
const TREE_PAD_X = 40;
const TREE_PAD_Y = 28;

function nodePos(node: MapNode, maxColsByTier: number[]): { x: number; y: number } {
  const cols = maxColsByTier[node.tier] || 1;
  // Center each tier's columns inside the canvas
  const tierWidth = (cols - 1) * COL_GUTTER;
  const startX = -tierWidth / 2;
  const x = startX + node.col * COL_GUTTER;
  const y = node.tier * TIER_HEIGHT;
  return { x, y };
}

export default function MapView() {
  const {
    map,
    currentNodeIndex,
    enterNode,
    ownedDeck,
    player,
    message,
    faction,
    loadout,
    difficulty,
    modifiers,
  } = useGame();
  const runBuffs = useGame((s) => s.runBuffs);
  const missionType = useGame((s) => s.missionType);
  const missionCodename = useGame((s) => s.missionCodename);
  const planet = PLANETS[faction];
  const missionSpec = MISSION_TYPES[missionType];
  const armor = getArmor(loadout.armorId);
  const weapon = getWeapon(loadout.weaponId);
  const booster = getBooster(loadout.boosterId);
  const [hoverNode, setHoverNode] = useState<number | null>(null);

  // Determine reachable nodes
  const startIndex = currentNodeIndex < 0 ? map.findIndex((n) => n.tier === 0) : currentNodeIndex;
  const reachable = startIndex >= 0 ? reachableFrom(map, startIndex) : [];

  // Build per-tier column counts for layout
  const maxColsByTier: number[] = [];
  map.forEach((n) => {
    maxColsByTier[n.tier] = Math.max(maxColsByTier[n.tier] || 0, n.col + 1);
  });

  const tiers = Math.max(...map.map((n) => n.tier), 0) + 1;
  const widestCols = Math.max(...maxColsByTier, 1);
  const canvasWidth = (widestCols - 1) * COL_GUTTER + NODE_SIZE * 2 + TREE_PAD_X * 2;
  const canvasHeight = (tiers - 1) * TIER_HEIGHT + NODE_SIZE + TREE_PAD_Y * 2;

  // Threat tier colour cascades through the top strip + threat number.
  const threatColor =
    difficulty >= 8 ? "#ff4d4d" : difficulty >= 5 ? "#ff8a28" : "#FFC72C";

  return (
    // h-screen + overflow-hidden + flex-col = the entire mission map is
    // strictly one viewport. The map cell scrolls inside if it cannot fit
    // (very tall trees on short viewports), the rest of the layout stays
    // pinned. No page-level scroll. Keeps the map as the hero element.
    <div
      className="h-screen overflow-hidden text-white font-mono relative flex flex-col"
      style={{ background: "#0a0d12" }}
    >
      <StarField />

      {/* ── TOP STRIP (≈80px) — slim horizontal command briefing ── */}
      <header
        className="relative z-10 shrink-0 px-4 py-2 flex items-center gap-4 border-b"
        style={{
          borderColor: "rgba(255,199,44,0.22)",
          background: "linear-gradient(180deg, rgba(14,18,24,0.92), rgba(10,13,18,0.85))",
          minHeight: 80,
        }}
      >
        {/* gold hairline accent */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, #FFC72C, transparent)" }}
        />

        {/* Mission codename + planet */}
        <div className="min-w-0 flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.35em] text-helldiver-yellow">
            <FactionIcon faction={faction} className="w-3.5 h-3.5" />
            {missionCodename}
          </div>
          <div className="font-display font-black tracking-tight text-[18px] leading-none">
            PLANET <span className="text-helldiver-yellow">{planet.name}</span>
          </div>
          <div className="text-[9px] text-helldiver-dim uppercase tracking-[0.32em]">
            {planet.biome} · <span className="text-emerald-400">{missionSpec.label.toUpperCase()}</span>
          </div>
        </div>

        {/* Briefing + modifiers (one line each, max) */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="text-[11px] text-gray-300 italic leading-snug truncate" title={missionSpec.briefing}>
            “{missionSpec.briefing}”
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-h-[16px]">
            {message && (
              <span className="text-[10px] text-helldiver-yellow truncate">› {message}</span>
            )}
            {modifiers.length > 0 && modifiers.map((id) => {
              const m = getModifier(id);
              if (!m) return null;
              return (
                <span
                  key={id}
                  className="px-1.5 h-4 inline-flex items-center text-[8.5px] uppercase tracking-[0.3em] font-display font-black"
                  style={{
                    color: "#ff8a28",
                    border: "1px solid rgba(255,138,40,0.45)",
                    background: "rgba(255,138,40,0.08)",
                  }}
                  title={m.description}
                >
                  ⚠ {m.name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Threat dial */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right leading-tight">
            <div className="text-[8px] uppercase tracking-[0.32em] text-helldiver-dim">Threat</div>
            <div
              className="font-display font-black tabular-nums leading-none"
              style={{ color: threatColor, fontSize: 26 }}
            >
              {difficulty}<span className="text-helldiver-dim text-base">/10</span>
            </div>
          </div>
          <HellpodIcon className="w-9 h-9 text-helldiver-yellow/60" />
        </div>
      </header>

      {/* ── MAIN AREA — map (flex-1) + right panel (320px) ── */}
      <div
        className="relative z-10 flex-1 min-h-0 grid"
        style={{ gridTemplateColumns: "1fr 320px" }}
      >
        {/* MAP CELL — hero element, centered, takes full available height */}
        <div className="relative overflow-auto flex items-center justify-center p-4">
            <div
              style={{
                width: canvasWidth,
                height: canvasHeight,
                position: "relative",
              }}
            >
                {/* SVG layer for edges */}
                <svg
                  width={canvasWidth}
                  height={canvasHeight}
                  className="absolute top-0 left-0 pointer-events-none"
                >
                  {map.map((node) => {
                    const from = nodePos(node, maxColsByTier);
                    const fromX = canvasWidth / 2 + from.x + NODE_SIZE / 2;
                    const fromY = TREE_PAD_Y + from.y + NODE_SIZE / 2;
                    return node.children.map((childIdx) => {
                      const child = map[childIdx];
                      if (!child) return null;
                      const to = nodePos(child, maxColsByTier);
                      const toX = canvasWidth / 2 + to.x + NODE_SIZE / 2;
                      const toY = TREE_PAD_Y + to.y + NODE_SIZE / 2;
                      const reachableEdge =
                        node.index === startIndex && reachable.includes(childIdx);
                      const traveledEdge = node.cleared && child.cleared;
                      return (
                        <line
                          key={`${node.index}-${childIdx}`}
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke={
                            traveledEdge
                              ? "rgba(16,185,129,0.6)"
                              : reachableEdge
                                ? "rgba(255,211,77,0.85)"
                                : "rgba(120,120,140,0.25)"
                          }
                          strokeWidth={reachableEdge ? 2.5 : 1.5}
                          strokeDasharray={reachableEdge ? undefined : "4 4"}
                        />
                      );
                    });
                  })}
                </svg>

                {/* Nodes */}
                {map.map((node) => {
                  if (node.tier === 0) return null; // hide drop point
                  const pos = nodePos(node, maxColsByTier);
                  const left = canvasWidth / 2 + pos.x;
                  const top = TREE_PAD_Y + pos.y;
                  const isCurrent = node.index === currentNodeIndex && !node.cleared;
                  const isReachable = reachable.includes(node.index);
                  const isCleared = node.cleared;
                  const isSelectable = isReachable && !isCleared;

                  return (
                    <motion.button
                      key={node.index}
                      disabled={!isSelectable}
                      onClick={() => {
                        if (!isSelectable) return;
                        sfx.unlock();
                        sfx.beacon();
                        enterNode(node.index);
                      }}
                      onMouseEnter={() => setHoverNode(node.index)}
                      onMouseLeave={() => setHoverNode((cur) => (cur === node.index ? null : cur))}
                      onFocus={() => setHoverNode(node.index)}
                      onBlur={() => setHoverNode((cur) => (cur === node.index ? null : cur))}
                      whileHover={isSelectable ? { scale: 1.08 } : { scale: 1.04 }}
                      whileTap={isSelectable ? { scale: 0.95 } : {}}
                      animate={
                        isSelectable
                          ? { scale: [1, 1.04, 1], opacity: 1 }
                          : { scale: 1, opacity: 1 }
                      }
                      transition={
                        isSelectable
                          ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
                          : {}
                      }
                      style={{
                        position: "absolute",
                        left,
                        top,
                        width: NODE_SIZE,
                        height: NODE_SIZE,
                      }}
                      className={clsx(
                        "flex flex-col items-center justify-center border-2 bg-helldiver-panel/60 transition-colors",
                        node.visibility === "hidden"
                          ? "border-helldiver-steel/50 text-helldiver-dim"
                          : node.visibility === "partial"
                          ? clsx(NODE_BORDER[node.type], "opacity-70 text-helldiver-dim")
                          : clsx(NODE_BORDER[node.type], NODE_TEXT[node.type]),
                        isSelectable && node.visibility !== "hidden" && NODE_GLOW[node.type],
                        isCleared && "border-emerald-700 bg-emerald-900/30 opacity-60",
                        !isSelectable && !isCleared && "opacity-40",
                        isCurrent && "ring-2 ring-helldiver-yellow"
                      )}
                      title={
                        node.visibility === "hidden"
                          ? "UNKNOWN · scout for intel"
                          : node.visibility === "partial"
                          ? `${NODE_LABELS[node.type]} · partial scan`
                          : `${NODE_LABELS[node.type]}${node.enemyTemplateIds.length ? ` · ${node.enemyTemplateIds.join(", ")}` : ""}`
                      }
                    >
                      <div className="font-display font-black text-2xl leading-none">
                        {node.visibility === "hidden" ? "?" : NODE_GLYPH[node.type]}
                      </div>
                      <div className="text-[7px] uppercase tracking-[0.15em] mt-0.5 leading-none">
                        {node.visibility === "hidden"
                          ? "UNKNOWN"
                          : NODE_LABELS[node.type].split(" ")[0]}
                      </div>
                      {isCleared && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center rounded-full">
                          ✓
                        </div>
                      )}
                      {node.visibility === "partial" && !isCleared && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-helldiver-steel text-helldiver-yellow text-[8px] font-black flex items-center justify-center" title="Partial scan">
                          ◐
                        </div>
                      )}
                    </motion.button>
                  );
                })}

                {/* Hover preview tooltip */}
                <AnimatePresence>
                  {hoverNode !== null && map[hoverNode] && (() => {
                    const node = map[hoverNode];
                    const pos = nodePos(node, maxColsByTier);
                    const left = canvasWidth / 2 + pos.x + NODE_SIZE + 12;
                    const top = TREE_PAD_Y + pos.y - 8;
                    // If tooltip would overflow right, flip to left side
                    const flipLeft = left + 240 > canvasWidth;
                    const finalLeft = flipLeft
                      ? canvasWidth / 2 + pos.x - 240 - 12
                      : left;
                    return (
                      <motion.div
                        key={`tip-${hoverNode}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.12 }}
                        style={{
                          position: "absolute",
                          left: finalLeft,
                          top,
                          width: 240,
                          zIndex: 20,
                          pointerEvents: "none",
                        }}
                        className={clsx(
                          "border-2 bg-helldiver-panel/95 backdrop-blur p-3 shadow-xl",
                          NODE_BORDER[node.type]
                        )}
                      >
                        <div className={clsx(
                          "text-[9px] uppercase tracking-[0.3em] font-display font-black mb-1",
                          NODE_TEXT[node.type]
                        )}>
                          {NODE_LABELS[node.type]}
                        </div>
                        <NodePreviewBody node={node} />
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </div>

        {/* RIGHT PANEL — single unified column. No nested boxes, no
            HudFrame chrome. Spacing defines the structure. Sections are
            separated by a hairline rule + uppercase title. */}
        <aside
          className="relative overflow-y-auto border-l flex flex-col"
          style={{
            borderColor: "rgba(255,199,44,0.15)",
            background: "linear-gradient(180deg, rgba(14,18,24,0.85), rgba(10,13,18,0.6))",
          }}
        >
          {/* All sections share px-3 py-1.5 (was 2.5) so 4-5 of them fit
              comfortably inside the right panel without forcing scroll on
              normal viewports. The first section also gets py-2 at top to
              breathe, but every subsequent section uses the tighter spacing. */}

          {/* OBJECTIVES */}
          <div className="px-3 pt-2 pb-1.5 shrink-0">
            <SectionHeading tint="#FFC72C">Objectives</SectionHeading>
            <ObjectivePanel bare />
          </div>

          {/* FACTION PRESSURE — bars only, no footnote */}
          <div className="px-3 py-1.5 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionHeading tint="#ff8a28">Faction Pressure</SectionHeading>
            <FactionPressureMeter bare />
          </div>

          {/* HELLDIVER + LOADOUT — packed into a single section to save space */}
          <div className="px-3 py-1.5 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionHeading tint="#10b981">Helldiver</SectionHeading>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mb-2">
              <div className="flex flex-col">
                <span className="text-helldiver-dim uppercase tracking-widest text-[8.5px]">HP</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {player.hp}<span className="text-helldiver-dim"> / {player.maxHp}</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-helldiver-dim uppercase tracking-widest text-[8.5px]">Reinf</span>
                <span className="text-helldiver-yellow font-bold tabular-nums">{player.reinforcements}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-helldiver-dim uppercase tracking-widest text-[8.5px]">Strats</span>
                <span className="text-white font-bold tabular-nums">{ownedDeck.length}</span>
              </div>
            </div>
            <div className="space-y-0.5 text-[10.5px] font-mono">
              <LoadoutLine label="ARM" value={armor.name} tint="text-helldiver-yellow" />
              <LoadoutLine label="WPN" value={weapon.name} tint="text-sky-400" />
              <LoadoutLine label="BST" value={booster.name} tint="text-purple-400" />
            </div>
          </div>

          {/* RUN BUFFS — only when present */}
          {runBuffs.length > 0 && (
            <div className="px-3 py-1.5 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionHeading tint="#FFC72C">Active Buffs</SectionHeading>
              <div className="space-y-0.5">
                {runBuffs.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-[10px]">
                    <span
                      className="w-1 h-3 shrink-0"
                      style={{ background: b.lifetime === "next_combat" ? "#60c4ff" : "#FFC72C" }}
                    />
                    <span
                      className={clsx(
                        "font-bold truncate",
                        b.lifetime === "next_combat" ? "text-sky-300" : "text-helldiver-yellow",
                      )}
                    >
                      {b.name}
                    </span>
                    <span className="ml-auto text-[8px] uppercase tracking-widest text-helldiver-dim shrink-0">
                      {b.lifetime === "next_combat" ? "1 fight" : "run"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── BOTTOM LEGEND STRIP (32px) — horizontal, low priority ── */}
      <footer
        className="relative z-10 shrink-0 px-4 flex items-center gap-3 overflow-x-auto border-t"
        style={{
          height: 32,
          borderColor: "rgba(255,199,44,0.12)",
          background: "rgba(10,13,18,0.85)",
        }}
      >
        <span className="text-[8.5px] uppercase tracking-[0.32em] text-helldiver-dim shrink-0">Legend</span>
        <LegendChip glyph="✦" tint="#FFC72C" label="Patrol" />
        <LegendChip glyph="☠" tint="#ff8a28" label="Elite" />
        <LegendChip glyph="?" tint="#a855f7" label="Encounter" />
        <LegendChip glyph="✚" tint="#10b981" label="Resupply" />
        <LegendChip glyph="◆" tint="#fcd34d" label="Cache" />
        <LegendChip glyph="☣" tint="#84cc16" label="Hazard" />
        <LegendChip glyph="◈" tint="#22d3ee" label="Signal" />
        <LegendChip glyph="★" tint="#ff4d4d" label="Boss" />
        <span className="text-helldiver-dim text-[9px] shrink-0">·</span>
        <span className="text-[9px] tracking-widest text-helldiver-dim shrink-0">◐ partial intel</span>
        <span className="text-[9px] tracking-widest text-helldiver-dim shrink-0">? unknown</span>
      </footer>
    </div>
  );
}

/** Tiny uppercase section heading used inside the unified right panel. */
function SectionHeading({ tint, children }: { tint: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-1.5 mb-1.5 text-[9px] font-display font-black uppercase tracking-[0.34em]"
      style={{ color: tint }}
    >
      <span className="w-1 h-1" style={{ background: tint, boxShadow: `0 0 4px ${tint}` }} />
      {children}
    </div>
  );
}

/** Inline loadout row — label chip + value name. No nested frame. */
function LoadoutLine({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="px-1 py-0.5 text-[8px] uppercase tracking-[0.26em] text-helldiver-dim shrink-0" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        {label}
      </span>
      <span className={clsx("font-bold leading-tight truncate", tint)}>{value}</span>
    </div>
  );
}

/** Compact horizontal legend pill for the bottom strip. */
function LegendChip({ glyph, tint, label }: { glyph: string; tint: string; label: string }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <span
        className="font-display font-black"
        style={{ color: tint, fontSize: 10, lineHeight: 1, textShadow: `0 0 4px ${tint}66` }}
      >
        {glyph}
      </span>
      <span className="text-[9px] uppercase tracking-widest" style={{ color: tint }}>
        {label}
      </span>
    </div>
  );
}

function Legend({ color, text, label }: { color: string; text: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={clsx("w-3 h-3 border-2 bg-helldiver-panel/60", color)} />
      <span className={text}>{label}</span>
    </div>
  );
}

function NodePreviewBody({ node }: { node: MapNode }) {
  // Hidden = no info at all. Partial = type but no enemy details / no flavor.
  if (node.visibility === "hidden") {
    return (
      <div className="space-y-1">
        <div className="text-[10px] text-helldiver-dim italic leading-snug">
          Sector unmapped. Scout a Signal node to reveal nearby positions.
        </div>
      </div>
    );
  }

  const flavorLine = node.flavor && node.visibility !== "partial" ? (
    <div className="text-[10px] text-gray-300 leading-snug italic mb-2 border-l-2 border-helldiver-steel/40 pl-2">
      "{node.flavor}"
    </div>
  ) : null;

  if (node.type === "cache") {
    const p = node.payload ?? {};
    const reward = p.medals ? `+${p.medals} M` : p.samples ? `+${p.samples} S` : p.requisition ? `+${p.requisition} R` : "Loot";
    return (
      <>
        {flavorLine}
        <div className="text-[11px] text-amber-300 font-display font-bold">
          ◆ Cache · {reward}
        </div>
        <div className="text-[10px] text-gray-300 leading-snug">
          On-enter loot. No combat.
        </div>
      </>
    );
  }
  if (node.type === "hazard") {
    const p = node.payload ?? {};
    return (
      <>
        {flavorLine}
        <div className="text-[11px] text-lime-300 font-display font-bold">
          ☣ Hazard · {p.hpDelta ? `${p.hpDelta} HP` : ""}
          {p.runModifierId ? " · run modifier" : ""}
        </div>
        <div className="text-[10px] text-gray-300 leading-snug">
          Environmental cost on entry.
        </div>
      </>
    );
  }
  if (node.type === "signal") {
    return (
      <>
        {flavorLine}
        <div className="text-[11px] text-cyan-300 font-display font-bold">
          ◈ Signal · reveals {node.revealRadius ?? 1} tier{(node.revealRadius ?? 1) > 1 ? "s" : ""} ahead
        </div>
        <div className="text-[10px] text-gray-300 leading-snug">
          Free intel. Hidden nodes near you become readable.
        </div>
      </>
    );
  }

  if (node.type === "rest") {
    return (
      <>
        {flavorLine}
        <div className="text-[11px] text-emerald-300 leading-snug">
          Resupply beacon — recover ~40% max HP. No combat.
        </div>
      </>
    );
  }
  if (node.type === "shop") {
    return (
      <>
        {flavorLine}
        <div className="text-[11px] text-sky-300 leading-snug">
          Black-market vendor. Spend medals on stratagems, stims, or HP.
        </div>
      </>
    );
  }
  if (node.type === "event") {
    const ev = node.eventId ? EVENTS[node.eventId] : null;
    return (
      <div className="space-y-1">
        {flavorLine}
        <div className="text-[11px] text-purple-200 font-display font-bold">
          {ev?.title ?? "Unknown Encounter"}
        </div>
        <div className="text-[10px] text-gray-300 leading-snug italic line-clamp-3">
          {ev?.flavor ?? "Outcome depends on your choice."}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-helldiver-dim pt-1">
          {ev?.choices.length ?? 0} options
        </div>
      </div>
    );
  }
  // combat / elite / boss
  const enemyCounts = node.enemyTemplateIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className="space-y-1.5">
      {flavorLine}
      <div className="text-[10px] uppercase tracking-widest text-helldiver-dim">
        {node.enemyTemplateIds.length} hostile{node.enemyTemplateIds.length === 1 ? "" : "s"}
      </div>
      <div className="space-y-0.5">
        {Object.entries(enemyCounts).map(([id, count]) => {
          const tpl = ENEMY_TEMPLATES[id];
          return (
            <div key={id} className="flex items-center justify-between text-[11px]">
              <span className="text-gray-200">{tpl?.name ?? id}</span>
              <span className="text-helldiver-yellow tabular-nums">
                {count > 1 ? `×${count}` : ""}
                <span className="text-helldiver-dim ml-2">{tpl?.hp ?? "?"}HP</span>
                {(tpl?.armor ?? 0) > 0 && (
                  <span className="text-helldiver-orange ml-1">A{tpl!.armor}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {node.type === "boss" && (
        <div className="text-[9px] uppercase tracking-widest text-helldiver-red pt-1 border-t border-helldiver-red/30 mt-1">
          ⚠ Primary objective · enrages at 50%
        </div>
      )}
      {node.type === "elite" && (
        <div className="text-[9px] uppercase tracking-widest text-helldiver-orange pt-1 border-t border-helldiver-orange/30 mt-1">
          Elite · counts toward kill_elites
        </div>
      )}
    </div>
  );
}
