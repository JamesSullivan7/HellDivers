"use client";

import { Faction } from "@/lib/types";
import { FactionIcon } from "@/lib/icons";

const FACTION_BG: Record<Faction, string> = {
  terminid: "from-faction-terminid/15 via-bg-tertiary to-bg-secondary",
  automaton: "from-faction-automaton/15 via-bg-tertiary to-bg-secondary",
  illuminate: "from-faction-illuminate/15 via-bg-tertiary to-bg-secondary",
};

const FACTION_TEXT: Record<Faction, string> = {
  terminid: "text-faction-terminid",
  automaton: "text-faction-automaton",
  illuminate: "text-faction-illuminate",
};

interface Props {
  faction: Faction;
}

export default function EnemyImage({ faction }: Props) {
  return (
    <div
      className={`relative h-full bg-gradient-to-br ${FACTION_BG[faction]} overflow-hidden`}
    >
      {/* Aggressive crop / silhouette placeholder */}
      <div className={`absolute inset-0 flex items-center justify-center ${FACTION_TEXT[faction]} opacity-80 drop-shadow-[0_0_18px_currentColor]`}>
        <FactionIcon faction={faction} className="w-16 h-16" />
      </div>

      {/* Right-side fade (per spec) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent 60%, rgba(0,0,0,0.7))",
        }}
      />
    </div>
  );
}
