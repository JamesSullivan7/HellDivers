"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { CARD_LIBRARY } from "@/lib/cards";
import { getCardCost, SHIP_MODULES } from "@/lib/account";
import { CAPES, TITLES } from "@/lib/cosmetics";
import HudFrame from "./HudFrame";
import CardView from "./CardView";
import AppShell from "./shell/AppShell";
import OutfitterPanel from "./OutfitterPanel";

type Tab = "outfitter" | "warbonds" | "modules" | "cosmetics";

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "eagle", label: "EAGLE" },
  { id: "orbital", label: "ORBITAL" },
  { id: "sentry", label: "SENTRY" },
  { id: "support", label: "SUPPORT" },
  { id: "backpack", label: "BACKPACK" },
  { id: "utility", label: "UTILITY" },
];

export default function ArmoryScreen() {
  const { account, unlockCard, unlockModule, unlockCape, unlockTitle, equipCape, equipTitle, goToMenu } = useGame();
  const [tab, setTab] = useState<Tab>("outfitter");
  const [filter, setFilter] = useState<string>("all");

  const filteredCards =
    filter === "all" ? CARD_LIBRARY : CARD_LIBRARY.filter((c) => c.type === filter);

  const handleCardUnlock = (cardId: string) => {
    const card = CARD_LIBRARY.find((c) => c.id === cardId)!;
    if (account.unlockedCards.includes(cardId)) return;
    if (account.medals < getCardCost(card.rarity)) {
      sfx.alert();
      return;
    }
    if (unlockCard(cardId)) {
      sfx.beacon();
    } else {
      sfx.alert();
    }
  };

  const handleModuleUnlock = (modId: string) => {
    const mod = SHIP_MODULES.find((m) => m.id === modId)!;
    if (account.unlockedModules.includes(modId)) return;
    if (account.samples < mod.cost) {
      sfx.alert();
      return;
    }
    if (unlockModule(modId)) {
      sfx.beacon();
    } else {
      sfx.alert();
    }
  };

  return (
    <AppShell activeNav="armory">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-tok-5">
          <div className="text-[10px] uppercase tracking-[0.4em] text-accent-yellow mb-1">
            ◢ Destroyer Armory · Acquisitions Division ◣
          </div>
          <div className="text-3xl font-display font-black tracking-tight">
            ARMORY · <span className="text-accent-yellow">SES DEMOCRATIC FLAME</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 mb-5 flex-wrap">
          <button
            onClick={() => { sfx.click(); setTab("outfitter"); }}
            className={clsx(
              "px-5 py-2 border-2 font-display font-bold tracking-widest text-xs transition-all",
              tab === "outfitter"
                ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.5)]"
                : "border-helldiver-steel text-helldiver-dim hover:border-emerald-400 hover:text-emerald-400"
            )}
          >
            ◇ OUTFITTER
          </button>
          <button
            onClick={() => { sfx.click(); setTab("warbonds"); }}
            className={clsx(
              "px-5 py-2 border-2 font-display font-bold tracking-widest text-xs transition-all",
              tab === "warbonds"
                ? "bg-helldiver-yellow text-black border-helldiver-yellow shadow-[0_0_18px_rgba(255, 211, 77,0.5)]"
                : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
            )}
          >
            ◇ WARBONDS
          </button>
          <button
            onClick={() => { sfx.click(); setTab("modules"); }}
            className={clsx(
              "px-5 py-2 border-2 font-display font-bold tracking-widest text-xs transition-all",
              tab === "modules"
                ? "bg-sky-400 text-black border-sky-400 shadow-[0_0_18px_rgba(14,165,233,0.5)]"
                : "border-helldiver-steel text-helldiver-dim hover:border-sky-400 hover:text-sky-400"
            )}
          >
            ◇ SHIP MODULES
          </button>
          <button
            onClick={() => { sfx.click(); setTab("cosmetics"); }}
            className={clsx(
              "px-5 py-2 border-2 font-display font-bold tracking-widest text-xs transition-all",
              tab === "cosmetics"
                ? "bg-helldiver-orange text-black border-helldiver-orange shadow-[0_0_18px_rgba(255, 211, 77,0.5)]"
                : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-orange hover:text-helldiver-orange"
            )}
          >
            ◇ COSMETICS
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "outfitter" && (
            <motion.div
              key="outfitter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OutfitterPanel />
            </motion.div>
          )}

          {tab === "warbonds" && (
            <motion.div
              key="warbonds"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-3 flex flex-wrap gap-1">
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
              </div>

              <HudFrame label={`Available Stratagems (${filteredCards.length})`} accent="steel" className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredCards.map((card) => {
                    const unlocked = account.unlockedCards.includes(card.id);
                    const cost = getCardCost(card.rarity);
                    const canAfford = account.medals >= cost;
                    return (
                      <div key={card.id} className="relative">
                        <CardView card={card} small affordable={unlocked} />
                        {!unlocked && (
                          <button
                            onClick={() => handleCardUnlock(card.id)}
                            className={clsx(
                              "absolute inset-0 flex flex-col items-center justify-center bg-black/85 border-2 transition-all",
                              canAfford
                                ? "border-helldiver-yellow hover:bg-black/70 cursor-pointer"
                                : "border-helldiver-red cursor-not-allowed"
                            )}
                          >
                            <div className="text-2xl mb-2">🔒</div>
                            <div className={clsx(
                              "px-2 py-0.5 border-2 text-xs font-display font-bold tracking-wider",
                              canAfford
                                ? "border-helldiver-yellow text-helldiver-yellow"
                                : "border-helldiver-red text-helldiver-red"
                            )}>
                              {cost} ◆
                            </div>
                            <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mt-2">
                              {card.rarity}
                            </div>
                            {canAfford && (
                              <div className="text-[9px] uppercase tracking-widest text-helldiver-yellow mt-1 animate-blink">
                                CLICK TO UNLOCK
                              </div>
                            )}
                          </button>
                        )}
                        {unlocked && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] tracking-widest border border-emerald-400 text-emerald-400 bg-black/70">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </HudFrame>
            </motion.div>
          )}

          {tab === "modules" && (
            <motion.div
              key="modules"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <HudFrame label="Ship Modules · Persistent Upgrades" accent="emerald" className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SHIP_MODULES.map((mod) => {
                    const unlocked = account.unlockedModules.includes(mod.id);
                    const canAfford = account.samples >= mod.cost;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => !unlocked && handleModuleUnlock(mod.id)}
                        disabled={unlocked}
                        className={clsx(
                          "relative p-4 border-2 text-left transition-all bg-helldiver-panel/80 group",
                          unlocked
                            ? "border-emerald-400 cursor-default"
                            : canAfford
                              ? "border-sky-400 hover:bg-helldiver-panel cursor-pointer"
                              : "border-helldiver-steel opacity-60 cursor-not-allowed"
                        )}
                      >
                        <span className={clsx("absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2", unlocked ? "border-emerald-400" : "border-sky-400")} />
                        <span className={clsx("absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2", unlocked ? "border-emerald-400" : "border-sky-400")} />
                        <span className={clsx("absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2", unlocked ? "border-emerald-400" : "border-sky-400")} />
                        <span className={clsx("absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2", unlocked ? "border-emerald-400" : "border-sky-400")} />

                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">
                            Module · {unlocked ? "ACTIVE" : "LOCKED"}
                          </div>
                          {unlocked ? (
                            <span className="text-emerald-400 text-xs font-bold">✓</span>
                          ) : (
                            <span className={clsx("px-1.5 py-0.5 border text-[10px] font-bold", canAfford ? "border-sky-400 text-sky-400" : "border-helldiver-red text-helldiver-red")}>
                              {mod.cost} ◆
                            </span>
                          )}
                        </div>
                        <div className={clsx("font-display font-bold text-sm tracking-tight mb-2", unlocked ? "text-emerald-400" : "text-sky-400")}>
                          {mod.name.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-gray-300 leading-snug">{mod.description}</div>
                      </button>
                    );
                  })}
                </div>
              </HudFrame>
            </motion.div>
          )}
          {tab === "cosmetics" && (
            <motion.div
              key="cosmetics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Capes */}
              <HudFrame label="Capes" accent="orange" className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CAPES.map((cape) => {
                    const unlocked = account.unlockedCapes.includes(cape.id);
                    const equipped = account.equippedCape === cape.id;
                    const canAfford = account.requisition >= cape.cost;
                    return (
                      <button
                        key={cape.id}
                        onClick={() => {
                          if (unlocked) {
                            sfx.click();
                            equipCape(cape.id);
                          } else if (canAfford) {
                            if (unlockCape(cape.id)) sfx.beacon();
                            else sfx.alert();
                          } else sfx.alert();
                        }}
                        className={clsx(
                          "relative p-3 border-2 text-left bg-helldiver-panel/80 transition-all",
                          equipped
                            ? "border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.4)]"
                            : unlocked
                              ? "border-helldiver-orange hover:scale-[1.02]"
                              : canAfford
                                ? "border-helldiver-steel hover:border-helldiver-orange"
                                : "border-helldiver-steel opacity-50"
                        )}
                      >
                        <span className={clsx("absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2", equipped ? "border-emerald-400" : "border-helldiver-orange")} />
                        <span className={clsx("absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2", equipped ? "border-emerald-400" : "border-helldiver-orange")} />

                        {/* Cape preview */}
                        <div className={clsx("h-12 mb-2 bg-gradient-to-b border border-black/40", cape.colorClass)} />

                        <div className="flex items-center justify-between mb-1">
                          <div className="font-display font-bold text-sm text-white">{cape.name}</div>
                          {equipped && <span className="text-emerald-400 text-[10px] font-bold">✓ EQUIPPED</span>}
                          {!unlocked && (
                            <span className={clsx("text-[10px] font-bold border px-1.5 py-0.5", canAfford ? "border-helldiver-orange text-helldiver-orange" : "border-helldiver-red text-helldiver-red")}>
                              {cape.cost} ◇
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-helldiver-dim leading-snug">{cape.description}</div>
                        {!unlocked && canAfford && (
                          <div className="text-[9px] uppercase tracking-widest text-helldiver-orange mt-1 animate-blink">CLICK TO UNLOCK</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </HudFrame>

              {/* Titles */}
              <HudFrame label="Titles" accent="orange" className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {TITLES.map((title) => {
                    const unlocked = account.unlockedTitles.includes(title.id);
                    const equipped = account.equippedTitle === title.id;
                    const canAfford = account.requisition >= title.cost;
                    return (
                      <button
                        key={title.id || "none"}
                        onClick={() => {
                          if (unlocked) {
                            sfx.click();
                            equipTitle(title.id);
                          } else if (canAfford) {
                            if (unlockTitle(title.id)) sfx.beacon();
                            else sfx.alert();
                          } else sfx.alert();
                        }}
                        className={clsx(
                          "relative p-3 border-2 text-left bg-helldiver-panel/80 transition-all",
                          equipped
                            ? "border-emerald-400"
                            : unlocked
                              ? "border-helldiver-orange hover:scale-[1.02]"
                              : canAfford
                                ? "border-helldiver-steel hover:border-helldiver-orange"
                                : "border-helldiver-steel opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className={clsx("font-display font-bold text-sm", equipped ? "text-emerald-400" : "text-helldiver-orange")}>
                            {title.name}
                          </div>
                          {equipped && <span className="text-emerald-400 text-[10px] font-bold">✓</span>}
                          {!unlocked && (
                            <span className={clsx("text-[10px] font-bold border px-1.5 py-0.5", canAfford ? "border-helldiver-orange text-helldiver-orange" : "border-helldiver-red text-helldiver-red")}>
                              {title.cost} ◇
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-helldiver-dim leading-snug">{title.description}</div>
                      </button>
                    );
                  })}
                </div>
              </HudFrame>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AppShell>
  );
}
