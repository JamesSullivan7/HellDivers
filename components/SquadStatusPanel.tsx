"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/lib/store";
import HudFrame from "./HudFrame";

interface Props {
  currentPhase: string;
  currentNode?: number;
  currentHp?: number;
  currentMaxHp?: number;
}

const PHASE_LABEL: Record<string, string> = {
  lobby: "LOBBY",
  loadout: "LOADOUT",
  map: "ON MAP",
  combat: "IN COMBAT",
  reward: "REWARD",
  rest: "RESTING",
  victory: "VICTORY",
  gameover: "KIA",
};

const PHASE_COLOR: Record<string, string> = {
  lobby: "text-helldiver-dim",
  loadout: "text-sky-400",
  map: "text-helldiver-yellow",
  combat: "text-helldiver-red",
  reward: "text-emerald-400",
  rest: "text-emerald-400",
  victory: "text-emerald-400",
  gameover: "text-helldiver-red",
};

export default function SquadStatusPanel({
  currentPhase,
  currentNode,
  currentHp,
  currentMaxHp,
}: Props) {
  const { account, squadCode } = useGame();
  const squad = useQuery(api.squads.get, squadCode ? { code: squadCode } : "skip");
  const updatePresence = useMutation(api.squads.updatePresence);

  useEffect(() => {
    if (!squadCode || !account.helldiverName) return;
    updatePresence({
      code: squadCode,
      helldiverName: account.helldiverName,
      phase: currentPhase,
      currentNode,
      currentHp,
      currentMaxHp,
    }).catch(() => {});
    const t = setInterval(() => {
      updatePresence({
        code: squadCode,
        helldiverName: account.helldiverName!,
        phase: currentPhase,
        currentNode,
        currentHp,
        currentMaxHp,
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [squadCode, account.helldiverName, currentPhase, currentNode, currentHp, currentMaxHp, updatePresence]);

  if (!squadCode || !squad) return null;

  return (
    <HudFrame label={`Squad ${squad.code}`} accent="emerald" className="p-2">
      <div className="space-y-1.5 text-[11px] font-mono">
        {squad.members.map((m) => {
          const isMe = m.name === account.helldiverName;
          const hpPct = m.currentMaxHp > 0 ? (m.currentHp / m.currentMaxHp) * 100 : 0;
          const stale = Date.now() - m.lastSeen > 30000;
          return (
            <div
              key={m.name}
              className={clsx(
                "border px-2 py-1",
                isMe ? "border-helldiver-yellow bg-helldiver-yellow/5" : "border-helldiver-steel/40",
                stale && "opacity-50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={clsx("font-bold truncate", isMe ? "text-helldiver-yellow" : "text-white")}>
                  {m.name}
                </span>
                <span className={clsx("text-[9px] uppercase tracking-widest", PHASE_COLOR[m.currentPhase] ?? "text-helldiver-dim")}>
                  {PHASE_LABEL[m.currentPhase] ?? m.currentPhase}
                </span>
              </div>
              {m.currentMaxHp > 0 && m.currentPhase === "combat" && (
                <div className="h-1 bg-black border border-helldiver-steel mt-1 relative">
                  <div
                    className={clsx(
                      "h-full",
                      hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-helldiver-yellow" : "bg-helldiver-red"
                    )}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </HudFrame>
  );
}
