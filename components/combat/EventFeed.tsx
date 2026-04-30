"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useGame } from "@/lib/store";

function classify(line: string) {
  if (line.startsWith(">")) return "system" as const;
  if (line.startsWith("  [")) return "sentry" as const;
  // crude heuristic: lines that mention damage to something with "→" or HP loss
  if (line.includes("hits for") || line.includes("attacks for") || line.includes("AoE")) return "enemy" as const;
  return "player" as const;
}

const COLOR: Record<string, string> = {
  system: "text-accent-yellow",
  sentry: "text-accent-green",
  enemy: "text-accent-red",
  player: "text-text-secondary",
  status: "text-accent-cyan",
};

export default function EventFeed() {
  const { combat } = useGame();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [combat.log.length]);

  // Show only the last 6 entries with fade-out for older ones
  const recent = combat.log.slice(-6);

  return (
    <div className="border border-border-subtle bg-bg-secondary/70 backdrop-blur-sm h-full flex flex-col">
      <div className="px-tok-3 py-tok-2 border-b border-border-subtle flex items-center gap-tok-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-blink" />
        <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono">
          Combat Feed
        </span>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-tok-2 font-mono text-[11px] leading-relaxed">
        <AnimatePresence initial={false}>
          {recent.map((line, i) => {
            const kind = classify(line);
            return (
              <motion.div
                key={`${combat.log.length - recent.length + i}-${line.slice(0, 20)}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1 - (recent.length - 1 - i) * 0.1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className={clsx("truncate", COLOR[kind])}
              >
                {line}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
