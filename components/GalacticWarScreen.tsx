"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { Faction } from "@/lib/types";
import { rollModifiers, getModifier } from "@/lib/modifiers";
import { loadWarState, listPlanets, PlanetState, WarState } from "@/lib/galacticWar";
import HudFrame from "./HudFrame";
import MajorOrderBanner from "./MajorOrderBanner";
import ActivityTicker from "./ActivityTicker";
import AppShell from "./shell/AppShell";
import { FactionIcon } from "@/lib/icons";

const DIFF_LABELS: Record<number, string> = {
  1: "TRIVIAL", 2: "EASY", 3: "MEDIUM", 4: "CHALLENGING", 5: "HARD",
  6: "EXTREME", 7: "SUICIDE MISSION", 8: "IMPOSSIBLE", 9: "HELLDIVE", 10: "SUPER HELLDIVE",
};

const FACTION_COLOR: Record<Faction, string> = {
  terminid: "border-helldiver-orange text-helldiver-orange",
  automaton: "border-helldiver-red text-helldiver-red",
  illuminate: "border-sky-500 text-sky-400",
};

const FACTION_BG: Record<Faction, string> = {
  terminid: "from-orange-700/40 to-transparent",
  automaton: "from-red-800/40 to-transparent",
  illuminate: "from-sky-700/40 to-transparent",
};

