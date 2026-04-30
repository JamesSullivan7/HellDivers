"use client";

import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx, isMuted, setMuted } from "@/lib/sfx";
import { useEffect, useState } from "react";
import { getCape, getTitle } from "@/lib/cosmetics";

export default function TopBar() {
  const { account, settings, setSetting } = useGame();
  const [muted, setMutedState] = useState(false);
  const cape = getCape(account.equippedCape);
  const title = getTitle(account.equippedTitle);

  useEffect(() => {
    setMuted(settings.muted);
    setMutedState(settings.muted);
  }, [settings.muted]);

  return (
    <header
      className="relative z-ui w-full border-b border-border-strong bg-bg-secondary/85 backdrop-blur-md"
      style={{ height: "44px" }}
    >
      {/* Cape stripe under top bar — tiny visual identity hint */}
      <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r ${cape.colorClass}`} />

      <div className="h-full px-tok-4 flex items-center gap-tok-4">
        {/* Identity (left) */}
        <div className="flex items-center gap-tok-3 min-w-0">
          <div className="font-display font-black text-sm tracking-[0.18em] text-accent-yellow shrink-0">
            HELLDIVERS<span className="text-text-dim mx-1">·</span>STRATAGEM
          </div>
          <span className="hidden md:block w-px h-4 bg-border-strong" />
          <div className="hidden md:flex items-center gap-tok-2 text-[10px] uppercase tracking-[0.2em] font-mono min-w-0">
            {title.id && (
              <span className="text-accent-yellow truncate">{title.name}</span>
            )}
            <span className="text-text-secondary truncate">
              {account.helldiverName ?? "ANONYMOUS"}
            </span>
            <span className="text-text-dim">LV {account.level}</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Currencies (right-center) */}
        <div className="flex items-center gap-tok-3 text-[11px] font-mono">
          <Currency label="Medals" value={account.medals} color="text-accent-yellow" />
          <span className="w-px h-4 bg-border-strong" />
          <Currency label="Samples" value={account.samples} color="text-accent-cyan" />
          <span className="w-px h-4 bg-border-strong" />
          <Currency label="Requisition" value={account.requisition} color="text-accent-yellow" />
        </div>

        {/* Settings (right) */}
        <button
          aria-label="Toggle SFX"
          onClick={() => {
            sfx.unlock();
            sfx.click();
            const next = !muted;
            setMuted(next);
            setMutedState(next);
            setSetting("muted", next);
          }}
          className="ml-tok-2 px-tok-2 py-1 border border-border-strong text-text-dim hover:text-accent-yellow hover:border-accent-yellow transition-colors text-[10px] tracking-widest uppercase"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          aria-label="Toggle stratagem code"
          onClick={() => {
            sfx.unlock();
            sfx.click();
            setSetting("codeMinigameEnabled", !settings.codeMinigameEnabled);
          }}
          className={
            "px-tok-2 py-1 border transition-colors text-[10px] tracking-widest uppercase " +
            (settings.codeMinigameEnabled
              ? "border-accent-yellow text-accent-yellow"
              : "border-border-strong text-text-dim hover:text-accent-yellow hover:border-accent-yellow")
          }
          title="Stratagem code minigame"
        >
          ⌨
        </button>
      </div>
    </header>
  );
}

function Currency({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[9px] uppercase tracking-[0.2em] text-text-dim hidden sm:inline">
        {label}
      </span>
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`font-display font-bold tabular-nums ${color}`}
      >
        {value.toLocaleString()}
      </motion.span>
    </div>
  );
}
