"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { loadWarState } from "@/lib/galacticWar";
import {
  ARMORS,
  WEAPONS,
  BOOSTERS,
  STRATAGEM_PICK_POOL,
  STRATAGEM_PICKS_REQUIRED,
  FREE_STRATAGEM_ID,
  FIXED_BASICS,
  DEFAULT_ARMOR,
  DEFAULT_WEAPON,
  DEFAULT_BOOSTER,
  getArmorEffective,
  getWeaponEffective,
  MAX_TIER,
} from "@/lib/loadout";
import { CARD_LIBRARY, getCardById } from "@/lib/cards";
import { PLANETS } from "@/lib/enemies";
import HudFrame from "./HudFrame";
import CardView from "./CardView";
import AppShell from "./shell/AppShell";
import { FactionIcon } from "@/lib/icons";
import { getArmorArt, getWeaponArt, getBoosterArt } from "@/lib/artManifest";
import type { Armor } from "@/lib/types";
import type { Account } from "@/lib/account";

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
  const [warPlanet, setWarPlanet] = useState<{ name: string; biome: string } | null>(null);
  // Resolve actual selected planet from local war state. Fall back to faction default if missing.
  useEffect(() => {
    if (!targetPlanetId) {
      setWarPlanet(null);
      return;
    }
    const war = loadWarState();
    const p = war.planets[targetPlanetId];
    if (p) setWarPlanet({ name: p.name, biome: p.biome });
    else setWarPlanet(null);
  }, [targetPlanetId]);

  const fallback = PLANETS[faction];
  const planet = warPlanet
    ? { name: warPlanet.name.toUpperCase(), biome: warPlanet.biome || fallback.biome, description: fallback.description }
    : fallback;

  const [step, setStep] = useState<Step>("armor");
  // Default to the first owned item the player has, falling back to standard issue.
  const [armorId, setArmorId] = useState<string>(
    account.ownedArmors.includes(DEFAULT_ARMOR) ? DEFAULT_ARMOR : (account.ownedArmors[0] ?? DEFAULT_ARMOR)
  );
  const [weaponId, setWeaponId] = useState<string>(
    account.ownedWeapons.includes(DEFAULT_WEAPON) ? DEFAULT_WEAPON : (account.ownedWeapons[0] ?? DEFAULT_WEAPON)
  );
  const [boosterId, setBoosterId] = useState<string>(
    account.ownedBoosters.includes(DEFAULT_BOOSTER) ? DEFAULT_BOOSTER : (account.ownedBoosters[0] ?? DEFAULT_BOOSTER)
  );
  const [stratagems, setStratagems] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showLocked, setShowLocked] = useState<boolean>(false);

  const selectableCards = CARD_LIBRARY.filter((c) => {
    if (!STRATAGEM_PICK_POOL.includes(c.id)) return false;
    // Resupply is included automatically as the free 5th slot — hide it
    // from the picker so the player doesn't double up on a "free" pick.
    if (c.id === FREE_STRATAGEM_ID) return false;
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
            <ArmorStep
              account={account}
              equippedId={armorId}
              setEquippedId={setArmorId}
            />
          )}

          {step === "weapon" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {WEAPONS.map((w) => {
                  const owned = account.ownedWeapons.includes(w.id);
                  const tier = account.weaponTiers[w.id] ?? 1;
                  const eff = owned ? getWeaponEffective(w.id, tier) : w;
                  return (
                    <motion.button
                      key={w.id}
                      whileHover={owned ? { y: -4 } : {}}
                      onClick={() => {
                        if (!owned) {
                          sfx.alert();
                          return;
                        }
                        sfx.cardSelect();
                        setWeaponId(w.id);
                      }}
                      disabled={!owned}
                      className={clsx(
                        "relative p-5 border-2 text-left transition-all bg-helldiver-panel/80",
                        !owned && "opacity-60 cursor-not-allowed border-helldiver-steel/40",
                        owned && weaponId === w.id
                          ? "border-sky-400 shadow-[0_0_24px_rgba(14,165,233,0.4)]"
                          : owned && "border-helldiver-steel hover:border-sky-400/50"
                      )}
                    >
                      <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-sky-400 z-10" />
                      <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-sky-400 z-10" />
                      <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-sky-400 z-10" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-sky-400 z-10" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] uppercase tracking-widest text-helldiver-dim">
                          Primary Weapon · Auto-Fire
                        </div>
                        {owned && <TierBadge tier={tier} />}
                      </div>
                      {/* Cinematic weapon portrait — same source as the Codex */}
                      <WeaponPortrait weaponId={w.id} className="mb-3" />
                      <div className="font-display font-black text-lg text-sky-400 tracking-tight mb-2">
                        {w.name.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-300 mb-3 leading-relaxed">{w.description}</div>
                      <div className="flex gap-3 text-[11px] font-mono">
                        <div className="px-2 py-1 border border-helldiver-steel">
                          <span className="text-helldiver-dim">DMG </span>
                          <span className="text-helldiver-yellow font-bold">{eff.damage}</span>
                        </div>
                        <div className="px-2 py-1 border border-helldiver-steel">
                          <span className="text-helldiver-dim">HITS </span>
                          <span className="text-helldiver-yellow font-bold">{eff.hitsPerTurn}</span>
                        </div>
                        <div className="px-2 py-1 border border-helldiver-steel">
                          <span className="text-helldiver-dim">TGT </span>
                          <span className="text-helldiver-yellow font-bold uppercase">{eff.target.replace("_", " ")}</span>
                        </div>
                      </div>
                      {!owned && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px]">
                          <div className="text-3xl mb-1">🔒</div>
                          <div className="text-[10px] uppercase tracking-widest text-helldiver-red font-bold">Locked</div>
                          <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mt-1">Visit Outfitter</div>
                        </div>
                      )}
                      {owned && weaponId === w.id && (
                        <div className="absolute top-9 right-2 text-sky-400 text-xs font-bold">✓ EQUIPPED</div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <ArmoryHint />
            </div>
          )}

          {step === "booster" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {BOOSTERS.map((b) => {
                  const owned = account.ownedBoosters.includes(b.id);
                  const tier = account.boosterTiers[b.id] ?? 1;
                  return (
                    <motion.button
                      key={b.id}
                      whileHover={owned ? { y: -4 } : {}}
                      onClick={() => {
                        if (!owned) {
                          sfx.alert();
                          return;
                        }
                        sfx.cardSelect();
                        setBoosterId(b.id);
                      }}
                      disabled={!owned}
                      className={clsx(
                        "relative p-5 border-2 text-left transition-all bg-helldiver-panel/80",
                        !owned && "opacity-60 cursor-not-allowed border-helldiver-steel/40",
                        owned && boosterId === b.id
                          ? "border-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.4)]"
                          : owned && "border-helldiver-steel hover:border-purple-400/50"
                      )}
                    >
                      <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-purple-400 z-10" />
                      <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-purple-400 z-10" />
                      <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-purple-400 z-10" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-purple-400 z-10" />
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] uppercase tracking-widest text-helldiver-dim">
                          Run-Wide Booster
                        </div>
                        {owned && <TierBadge tier={tier} />}
                      </div>
                      {/* Cinematic booster portrait — same source as the codex */}
                      <BoosterPortrait boosterId={b.id} className="mb-3" />
                      <div className="font-display font-black text-lg text-purple-400 tracking-tight mb-2">
                        {b.name.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-300 leading-relaxed">{b.description}</div>
                      {!owned && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px]">
                          <div className="text-3xl mb-1">🔒</div>
                          <div className="text-[10px] uppercase tracking-widest text-helldiver-red font-bold">Locked</div>
                          <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mt-1">Visit Outfitter</div>
                        </div>
                      )}
                      {owned && boosterId === b.id && (
                        <div className="absolute top-9 right-2 text-purple-400 text-xs font-bold">✓ ACTIVE</div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <ArmoryHint />
            </div>
          )}

          {step === "stratagems" && (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[10px] uppercase tracking-widest text-helldiver-dim">
                  Pick <span className="text-helldiver-yellow font-bold">{STRATAGEM_PICKS_REQUIRED}</span> Stratagems · Resupply is <span className="text-emerald-400 font-bold">free</span>
                </div>
                <div className={clsx(
                  "text-sm font-display font-black tracking-widest",
                  canDeploy ? "text-emerald-400" : "text-helldiver-yellow"
                )}>
                  {stratagems.length} / {STRATAGEM_PICKS_REQUIRED} SELECTED
                </div>
              </div>

              {/* Selected pills + locked free Resupply slot */}
              <div className="mb-4 grid grid-cols-5 gap-2 min-h-[60px]">
                {Array.from({ length: STRATAGEM_PICKS_REQUIRED }).map((_, i) => {
                  const id = stratagems[i];
                  const card = id ? getCardById(id) : null;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        "h-14 px-2 flex flex-col items-center justify-center text-center border-2 text-xs font-mono",
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
                {/* Free Resupply slot — locked & always included */}
                <div
                  className="h-14 px-2 flex flex-col items-center justify-center text-center border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-mono relative"
                  title="Resupply is free and always included in your loadout."
                >
                  <span className="text-[8px] uppercase tracking-widest opacity-80">◆ FREE</span>
                  <span className="text-[10px] tracking-wider mt-0.5">Resupply</span>
                </div>
              </div>

              {/* Always-included basics */}
              <div className="mb-4 text-[10px] uppercase tracking-widest text-helldiver-dim font-mono">
                ◇ Always In Loadout: 3× Orbital Precision Strike · 1× Stim · 1× Shield Generator · <span className="text-emerald-400">1× Resupply (free)</span>
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

const TIER_LABELS: Record<number, string> = { 1: "MK I", 2: "MK II", 3: "MK III" };
const TIER_COLORS: Record<number, string> = {
  1: "text-helldiver-yellow border-helldiver-yellow",
  2: "text-sky-300 border-sky-400",
  3: "text-purple-300 border-purple-400",
};

function TierBadge({ tier }: { tier: number }) {
  return (
    <div
      className={clsx(
        "px-1.5 py-0.5 border text-[9px] font-display font-black tracking-widest bg-black/60 flex items-center gap-1",
        TIER_COLORS[tier]
      )}
    >
      {TIER_LABELS[tier]}
      <span className="flex gap-0.5">
        {Array.from({ length: MAX_TIER }).map((_, i) => (
          <span
            key={i}
            className={clsx(
              "w-1 h-1 inline-block",
              i < tier
                ? tier === 3
                  ? "bg-purple-400"
                  : tier === 2
                    ? "bg-sky-400"
                    : "bg-helldiver-yellow"
                : "bg-helldiver-steel"
            )}
          />
        ))}
      </span>
    </div>
  );
}

function ArmoryHint() {
  return (
    <div className="text-[10px] text-helldiver-dim text-center font-mono uppercase tracking-widest mb-2">
      Locked items can be purchased and upgraded in the{" "}
      <span className="text-emerald-400">Armory ▸ Outfitter</span> tab.
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PORTRAIT HELPERS — pull the same cinematic art the Codex uses so the
// loadout cards aren't text-only. Both gracefully fall back to a tinted
// silhouette when the source image is missing.
// ─────────────────────────────────────────────────────────────────────────
function ArmorPortrait({ armorId, className }: { armorId: string; className?: string }) {
  const art = getArmorArt(armorId);
  return (
    <div
      className={clsx("relative overflow-hidden border border-helldiver-yellow/20 bg-gradient-to-b from-helldiver-yellow/[0.04] to-black/40", className)}
      style={{ height: 140 }}
    >
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-helldiver-yellow/40 text-3xl">⚙</div>
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
      />
    </div>
  );
}

function WeaponPortrait({ weaponId, className }: { weaponId: string; className?: string }) {
  const art = getWeaponArt(weaponId);
  return (
    <div
      className={clsx("relative overflow-hidden border border-sky-400/20 bg-gradient-to-b from-sky-400/[0.04] to-black/40", className)}
      style={{ height: 130 }}
    >
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sky-400/40 text-3xl">▶▶</div>
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
      />
    </div>
  );
}

function BoosterPortrait({ boosterId, className }: { boosterId: string; className?: string }) {
  const art = getBoosterArt(boosterId);
  return (
    <div
      className={clsx("relative overflow-hidden border border-purple-400/20 bg-gradient-to-b from-purple-400/[0.04] to-black/40", className)}
      style={{ height: 130 }}
    >
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-purple-400/40 text-3xl">◆</div>
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ARMOR STEP — split-screen tactical-decision UI.
// LEFT (35%):  vertical list of compact selectable armor tiles
// RIGHT (65%): hero display with parallax art, stat block, tactical
//              profile bars, description, and ACTIVE LOADOUT banner
// ─────────────────────────────────────────────────────────────────────────

const ARMOR_CLASS_TINT: Record<string, { primary: string; soft: string; label: string; glyph: string }> = {
  scout:     { primary: "#60c4ff", soft: "rgba(96,196,255,0.22)",  label: "LIGHT",  glyph: "▲" },
  frontline: { primary: "#FFC72C", soft: "rgba(255,199,44,0.22)",  label: "MEDIUM", glyph: "■" },
  fortified: { primary: "#ff8a28", soft: "rgba(255,138,40,0.22)",  label: "HEAVY",  glyph: "▼" },
};

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

/**
 * Derive the three tactical-profile bars (1-10 each) from an armor's
 * raw stats. Keeps the metric simple and always reflects the live numbers
 * — adding a new armor automatically gets a sensible profile.
 */
function tacticalProfile(armor: Armor) {
  const surv = clamp(5 + armor.hpMod / 4 + armor.startingBlock * 0.8, 1, 10);
  const mob  = clamp(5 + armor.handMod * 2.5, 1, 10);
  const util = clamp(5 + armor.reqMod * 2 + (armor.bonusStims ?? 0) * 1.5, 1, 10);
  return { surv: Math.round(surv), mob: Math.round(mob), util: Math.round(util) };
}

function ArmorStep({
  account,
  equippedId,
  setEquippedId,
}: {
  account: Account;
  equippedId: string;
  setEquippedId: (id: string) => void;
}) {
  // selected = the tile being PREVIEWED on the right. Defaults to the
  // currently-equipped armor so the right rail always has something to show.
  const [selectedId, setSelectedId] = useState<string>(equippedId);
  const selected = ARMORS.find((a) => a.id === selectedId) ?? ARMORS.find((a) => a.id === equippedId) ?? ARMORS[0];
  const selectedTier = account.armorTiers[selected.id] ?? 1;
  const selectedOwned = account.ownedArmors.includes(selected.id);
  const selectedEff = selectedOwned ? getArmorEffective(selected.id, selectedTier) : selected;
  const selectedTint = ARMOR_CLASS_TINT[selected.weightClass] ?? ARMOR_CLASS_TINT.frontline;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(320px, 35%) 1fr" }}>
      {/* LEFT — selector list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-helldiver-yellow shadow-[0_0_4px_currentColor]" />
          <h3 className="text-[10px] font-display font-black uppercase tracking-[0.32em] text-helldiver-yellow">
            Body Armor · {ARMORS.length} configurations
          </h3>
        </div>
        {ARMORS.map((a) => {
          const owned = account.ownedArmors.includes(a.id);
          const tier = account.armorTiers[a.id] ?? 1;
          const eff = owned ? getArmorEffective(a.id, tier) : a;
          const tint = ARMOR_CLASS_TINT[a.weightClass] ?? ARMOR_CLASS_TINT.frontline;
          const isSelected = a.id === selectedId;
          const isEquipped = a.id === equippedId;
          return (
            <ArmorTile
              key={a.id}
              armor={a}
              eff={eff}
              owned={owned}
              tier={tier}
              tint={tint}
              isSelected={isSelected}
              isEquipped={isEquipped}
              onClick={() => {
                if (!owned) {
                  sfx.alert();
                  return;
                }
                sfx.cardSelect();
                setSelectedId(a.id);
                setEquippedId(a.id);
              }}
            />
          );
        })}
        <ArmoryHint />
      </div>

      {/* RIGHT — hero panel */}
      <ArmorHeroPanel
        armor={selected}
        eff={selectedEff}
        tier={selectedTier}
        owned={selectedOwned}
        tint={selectedTint}
        isEquipped={selected.id === equippedId}
      />
    </div>
  );
}

function ArmorTile({
  armor, eff, owned, tier, tint, isSelected, isEquipped, onClick,
}: {
  armor: Armor;
  eff: Armor;
  owned: boolean;
  tier: number;
  tint: { primary: string; soft: string; label: string; glyph: string };
  isSelected: boolean;
  isEquipped: boolean;
  onClick: () => void;
}) {
  const art = getArmorArt(armor.id);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={owned ? { x: 3, scale: 1.005 } : {}}
      whileTap={owned ? { scale: 0.995 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      disabled={!owned}
      className={clsx(
        "relative grid grid-cols-[72px_1fr] gap-3 p-2 text-left transition-all",
        !owned && "opacity-50 cursor-not-allowed",
      )}
      style={{
        background: isSelected
          ? `linear-gradient(90deg, ${tint.soft}, ${tint.soft}05 60%, transparent)`
          : "rgba(14,18,24,0.55)",
        border: `1px solid ${isSelected ? tint.primary : "rgba(255,255,255,0.08)"}`,
        boxShadow: isSelected
          ? `inset 4px 0 0 ${tint.primary}, 0 0 18px ${tint.soft}`
          : isEquipped
            ? `inset 3px 0 0 ${tint.primary}88`
            : "none",
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          width: 72, height: 72,
          border: `1px solid ${tint.primary}33`,
          background: `linear-gradient(180deg, ${tint.soft}, rgba(0,0,0,0.6))`,
        }}
      >
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art} alt="" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover object-top" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: tint.primary, fontSize: 20 }}>
            {tint.glyph}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="px-1 py-0.5 text-[8px] font-display font-black uppercase tracking-[0.3em] shrink-0"
              style={{ color: tint.primary, border: `1px solid ${tint.primary}55`, background: `${tint.primary}10` }}
            >
              {tint.glyph} {tint.label}
            </span>
            {owned && <TierBadge tier={tier} />}
          </div>
          {isEquipped && (
            <span className="text-[8px] font-display font-black uppercase tracking-[0.3em] shrink-0" style={{ color: tint.primary }}>
              ✓ Active
            </span>
          )}
        </div>

        <div
          className="font-display font-black uppercase tracking-tight truncate"
          style={{ color: isSelected ? tint.primary : "rgba(255,255,255,0.92)", fontSize: 14, lineHeight: 1.1 }}
        >
          {armor.name}
        </div>

        {/* Compact stat summary */}
        <div className="flex gap-2 text-[10px] font-mono">
          <span className={clsx("tabular-nums", eff.hpMod >= 0 ? "text-emerald-400" : "text-helldiver-red")}>
            HP {eff.hpMod >= 0 ? "+" : ""}{eff.hpMod}
          </span>
          <span className="text-helldiver-steel">·</span>
          <span className={clsx("tabular-nums", eff.handMod >= 0 ? "text-emerald-400" : "text-helldiver-red")}>
            HND {eff.handMod >= 0 ? "+" : ""}{eff.handMod}
          </span>
          <span className="text-helldiver-steel">·</span>
          <span className="tabular-nums text-sky-400">
            BLK +{eff.startingBlock}
          </span>
        </div>
      </div>

      {/* Locked overlay */}
      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
          <div className="text-[10px] uppercase tracking-[0.32em] text-helldiver-red font-display font-black">
            🔒 Locked · Visit Outfitter
          </div>
        </div>
      )}
    </motion.button>
  );
}

function ArmorHeroPanel({
  armor, eff, tier, owned, tint, isEquipped,
}: {
  armor: Armor;
  eff: Armor;
  tier: number;
  owned: boolean;
  tint: { primary: string; soft: string; label: string; glyph: string };
  isEquipped: boolean;
}) {
  const art = getArmorArt(armor.id);
  const profile = tacticalProfile(armor);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(14,18,24,0.92) 0%, rgba(7,11,16,0.92) 100%)`,
        border: `1px solid ${tint.primary}33`,
        boxShadow: isEquipped ? `0 0 32px ${tint.soft}, inset 0 0 60px rgba(0,0,0,0.6)` : "0 8px 28px rgba(0,0,0,0.45)",
      }}
    >
      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tint.primary}, transparent)` }}
      />

      {/* HERO ART — animated parallax */}
      <AnimatePresence mode="wait">
        <motion.div
          key={armor.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full overflow-hidden"
          style={{ height: 280, background: "#070b10" }}
        >
          {art ? (
            <motion.img
              src={art}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover object-top"
              animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl" style={{ color: tint.primary, opacity: 0.3 }}>
              {tint.glyph}
            </div>
          )}

          {/* Class wash — light blue / gold / heavy orange */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                `radial-gradient(ellipse 60% 50% at 50% 30%, ${tint.soft} 0%, transparent 60%), linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 45%)`,
            }}
          />

          {/* Scanlines */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 4px)",
            }}
          />

          {/* Title overlay */}
          <div className="absolute left-4 right-4 bottom-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-[10px] uppercase tracking-[0.4em] font-display font-black mb-1"
                style={{ color: tint.primary }}
              >
                {tint.glyph} {tint.label} ARMOR · {armor.passiveName ?? "Standard"}
              </div>
              <div
                className="font-display font-black uppercase tracking-tight leading-none"
                style={{
                  color: tint.primary,
                  fontSize: 28,
                  textShadow: `0 0 12px ${tint.soft}, 0 2px 4px rgba(0,0,0,0.95)`,
                }}
              >
                {armor.name}
              </div>
            </div>
            {owned && <TierBadge tier={tier} />}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* INFO STRIP — stat block + tactical profile side-by-side */}
      <div className="grid grid-cols-2 gap-3 p-4" style={{ borderTop: `1px solid ${tint.primary}22` }}>
        {/* STAT BLOCK */}
        <div>
          <SectionLabel tint={tint.primary}>Vitals · Stat Block</SectionLabel>
          <div className="space-y-1.5">
            <StatRow label="HP" value={eff.hpMod} sign accent="emerald" />
            <StatRow label="Hand Size" value={eff.handMod} sign accent="emerald" />
            <StatRow label="Starting Block" value={eff.startingBlock} sign accent="sky" />
            {(armor.bonusStims ?? 0) > 0 && <StatRow label="Bonus Stims" value={armor.bonusStims!} sign accent="emerald" />}
            {armor.reqMod !== 0 && <StatRow label="Requisition" value={armor.reqMod} sign accent="orange" />}
          </div>
        </div>

        {/* TACTICAL PROFILE */}
        <div>
          <SectionLabel tint={tint.primary}>Tactical Profile</SectionLabel>
          <div className="space-y-2">
            <ProfileBar label="Survivability" value={profile.surv} accent={tint.primary} />
            <ProfileBar label="Mobility" value={profile.mob} accent={tint.primary} />
            <ProfileBar label="Utility" value={profile.util} accent={tint.primary} />
          </div>
        </div>
      </div>

      {/* DESCRIPTION + LOADOUT BANNER */}
      <div className="px-4 pb-4 flex flex-col gap-3">
        <p className="text-[12px] text-gray-300 leading-relaxed italic" style={{ borderLeft: `2px solid ${tint.primary}55`, paddingLeft: 10 }}>
          “{armor.passive}”
        </p>

        <ActiveLoadoutBanner active={isEquipped} tint={tint.primary} />
      </div>
    </div>
  );
}

function SectionLabel({ tint, children }: { tint: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-1.5 mb-2 text-[9px] font-display font-black uppercase tracking-[0.3em]"
      style={{ color: tint }}
    >
      <span className="w-1 h-1" style={{ background: tint, boxShadow: `0 0 4px ${tint}` }} />
      {children}
    </div>
  );
}

function StatRow({
  label, value, sign, accent,
}: {
  label: string;
  value: number;
  sign?: boolean;
  accent: "emerald" | "sky" | "orange";
}) {
  const accentColor =
    accent === "sky" ? "text-sky-400" :
    accent === "orange" ? "text-helldiver-orange" :
    value >= 0 ? "text-emerald-400" : "text-helldiver-red";
  const display = sign ? `${value >= 0 ? "+" : ""}${value}` : `${value}`;
  return (
    <div className="flex items-center justify-between text-[11px] font-mono">
      <span className="text-helldiver-dim uppercase tracking-widest text-[10px]">{label}</span>
      <span className={clsx("font-bold tabular-nums", accentColor)}>{display}</span>
    </div>
  );
}

function ProfileBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9.5px] font-mono mb-0.5">
        <span className="text-helldiver-dim uppercase tracking-widest">{label}</span>
        <span className="text-helldiver-yellow tabular-nums font-bold">{value}<span className="text-helldiver-dim">/10</span></span>
      </div>
      <div className="h-1.5 bg-black/60 border border-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ActiveLoadoutBanner({ active, tint }: { active: boolean; tint: string }) {
  if (!active) {
    return (
      <div
        className="text-center py-2 text-[10px] uppercase tracking-[0.4em] font-display font-black"
        style={{ color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        ▸ Click a tile to equip ◂
      </div>
    );
  }
  return (
    <motion.div
      className="relative overflow-hidden text-center py-2.5 font-display font-black uppercase"
      style={{
        background: `linear-gradient(90deg, transparent, ${tint}1f 50%, transparent)`,
        border: `1px solid ${tint}`,
        color: tint,
        boxShadow: `0 0 18px ${tint}55, inset 0 0 12px ${tint}22`,
      }}
      animate={{ boxShadow: [`0 0 14px ${tint}55, inset 0 0 12px ${tint}22`, `0 0 22px ${tint}88, inset 0 0 18px ${tint}44`, `0 0 14px ${tint}55, inset 0 0 12px ${tint}22`] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="text-[12px] tracking-[0.42em]">✓ Active Loadout</span>
    </motion.div>
  );
}
