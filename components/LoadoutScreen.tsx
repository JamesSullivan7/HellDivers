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
import type { Armor, Weapon } from "@/lib/types";
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
    // Stim/Resupply/Reinforce are run-utility charges now (not stratagems)
    // and have already been removed from STRATAGEM_PICK_POOL, but a
    // belt-and-suspenders filter in case CARD_LIBRARY adds them again.
    if (c.id === "util_resupply" || c.id === "util_reinforce" || c.id === "util_stim") return false;
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

  // Live names of currently selected items, for the bottom summary bar.
  const summary = {
    armor: ARMORS.find((a) => a.id === armorId)?.name ?? "—",
    weapon: WEAPONS.find((w) => w.id === weaponId)?.name ?? "—",
    booster: BOOSTERS.find((b) => b.id === boosterId)?.name ?? "—",
  };

  return (
    <AppShell activeNav="mission">
      {/*
        h-full + flex-col + overflow-hidden = the loadout page is *strictly*
        one viewport. The negative margins reclaim the AppShell main padding
        so the whole layout has more vertical room to work with. Each step
        renders inside the flex-1 content row, which in turn scrolls
        internally if needed (stratagems) but never the page.
      */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="h-full flex flex-col overflow-hidden"
        style={{ margin: -24 }}
      >
        {/* ── HEADER (32px) — destination + subtitle on one line ── */}
        <div
          className="flex items-center gap-3 px-5 shrink-0 border-b"
          style={{ height: 32, borderColor: "rgba(255,199,44,0.18)", background: "rgba(14,18,24,0.65)" }}
        >
          <FactionIcon faction={faction} className="w-3.5 h-3.5 text-helldiver-yellow shrink-0" />
          <span className="text-[9px] uppercase tracking-[0.4em] text-helldiver-yellow shrink-0">
            Loadout · Pre-Drop
          </span>
          <span aria-hidden className="w-px h-3.5 bg-helldiver-steel/40 shrink-0" />
          <span className="font-display font-black tracking-tight text-[14px] truncate">
            DESTINATION <span className="text-helldiver-yellow">{planet.name}</span>
          </span>
        </div>

        {/* ── STEP TABS (36px) — compact horizontal bar ── */}
        <div
          className="flex items-center gap-1 px-5 shrink-0 border-b"
          style={{ height: 36, borderColor: "rgba(255,255,255,0.06)" }}
        >
          {STEPS.map((s, i) => {
            const isActive = s.id === step;
            return (
              <button
                key={s.id}
                onClick={() => { sfx.click(); setStep(s.id); }}
                className={clsx(
                  "px-3 h-[26px] text-[10px] font-display font-black tracking-[0.22em] uppercase transition-colors flex items-center gap-1.5 shrink-0",
                  isActive
                    ? "bg-helldiver-yellow text-black"
                    : "text-helldiver-dim hover:text-helldiver-yellow"
                )}
                style={{
                  border: `1px solid ${isActive ? "#FFC72C" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isActive ? "0 0 12px rgba(255,199,44,0.4)" : "none",
                }}
              >
                <span className={clsx("font-mono tabular-nums", isActive ? "text-black/60" : "text-helldiver-steel")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── STEP CONTENT (flex-1) — fills the remaining viewport ── */}
        <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
          {step === "armor" && (
            <ArmorStep
              account={account}
              equippedId={armorId}
              setEquippedId={setArmorId}
            />
          )}

          {step === "weapon" && (
            <WeaponStep
              account={account}
              equippedId={weaponId}
              setEquippedId={setWeaponId}
            />
          )}

          {step === "booster" && (
            // 4-col x 2-row compressed grid — 7 boosters fit one screen.
            <div className="p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 shadow-[0_0_4px_currentColor]" />
                  <h3 className="text-[10px] font-display font-black uppercase tracking-[0.32em] text-purple-400">
                    Drop-Pod Boosters · {BOOSTERS.length} options
                  </h3>
                </div>
                <span className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">
                  Click a tile to equip
                </span>
              </div>
              <div className="grid grid-cols-4 grid-rows-2 gap-2 flex-1 min-h-0">
                {BOOSTERS.map((b) => {
                  const owned = account.ownedBoosters.includes(b.id);
                  const tier = account.boosterTiers[b.id] ?? 1;
                  const isEquipped = boosterId === b.id;
                  return (
                    <motion.button
                      key={b.id}
                      type="button"
                      whileHover={owned ? { y: -2, scale: 1.01 } : {}}
                      whileTap={owned ? { scale: 0.99 } : {}}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      onClick={() => {
                        if (!owned) { sfx.alert(); return; }
                        sfx.cardSelect();
                        setBoosterId(b.id);
                      }}
                      disabled={!owned}
                      className={clsx(
                        "relative overflow-hidden text-left flex flex-col",
                        !owned && "opacity-50 cursor-not-allowed",
                      )}
                      style={{
                        background: "rgba(14,18,24,0.55)",
                        border: `1px solid ${isEquipped ? "#a855f7" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: isEquipped ? "0 0 14px rgba(168,85,247,0.35), inset 0 0 0 1px rgba(168,85,247,0.55)" : "none",
                      }}
                    >
                      <div className="relative flex-1 min-h-0 overflow-hidden bg-gradient-to-b from-purple-400/[0.04] to-black/40">
                        {/* Inline image so it fills the flex-1 cell.
                            BoosterPortrait has a fixed inline height that
                            overrode any Tailwind !h-full and capped the
                            artwork at 130px. */}
                        {(() => {
                          const art = getBoosterArt(b.id);
                          return art ? (
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
                          );
                        })()}
                        <div
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
                          style={{ background: "linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 100%)" }}
                        />
                        {isEquipped && (
                          <span
                            className="absolute top-1 right-1 px-1 py-0.5 text-[7.5px] font-display font-black uppercase tracking-[0.28em] z-10"
                            style={{ color: "#0A0F14", background: "#a855f7" }}
                          >
                            ✓ Active
                          </span>
                        )}
                        {owned && (
                          <div className="absolute bottom-1 right-1 z-10">
                            <TierBadge tier={tier} />
                          </div>
                        )}
                      </div>
                      <div
                        className="px-2 py-1.5 shrink-0"
                        style={{ borderTop: `1px solid ${isEquipped ? "rgba(168,85,247,0.55)" : "rgba(255,255,255,0.06)"}` }}
                      >
                        <div
                          className="font-display font-black uppercase tracking-tight truncate"
                          style={{ color: isEquipped ? "#a855f7" : "rgba(255,255,255,0.92)", fontSize: 10.5, lineHeight: 1.1 }}
                        >
                          {b.name}
                        </div>
                        <div className="text-[9px] text-gray-300 leading-snug line-clamp-2 mt-0.5">
                          {b.description}
                        </div>
                      </div>
                      {!owned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
                          <div className="text-[9px] uppercase tracking-[0.32em] text-helldiver-red font-display font-black text-center px-2">
                            🔒 Locked<br />Visit Outfitter
                          </div>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "stratagems" && (
            // Stratagems step keeps its rich layout but now lives inside a
            // strict h-full flex container. Header + slot strip + filters
            // are shrink-0; the card grid claims flex-1 and scrolls
            // internally so the page itself never grows past 100vh.
            <div className="p-3 h-full flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <span className="w-1.5 h-1.5 bg-helldiver-yellow shadow-[0_0_4px_currentColor]" />
                <h3 className="text-[10px] font-display font-black uppercase tracking-[0.32em] text-helldiver-yellow">
                  Pick {STRATAGEM_PICKS_REQUIRED} stratagems
                </h3>
                <div className="flex-1" />
                <span className={clsx(
                  "text-[11px] font-display font-black tracking-widest",
                  canDeploy ? "text-emerald-400" : "text-helldiver-yellow"
                )}>
                  {stratagems.length} / {STRATAGEM_PICKS_REQUIRED} SELECTED
                </span>
              </div>

              {/* Selected pills — 4 slots only (Resupply / Stim / Reinforce
                  are run-utility charges, not deck cards anymore). */}
              <div className="grid grid-cols-4 gap-1.5 mb-2 shrink-0" style={{ height: 36 }}>
                {Array.from({ length: STRATAGEM_PICKS_REQUIRED }).map((_, i) => {
                  const id = stratagems[i];
                  const card = id ? getCardById(id) : null;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        "px-2 flex items-center justify-center text-center text-[10px] font-mono",
                        card ? "border border-helldiver-yellow text-helldiver-yellow bg-helldiver-yellow/10" : "border border-dashed border-helldiver-steel text-helldiver-dim"
                      )}
                    >
                      <span className="truncate tracking-wider">
                        {card ? card.name : `SLOT ${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Filters — slim row */}
              <div className="flex flex-wrap gap-1 items-center mb-2 shrink-0">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { sfx.click(); setFilter(f.id); }}
                    className={clsx(
                      "px-2 h-6 border text-[9px] tracking-widest font-mono transition-colors",
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
                  onClick={() => { sfx.click(); setShowLocked(!showLocked); }}
                  className={clsx(
                    "px-2 h-6 border text-[9px] tracking-widest font-mono transition-colors",
                    showLocked
                      ? "border-helldiver-yellow bg-helldiver-yellow text-black"
                      : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
                  )}
                >
                  {showLocked ? "✓ SHOW LOCKED" : "□ SHOW LOCKED"}
                </button>
                <button
                  onClick={() => { sfx.click(); goToArmory(); }}
                  className="px-2 h-6 border text-[9px] tracking-widest font-mono border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black transition-colors"
                >
                  ⌥ ARMORY
                </button>
              </div>

              {/* Card grid — flex-1 + min-h-0 + overflow-y-auto so this is
                  the only thing that scrolls; the rest of the page stays
                  pinned. */}
              <HudFrame label={`Available Stratagems (${selectableCards.length})`} accent="steel" className="p-2 flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
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
        </div>

        {/* ── BOTTOM SUMMARY BAR (48px) — current loadout at-a-glance + nav ── */}
        <div
          className="flex items-center gap-3 px-4 shrink-0 border-t"
          style={{ height: 48, borderColor: "rgba(255,199,44,0.18)", background: "rgba(14,18,24,0.85)" }}
        >
          <button
            onClick={handlePrev}
            className="h-7 px-3 border text-[9px] uppercase tracking-[0.3em] font-mono transition-colors text-helldiver-dim hover:text-helldiver-yellow shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            ◀ {step === "armor" ? "Sector" : "Back"}
          </button>

          {/* Loadout summary chips */}
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto">
            <SummaryChip label="ARMOR"   value={summary.armor}   active={step === "armor"} tint="#FFC72C" />
            <SummaryChip label="PRIMARY" value={summary.weapon}  active={step === "weapon"} tint="#60c4ff" />
            <SummaryChip label="BOOSTER" value={summary.booster} active={step === "booster"} tint="#a855f7" />
            <SummaryChip
              label="STRATS"
              value={`${stratagems.length} / ${STRATAGEM_PICKS_REQUIRED}`}
              active={step === "stratagems"}
              tint="#10b981"
            />
          </div>

          {step !== "stratagems" ? (
            <button
              onClick={handleNext}
              className="h-9 px-5 bg-helldiver-yellow text-black font-display font-black uppercase tracking-[0.3em] text-[11px] shrink-0 transition-shadow hover:shadow-[0_0_24px_rgba(255,199,44,0.6)]"
              style={{ border: "1px solid #FFC72C", boxShadow: "0 0 14px rgba(255,199,44,0.35)" }}
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
                "h-9 px-5 font-display font-black uppercase tracking-[0.3em] text-[11px] shrink-0 transition-all",
                canDeploy
                  ? "bg-gradient-to-b from-helldiver-red to-red-800 text-white shadow-[0_0_20px_rgba(255,77,77,0.5)]"
                  : "text-helldiver-dim cursor-not-allowed",
              )}
              style={{ border: `1px solid ${canDeploy ? "#ff4d4d" : "rgba(255,255,255,0.1)"}` }}
            >
              {canDeploy ? "▶ Deploy Hellpod" : `Pick ${STRATAGEM_PICKS_REQUIRED - stratagems.length} more`}
            </motion.button>
          )}
        </div>
      </motion.div>
    </AppShell>
  );
}

/**
 * SummaryChip — compact loadout pill in the bottom bar. Shows the
 * current selection name; the chip for the active step is tinted +
 * highlighted so the player always knows where they are.
 */
function SummaryChip({
  label, value, active, tint,
}: {
  label: string;
  value: string;
  active: boolean;
  tint: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2 h-7 text-[10px] font-mono tabular-nums shrink-0"
      style={{
        background: active ? `${tint}14` : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? tint : "rgba(255,255,255,0.06)"}`,
        boxShadow: active ? `inset 2px 0 0 ${tint}, 0 0 10px ${tint}33` : "none",
        minWidth: 0,
      }}
    >
      <span
        className="font-display font-black uppercase tracking-[0.28em] shrink-0"
        style={{ color: active ? tint : "rgba(255,255,255,0.42)", fontSize: 8.5 }}
      >
        {label}
      </span>
      <span className="truncate text-white/85" style={{ maxWidth: 160 }}>
        {value}
      </span>
    </div>
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
    // 100vh-fit: 1fr / 380px split. The grid claims the full available
    // height (h-full from the parent step wrapper). Section headers are
    // slim and the inner content adapts to whatever vertical space is left.
    <div className="grid gap-3 p-3 h-full" style={{ gridTemplateColumns: "1fr 380px" }}>
      {/* LEFT — 3-col x 2-row armor grid */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-helldiver-yellow shadow-[0_0_4px_currentColor]" />
            <h3 className="text-[10px] font-display font-black uppercase tracking-[0.32em] text-helldiver-yellow">
              Body Armor · {ARMORS.length} configurations
            </h3>
          </div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">
            Click a tile to equip
          </span>
        </div>

        <div className="grid grid-cols-3 grid-rows-2 gap-2 flex-1 min-h-0">
          {ARMORS.map((a) => {
            const owned = account.ownedArmors.includes(a.id);
            const tier = account.armorTiers[a.id] ?? 1;
            const eff = owned ? getArmorEffective(a.id, tier) : a;
            const tint = ARMOR_CLASS_TINT[a.weightClass] ?? ARMOR_CLASS_TINT.frontline;
            const isSelected = a.id === selectedId;
            const isEquipped = a.id === equippedId;
            return (
              <ArmorGridCard
                key={a.id}
                armor={a}
                eff={eff}
                owned={owned}
                tier={tier}
                tint={tint}
                isSelected={isSelected}
                isEquipped={isEquipped}
                onClick={() => {
                  if (!owned) { sfx.alert(); return; }
                  sfx.cardSelect();
                  setSelectedId(a.id);
                  setEquippedId(a.id);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* RIGHT — slim hero preview */}
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

/**
 * ArmorGridCard — compact tile sized to fit a 3x2 grid in the
 * compressed loadout layout. Image fills the upper portion; a slim
 * data strip at the bottom carries name + class + key stats.
 */
function ArmorGridCard({
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
      whileHover={owned ? { y: -2, scale: 1.01 } : {}}
      whileTap={owned ? { scale: 0.99 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      disabled={!owned}
      className={clsx(
        "relative overflow-hidden text-left flex flex-col",
        !owned && "opacity-50 cursor-not-allowed",
      )}
      style={{
        background: "rgba(14,18,24,0.55)",
        border: `1px solid ${isSelected ? tint.primary : "rgba(255,255,255,0.08)"}`,
        boxShadow: isSelected
          ? `0 0 16px ${tint.soft}, inset 0 0 0 1px ${tint.primary}55`
          : isEquipped
            ? `inset 0 0 0 1px ${tint.primary}55`
            : "none",
      }}
    >
      {/* IMAGE — fills the top, object-cover with object-top to keep the
          helldiver framed nicely even at compact sizes */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
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
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: tint.primary, fontSize: 32 }}>
            {tint.glyph}
          </div>
        )}
        {/* Bottom darken so the data strip text stays legible */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 100%)" }}
        />
        {/* Class chip — top-left over the image */}
        <span
          className="absolute top-1.5 left-1.5 px-1 py-0.5 text-[8px] font-display font-black uppercase tracking-[0.3em] z-10"
          style={{ color: tint.primary, border: `1px solid ${tint.primary}55`, background: "rgba(0,0,0,0.7)" }}
        >
          {tint.glyph} {tint.label}
        </span>
        {/* Active indicator — top-right */}
        {isEquipped && (
          <span
            className="absolute top-1.5 right-1.5 px-1 py-0.5 text-[8px] font-display font-black uppercase tracking-[0.3em] z-10"
            style={{ color: "#0A0F14", background: tint.primary, boxShadow: `0 0 8px ${tint.primary}88` }}
          >
            ✓ Active
          </span>
        )}
        {/* Tier badge — bottom-right (over gradient) */}
        {owned && (
          <div className="absolute bottom-1.5 right-1.5 z-10">
            <TierBadge tier={tier} />
          </div>
        )}
      </div>

      {/* DATA STRIP — name + compact stats */}
      <div
        className="px-2 py-1.5 shrink-0"
        style={{ borderTop: `1px solid ${isSelected ? tint.primary + "55" : "rgba(255,255,255,0.06)"}` }}
      >
        <div
          className="font-display font-black uppercase tracking-tight truncate"
          style={{ color: isSelected ? tint.primary : "rgba(255,255,255,0.92)", fontSize: 11, lineHeight: 1.1 }}
        >
          {armor.name}
        </div>
        <div className="flex gap-1.5 text-[9px] font-mono mt-0.5">
          <span className={clsx("tabular-nums", eff.hpMod >= 0 ? "text-emerald-400" : "text-helldiver-red")}>
            HP {eff.hpMod >= 0 ? "+" : ""}{eff.hpMod}
          </span>
          <span className="text-helldiver-steel">·</span>
          <span className={clsx("tabular-nums", eff.handMod >= 0 ? "text-emerald-400" : "text-helldiver-red")}>
            HND {eff.handMod >= 0 ? "+" : ""}{eff.handMod}
          </span>
          <span className="text-helldiver-steel">·</span>
          <span className="tabular-nums text-sky-400">BLK +{eff.startingBlock}</span>
        </div>
      </div>

      {/* Locked overlay */}
      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
          <div className="text-[9px] uppercase tracking-[0.32em] text-helldiver-red font-display font-black text-center px-2">
            🔒 Locked<br />Visit Outfitter
          </div>
        </div>
      )}
    </motion.button>
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
      className="relative flex flex-col overflow-hidden h-full min-h-0"
      style={{
        background: `linear-gradient(180deg, rgba(14,18,24,0.92) 0%, rgba(7,11,16,0.92) 100%)`,
        border: `1px solid ${tint.primary}33`,
        boxShadow: isEquipped ? `0 0 24px ${tint.soft}, inset 0 0 40px rgba(0,0,0,0.6)` : "0 6px 20px rgba(0,0,0,0.45)",
      }}
    >
      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tint.primary}, transparent)` }}
      />

      {/* HERO ART — flex-1 min-h-0 so the artwork claims whatever
          vertical space is left after the stats/profile/banner below.
          Adapts to short and tall viewports without forcing scroll. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={armor.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full overflow-hidden flex-1 min-h-0"
          style={{ background: "#070b10" }}
        >
          {art ? (
            <motion.img
              src={art}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ objectPosition: "center top" }}
              animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl" style={{ color: tint.primary, opacity: 0.3 }}>
              {tint.glyph}
            </div>
          )}

          {/* Class wash — fills the side letterbox bands with a class-tinted
              gradient (light blue / gold / heavy orange) so contained images
              don't leave plain black slivers on either side. The radial
              focus stays centered on the figure. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                `radial-gradient(ellipse 70% 60% at 50% 35%, transparent 35%, ${tint.soft} 100%), linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 45%)`,
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

          {/* Title overlay — sized for the slim 380px preview panel */}
          <div className="absolute left-3 right-3 bottom-2 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div
                className="text-[8.5px] uppercase tracking-[0.32em] font-display font-black mb-0.5"
                style={{ color: tint.primary }}
              >
                {tint.glyph} {tint.label} · {armor.passiveName ?? "Standard"}
              </div>
              <div
                className="font-display font-black uppercase tracking-tight leading-none truncate"
                style={{
                  color: tint.primary,
                  fontSize: 18,
                  textShadow: `0 0 10px ${tint.soft}, 0 2px 4px rgba(0,0,0,0.95)`,
                }}
              >
                {armor.name}
              </div>
            </div>
            {owned && <TierBadge tier={tier} />}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* INFO STRIP — shrink-0 + tighter padding so the hero claims the
          flex-1 space above. Two-column stat-block + tactical-profile. */}
      <div className="grid grid-cols-2 gap-3 px-3 py-2 shrink-0" style={{ borderTop: `1px solid ${tint.primary}22` }}>
        <div>
          <SectionLabel tint={tint.primary}>Stat Block</SectionLabel>
          <div className="space-y-1">
            <StatRow label="HP" value={eff.hpMod} sign accent="emerald" />
            <StatRow label="Hand" value={eff.handMod} sign accent="emerald" />
            <StatRow label="Block" value={eff.startingBlock} sign accent="sky" />
          </div>
        </div>
        <div>
          <SectionLabel tint={tint.primary}>Tactical Profile</SectionLabel>
          <div className="space-y-1">
            <ProfileBar label="Survivability" value={profile.surv} accent={tint.primary} />
            <ProfileBar label="Mobility" value={profile.mob} accent={tint.primary} />
            <ProfileBar label="Utility" value={profile.util} accent={tint.primary} />
          </div>
        </div>
      </div>

      {/* DESCRIPTION + LOADOUT BANNER — shrink-0 */}
      <div className="px-3 pb-2 flex flex-col gap-2 shrink-0">
        <p className="text-[10.5px] text-gray-300 leading-snug italic line-clamp-2" style={{ borderLeft: `2px solid ${tint.primary}55`, paddingLeft: 8 }}>
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
  label, value, sign, accent, customDisplay,
}: {
  label: string;
  value: number;
  sign?: boolean;
  accent: "emerald" | "sky" | "orange";
  /** Override the rendered value entirely (for non-numeric stats like target type). */
  customDisplay?: string;
}) {
  const accentColor =
    accent === "sky" ? "text-sky-400" :
    accent === "orange" ? "text-helldiver-orange" :
    value >= 0 ? "text-emerald-400" : "text-helldiver-red";
  const display = customDisplay ?? (sign ? `${value >= 0 ? "+" : ""}${value}` : `${value}`);
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

// ─────────────────────────────────────────────────────────────────────────
// WEAPON STEP — same split-screen pattern as ArmorStep:
// LEFT (35%):  vertical list of compact selectable weapon tiles
// RIGHT (65%): hero display with full cinematic art, stat block, tactical
//              profile bars, description, and ACTIVE LOADOUT banner
// ─────────────────────────────────────────────────────────────────────────

const WEAPON_CLASS_TINT: Record<string, { primary: string; soft: string; label: string; glyph: string }> = {
  // Tints map by primary visual identity. Computed from target + ignoreArmor.
  marksman:  { primary: "#60c4ff", soft: "rgba(96,196,255,0.22)",  label: "PRECISION", glyph: "◆" },
  assault:   { primary: "#FFC72C", soft: "rgba(255,199,44,0.22)",  label: "ASSAULT",   glyph: "▶▶" },
  area:      { primary: "#ff8a28", soft: "rgba(255,138,40,0.22)",  label: "AREA",      glyph: "✸" },
  energy:    { primary: "#a855f7", soft: "rgba(168,85,247,0.22)",  label: "PLASMA",    glyph: "◉" },
};

/** Resolve a weapon's visual class from its mechanical profile. */
function classifyWeapon(w: Weapon): keyof typeof WEAPON_CLASS_TINT {
  if (w.target === "all") return "area";
  if (w.target === "highest_hp" && w.ignoreArmor) return "marksman";
  // Map a few specific ids to plasma/energy so the colour matches the art
  if (w.id === "sg8p_punisher_plasma" || w.id === "arc12_blitzer") return "energy";
  return "assault";
}

/** Tactical profile derived from raw weapon stats — same pattern as armor. */
function weaponProfile(w: Weapon) {
  const power     = clamp(2 + w.damage * 0.9, 1, 10);
  const tempo     = clamp(2 + w.hitsPerTurn * 2.2, 1, 10);
  const precision = clamp(
    (w.target === "highest_hp" ? 6 : w.target === "all" ? 3 : 4) +
    (w.ignoreArmor ? 3 : 0),
    1, 10,
  );
  return { power: Math.round(power), tempo: Math.round(tempo), precision: Math.round(precision) };
}

const TARGET_LABEL: Record<Weapon["target"], string> = {
  highest_hp: "PRIORITY",
  random:     "SPREAD",
  all:        "AREA",
};

function WeaponStep({
  account,
  equippedId,
  setEquippedId,
}: {
  account: Account;
  equippedId: string;
  setEquippedId: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(equippedId);
  const selected = WEAPONS.find((w) => w.id === selectedId) ?? WEAPONS.find((w) => w.id === equippedId) ?? WEAPONS[0];
  const selectedTier = account.weaponTiers[selected.id] ?? 1;
  const selectedOwned = account.ownedWeapons.includes(selected.id);
  const selectedEff = selectedOwned ? getWeaponEffective(selected.id, selectedTier) : selected;
  const selectedTint = WEAPON_CLASS_TINT[classifyWeapon(selected)];

  return (
    // Same compressed pattern as ArmorStep — 1fr grid + 380px hero,
    // h-full so the layout fits the parent step container.
    <div className="grid gap-3 p-3 h-full" style={{ gridTemplateColumns: "1fr 380px" }}>
      {/* LEFT — 4-col x 3-row grid for the 12 weapons */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-sky-400 shadow-[0_0_4px_currentColor]" />
            <h3 className="text-[10px] font-display font-black uppercase tracking-[0.32em] text-sky-400">
              Primary Armament · {WEAPONS.length} options
            </h3>
          </div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">
            Click a tile to equip
          </span>
        </div>
        <div className="grid grid-cols-4 grid-rows-3 gap-2 flex-1 min-h-0">
          {WEAPONS.map((w) => {
            const owned = account.ownedWeapons.includes(w.id);
            const tier = account.weaponTiers[w.id] ?? 1;
            const eff = owned ? getWeaponEffective(w.id, tier) : w;
            const tint = WEAPON_CLASS_TINT[classifyWeapon(w)];
            const isSelected = w.id === selectedId;
            const isEquipped = w.id === equippedId;
            return (
              <WeaponGridCard
                key={w.id}
                weapon={w}
                eff={eff}
                owned={owned}
                tier={tier}
                tint={tint}
                isSelected={isSelected}
                isEquipped={isEquipped}
                onClick={() => {
                  if (!owned) { sfx.alert(); return; }
                  sfx.cardSelect();
                  setSelectedId(w.id);
                  setEquippedId(w.id);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* RIGHT — slim hero preview */}
      <WeaponHeroPanel
        weapon={selected}
        eff={selectedEff}
        tier={selectedTier}
        owned={selectedOwned}
        tint={selectedTint}
        isEquipped={selected.id === equippedId}
      />
    </div>
  );
}

/**
 * WeaponGridCard — compact 4-col tile. Tighter than the wider list
 * tile since 12 weapons need to share one screen.
 */
function WeaponGridCard({
  weapon, eff, owned, tier, tint, isSelected, isEquipped, onClick,
}: {
  weapon: Weapon;
  eff: Weapon;
  owned: boolean;
  tier: number;
  tint: { primary: string; soft: string; label: string; glyph: string };
  isSelected: boolean;
  isEquipped: boolean;
  onClick: () => void;
}) {
  const art = getWeaponArt(weapon.id);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={owned ? { y: -2, scale: 1.01 } : {}}
      whileTap={owned ? { scale: 0.99 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      disabled={!owned}
      className={clsx(
        "relative overflow-hidden text-left flex flex-col",
        !owned && "opacity-50 cursor-not-allowed",
      )}
      style={{
        background: "rgba(14,18,24,0.55)",
        border: `1px solid ${isSelected ? tint.primary : "rgba(255,255,255,0.08)"}`,
        boxShadow: isSelected
          ? `0 0 14px ${tint.soft}, inset 0 0 0 1px ${tint.primary}55`
          : isEquipped
            ? `inset 0 0 0 1px ${tint.primary}55`
            : "none",
      }}
    >
      <div className="relative flex-1 min-h-0 overflow-hidden">
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
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: tint.primary, fontSize: 24 }}>
            {tint.glyph}
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(7,11,16,0.9) 0%, transparent 100%)" }}
        />
        <span
          className="absolute top-1 left-1 px-1 py-0.5 text-[7.5px] font-display font-black uppercase tracking-[0.28em] z-10"
          style={{ color: tint.primary, border: `1px solid ${tint.primary}55`, background: "rgba(0,0,0,0.7)" }}
        >
          {tint.label}
        </span>
        {isEquipped && (
          <span
            className="absolute top-1 right-1 px-1 py-0.5 text-[7.5px] font-display font-black uppercase tracking-[0.28em] z-10"
            style={{ color: "#0A0F14", background: tint.primary }}
          >
            ✓
          </span>
        )}
      </div>

      <div
        className="px-1.5 py-1 shrink-0"
        style={{ borderTop: `1px solid ${isSelected ? tint.primary + "55" : "rgba(255,255,255,0.06)"}` }}
      >
        <div
          className="font-display font-black uppercase tracking-tight truncate"
          style={{ color: isSelected ? tint.primary : "rgba(255,255,255,0.92)", fontSize: 9.5, lineHeight: 1.1 }}
        >
          {weapon.name}
        </div>
        <div className="flex gap-1.5 text-[8.5px] font-mono mt-0.5">
          <span className="text-helldiver-yellow tabular-nums">DMG {eff.damage}</span>
          <span className="text-helldiver-steel">·</span>
          <span className="text-white tabular-nums">×{eff.hitsPerTurn}</span>
          {eff.ignoreArmor && (
            <>
              <span className="text-helldiver-steel">·</span>
              <span className="text-helldiver-yellow">AP</span>
            </>
          )}
        </div>
      </div>

      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
          <div className="text-[8px] uppercase tracking-[0.28em] text-helldiver-red font-display font-black text-center px-2">
            🔒 Locked<br />Visit Outfitter
          </div>
        </div>
      )}
    </motion.button>
  );
}

function WeaponTile({
  weapon, eff, owned, tier, tint, isSelected, isEquipped, onClick,
}: {
  weapon: Weapon;
  eff: Weapon;
  owned: boolean;
  tier: number;
  tint: { primary: string; soft: string; label: string; glyph: string };
  isSelected: boolean;
  isEquipped: boolean;
  onClick: () => void;
}) {
  const art = getWeaponArt(weapon.id);
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
      {/* Thumbnail — object-contain so the full weapon shows even at 72px */}
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
          <img src={art} alt="" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: tint.primary, fontSize: 18 }}>
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
          style={{ color: isSelected ? tint.primary : "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 1.1 }}
        >
          {weapon.name}
        </div>

        {/* Compact stat summary */}
        <div className="flex gap-2 text-[10px] font-mono">
          <span className="text-helldiver-yellow tabular-nums">DMG {eff.damage}</span>
          <span className="text-helldiver-steel">·</span>
          <span className="text-white tabular-nums">×{eff.hitsPerTurn}</span>
          <span className="text-helldiver-steel">·</span>
          <span className={clsx("tabular-nums", eff.ignoreArmor ? "text-helldiver-yellow" : "text-helldiver-dim")}>
            {eff.ignoreArmor ? "AP" : TARGET_LABEL[eff.target].slice(0, 3)}
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

function WeaponHeroPanel({
  weapon, eff, tier, owned, tint, isEquipped,
}: {
  weapon: Weapon;
  eff: Weapon;
  tier: number;
  owned: boolean;
  tint: { primary: string; soft: string; label: string; glyph: string };
  isEquipped: boolean;
}) {
  const art = getWeaponArt(weapon.id);
  const profile = weaponProfile(weapon);

  return (
    <div
      className="relative flex flex-col overflow-hidden h-full min-h-0"
      style={{
        background: `linear-gradient(180deg, rgba(14,18,24,0.92) 0%, rgba(7,11,16,0.92) 100%)`,
        border: `1px solid ${tint.primary}33`,
        boxShadow: isEquipped ? `0 0 24px ${tint.soft}, inset 0 0 40px rgba(0,0,0,0.6)` : "0 6px 20px rgba(0,0,0,0.45)",
      }}
    >
      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tint.primary}, transparent)` }}
      />

      {/* HERO ART — flex-1 so it claims whatever vertical space remains */}
      <AnimatePresence mode="wait">
        <motion.div
          key={weapon.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full overflow-hidden flex-1 min-h-0"
          style={{ background: "#070b10" }}
        >
          {art ? (
            <motion.img
              src={art}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain"
              animate={{ y: [0, -3, 0], scale: [1, 1.015, 1] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl" style={{ color: tint.primary, opacity: 0.3 }}>
              {tint.glyph}
            </div>
          )}

          {/* Class wash — fills letterbox bands with class tint */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 35%, ${tint.soft} 100%), linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 45%)`,
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

          {/* Title overlay — sized for the slim 380px panel */}
          <div className="absolute left-3 right-3 bottom-2 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div
                className="text-[8.5px] uppercase tracking-[0.32em] font-display font-black mb-0.5"
                style={{ color: tint.primary }}
              >
                {tint.glyph} {tint.label} · AUTO-FIRE
              </div>
              <div
                className="font-display font-black uppercase tracking-tight leading-none truncate"
                style={{
                  color: tint.primary,
                  fontSize: 17,
                  textShadow: `0 0 10px ${tint.soft}, 0 2px 4px rgba(0,0,0,0.95)`,
                }}
              >
                {weapon.name}
              </div>
            </div>
            {owned && <TierBadge tier={tier} />}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* INFO STRIP — shrink-0, tighter padding */}
      <div className="grid grid-cols-2 gap-3 px-3 py-2 shrink-0" style={{ borderTop: `1px solid ${tint.primary}22` }}>
        <div>
          <SectionLabel tint={tint.primary}>Stat Block</SectionLabel>
          <div className="space-y-1">
            <StatRow label="Damage" value={eff.damage} accent="emerald" />
            <StatRow label="Hits/Turn" value={eff.hitsPerTurn} accent="emerald" />
            <StatRow label="Targeting" value={0} accent="sky" sign={false} customDisplay={TARGET_LABEL[eff.target]} />
            {eff.ignoreArmor && <StatRow label="Penetration" value={0} accent="orange" sign={false} customDisplay="AP" />}
          </div>
        </div>
        <div>
          <SectionLabel tint={tint.primary}>Tactical Profile</SectionLabel>
          <div className="space-y-1">
            <ProfileBar label="Firepower" value={profile.power} accent={tint.primary} />
            <ProfileBar label="Tempo" value={profile.tempo} accent={tint.primary} />
            <ProfileBar label="Precision" value={profile.precision} accent={tint.primary} />
          </div>
        </div>
      </div>

      {/* DESCRIPTION + ACTIVE LOADOUT BANNER — shrink-0 */}
      <div className="px-3 pb-2 flex flex-col gap-2 shrink-0">
        <p className="text-[10.5px] text-gray-300 leading-snug italic line-clamp-2" style={{ borderLeft: `2px solid ${tint.primary}55`, paddingLeft: 8 }}>
          “{weapon.description}”
        </p>
        <ActiveLoadoutBanner active={isEquipped} tint={tint.primary} />
      </div>
    </div>
  );
}
