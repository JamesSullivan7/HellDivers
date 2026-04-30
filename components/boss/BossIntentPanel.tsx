"use client";

import clsx from "clsx";
import { useGame } from "@/lib/store";
import { Enemy, EnemyIntent as Intent } from "@/lib/types";

const KIND_ICON: Record<string, string> = {
  attack: "⚡",
  attack_all: "⚡",
  buff: "↑",
  armor: "⛨",
  wait: "⏳",
};

const KIND_COLOR: Record<string, string> = {
  attack: "text-accent-red",
  attack_all: "text-accent-red",
  buff: "text-accent-cyan",
  armor: "text-accent-cyan",
  wait: "text-accent-yellow",
};

interface Props {
  enemy: Enemy;
}

/**
 * Multi-turn pattern panel — shows the next 3 intents in sequence.
 * In enraged state, shows the enraged pattern with a red header.
 */
export default function BossIntentPanel({ enemy }: Props) {
  const modifiers = useGame((s) => s.modifiers);
  const fogged = modifiers.includes("heavy_fog");

  // Project up to 3 turns ahead from current intent index
  const upcoming: { turn: number; intent: Intent }[] = [];
  for (let i = 0; i < 3; i++) {
    upcoming.push({
      turn: i + 1,
      intent: enemy.intents[(enemy.intentIndex + i) % enemy.intents.length],
    });
  }

  return (
    <div className="p-tok-3 flex flex-col">
      <div
        className={clsx(
          "text-[9px] uppercase tracking-[0.3em] font-mono mb-tok-2 flex items-center justify-between",
          enemy.enraged ? "text-accent-red" : "text-text-dim"
        )}
      >
        <span>{enemy.enraged ? "⚡ ENRAGED PATTERN" : "BEHAVIORAL PATTERN"}</span>
        <span className="text-text-dim">NEXT 3 TURNS</span>
      </div>

      <div className="space-y-tok-2">
        {upcoming.map(({ turn, intent }, i) => {
          const isNow = i === 0;
          return (
            <div
              key={turn}
              className={clsx(
                "flex items-center gap-tok-2 px-tok-2 py-1 border",
                isNow
                  ? "border-accent-yellow bg-accent-yellow/5"
                  : "border-border-subtle opacity-60"
              )}
            >
              <span className={clsx("text-[9px] font-mono uppercase tracking-widest shrink-0", isNow ? "text-accent-yellow" : "text-text-dim")}>
                T{turn}
              </span>
              <span
                className={clsx("font-bold text-base shrink-0", fogged ? "text-text-dim" : KIND_COLOR[intent.kind] ?? "text-text-secondary")}
              >
                {fogged ? "?" : KIND_ICON[intent.kind] ?? "·"}
              </span>
              <span
                className={clsx(
                  "font-mono truncate flex-1",
                  isNow ? "text-text-primary" : "text-text-secondary"
                )}
                style={{ fontSize: "12px" }}
              >
                {fogged ? "??? — Heavy Fog" : intent.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
