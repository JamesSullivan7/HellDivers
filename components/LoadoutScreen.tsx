"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import {
  ARMORS,
  WEAPONS,
  BOOSTERS,
  STRATAGEM_PICK_POOL,
  STRATAGEM_PICKS_REQUIRED,
  FIXED_BASICS,
  DEFAULT_ARMOR,
  DEFAULT_WEAPON,
  DEFAULT_BOOSTER,
} from "@/lib/loadout";
import { CARD_LIBRARY, getCardById } from "@/lib/cards";
import { PLANETS } from "@/lib/enemies";
import HudFrame from "./HudFrame";
import CardView from "./CardView";
import AppShell from "./shell/AppShell";
import { FactionIcon } from "@/lib/icons";

type Step = "armor" | "weapon" | "booster" | "stratagems";

const STEPS: { id: Step; label: string }[] = [
  { id: "armor", label: "ARMOR" },
  { id: "weapon", label: "PRIMARY" },
  { id: "booster", label: "BOOSTER" },
  { id: "stratagems", label: "STRATAGEMS" },
];

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "eagle", label: "EAGLE" },
  { id: "orbital", label: "ORBITAL" },
  { id: "sentry", label: "SENTRY" },
  { id: "support", label: "SUPPORT" },
  { id: "backpack", label: "BACKPACK" },
  { id: "utility", label: "UTILITY" },
];

