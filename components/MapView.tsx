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
import { HellpodIcon, FactionIcon } from "@/lib/icons";

const NODE_GLYPH: Record<NodeType, string> = {
  combat: "✦",
  elite: "☠",
  rest: "✚",
  shop: "$",
  boss: "★",
  event: "?",
};

const NODE_LABELS: Record<NodeType, string> = {
  combat: "PATROL",
  elite: "ELITE",
  rest: "RESUPPLY",
  shop: "MARKET",
  boss: "PRIMARY OBJECTIVE",
  event: "ENCOUNTER",
};

const NODE_BORDER: Record<NodeType, string> = {
  combat: "border-helldiver-yellow",
  elite: "border-helldiver-orange",
  rest: "border-emerald-500",
  shop: "border-sky-500",
  boss: "border-helldiver-red",
  event: "border-purple-400",
};

const NODE_TEXT: Record<NodeType, string> = {
  combat: "text-helldiver-yellow",
  elite: "text-helldiver-orange",
  rest: "text-emerald-400",
  shop: "text-sky-400",
  boss: "text-helldiver-red",
  event: "text-purple-300",
};

const NODE_GLOW: Record<NodeType, string> = {
  combat: "shadow-[0_0_18px_rgba(255,211,77,0.55)]",
  elite: "shadow-[0_0_18px_rgba(255,138,40,0.55)]",
  rest: "shadow-[0_0_18px_rgba(16,185,129,0.5)]",
  shop: "shadow-[0_0_18px_rgba(56,189,248,0.5)]",
  boss: "shadow-[0_0_24px_rgba(239,68,68,0.6)]",
  event: "shadow-[0_0_18px_rgba(192,132,252,0.55)]",
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

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />

      <div className="max-w-7xl mx-auto relative z-10">
        <HudFrame label="Galactic Operation Briefing" accent="yellow" glow className="p-5 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1 flex items-center gap-2">
                <FactionIcon faction={faction} className="w-4 h-4" />
                {missionCodename}
              </div>
              <div className="text-3xl font-display font-black tracking-tight mb-1">
                PLANET <span className="text-helldiver-yellow">{planet.name}</span>
              </div>
              <div className="text-[10px] text-helldiver-dim uppercase tracking-widest mb-2">
                {planet.biome} · <span className="text-emerald-400">{missionSpec.label.toUpperCase()}</span>
              </div>
              <div className="text-xs text-gray-300 max-w-xl italic">
                {missionSpec.briefing}
              </div>
              {message && (
                <div className="mt-2 text-helldiver-yellow text-sm">› {message}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">Threat Tier</div>
              <div className={
                "font-display font-black text-3xl " +
                (difficulty >= 8 ? "text-helldiver-red" : difficulty >= 5 ? "text-helldiver-orange" : "text-helldiver-yellow")
              }>
                {difficulty}/10
              </div>
              <div className="hidden md:block text-helldiver-yellow/60 mt-2">
                <HellpodIcon className="w-12 h-12 ml-auto" />
              </div>
            </div>
          </div>

          {modifiers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-helldiver-yellow/30">
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-orange mb-1">
                ⚠ Active Sector Modifiers
              </div>
              <div className="flex flex-wrap gap-2">
                {modifiers.map((id) => {
                  const m = getModifier(id);
                  if (!m) return null;
                  return (
                    <div
                      key={id}
                      className="px-2 py-1 bg-helldiver-orange/10 border border-helldiver-orange/50 text-[10px]"
                      title={m.description}
                    >
                      <span className="text-helldiver-orange font-bold">{m.name}</span>{" "}
                      <span className="text-gray-300">— {m.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </HudFrame>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <HudFrame label="Operation Path" accent="steel" className="p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim mb-3">
              Branching Mission Plan · select your route
            </div>
            <div className="overflow-auto flex justify-center">
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
                        NODE_BORDER[node.type],
                        NODE_TEXT[node.type],
                        isSelectable && NODE_GLOW[node.type],
                        isCleared && "border-emerald-700 bg-emerald-900/30 opacity-60",
                        !isSelectable && !isCleared && "opacity-40",
                        isCurrent && "ring-2 ring-helldiver-yellow"
                      )}
                      title={`${NODE_LABELS[node.type]}${node.enemyTemplateIds.length ? ` · ${node.enemyTemplateIds.join(", ")}` : ""}`}
                    >
                      <div className="font-display font-black text-2xl leading-none">
                        {NODE_GLYPH[node.type]}
                      </div>
                      <div className="text-[7px] uppercase tracking-[0.15em] mt-0.5 leading-none">
                        {NODE_LABELS[node.type].split(" ")[0]}
                      </div>
                      {isCleared && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center rounded-full">
                          ✓
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

            <div className="mt-4 flex flex-wrap gap-3 text-[9px] uppercase tracking-widest text-helldiver-dim">
              <Legend color="border-helldiver-yellow" text="text-helldiver-yellow" label="Patrol" />
              <Legend color="border-helldiver-orange" text="text-helldiver-orange" label="Elite" />
              <Legend color="border-purple-400" text="text-purple-300" label="Encounter" />
              <Legend color="border-emerald-500" text="text-emerald-400" label="Resupply" />
              <Legend color="border-helldiver-red" text="text-helldiver-red" label="Boss" />
            </div>
          </HudFrame>

          <div className="space-y-4">
            <ObjectivePanel />

            {runBuffs.length > 0 && (
              <HudFrame label="Active Buffs" accent="steel" className="p-3">
                <div className="space-y-2">
                  {runBuffs.map((b) => (
                    <div
                      key={b.id}
                      className={clsx(
                        "border-l-2 pl-2 py-1",
                        b.lifetime === "next_combat"
                          ? "border-sky-400"
                          : "border-helldiver-yellow"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={clsx(
                          "text-[11px] font-bold",
                          b.lifetime === "next_combat" ? "text-sky-300" : "text-helldiver-yellow"
                        )}>
                          {b.name}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-helldiver-dim">
                          {b.lifetime === "next_combat" ? "1 fight" : "run"}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-300 leading-snug">
                        {b.description}
                      </div>
                    </div>
                  ))}
                </div>
              </HudFrame>
            )}

            <HudFrame label="Helldiver" accent="yellow" className="p-3">
              <div className="space-y-1.5 text-sm font-mono">
                <div className="flex justify-between"><span className="text-helldiver-dim">HP</span><span className="text-emerald-400 font-bold">{player.hp} / {player.maxHp}</span></div>
                <div className="flex justify-between"><span className="text-helldiver-dim">Reinforcements</span><span className="text-helldiver-yellow font-bold">{player.reinforcements}</span></div>
                <div className="flex justify-between"><span className="text-helldiver-dim">Stratagems</span><span className="text-white font-bold">{ownedDeck.length}</span></div>
              </div>
            </HudFrame>

            <HudFrame label="Equipment" accent="steel" className="p-3">
              <div className="space-y-2 text-[11px] font-mono">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">Armor</div>
                  <div className="text-helldiver-yellow font-bold leading-tight">{armor.name}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">Primary</div>
                  <div className="text-sky-400 font-bold leading-tight">{weapon.name}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">Booster</div>
                  <div className="text-purple-400 font-bold leading-tight">{booster.name}</div>
                </div>
              </div>
            </HudFrame>

            <HudFrame label="Stratagem Loadout" accent="steel" className="p-3">
              <div className="max-h-48 overflow-y-auto space-y-1 text-[11px]">
                {ownedDeck.map((c, i) => (
                  <div
                    key={i}
                    className="flex justify-between border-b border-helldiver-steel/40 py-1 hover:bg-helldiver-yellow/5"
                  >
                    <span className="truncate text-gray-200">{c.name}</span>
                    <span className="text-helldiver-yellow tabular-nums font-bold">{c.cost}R</span>
                  </div>
                ))}
              </div>
            </HudFrame>

            <SquadStatusPanel
              currentPhase="map"
              currentNode={currentNodeIndex >= 0 ? currentNodeIndex : 0}
              currentHp={player.hp}
              currentMaxHp={player.maxHp}
            />
          </div>
        </div>
      </div>
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
  const flavorLine = node.flavor ? (
    <div className="text-[10px] text-gray-300 leading-snug italic mb-2 border-l-2 border-helldiver-steel/40 pl-2">
      "{node.flavor}"
    </div>
  ) : null;

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
