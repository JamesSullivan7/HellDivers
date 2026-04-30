"use client";

import { Faction } from "@/lib/types";

const FACTION_PREFIX: Record<Faction, string> = {
  terminid: "TRM",
  automaton: "AUT",
  illuminate: "ILL",
};

function deriveThreat(maxHp: number, isBoss?: boolean): number {
  if (isBoss) return 5;
  if (maxHp < 10) return 1;
  if (maxHp < 20) return 2;
  if (maxHp < 35) return 3;
  if (maxHp < 60) return 4;
  return 5;
}

function deriveCode(templateId: string): string {
  let h = 0;
  for (let i = 0; i < templateId.length; i++) h = (h * 31 + templateId.charCodeAt(i)) >>> 0;
  return (h % 999).toString().padStart(3, "0");
}

interface Props {
  templateId: string;
  faction: Faction;
  maxHp: number;
  isBoss?: boolean;
}

export default function EnemyFooter({ templateId, faction, maxHp, isBoss }: Props) {
  const threat = deriveThreat(maxHp, isBoss);
  const code = deriveCode(templateId);
  return (
    <div
      className="flex items-center justify-between px-tok-3 border-t border-border-subtle"
      style={{ height: "24px" }}
    >
      <div className="text-[10px] font-mono uppercase tracking-widest" style={{ opacity: 0.6 }}>
        <span className="text-text-dim">THREAT</span>{" "}
        <span className="text-accent-yellow font-bold tabular-nums">{threat}</span>
      </div>
      <div
        className="text-[10px] font-mono uppercase tracking-widest text-text-dim tabular-nums"
        style={{ opacity: 0.6 }}
      >
        EN-{FACTION_PREFIX[faction]}-{code}
      </div>
    </div>
  );
}