export default function GalacticWarScreen() {
  const { goToLoadout, difficulty, setDifficulty } = useGame();
  const [war, setWar] = useState<WarState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => Date.now());

  // Load local war state on mount, refresh when reward phase changes update it
  useEffect(() => {
    setWar(loadWarState());
    // Reload when storage changes (e.g. after a run finishes)
    const onStorage = () => setWar(loadWarState());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, []);

  const planets: PlanetState[] = war ? listPlanets(war) : [];
  const majorOrder = war?.majorOrder ?? null;

  const sectors = useMemo(() => {
    const map: Record<string, PlanetState[]> = {};
    planets.forEach((p) => {
      if (!map[p.sector]) map[p.sector] = [];
      map[p.sector].push(p);
    });
    return map;
  }, [planets]);

  const selected = selectedId ? planets.find((p) => p.id === selectedId) ?? null : null;
  const isMajorTarget =
    selected && majorOrder?.targetPlanetIds.includes(selected.id);

  const modifierIds = useMemo(() => {
    if (!selected) return [];
    return rollModifiers(selected.faction, difficulty, seed);
  }, [selected, difficulty, seed]);

  return (
    <AppShell activeNav="war">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="text-center mb-5">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-blink" />
            ◢ Galactic War · Sector Command ◣
          </div>
          <div className="text-4xl font-display font-black tracking-tight">
            STRATEGIC <span className="text-helldiver-yellow">DEPLOYMENT MAP</span>
          </div>
        </div>

        {majorOrder && war && <MajorOrderBanner warState={war} />}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-5">
          <HudFrame label="Active Planetary Theaters" accent="yellow" className="p-4">
            {!war ? (
              <div className="text-center py-8 text-helldiver-dim text-xs uppercase tracking-widest">
                Loading war room...
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(sectors).map(([sector, sectorPlanets]) => (
                  <div key={sector}>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim mb-2">
                      Sector · {sector}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {sectorPlanets.map((planet) => {
                        const isMajor = majorOrder?.targetPlanetIds.includes(planet.id);
                        const isSelected = selectedId === planet.id;
                        const liberated = planet.liberation >= 100;
                        return (
                          <motion.button
                            key={planet.id}
                            whileHover={{ y: -3, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              sfx.click();
                              setSelectedId(planet.id);
                              setSeed(Date.now());
                            }}
                            className={clsx(
                              "relative p-3 border-2 text-left bg-gradient-to-b transition-all",
                              FACTION_BG[planet.faction],
                              FACTION_COLOR[planet.faction],
                              isSelected && "ring-2 ring-helldiver-yellow shadow-[0_0_18px_rgba(255, 211, 77,0.5)]"
                            )}
                          >
                            {isMajor && (
                              <div className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[8px] tracking-widest font-bold bg-helldiver-red text-white border border-helldiver-red">
                                ★MO
                              </div>
                            )}
                            {liberated && (
                              <div className="absolute -top-1 -left-1 px-1.5 py-0.5 text-[8px] tracking-widest font-bold bg-emerald-500 text-black border border-emerald-500">
                                ✓
                              </div>
                            )}
                            <div className="flex items-center gap-1 mb-1">
                              <FactionIcon faction={planet.faction} className="w-3.5 h-3.5" />
                              <span className="text-[9px] uppercase tracking-widest text-helldiver-dim">
                                {planet.faction}
                              </span>
                            </div>
                            <div className="font-display font-black text-sm leading-tight tracking-tight text-white mb-1">
                              {planet.name.toUpperCase()}
                            </div>
                            {planet.biome && (
                              <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mb-2 truncate">
                                {planet.biome}
                              </div>
                            )}

                            <div className="h-2 bg-black border border-helldiver-steel relative overflow-hidden">
                              <motion.div
                                animate={{ width: `${planet.liberation}%` }}
                                transition={{ type: "spring", stiffness: 100, damping: 25 }}
                                className={clsx(
                                  "h-full",
                                  liberated
                                    ? "bg-emerald-500"
                                    : planet.liberation > 60
                                      ? "bg-helldiver-yellow"
                                      : "bg-helldiver-orange"
                                )}
                              />
                            </div>
                            <div className="text-[10px] mt-1 flex items-center justify-between text-helldiver-dim">
                              <span>{planet.liberation.toFixed(1)}% LIB</span>
                              {liberated && <span className="text-emerald-400 text-[9px]">FREED</span>}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </HudFrame>

          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <HudFrame label="Mission Briefing" accent="yellow" glow className="p-4">
                    <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-yellow mb-1">
                      {selected.sector} Sector
                    </div>
                    <div className="text-2xl font-display font-black tracking-tight mb-1">
                      {selected.name.toUpperCase()}
                    </div>
                    {selected.biome && (
                      <div className="text-[10px] uppercase tracking-widest text-helldiver-dim mb-2">
                        {selected.biome}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <FactionIcon faction={selected.faction} className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest text-helldiver-dim">
                        {selected.faction} controlled
                      </span>
                    </div>
                    {isMajorTarget && (
                      <div className="mb-3 px-2 py-1 bg-helldiver-red/30 border border-helldiver-red text-[10px] uppercase tracking-widest text-helldiver-red font-bold">
                        ★ MAJOR ORDER TARGET
                      </div>
                    )}

                    <div className="border-t border-helldiver-steel pt-3 mb-3">
                      <div className="text-[10px] uppercase tracking-widest text-helldiver-dim mb-1">
                        Liberation Status
                      </div>
                      <div className="h-2.5 bg-black border border-helldiver-steel relative overflow-hidden mb-1">
                        <motion.div
                          animate={{ width: `${selected.liberation}%` }}
                          transition={{ type: "spring", stiffness: 100, damping: 25 }}
                          className={clsx(
                            "h-full",
                            selected.liberation >= 100
                              ? "bg-emerald-500"
                              : selected.liberation > 60
                                ? "bg-helldiver-yellow"
                                : "bg-helldiver-orange"
                          )}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-helldiver-dim">
                        <span>{selected.liberation.toFixed(2)}% liberated</span>
                        <span>
                          {selected.liberation >= 100
                            ? "PLANET SECURED"
                            : `${Math.ceil((100 - selected.liberation) / 22)} ops to liberate`}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-helldiver-steel pt-3 mb-3">
                      <div className="text-[10px] uppercase tracking-widest text-helldiver-dim mb-2">
                        Threat Tier
                      </div>
                      <div className="grid grid-cols-10 gap-0.5 mb-2">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const active = i < difficulty;
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                sfx.click();
                                setDifficulty(i + 1);
                                setSeed(Date.now());
                              }}
                              className={clsx(
                                "h-7 border font-display font-bold text-[10px] transition-all",
                                active
                                  ? i + 1 >= 8
                                    ? "bg-helldiver-red border-helldiver-red text-white"
                                    : i + 1 >= 5
                                      ? "bg-helldiver-orange border-helldiver-orange text-black"
                                      : "bg-helldiver-yellow border-helldiver-yellow text-black"
                                  : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow"
                              )}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={clsx(
                          "font-display font-black tracking-wider",
                          difficulty >= 8 ? "text-helldiver-red" : difficulty >= 5 ? "text-helldiver-orange" : "text-helldiver-yellow"
                        )}>
                          {DIFF_LABELS[difficulty]}
                        </span>
                        <span className="text-helldiver-dim uppercase tracking-widest">
                          ×{(0.8 + (difficulty - 1) * 0.18).toFixed(2)} REWARDS
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-helldiver-steel pt-3 mb-3 min-h-[60px]">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] uppercase tracking-widest text-helldiver-dim">
                          Sector Modifiers
                        </div>
                        <button
                          onClick={() => {
                            sfx.click();
                            setSeed(Date.now());
                          }}
                          className="text-[9px] uppercase tracking-widest text-helldiver-yellow hover:text-yellow-300"
                        >
                          ↻ Reroll
                        </button>
                      </div>
                      {modifierIds.length === 0 ? (
                        <div className="text-[10px] text-helldiver-dim italic">— Standard conditions —</div>
                      ) : (
                        <div className="space-y-1">
                          {modifierIds.map((id) => {
                            const m = getModifier(id);
                            if (!m) return null;
                            return (
                              <div key={id} className="text-[10px]">
                                <span className="text-helldiver-orange">⚠</span>{" "}
                                <span className="text-white font-bold">{m.name}</span>
                                <div className="text-helldiver-dim text-[9px] ml-3">{m.description}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        sfx.unlock();
                        sfx.beacon();
                        useGame.setState({ targetPlanetId: selected.id });
                        goToLoadout(selected.faction, difficulty, modifierIds);
                      }}
                      className="w-full py-3 bg-gradient-to-b from-helldiver-yellow to-yellow-500 text-helldiver-dark font-display font-black uppercase tracking-[0.3em] border-2 border-helldiver-yellow shadow-[0_0_20px_rgba(255, 211, 77,0.4)]"
                    >
                      ▶ Configure Loadout
                    </motion.button>
                  </HudFrame>
                </motion.div>
              ) : (
                <HudFrame label="Awaiting Planet Selection" accent="steel" className="p-6 text-center">
                  <div className="text-helldiver-dim text-xs uppercase tracking-widest font-mono">
                    Select a theater from the deployment map.
                  </div>
                </HudFrame>
              )}
            </AnimatePresence>

            <ActivityTicker />
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
