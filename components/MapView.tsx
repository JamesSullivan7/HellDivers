"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { NodeType } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import { PLANETS } from "@/lib/enemies";
import { getArmor, getBooster, getWeapon } from "@/lib/loadout";
import { getModifier } from "@/lib/modifiers";
import StarField from "./StarField";
import HudFrame from "./HudFrame";
import SquadStatusPanel from "./SquadStatusPanel";
import { HellpodIcon, FactionIcon } from "@/lib/icons";

const NODE_GLYPH: Record<NodeType, string> = {
  combat: "✦",
  elite: "☠",
  rest: "✚",
  shop: "$",
  boss: "★",
};

const NODE_LABELS: Record<NodeType, string> = {
  combat: "PATROL",
  elite: "ELITE",
  rest: "RESUPPLY",
  shop: "MARKET",
  boss: "PRIMARY OBJECTIVE",
};

const NODE_BORDER: Record<NodeType, string> = {
  combat: "border-helldiver-yellow",
  elite: "border-helldiver-orange",
  rest: "border-emerald-500",
  shop: "border-sky-500",
  boss: "border-helldiver-red",
};

const NODE_TEXT: Record<NodeType, string> = {
  combat: "text-helldiver-yellow",
  elite: "text-helldiver-orange",
  rest: "text-emerald-400",
  shop: "text-sky-400",
  boss: "text-helldiver-red",
};

export default function MapView() {
  const { map, currentNodeIndex, enterNode, ownedDeck, player, message, faction, loadout, difficulty, modifiers } = useGame();
  const planet = PLANETS[faction];
  const armor = getArmor(loadout.armorId);
  const weapon = getWeapon(loadout.weaponId);
  const booster = getBooster(loadout.boosterId);

  const nextIndex =
    currentNodeIndex < 0
      ? 0
      : map[currentNodeIndex]?.cleared
        ? currentNodeIndex + 1
        : currentNodeIndex;

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />

      <div className="max-w-6xl mx-auto relative z-10">
        <HudFrame label="Galactic Operation Briefing" accent="yellow" glow className="p-5 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1 flex items-center gap-2">
                <FactionIcon faction={faction} className="w-4 h-4" />
                Operation: {faction === "automaton" ? "Iron Vigilance" : faction === "illuminate" ? "Crystal Crusade" : "Iron Sword"}
              </div>
              <div className="text-3xl font-display font-black tracking-tight mb-1">
                PLANET <span className="text-helldiver-yellow">{planet.name}</span>
              </div>
              <div className="text-[10px] text-helldiver-dim uppercase tracking-widest mb-2">
                {planet.biome}
              </div>
              <div className="text-xs text-gray-300 max-w-xl">
                Major Order: {planet.description}
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
            <div className="space-y-2">
              {map.map((node, i) => {
                const isCurrent = i === nextIndex;
                const isLocked = i > nextIndex;
                const isCleared = node.cleared;
                return (
                  <motion.button
                    key={i}
                    disabled={!isCurrent}
                    onClick={() => {
                      sfx.unlock();
                      sfx.beacon();
                      enterNode(i);
                    }}
                    whileHover={isCurrent ? { x: 6 } : {}}
                    className={clsx(
                      "relative w-full flex items-center gap-3 p-3 border-2 transition-all text-left bg-helldiver-panel/40",
                      isCurrent && [
                        NODE_BORDER[node.type],
                        "shadow-[0_0_20px_rgba(255, 211, 77,0.25)]",
                        "animate-pulse-yellow",
                      ],
                      isCleared && "border-emerald-700 bg-emerald-900/20 opacity-60",
                      isLocked && "border-helldiver-steel/40 opacity-30"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-12 h-12 flex items-center justify-center text-2xl border-2 font-display font-black",
                        NODE_BORDER[node.type],
                        NODE_TEXT[node.type],
                        isCleared && "opacity-60"
                      )}
                    >
                      {NODE_GLYPH[node.type]}
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim">
                        Node {String(i + 1).padStart(2, "0")} · {NODE_LABELS[node.type]}
                      </div>
                      <div className="text-sm font-display font-bold tracking-wider">
                        {node.enemyTemplateIds.length > 0
                          ? `${node.enemyTemplateIds.length} HOSTILE${node.enemyTemplateIds.length > 1 ? "S" : ""} DETECTED`
                          : "SECURE ZONE"}
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="text-helldiver-yellow text-xs font-display font-bold tracking-[0.25em] animate-blink">
                        ► DEPLOY
                      </div>
                    )}
                    {isCleared && (
                      <div className="text-emerald-400 text-xs font-bold tracking-[0.2em]">
                        ✓ CLEARED
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </HudFrame>

          <div className="space-y-4">
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
              <div className="max-h-60 overflow-y-auto space-y-1 text-[11px]">
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
