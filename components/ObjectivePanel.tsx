"use client";

import clsx from "clsx";
import { useGame } from "@/lib/store";
import HudFrame from "./HudFrame";

export default function ObjectivePanel({ bare = false }: { bare?: boolean } = {}) {
  const objectives = useGame((s) => s.objectives);

  if (!objectives || objectives.length === 0) return null;

  // Inner list — used both inside the framed default and the bare variant.
  const list = (
    <div className="space-y-2">
      {objectives.map((o) => {
          const pct = o.target > 0 ? Math.min(100, Math.round((o.progress / o.target) * 100)) : (o.completed ? 100 : 0);
          return (
            <div
              key={o.id}
              className={clsx(
                "border-2 p-2 transition-colors",
                o.completed
                  ? "border-emerald-500/70 bg-emerald-900/20"
                  : "border-helldiver-steel/50 bg-helldiver-panel/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] leading-tight text-gray-200 flex-1">
                  {o.description}
                </div>
                <div
                  className={clsx(
                    "text-[10px] font-display font-black tabular-nums",
                    o.completed ? "text-emerald-400" : "text-helldiver-yellow"
                  )}
                >
                  {o.completed ? "✓" : `${o.progress}/${o.target || 1}`}
                </div>
              </div>
              {/* progress bar */}
              <div className="mt-1.5 h-1 bg-helldiver-steel/30 overflow-hidden">
                <div
                  className={clsx(
                    "h-full transition-all duration-300",
                    o.completed ? "bg-emerald-500" : "bg-helldiver-yellow"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[9px] uppercase tracking-widest">
                <span className="text-helldiver-dim">Bonus</span>
                <span className={o.completed ? "text-emerald-400" : "text-helldiver-yellow"}>
                  +{o.rewardMedals} Medals
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );

  // Bare = render just the list. Used by parents that supply their own
  // section heading (e.g. the redesigned MapView right panel).
  if (bare) return list;

  return (
    <HudFrame label="Mission Objectives" accent="yellow" className="p-3">
      {list}
    </HudFrame>
  );
}
