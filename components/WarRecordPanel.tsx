"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { listPlanets, loadWarState, WarState } from "@/lib/galacticWar";
import { Faction } from "@/lib/types";
import HudFrame from "./HudFrame";
import { FactionIcon } from "@/lib/icons";

const FACTION_LABEL: Record<Faction, string> = {
  terminid: "Terminid",
  automaton: "Automaton",
  illuminate: "Illuminate",
};

const FACTION_ACCENT: Record<Faction, string> = {
  terminid: "text-helldiver-orange",
  automaton: "text-helldiver-red",
  illuminate: "text-sky-400",
};

const TOTAL_MAJOR_ORDERS = 6;

export default function WarRecordPanel() {
  const [war, setWar] = useState<WarState | null>(null);

  useEffect(() => {
    setWar(loadWarState());
    const onFocus = () => setWar(loadWarState());
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
    };
  }, []);

  if (!war) return null;

  const planets = listPlanets(war);
  const totalPlanets = planets.length;
  const liberatedPlanets = planets.filter((p) => p.liberation >= 100).length;

  // Per-faction tallies
  const byFaction: Record<Faction, { total: number; liberated: number }> = {
    terminid: { total: 0, liberated: 0 },
    automaton: { total: 0, liberated: 0 },
    illuminate: { total: 0, liberated: 0 },
  };
  planets.forEach((p) => {
    byFaction[p.faction].total += 1;
    if (p.liberation >= 100) byFaction[p.faction].liberated += 1;
  });

  const ordersClaimed = war.completedOrderIds?.length ?? 0;
  const moMedalsTotal = war.ordersClaimedMedals ?? 0;

  // Most-liberated planet (resume hint)
  const inProgress = planets
    .filter((p) => p.liberation > 0 && p.liberation < 100)
    .sort((a, b) => b.liberation - a.liberation)[0];

  const overallPct = (liberatedPlanets / totalPlanets) * 100;
  const allDone = liberatedPlanets === totalPlanets;
  const allOrdersDone = ordersClaimed >= TOTAL_MAJOR_ORDERS;

  return (
    <HudFrame label="War Record" accent="yellow" className="p-4 mb-4 text-left">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim mb-1">
            Galaxy Liberated
          </div>
          <div className="flex items-baseline gap-2">
            <span className={clsx(
              "font-display font-black text-2xl tabular-nums",
              allDone ? "text-emerald-400" : "text-helldiver-yellow"
            )}>
              {liberatedPlanets}
            </span>
            <span className="text-helldiver-dim text-sm">/ {totalPlanets} planets</span>
          </div>
          <div className="h-1.5 bg-black border border-helldiver-steel overflow-hidden mt-1">
            <motion.div
              className={clsx("h-full", allDone ? "bg-emerald-500" : "bg-helldiver-yellow")}
              animate={{ width: `${overallPct}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 25 }}
            />
          </div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim mb-1">
            Major Orders Claimed
          </div>
          <div className="flex items-baseline gap-2">
            <span className={clsx(
              "font-display font-black text-2xl tabular-nums",
              allOrdersDone ? "text-emerald-400" : "text-helldiver-yellow"
            )}>
              {ordersClaimed}
            </span>
            <span className="text-helldiver-dim text-sm">/ {TOTAL_MAJOR_ORDERS}</span>
          </div>
          <div className="text-[10px] text-helldiver-yellow mt-1 tabular-nums">
            +{moMedalsTotal.toLocaleString()} Medals from orders
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 border-t border-helldiver-steel pt-3">
        {(Object.keys(byFaction) as Faction[]).map((f) => {
          const { total, liberated } = byFaction[f];
          const pct = total > 0 ? (liberated / total) * 100 : 0;
          return (
            <div key={f} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <FactionIcon faction={f} className={clsx("w-3 h-3", FACTION_ACCENT[f])} />
                <span className={clsx("text-[9px] uppercase tracking-widest font-bold", FACTION_ACCENT[f])}>
                  {FACTION_LABEL[f]}
                </span>
              </div>
              <div className="text-[11px] tabular-nums text-gray-200">
                {liberated} / {total}
              </div>
              <div className="h-1 bg-black border border-helldiver-steel overflow-hidden mt-1">
                <div
                  className={clsx(
                    "h-full",
                    f === "terminid" && "bg-helldiver-orange",
                    f === "automaton" && "bg-helldiver-red",
                    f === "illuminate" && "bg-sky-400"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {inProgress && !allDone && (
        <div className="border-t border-helldiver-steel pt-2 text-[10px] flex items-center justify-between">
          <span className="text-helldiver-dim uppercase tracking-widest">Frontline</span>
          <span className="text-gray-200 font-mono">
            {inProgress.name.toUpperCase()}{" "}
            <span className="text-helldiver-yellow tabular-nums">
              {inProgress.liberation.toFixed(1)}%
            </span>
          </span>
        </div>
      )}

      {allDone && (
        <div className="border-t border-emerald-500/40 pt-2 text-[10px] text-center text-emerald-400 uppercase tracking-[0.3em] font-display font-black">
          ✓ Galaxy Secured · Super Earth Triumphant
        </div>
      )}
    </HudFrame>
  );
}
