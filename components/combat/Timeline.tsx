"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { Enemy, EnemyIntent as Intent } from "@/lib/types";
import { FactionIcon } from "@/lib/icons";

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

interface ChipProps {
  label: string;
  sublabel: string;
  icon?: string;
  iconColor?: string;
  active?: boolean;
  dimmed?: boolean;
  isPlayer?: boolean;
  isBoss?: boolean;
  faction?: Enemy["faction"];
}

function Chip({
  label,
  sublabel,
  icon,
  iconColor,
  active,
  dimmed,
  isPlayer,
  isBoss,
  faction,
}: ChipProps) {
  return (
    <motion.div
      layout
      animate={
        active
          ? { boxShadow: ["0 0 0 0 rgba(255,211,77,0)", "0 0 16px rgba(255,211,77,0.5)", "0 0 0 0 rgba(255,211,77,0)"] }
          : { boxShadow: "0 0 0 0 rgba(255,211,77,0)" }
      }
      transition={active ? { repeat: Infinity, duration: 1.5 } : { duration: 0.2 }}
      className={clsx(
        "shrink-0 flex items-center gap-tok-2 px-tok-3 py-1.5 border-2 min-w-[140px] max-w-[180px]",
        active
          ? "border-accent-yellow bg-accent-yellow/10"
          : isBoss
            ? "border-accent-red bg-accent-red/5"
            : isPlayer
              ? "border-border-strong bg-bg-secondary/60"
              : "border-border-strong bg-bg-secondary/40",
        dimmed && "opacity-50"
      )}
    >
      {icon && (
        <span
          className={clsx("font-bold leading-none shrink-0", iconColor)}
          style={{ fontSize: "16px" }}
        >
          {icon}
        </span>
      )}
      {faction && !isPlayer && (
        <span className="shrink-0 opacity-70">
          <FactionIcon faction={faction} className="w-3.5 h-3.5" />
        </span>
      )}
      <div className="flex flex-col min-w-0 flex-1 leading-tight">
        <span
          className={clsx(
            "text-[9px] uppercase tracking-[0.2em] truncate font-mono",
            isPlayer ? "text-accent-yellow" : "text-text-dim"
          )}
        >
          {label}
        </span>
        <span
          className={clsx(
            "font-display font-bold truncate",
            active ? "text-accent-yellow" : "text-text-secondary"
          )}
          style={{ fontSize: "11px" }}
        >
          {sublabel}
        </span>
      </div>
    </motion.div>
  );
}

function Arrow({ dimmed }: { dimmed?: boolean }) {
  return (
    <span className={clsx("shrink-0 text-text-dim", dimmed && "opacity-40")}>
      ▸
    </span>
  );
}

function intentSublabel(intent: Intent | undefined, fogged: boolean): string {
  if (!intent) return "—";
  if (fogged) return "???";
  return intent.text;
}

interface Props {
  /** How many turns ahead to project per enemy (default 1). */
  lookahead?: number;
}

/**
 * Tactical Timeline — multi-turn visibility.
 *
 * Shows current player turn → each alive enemy's next action → player's
 * upcoming turn. Each chip displays unit name + their next intent.
 * Active actor pulses yellow.
 */
export default function Timeline({ lookahead = 1 }: Props) {
  const { combat, modifiers } = useGame();
  const fogged = modifiers.includes("heavy_fog");
  const aliveEnemies = combat.enemies.filter((e) => e.hp > 0);

  return (
    <div className="border-b border-border-subtle bg-bg-tertiary/85 backdrop-blur-md">
      <div
        className="flex items-center gap-tok-2 px-tok-4 py-tok-2 overflow-x-auto"
        style={{ minHeight: "60px" }}
      >
        <div className="shrink-0 text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono pr-tok-2 border-r border-border-subtle">
          TIMELINE
        </div>

        {/* NOW: Player turn */}
        <Chip
          label={`TURN ${combat.turn}`}
          sublabel="YOUR ACTION"
          icon="◆"
          iconColor="text-accent-yellow"
          active
          isPlayer
        />

        <Arrow />

        {/* This turn — all alive enemies will act after End Turn */}
        {aliveEnemies.map((e, i) => {
          const intent = e.intents[e.intentIndex % e.intents.length];
          return (
            <div key={`now-${e.id}`} className="flex items-center gap-tok-2">
              <Chip
                label={e.name}
                sublabel={intentSublabel(intent, fogged)}
                icon={fogged ? "?" : (KIND_ICON[intent.kind] ?? "·")}
                iconColor={fogged ? "text-text-dim" : KIND_COLOR[intent.kind] ?? "text-text-secondary"}
                isBoss={e.isBoss}
                faction={e.faction}
              />
              {i < aliveEnemies.length - 1 && <Arrow />}
            </div>
          );
        })}

        {/* Separator to next round */}
        <div className="shrink-0 px-tok-2 text-[9px] tracking-[0.3em] text-text-dim font-mono uppercase">
          ‖ NEXT
        </div>

        {/* NEXT TURN: Player's upcoming action */}
        <Chip
          label={`TURN ${combat.turn + 1}`}
          sublabel="DRAW + R RESET"
          icon="◇"
          iconColor="text-text-dim"
          dimmed
          isPlayer
        />

        {/* NEXT+1 enemy projections (lookahead) */}
        {lookahead >= 1 && aliveEnemies.length > 0 && (
          <>
            <Arrow dimmed />
            {aliveEnemies.slice(0, 3).map((e, i) => {
              const nextIntent = e.intents[(e.intentIndex + 1) % e.intents.length];
              return (
                <div key={`next-${e.id}`} className="flex items-center gap-tok-2">
                  <Chip
                    label={e.name}
                    sublabel={intentSublabel(nextIntent, fogged)}
                    icon={fogged ? "?" : (KIND_ICON[nextIntent.kind] ?? "·")}
                    iconColor={fogged ? "text-text-dim" : KIND_COLOR[nextIntent.kind] ?? "text-text-secondary"}
                    isBoss={e.isBoss}
                    faction={e.faction}
                    dimmed
                  />
                  {i < Math.min(2, aliveEnemies.length - 1) && <Arrow dimmed />}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
