"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const VICTORY_VERBS = [
  "liberated", "secured", "purged", "scoured", "extracted from", "neutralized",
];

const DEATH_VERBS = [
  "KIA at", "extracted under fire from", "lost on", "depleted reinforcements at",
];

interface FeedItem {
  id: string;
  text: string;
  victory: boolean;
}

function entryFor(c: {
  _id: string;
  _creationTime: number;
  helldiverName: string;
  planetName: string;
  victory: boolean;
  difficulty: number;
}): FeedItem {
  if (c.victory) {
    const verb = VICTORY_VERBS[Math.floor(Math.random() * VICTORY_VERBS.length)];
    return {
      id: c._id,
      victory: true,
      text: `${c.helldiverName} ${verb} ${c.planetName.toUpperCase()} (D${c.difficulty})`,
    };
  } else {
    const verb = DEATH_VERBS[Math.floor(Math.random() * DEATH_VERBS.length)];
    return {
      id: c._id,
      victory: false,
      text: `${c.helldiverName} ${verb} ${c.planetName.toUpperCase()} (D${c.difficulty})`,
    };
  }
}

export default function ActivityTicker() {
  const recent = useQuery(api.war.recentActivity, { limit: 12 });
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (!recent) return;
    setFeed(recent.map(entryFor));
  }, [recent]);

  return (
    <div className="border border-helldiver-yellow/30 bg-black/70 backdrop-blur-sm font-mono">
      <div className="px-3 py-1 border-b border-helldiver-yellow/30 text-[10px] uppercase tracking-[0.3em] text-helldiver-yellow flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-blink" />
        Live Galactic Feed
      </div>
      <div className="px-3 py-2 max-h-32 overflow-hidden text-[11px] leading-relaxed">
        {!recent && (
          <div className="text-helldiver-dim italic">Connecting to feed...</div>
        )}
        {recent && feed.length === 0 && (
          <div className="text-helldiver-dim italic">— No recorded deployments yet. Be the first. —</div>
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
