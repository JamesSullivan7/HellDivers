"use client";

import { Faction } from "@/lib/types";

const FACTION_LABEL: Record<Faction, string> = {
  terminid: "TERMINID",
  automaton: "AUTOMATON",
  illuminate: "ILLUMINATE",
};

const FACTION_TEXT: Record<Faction, string> = {
  terminid: "text-faction-terminid",
  automaton: "text-faction-automaton",
  illuminate: "text-faction-illuminate",
};

interface Props {
  name: string;
  faction: Faction;
}

export default function EnemyHeader({ name, faction }: Props) {
  return (
    <div
      className="flex items-center justify-between px-tok-2"
      style={{ height: "36px" }}
    >
      <div
        className="font-display font-black uppercase text-text-primary truncate"
        style={{ fontSize: "13px", letterSpacing: "0.05em" }}
      >
        {name}
      </div>
      <div
        className={`font-mono uppercase tracking-widest shrink-0 ${FACTION_TEXT[faction]}`}
        style={{ fontSize: "9px" }}
      >
        {FACTION_LABEL[faction]}
      </div>
    </div>
  );
}
