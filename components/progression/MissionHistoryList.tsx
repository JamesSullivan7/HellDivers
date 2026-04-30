"use client";

/**
 * MissionHistoryList — render the last 20 missions with optional faction
 * filter and a result-badge legend. Reads from useProgression().profile
 * which derives the engine's RunRecord[] into MissionRecord[].
 */

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useProgression } from "@/hooks/useProgression";
import type { MissionRecord } from "@/systems/progression/progressionTypes";
import { MissionRecordCard } from "./cards";

const FACTIONS: Array<MissionRecord["faction"] | "all"> = ["all", "terminid", "automaton", "illuminate"];

interface Props {
  /** When provided, prepended to engine history (rich missions). */
  rich?: MissionRecord[];
  className?: string;
}

export default function MissionHistoryList({ rich, className }: Props) {
  const { profile, richMissionHistory } = useProgression();
  const [factionFilter, setFactionFilter] = useState<(typeof FACTIONS)[number]>("all");
  const [resultFilter, setResultFilter] = useState<"all" | "victory" | "defeat">("all");

  const merged = useMemo(() => {
    const richList = rich ?? richMissionHistory;
    // Combine, deduplicate by id (rich first, then derived from engine).
    const seen = new Set<string>();
    const out: MissionRecord[] = [];
    for (const r of [...richList, ...profile.missionHistory]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
      if (out.length >= 20) break;
    }
    return out;
  }, [rich, richMissionHistory, profile.missionHistory]);

  const filtered = merged.filter((r) => {
    if (factionFilter !== "all" && r.faction !== factionFilter) return false;
    if (resultFilter !== "all" && r.result !== resultFilter) return false;
    return true;
  });

  return (
    <div className={clsx("flex flex-col gap-3 font-mono", className)}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] uppercase tracking-widest text-text-dim">FACTION</span>
        {FACTIONS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFactionFilter(f)}
            className={clsx(
              "text-[9px] uppercase tracking-widest px-2 py-0.5 border",
              factionFilter === f
                ? "border-accent-yellow text-accent-yellow"
                : "border-border-subtle text-text-dim hover:border-accent-yellow/40",
            )}
            style={{ borderRadius: 1 }}
          >
            {f}
          </button>
        ))}

        <span className="text-[9px] uppercase tracking-widest text-text-dim ml-3">RESULT</span>
        {["all", "victory", "defeat"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setResultFilter(r as typeof resultFilter)}
            className={clsx(
              "text-[9px] uppercase tracking-widest px-2 py-0.5 border",
              resultFilter === r
                ? "border-accent-yellow text-accent-yellow"
                : "border-border-subtle text-text-dim hover:border-accent-yellow/40",
            )}
            style={{ borderRadius: 1 }}
          >
            {r}
          </button>
        ))}

        <span className="ml-auto text-[9px] uppercase tracking-widest text-text-dim">
          {filtered.length} / {merged.length}
        </span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div
            className="text-[10px] uppercase tracking-widest text-text-dim border border-dashed py-6 text-center"
            style={{ borderColor: "var(--color-border-subtle, #1f2937)" }}
          >
            NO MISSIONS RECORDED
          </div>
        ) : (
          filtered.map((r) => <MissionRecordCard key={r.id} record={r} />)
        )}
      </div>
    </div>
  );
}
