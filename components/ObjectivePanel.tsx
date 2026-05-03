"use client";

import clsx from "clsx";
import { useGame } from "@/lib/store";
import HudFrame from "./HudFrame";

export default function ObjectivePanel({ bare = false }: { bare?: boolean } = {}) {
  const objectives = useGame((s) => s.objectives);

  if (!objectives || objectives.length === 0) return null;

  // BARE mode — chromeless rows with just a colored left rail, the
  // description, a tiny progress bar, and the medal reward inline.
  // Half the height of the framed variant so 2-3 objectives fit
  // comfortably inside the redesigned MapView right panel.
  if (bare) {
    return (
      <div className="space-y-1.5">
        {objectives.map((o) => {
          const pct = o.target > 0 ? Math.min(100, Math.round((o.progress / o.target) * 100)) : (o.completed ? 100 : 0);
          const accent = o.completed ? "#10b981" : "#FFC72C";
          return (
            <div
              key={o.id}
              className="pl-2 py-0.5"
              style={{ borderLeft: `2px solid ${accent}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10.5px] leading-snug text-gray-200 flex-1 line-clamp-2">
                  {o.description}
                </span>
                <span
                  className="text-[10px] font-display font-black tabular-nums shrink-0"
                  style={{ color: accent }}
                >
                  {o.completed ? "✓" : `${o.progress}/${o.target || 1}`}
                </span>
              </div>
              {/* slim progress bar */}
              <div className="mt-1 h-0.5 bg-white/10 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: accent }}
                />
              </div>
              <div className="mt-0.5 text-[8.5px] uppercase tracking-[0.28em] text-helldiver-dim">
                Bonus <span style={{ color: accent }}>+{o.rewardMedals}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // FRAMED mode (legacy) — kept identical to the original for any
  // surface that still uses the standalone panel.
  return (
    <HudFrame label="Mission Objectives" accent="yellow" className="p-3">
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
    </HudFrame>
  );
}