export default function LoadoutScreen() {
  const { faction, startNewRun, goToWar, account, goToArmory, targetPlanetId } = useGame();
  const war = useQuery(api.war.getWar);
  // Resolve actual selected planet by slug. Fall back to faction default if missing.
  const selectedPlanet = war?.planets?.find((p) => p.slug === targetPlanetId);
  const fallback = PLANETS[faction];
  const planet = selectedPlanet
    ? { name: selectedPlanet.name.toUpperCase(), biome: selectedPlanet.biome ?? fallback.biome, description: fallback.description }
    : fallback;

  const [step, setStep] = useState<Step>("armor");
  const [armorId, setArmorId] = useState<string>(DEFAULT_ARMOR);
  const [weaponId, setWeaponId] = useState<string>(DEFAULT_WEAPON);
  const [boosterId, setBoosterId] = useState<string>(DEFAULT_BOOSTER);
  const [stratagems, setStratagems] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showLocked, setShowLocked] = useState<boolean>(false);

  const selectableCards = CARD_LIBRARY.filter((c) => {
    if (!STRATAGEM_PICK_POOL.includes(c.id)) return false;
    if (filter !== "all" && c.type !== filter) return false;
    if (!showLocked && !account.unlockedCards.includes(c.id)) return false;
    return true;
  });

  const toggleStratagem = (id: string) => {
    if (!account.unlockedCards.includes(id)) {
      sfx.alert();
      return;
    }
    sfx.cardSelect();
    if (stratagems.includes(id)) {
      setStratagems(stratagems.filter((x) => x !== id));
    } else if (stratagems.length < STRATAGEM_PICKS_REQUIRED) {
      setStratagems([...stratagems, id]);
    } else {
      sfx.alert();
    }
  };

  const canDeploy = stratagems.length === STRATAGEM_PICKS_REQUIRED;

  const handleNext = () => {
    sfx.click();
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const handlePrev = () => {
    sfx.click();
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
    else goToWar();
  };

  const handleDeploy = () => {
    if (!canDeploy) {
      sfx.alert();
      return;
    }
    sfx.unlock();
    sfx.beacon();
    setTimeout(() => sfx.combatStart(), 250);
    startNewRun({ armorId, weaponId, boosterId, stratagemIds: stratagems });
  };

  return (
    <AppShell activeNav="mission">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow mb-1 flex items-center justify-center gap-2">
            <FactionIcon faction={faction} className="w-4 h-4" />
            Loadout Configuration · Pre-Drop
          </div>
          <div className="text-3xl font-display font-black tracking-tight">
            DESTINATION <span className="text-helldiver-yellow">{planet.name}</span>
          </div>
        </div>

        {/* Step nav */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                sfx.click();
                setStep(s.id);
              }}
              className={clsx(
                "px-4 py-2 border-2 font-display font-bold tracking-widest text-xs transition-all",
                s.id === step
                  ? "bg-helldiver-yellow text-black border-helldiver-yellow shadow-[0_0_18px_rgba(255, 211, 77,0.5)]"
                  : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
              )}
            >
              {String(i + 1).padStart(2, "0")} · {s.label}
            </button>
          ))}
        </div>

        {/* Step content — single keyed wrapper so AnimatePresence swaps cleanly */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
          >
          {step === "armor" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {ARMORS.map((a) => (
                  <motion.button
                    key={a.id}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      sfx.cardSelect();
                      setArmorId(a.id);
                    }}
                    className={clsx(
                      "relative p-5 border-2 text-left transition-all bg-helldiver-panel/80",
                      armorId === a.id
                        ? "border-helldiver-yellow shadow-[0_0_24px_rgba(255, 211, 77,0.4)]"
                        : "border-helldiver-steel hover:border-helldiver-yellow/50"
                    )}
                  >
                    <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-helldiver-yellow" />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-helldiver-yellow" />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-helldiver-yellow" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-helldiver-yellow" />
                    <div className="text-[10px] uppercase tracking-widest text-helldiver-dim mb-2">
                      {a.id === "scout" ? "LIGHT" : a.id === "frontline" ? "MEDIUM" : "HEAVY"} ARMOR
                    </div>
                    <div className="font-display font-black text-lg text-helldiver-yellow tracking-tight mb-3">
                      {a.name.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed mb-3">{a.passive}</div>
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between"><span className="text-helldiver-dim">HP</span><span className={a.hpMod >= 0 ? "text-emerald-400" : "text-helldiver-red"}>{a.hpMod >= 0 ? "+" : ""}{a.hpMod}</span></div>
                      <div className="flex justify-between"><span className="text-helldiver-dim">Hand Size</span><span className={a.handMod >= 0 ? "text-emerald-400" : "text-helldiver-red"}>{a.handMod >= 0 ? "+" : ""}{a.handMod}</span></div>
                      <div className="flex justify-between"><span className="text-helldiver-dim">Starting Block</span><span className="text-sky-400">+{a.startingBlock}</span></div>
                    </div>
                    {armorId === a.id && (
                      <div className="absolute top-2 right-2 text-helldiver-yellow text-xs font-bold">✓ EQUIPPED</div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === "weapon" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {WEAPONS.map((w) => (
                  <motion.button
                    key={w.id}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      sfx.cardSelect();
                      setWeaponId(w.id);
                    }}
                    className={clsx(
                      "relative p-5 border-2 text-left transition-all bg-helldiver-panel/80",
                      weaponId === w.id
                        ? "border-sky-400 shadow-[0_0_24px_rgba(14,165,233,0.4)]"
                        : "border-helldiver-steel hover:border-sky-400/50"
                    )}
                  >
                    <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-sky-400" />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-sky-400" />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-sky-400" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-sky-400" />
                    <div className="text-[10px] uppercase tracking-widest text-helldiver-dim mb-2">
                      Primary Weapon · Auto-Fire
                    </div>
                    <div className="font-display font-black text-lg text-sky-400 tracking-tight mb-3">
                      {w.name.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-300 mb-3 leading-relaxed">{w.description}</div>
                    <div className="flex gap-3 text-[11px] font-mono">
                      <div className="px-2 py-1 border border-helldiver-steel">
                        <span className="text-helldiver-dim">DMG </span>
                        <span className="text-helldiver-yellow font-bold">{w.damage}</span>
                      </div>
                      <div className="px-2 py-1 border border-helldiver-steel">
                        <span className="text-helldiver-dim">HITS </span>
                        <span className="text-helldiver-yellow font-bold">{w.hitsPerTurn}</span>
                      </div>
                      <div className="px-2 py-1 border border-helldiver-steel">
                        <span className="text-helldiver-dim">TGT </span>
                        <span className="text-helldiver-yellow font-bold uppercase">{w.target.replace("_", " ")}</span>
                      </div>
                    </div>
                    {weaponId === w.id && (
                      <div className="absolute top-2 right-2 text-sky-400 text-xs font-bold">✓ EQUIPPED</div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === "booster" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {BOOSTERS.map((b) => (
                  <motion.button
                    key={b.id}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      sfx.cardSelect();
                      setBoosterId(b.id);
                    }}
                    className={clsx(
                      "relative p-5 border-2 text-left transition-all bg-helldiver-panel/80",
                      boosterId === b.id
                        ? "border-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.4)]"
                        : "border-helldiver-steel hover:border-purple-400/50"
                    )}
                  >
                    <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-purple-400" />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-purple-400" />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-purple-400" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-purple-400" />
                    <div className="text-[10px] uppercase tracking-widest text-helldiver-dim mb-2">
                      Run-Wide Booster
                    </div>
                    <div className="font-display font-black text-lg text-purple-400 tracking-tight mb-3">
                      {b.name.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed">{b.description}</div>
                    {boosterId === b.id && (
                      <div className="absolute top-2 right-2 text-purple-400 text-xs font-bold">✓ ACTIVE</div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === "stratagems" && (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[10px] uppercase tracking-widest text-helldiver-dim">
                  Pick <span className="text-helldiver-yellow font-bold">{STRATAGEM_PICKS_REQUIRED}</span> Stratagems for your starter loadout
                </div>
                <div className={clsx(
                  "text-sm font-display font-black tracking-widest",
                  canDeploy ? "text-emerald-400" : "text-helldiver-yellow"
                )}>
                  {stratagems.length} / {STRATAGEM_PICKS_REQUIRED} SELECTED
                </div>
              </div>

              {/* Selected pills */}
              <div className="mb-4 grid grid-cols-5 gap-2 min-h-[60px]">
                {Array.from({ length: STRATAGEM_PICKS_REQUIRED }).map((_, i) => {
                  const id = stratagems[i];
                  const card = id ? getCardById(id) : null;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        "h-14 px-2 flex items-center justify-center text-center border-2 text-xs font-mono",
                        card ? "border-helldiver-yellow text-helldiver-yellow bg-helldiver-yellow/10" : "border-dashed border-helldiver-steel text-helldiver-dim"
                      )}
                    >
                      {card ? (
                        <span className="text-[10px] tracking-wider">{card.name}</span>
                      ) : (
                        <span className="text-[10px]">SLOT {i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Always-included basics */}
              <div className="mb-4 text-[10px] uppercase tracking-widest text-helldiver-dim font-mono">
                ◇ Always In Loadout: 3× Orbital Precision Strike · 1× Stim · 1× Shield Generator
              </div>

              {/* Filters */}
              <div className="mb-3 flex flex-wrap gap-1 items-center">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      sfx.click();
                      setFilter(f.id);
                    }}
                    className={clsx(
                      "px-3 py-1 border text-[10px] tracking-widest font-mono transition-colors",
                      filter === f.id
                        ? "border-helldiver-yellow bg-helldiver-yellow text-black"
                        : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={() => {
                    sfx.click();
                    setShowLocked(!showLocked);
                  }}
                  className={clsx(
                    "px-3 py-1 border text-[10px] tracking-widest font-mono transition-colors",
                    showLocked
                      ? "border-helldiver-yellow bg-helldiver-yellow text-black"
                      : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
                  )}
                >
                  {showLocked ? "✓ SHOW LOCKED" : "□ SHOW LOCKED"}
                </button>
                <button
                  onClick={() => {
                    sfx.click();
                    goToArmory();
                  }}
                  className="px-3 py-1 border text-[10px] tracking-widest font-mono border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black transition-colors"
                >
                  ⌥ ARMORY
                </button>
              </div>

              {/* Card grid */}
              <HudFrame label={`Available Stratagems (${selectableCards.length})`} accent="steel" className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
                  {selectableCards.map((card) => {
                    const selected = stratagems.includes(card.id);
                    const unlocked = account.unlockedCards.includes(card.id);
                    return (
                      <div key={card.id} className="relative">
                        <button
                          onClick={() => toggleStratagem(card.id)}
                          disabled={!unlocked}
                          className={clsx(
                            "transition-transform w-full",
                            selected && "opacity-100",
                            !selected && stratagems.length >= STRATAGEM_PICKS_REQUIRED && unlocked && "opacity-50",
                            !unlocked && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          <CardView card={card} small selected={selected} affordable={unlocked} />
                        </button>
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-3xl">🔒</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </HudFrame>
            </div>
          )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            className="px-5 py-2 border-2 border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow text-[10px] uppercase tracking-[0.3em] font-mono transition-colors"
          >
            ◀ {step === "armor" ? "Back to Sector Select" : "Back"}
          </button>

          {step !== "stratagems" ? (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-b from-helldiver-yellow to-yellow-500 text-helldiver-dark font-display font-black uppercase tracking-[0.3em] border-2 border-helldiver-yellow shadow-[0_0_24px_rgba(255, 211, 77,0.4)] transition-shadow hover:shadow-[0_0_36px_rgba(255, 211, 77,0.6)]"
            >
              Next ▶
            </button>
          ) : (
            <motion.button
              whileHover={canDeploy ? { scale: 1.03 } : {}}
              whileTap={canDeploy ? { scale: 0.97 } : {}}
              onClick={handleDeploy}
              disabled={!canDeploy}
              className={clsx(
                "px-8 py-3 font-display font-black uppercase tracking-[0.3em] border-2 transition-all",
                canDeploy
                  ? "bg-gradient-to-b from-helldiver-red to-red-800 border-helldiver-red text-white shadow-[0_0_30px_rgba(255, 77, 77,0.5)] hover:shadow-[0_0_40px_rgba(255, 77, 77,0.7)]"
                  : "border-helldiver-steel text-helldiver-dim cursor-not-allowed"
              )}
            >
              {canDeploy ? "▶ Deploy Hellpod" : `Pick ${STRATAGEM_PICKS_REQUIRED - stratagems.length} more`}
            </motion.button>
          )}
        </div>
      </motion.div>
    </AppShell>
  );
}
