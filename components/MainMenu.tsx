"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx, isMuted, setMuted } from "@/lib/sfx";
import { useEffect, useState } from "react";
import StarField from "./StarField";
import PropagandaTicker from "./PropagandaTicker";
import HudFrame from "./HudFrame";
import { xpToLevelUp } from "@/lib/account";
import { getCape, getTitle } from "@/lib/cosmetics";

export default function MainMenu() {
  const { goToWar, goToArmory, goToSquadHub, settings, setSetting, account, resetAccount, setHelldiverName } = useGame();
  const [muted, setMutedState] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(account.helldiverName ?? "");
  const cape = getCape(account.equippedCape);
  const title = getTitle(account.equippedTitle);

  useEffect(() => {
    setMuted(settings.muted);
    setMutedState(settings.muted);
  }, [settings.muted]);

  const xpNext = xpToLevelUp(account.level);
  const xpPct = Math.min(100, (account.xp / xpNext) * 100);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-start relative pt-16 pb-10 px-4">
      <StarField />

      <div className="absolute top-0 inset-x-0 z-20">
        <PropagandaTicker />
      </div>

      <div className="absolute top-12 right-4 z-20 flex items-center gap-2 text-[10px] uppercase tracking-widest text-helldiver-dim">
        <button
          onClick={() => {
            sfx.unlock();
            sfx.click();
            const next = !muted;
            setMuted(next);
            setMutedState(next);
            setSetting("muted", next);
          }}
          className="px-2 py-1 border border-helldiver-steel hover:border-helldiver-yellow hover:text-helldiver-yellow transition-colors"
        >
          {muted ? "🔇 SFX OFF" : "🔊 SFX ON"}
        </button>
        <button
          onClick={() => {
            sfx.unlock();
            sfx.click();
            setSetting("codeMinigameEnabled", !settings.codeMinigameEnabled);
          }}
          className={`px-2 py-1 border transition-colors ${
            settings.codeMinigameEnabled
              ? "border-helldiver-yellow text-helldiver-yellow"
              : "border-helldiver-steel hover:border-helldiver-yellow hover:text-helldiver-yellow"
          }`}
        >
          {settings.codeMinigameEnabled ? "⌨ CODE ON" : "⌨ CODE OFF"}
        </button>
      </div>

      <div className="absolute top-12 left-4 z-20 text-[10px] uppercase tracking-widest text-helldiver-dim font-mono">
        SES · DEMOCRATIC FLAME
        <br />
        <span className="text-helldiver-yellow">▶ AWAITING DEPLOYMENT</span>
        {account.helldiverName && (
          <>
            <br />
            <span className="text-emerald-400">
              {title.id ? `${title.name} ` : ""}{account.helldiverName}
            </span>
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl w-full text-center"
      >
        <div className="text-helldiver-yellow text-[10px] tracking-[0.4em] uppercase mb-2 font-mono">
          ◢ Super Earth Armed Forces · Authorized Use Only ◣
        </div>

        <motion.h1
          initial={{ letterSpacing: "0.5em", opacity: 0 }}
          animate={{ letterSpacing: "-0.02em", opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-7xl font-display font-black tracking-tight mb-1 leading-none drop-shadow-[0_0_20px_rgba(255, 211, 77,0.3)]"
        >
          HELL<span className="text-helldiver-yellow">DIVERS</span>
        </motion.h1>
        <div className="text-3xl font-display font-bold text-helldiver-yellow mb-1 tracking-[0.2em]">
          STRATAGEM PROTOCOL
        </div>
        <div className="text-[10px] text-gray-400 mb-6 uppercase tracking-[0.4em] font-mono">
          ‣ A Roguelike Deckbuilder ‣
        </div>

        {/* HQ Stats */}
        <HudFrame label="Helldiver Profile · HQ" accent="yellow" glow className="p-4 mb-4 text-left">
          {/* Helldiver identity card with cape stripe */}
          <div className={clsx("h-1.5 mb-2 -mx-4 -mt-4 mt-0 bg-gradient-to-r", cape.colorClass)} />
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              {title.id && (
                <div className="text-[10px] uppercase tracking-[0.3em] text-helldiver-orange font-bold">
                  {title.name}
                </div>
              )}
              {editingName ? (
                <div className="flex gap-1 items-center">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={24}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        sfx.click();
                        setHelldiverName(draftName);
                        setEditingName(false);
                      } else if (e.key === "Escape") {
                        setEditingName(false);
                      }
                    }}
                    autoFocus
                    className="bg-black border-2 border-helldiver-yellow text-helldiver-yellow px-2 py-1 font-display font-black text-lg w-full focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      sfx.click();
                      setHelldiverName(draftName);
                      setEditingName(false);
                    }}
                    className="px-2 py-1 bg-helldiver-yellow text-black text-[10px] font-bold tracking-widest"
                  >
                    SAVE
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="font-display font-black text-2xl text-helldiver-yellow tracking-wider">
                    {account.helldiverName ?? "ANONYMOUS"}
                  </div>
                  <button
                    onClick={() => {
                      sfx.click();
                      setDraftName(account.helldiverName ?? "");
                      setEditingName(true);
                    }}
                    className="text-[9px] uppercase tracking-widest text-helldiver-dim hover:text-helldiver-yellow border border-helldiver-steel hover:border-helldiver-yellow px-1.5 py-0.5 transition-colors"
                  >
                    EDIT
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">Level</div>
              <div className="font-display font-black text-2xl text-helldiver-yellow">{account.level}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">Medals</div>
              <div className="font-display font-black text-2xl text-helldiver-yellow">{account.medals}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">Samples</div>
              <div className="font-display font-black text-2xl text-sky-400">{account.samples}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim">Requisition</div>
              <div className="font-display font-black text-2xl text-helldiver-orange">{account.requisition}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-helldiver-dim w-8">XP</span>
            <div className="flex-1 h-2 bg-black border border-helldiver-steel relative overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-helldiver-yellow to-yellow-400"
                animate={{ width: `${xpPct}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 25 }}
              />
            </div>
            <span className="text-helldiver-dim tabular-nums">{account.xp} / {xpNext}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-center text-helldiver-dim border-t border-helldiver-steel pt-2 font-mono">
            <div>Runs <span className="text-white">{account.totalRuns}</span></div>
            <div>Cards <span className="text-helldiver-yellow">{account.unlockedCards.length}</span></div>
            <div>Modules <span className="text-sky-400">{account.unlockedModules.length}/8</span></div>
          </div>
        </HudFrame>

        <HudFrame accent="yellow" className="p-5 space-y-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sfx.unlock();
              sfx.beacon();
              goToWar();
            }}
            className="w-full bg-gradient-to-b from-helldiver-yellow to-yellow-500 text-helldiver-dark font-display font-black py-4 text-xl uppercase tracking-[0.3em] border-2 border-helldiver-yellow shadow-[0_0_30px_rgba(255, 211, 77,0.5)]"
          >
            ▶ Deploy Helldiver
          </motion.button>

          <button
            onClick={() => {
              sfx.click();
              goToSquadHub();
            }}
            className="w-full bg-helldiver-panel border-2 border-emerald-500/60 hover:border-emerald-400 hover:text-emerald-400 text-emerald-400 py-3 font-display font-bold uppercase tracking-[0.3em] transition-colors"
          >
            ◇ Squad · Form or Join
          </button>

          <button
            onClick={() => {
              sfx.click();
              goToArmory();
            }}
            className="w-full bg-helldiver-panel border-2 border-helldiver-steel hover:border-helldiver-yellow hover:text-helldiver-yellow text-helldiver-dim py-3 font-display font-bold uppercase tracking-[0.3em] transition-colors"
          >
            ⌥ Armory · Stratagems & Modules
          </button>

          <button
            onClick={() => {
              sfx.click();
              setShowHistory(!showHistory);
            }}
            className="w-full text-[10px] uppercase tracking-widest text-helldiver-dim hover:text-helldiver-yellow font-mono transition-colors"
          >
            {showHistory ? "▼ Hide" : "▶ Show"} Mission History
          </button>

          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t border-helldiver-steel pt-3 max-h-40 overflow-y-auto"
            >
              {account.history.length === 0 ? (
                <div className="text-[11px] text-helldiver-dim text-center font-mono">No deployments on record.</div>
              ) : (
                <div className="space-y-1 text-[11px] text-left">
                  {account.history.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono">
                      <span className={h.outcome === "victory" ? "text-emerald-400" : "text-helldiver-red"}>
                        {h.outcome === "victory" ? "✓" : "✕"}
                      </span>
                      <span className="text-gray-300 flex-1 truncate">{h.planet}</span>
                      <span className="text-helldiver-dim text-[9px]">{h.nodesCleared}/11</span>
                      <span className="text-helldiver-yellow">+{h.medalsEarned}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  if (confirm("Reset all account progress? This cannot be undone.")) {
                    sfx.click();
                    resetAccount();
                  }
                }}
                className="mt-3 text-[9px] uppercase tracking-widest text-helldiver-red/60 hover:text-helldiver-red font-mono transition-colors w-full"
              >
                ⚠ Reset Account Progress
              </button>
            </motion.div>
          )}
        </HudFrame>

        <div className="mt-4 text-[10px] text-helldiver-dim uppercase tracking-[0.4em] font-mono">
          Democracy Officer is watching.
        </div>
      </motion.div>
    </div>
  );
}
