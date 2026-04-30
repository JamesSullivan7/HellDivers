"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { Faction } from "@/lib/types";
import { PLANETS } from "@/lib/enemies";
import { rollModifiers, getModifier } from "@/lib/modifiers";
import StarField from "./StarField";
import HudFrame from "./HudFrame";
import { FactionIcon } from "@/lib/icons";

interface FactionInfo {
  id: Faction;
  callsign: string;
  threat: string;
  baseDifficulty: number;
  tagline: string;
  accentBg: string;
  accentText: string;
  border: string;
}

const FACTIONS: FactionInfo[] = [
  {
    id: "terminid",
    callsign: "ORDER 66",
    threat: "Terminid Bug Swarm",
    baseDifficulty: 3,
    tagline: "Massive horde ·weak armor ·high mobility",
    accentBg: "from-orange-700 to-yellow-700",
    accentText: "text-helldiver-orange",
    border: "border-helldiver-orange",
  },
  {
    id: "automaton",
    callsign: "ORDER 88",
    threat: "Automaton Mechanized",
    baseDifficulty: 5,
    tagline: "Heavy armor ·ranged ·slow but deadly",
    accentBg: "from-red-800 to-red-950",
    accentText: "text-helldiver-red",
    border: "border-helldiver-red",
  },
  {
    id: "illuminate",
    callsign: "ORDER 99",
    threat: "Illuminate Cult",
    baseDifficulty: 7,
    tagline: "Phase shields ·psionic attacks ·elusive",
    accentBg: "from-sky-700 to-purple-900",
    accentText: "text-sky-400",
    border: "border-sky-500",
  },
];

const DIFF_LABELS: Record<number, string> = {
  1: "TRIVIAL",
  2: "EASY",
  3: "MEDIUM",
  4: "CHALLENGING",
  5: "HARD",
  6: "EXTREME",
  7: "SUICIDE MISSION",
  8: "IMPOSSIBLE",
  9: "HELLDIVE",
  10: "SUPER HELLDIVE",
};

export default function FactionSelect() {
  const { goToLoadout, goToMenu, difficulty, setDifficulty } = useGame();
  const [seed, setSeed] = useState(() => Date.now());

  // Per-faction modifiers preview
  const previews = useMemo(() => {
    return FACTIONS.map((f) => ({
      id: f.id,
      mods: rollModifiers(f.id, difficulty, seed),
    }));
  }, [difficulty, seed]);

  return (
    <div className="min-h-screen text-white font-mono p-6 relative">
      <StarField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-2">
            ? Operation Selection ·Galactic Command ?
          </div>
          <div className="text-4xl font-display font-black tracking-tight mb-2">
            CHOOSE YOUR <span className="text-helldiver-yellow">DEPLOYMENT</span>
          </div>
          <div className="text-xs text-gray-400 max-w-2xl mx-auto">
            Pick a sector and difficulty. Higher tiers grant more medals, samples, and XP ·at a cost.
          </div>
        </div>

        {/* Difficulty selector */}
        <HudFrame label="Operation Difficulty" accent="yellow" className="p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim w-24">Threat Tier</div>
            <div className="flex-1 flex gap-1">
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
                      "h-8 flex-1 border-2 transition-all font-display font-bold text-xs",
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
            <div className="w-44 text-right">
              <div className={clsx(
                "font-display font-black text-lg tracking-wider",
                difficulty >= 8 ? "text-helldiver-red" : difficulty >= 5 ? "text-helldiver-orange" : "text-helldiver-yellow"
              )}>
                {DIFF_LABELS[difficulty]}
              </div>
              <div className="text-[9px] text-helldiver-dim uppercase tracking-widest">
                �{(0.8 + (difficulty - 1) * 0.18).toFixed(2)} REWARDS
              </div>
            </div>
          </div>
        </HudFrame>

        {/* Faction cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {FACTIONS.map((f, i) => {
            const planet = PLANETS[f.id];
            const factionMods = previews.find((p) => p.id === f.id)?.mods ?? [];
            return (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sfx.unlock();
                  sfx.click();
                  goToLoadout(f.id, difficulty, factionMods);
                }}
                className={clsx(
                  "relative text-left bg-helldiver-panel/90 backdrop-blur-sm border-2 p-5 transition-all overflow-hidden group",
                  f.border,
                  "hover:shadow-[0_0_30px_currentColor]",
                  f.accentText
                )}
              >
                <span className={clsx("absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2", f.border)} />
                <span className={clsx("absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2", f.border)} />
                <span className={clsx("absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2", f.border)} />
                <span className={clsx("absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2", f.border)} />

                <div className={clsx("absolute -top-1 -right-12 w-32 py-0.5 text-center text-[9px] tracking-widest font-mono text-black bg-gradient-to-r rotate-45", f.accentBg)}>
                  {f.callsign}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className={clsx("w-12 h-12 flex items-center justify-center border-2", f.border)}>
                    <FactionIcon faction={f.id} className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-dim">
                      Recommended {f.baseDifficulty}/10
                    </div>
                    <div className={clsx("font-display font-black tracking-wider text-lg", f.accentText)}>
                      {f.threat.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="border-t border-helldiver-steel pt-3 mb-3">
                  <div className="text-[10px] uppercase tracking-widest text-helldiver-dim">Planet</div>
                  <div className="text-xl font-display font-bold text-white">{planet.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{planet.biome}</div>
                </div>

                <div className="text-xs text-gray-300 mb-3 leading-snug">{planet.description}</div>

                <div className="text-[10px] text-helldiver-dim uppercase tracking-widest mb-2">{f.tagline}</div>

                {/* Modifiers */}
                <div className="border-t border-helldiver-steel/60 pt-2 mt-2 min-h-[60px]">
                  <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-yellow mb-1">
                    Sector Modifiers ({factionMods.length})
                  </div>
                  {factionMods.length === 0 ? (
                    <div className="text-[10px] text-helldiver-dim italic">� Standard conditions �</div>
                  ) : (
                    <div className="space-y-0.5">
                      {factionMods.map((id) => {
                        const m = getModifier(id);
                        if (!m) return null;
                        return (
                          <div key={id} className="text-[10px]">
                            <span className="text-helldiver-orange">?</span>{" "}
                            <span className="text-white font-bold">{m.name}</span>{" "}
                            <span className="text-helldiver-dim">� {m.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={clsx("absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r origin-left transition-transform group-hover:scale-x-100 scale-x-50", f.accentBg)} />
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              sfx.click();
              goToMenu();
            }}
            className="px-6 py-2 border-2 border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow text-[10px] uppercase tracking-[0.3em] font-mono transition-colors"
          >
            ? Return to HQ
          </button>
          <button
            onClick={() => {
              sfx.click();
              setSeed(Date.now());
            }}
            className="px-4 py-2 border-2 border-helldiver-yellow text-helldiver-yellow hover:bg-helldiver-yellow hover:text-black text-[10px] uppercase tracking-[0.3em] font-mono transition-colors"
          >
            ? Reroll Modifiers
          </button>
        </div>
      </motion.div>
    </div>
  );
}
