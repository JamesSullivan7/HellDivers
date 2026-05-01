"use client";

/**
 * ACTIVITY · Galactic Feed
 * ──────────────────────────────────────────────────────────────────────
 * Full activity feed for the war and the player. Combines:
 *   - galactic war ticker (planets liberated, defenses, stratagem deploys)
 *   - player history (extractions, deaths)
 *   - unlocks (warbond items, modules)
 *   - level-up notifications
 */

import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import { generateActivity, listPlanets, loadWarState } from "@/lib/galacticWar";
import HubFrame, { HubCard, HUB_TOKENS as C } from "./hub/HubFrame";

interface FeedEntry {
  id: string;
  glyph: string;
  accent: string;
  who: string;
  what: string;
  ago: string;
  category: "war" | "you" | "system";
}

export default function ActivityScreen() {
  const { account } = useGame();
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "war" | "you" | "system">("all");

  useEffect(() => {
    const planets = listPlanets(loadWarState());
    const warEntries: FeedEntry[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `war_${i}`,
      glyph: ["✦", "☠", "◆", "◊"][i % 4],
      accent: i % 3 === 0 ? C.cyan : i % 3 === 1 ? C.yellow : C.orange,
      who: ["Patriot_77", "Eagle-1", "Liberty_44", "Freedom-9", "Star_2218", "Iron-12", "Major_Yates", "Cpt_Voss"][i % 8],
      what: generateActivity(planets),
      ago: `${(i + 1) * 7}m ago`,
      category: "war",
    }));

    const playerEntries: FeedEntry[] = account.history.slice(-6).map((r, i) => ({
      id: `me_${i}`,
      glyph: r.outcome === "victory" ? "✦" : "☠",
      accent: r.outcome === "victory" ? C.green : C.red,
      who: account.helldiverName ?? "You",
      what: r.outcome === "victory"
        ? `Extracted from ${r.planet} (D${r.difficulty ?? 5})`
        : `KIA on ${r.planet} (D${r.difficulty ?? 5})`,
      ago: relativeTime(r.date),
      category: "you",
    }));

    const systemEntries: FeedEntry[] = [
      { id: "sys_1", glyph: "⚜", accent: C.orange, who: "Democracy Officer", what: "New Warbond Available — Cutting Edge", ago: "2h ago", category: "system" },
      { id: "sys_2", glyph: "◆", accent: C.cyan,  who: "Super Earth Command", what: "Major Order issued: Defend the Tanis Sector", ago: "1d ago", category: "system" },
    ];

    setFeed([...playerEntries, ...warEntries, ...systemEntries]);
  }, [account]);

  const filtered = useMemo(() => {
    if (filter === "all") return feed;
    return feed.filter((e) => e.category === filter);
  }, [feed, filter]);

  return (
    <HubFrame
      title="Galactic Activity"
      subtitle="Live Feed · War · Player · System"
      badge={
        <div className="flex items-center gap-2 px-3 py-1.5 border" style={{ borderColor: `${C.green}55`, background: `${C.green}10`, borderRadius: 1 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: C.green }}>
            LIVE
          </span>
        </div>
      }
    >
      <div className="max-w-[1100px] mx-auto">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {(["all", "war", "you", "system"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.3em] font-display font-black border transition-colors"
              style={{
                borderColor: filter === f ? C.yellow : C.rule,
                background: filter === f ? `${C.yellow}15` : "transparent",
                color: filter === f ? C.yellow : C.textMid,
                borderRadius: 1,
              }}
            >
              {f === "all" ? "All Activity" : f === "war" ? "War" : f === "you" ? "Your Record" : "System"}
            </button>
          ))}
          <span className="ml-auto text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
            {filtered.length} entries
          </span>
        </div>

        <HubCard title="Feed" accent={C.yellow}>
          <ul className="flex flex-col">
            {filtered.length === 0 ? (
              <li className="text-[10px] uppercase tracking-[0.3em] py-6 text-center" style={{ color: C.textDim }}>
                NO ACTIVITY RECORDED
              </li>
            ) : (
              filtered.map((e, i) => (
                <li
                  key={e.id}
                  className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.rule}` : undefined }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: `${e.accent}66`,
                      background: `${e.accent}12`,
                      color: e.accent,
                      borderRadius: 1,
                    }}
                  >
                    <span className="font-display font-black" style={{ fontSize: 14, textShadow: `0 0 4px ${e.accent}55` }}>{e.glyph}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[12px] uppercase tracking-wider font-display font-black truncate" style={{ color: e.accent }}>
                        {e.who}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest tabular-nums shrink-0" style={{ color: C.textDim }}>
                        {e.ago}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug mt-0.5" style={{ color: C.textMid }}>
                      {e.what}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </HubCard>
      </div>
    </HubFrame>
  );
}

function relativeTime(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
