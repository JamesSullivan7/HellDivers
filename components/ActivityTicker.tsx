"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateActivity, listPlanets, loadWarState } from "@/lib/galacticWar";

interface FeedItem {
  id: string;
  text: string;
  victory: boolean;
}

/**
 * Solo: this ticker is purely flavor text. No live feed, no other Helldivers.
 * It pulls planet data from the local war state and synthesizes propaganda
 * lines on a slow rolling cadence so the war room feels alive.
 */
export default function ActivityTicker() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    const planets = listPlanets(loadWarState());
    const initial: FeedItem[] = Array.from({ length: 6 }).map((_, i) => {
      const text = generateActivity(planets);
      return {
        id: `${Date.now()}-${i}`,
        text,
        victory: !/KIA|extracted under fire|lost on|depleted/i.test(text),
      };
    });
    setFeed(initial);

    const interval = setInterval(() => {
      const planetsNow = listPlanets(loadWarState());
      const text = generateActivity(planetsNow);
      const item: FeedItem = {
        id: `${Date.now()}-${Math.random()}`,
        text,
        victory: !/KIA|extracted under fire|lost on|depleted/i.test(text),
      };
      setFeed((prev) => [item, ...prev].slice(0, 6));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-helldiver-yellow/30 bg-black/70 backdrop-blur-sm font-mono">
      <div className="px-3 py-1 border-b border-helldiver-yellow/30 text-[10px] uppercase tracking-[0.3em] text-helldiver-yellow flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-blink" />
        Sector Bulletins
      </div>
      <div className="px-3 py-2 max-h-32 overflow-hidden text-[11px] leading-relaxed">
        {feed.length === 0 && (
          <div className="text-helldiver-dim italic">— Awaiting field reports. —</div>
        )}
        <AnimatePresence initial={false}>
          {feed.slice(0, 6).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -4, x: -4 }}
              animate={{ opacity: 1 - i * 0.13, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="text-gray-300 truncate"
            >
              <span className={entry.victory ? "text-emerald-400" : "text-helldiver-red"}>
                {entry.victory ? "▸" : "✕"}
              </span>{" "}
              <span>{entry.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
