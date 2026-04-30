"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { NavKey } from "@/types/shell";

interface NavItem {
  key: NavKey;
  label: string;
  icon: string;
  onActivate: (g: ReturnType<typeof useGame.getState>) => void;
}

const ITEMS: NavItem[] = [
  { key: "war", label: "GALACTIC WAR", icon: "🌌", onActivate: (g) => g.goToWar() },
  { key: "mission", label: "MISSION", icon: "🎯", onActivate: (g) => g.goToWar() },
  { key: "stratagems", label: "STRATAGEMS", icon: "🃏", onActivate: (g) => g.goToArmory() },
  { key: "armory", label: "ARMORY", icon: "⌥", onActivate: (g) => g.goToArmory() },
  { key: "squad", label: "SQUAD", icon: "◇", onActivate: (g) => g.goToSquadHub() },
  { key: "history", label: "HISTORY", icon: "📜", onActivate: (g) => g.goToMenu() },
];

interface Props {
  active: NavKey;
}

export default function LeftNav({ active }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const game = useGame();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label="Toggle navigation"
        onClick={() => setCollapsed((v) => !v)}
        className="lg:hidden fixed top-12 left-2 z-overlay border border-border-strong bg-bg-secondary text-accent-yellow px-tok-2 py-1 text-xs tracking-widest"
      >
        ☰
      </button>

      <nav
        className={clsx(
          "shrink-0 border-r border-border-strong bg-bg-secondary/85 backdrop-blur-md flex flex-col",
          "lg:relative lg:translate-x-0 lg:w-[260px]",
          "fixed top-[44px] bottom-[32px] left-0 z-overlay w-[240px] transition-transform duration-200",
          collapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="px-tok-3 py-tok-3 border-b border-border-subtle">
          <div className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono">
            ◢ Navigation
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-tok-2">
          {ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <motion.button
                key={item.key}
                whileHover={{ x: 2 }}
                onClick={() => {
                  sfx.click();
                  item.onActivate(game);
                  setCollapsed(true);
                }}
                className={clsx(
                  "w-full flex items-center gap-tok-3 px-tok-4 py-tok-3 text-left font-display font-bold text-xs tracking-[0.2em] uppercase transition-all border-l-4",
                  isActive
                    ? "bg-accent-yellow/10 border-accent-yellow text-accent-yellow"
                    : "border-transparent text-text-secondary hover:bg-bg-tertiary hover:text-accent-yellow"
                )}
              >
                <span className="text-lg shrink-0 leading-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="px-tok-3 py-tok-3 border-t border-border-subtle text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono">
          SES Democratic Flame
        </div>
      </nav>
    </>
  );
}
