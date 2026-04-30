"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { getModifier } from "@/lib/modifiers";
import { sfx } from "@/lib/sfx";

type Tab = "player" | "enemy" | "global" | "objectives";

export default function RightPanel() {
  const { player, combat, modifiers, objectives, runBuffs } = useGame();
  const [tab, setTab] = useState<Tab>("player");
  const focusedEnemy =
    combat.selectedCardIndex !== null
      ? combat.enemies.find((e) => e.hp > 0)
      : combat.enemies.find((e) => e.hp > 0);

  const tabs: { id: Tab; label: string }[] = [
    { id: "player", label: "PLAYER" },
    { id: "enemy", label: "ENEMY" },
    { id: "global", label: "GLOBAL" },
    { id: "objectives", label: "OBJ" },
  ];

  return (
    <div className="border border-border-subtle bg-bg-secondary/70 backdrop-blur-sm flex flex-col">
      <div className="flex border-b border-border-subtle">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              sfx.click();
              setTab(t.id);
            }}
            className={clsx(
              "flex-1 px-tok-2 py-tok-2 text-[10px] tracking-[0.25em] font-display font-bold transition-colors",
              tab === t.id
                ? "bg-accent-yellow/15 text-accent-yellow border-b-2 border-accent-yellow"
                : "text-text-dim hover:text-accent-yellow border-b-2 border-transparent"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-tok-3 text-[11px] font-mono">
        {tab === "player" && (
          <div className="space-y-tok-3">
            <Stat label="HP" value={`${player.hp} / ${player.maxHp}`} bar={(player.hp / player.maxHp) * 100} barColor="bg-accent-green" />
            {player.block > 0 && (
              <Stat label="BLOCK" value={`${player.block}`} barColor="bg-accent-cyan" />
            )}
            <Stat label="REQUISITION" value={`${player.requisition} / ${player.maxRequisition}`} bar={(player.requisition / player.maxRequisition) * 100} barColor="bg-accent-yellow" />
            <Stat label="REINFORCEMENTS" value={`${player.reinforcements}`} />
            <Stat label="TURN" value={`${combat.turn}`} />

            {runBuffs.length > 0 && (
              <div className="pt-tok-2 border-t border-border-subtle">
                <div className="text-[9px] uppercase tracking-widest text-text-dim mb-2">
                  Active Buffs
                </div>
                <div className="space-y-1.5">
                  {runBuffs.map((b) => (
                    <div
                      key={b.id}
                      className={clsx(
                        "border-l-2 pl-tok-2 py-1",
                        b.lifetime === "next_combat"
                          ? "border-accent-cyan"
                          : "border-accent-yellow"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={clsx(
                          "text-[11px] font-bold",
                          b.lifetime === "next_combat" ? "text-accent-cyan" : "text-accent-yellow"
                        )}>
                          {b.name}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-text-dim">
                          {b.lifetime === "next_combat" ? "1 fight" : "run"}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-secondary leading-snug">
                        {b.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "enemy" && (
          <div className="space-y-tok-3">
            {focusedEnemy ? (
              <>
                <div className="text-accent-yellow font-display font-black text-sm tracking-wider">
                  {focusedEnemy.name.toUpperCase()}
                </div>
                <Stat
                  label="HP"
                  value={`${focusedEnemy.hp} / ${focusedEnemy.maxHp}`}
                  bar={(focusedEnemy.hp / focusedEnemy.maxHp) * 100}
                  barColor={focusedEnemy.isBoss ? "bg-accent-red" : "bg-accent-green"}
                />
                {focusedEnemy.shield > 0 && (
                  <Stat label="SHIELD" value={`${focusedEnemy.shield}`} barColor="bg-accent-cyan" />
                )}
                {focusedEnemy.armor > 0 && (
                  <Stat label="ARMOR" value={`${focusedEnemy.armor}`} />
                )}
                {focusedEnemy.burn > 0 && (
                  <Stat label="BURN" value={`${focusedEnemy.burn}`} barColor="bg-accent-red" />
                )}
                <div className="pt-tok-2 border-t border-border-subtle">
                  <div className="text-[9px] uppercase tracking-widest text-text-dim mb-1">Next Action</div>
                  <div className="text-text-primary">
                    {focusedEnemy.intents[focusedEnemy.intentIndex % focusedEnemy.intents.length]?.text ?? "—"}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-text-dim italic">No hostiles in view.</div>
            )}
          </div>
        )}

        {tab === "objectives" && (
          <div className="space-y-tok-3">
            {objectives.length === 0 ? (
              <div className="text-text-dim italic">No mission objectives.</div>
            ) : (
              objectives.map((o) => {
                const pct = o.target > 0 ? Math.min(100, Math.round((o.progress / o.target) * 100)) : (o.completed ? 100 : 0);
                return (
                  <div
                    key={o.id}
                    className={clsx(
                      "border-l-2 pl-tok-2 py-1",
                      o.completed ? "border-accent-green" : "border-accent-yellow"
                    )}
                  >
                    <div className={clsx("text-[11px] font-bold", o.completed ? "text-accent-green" : "text-accent-yellow")}>
                      {o.completed ? "✓ " : ""}{o.description}
                    </div>
                    <div className="flex items-center gap-tok-2 mt-1">
                      <div className="flex-1 h-1 bg-black border border-border-strong overflow-hidden">
                        <div
                          className={clsx("h-full transition-all", o.completed ? "bg-accent-green" : "bg-accent-yellow")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-text-dim">
                        {o.progress}/{o.target || 1}
                      </span>
                    </div>
                    <div className="text-[9px] text-text-dim uppercase tracking-widest mt-1">
                      Bonus +{o.rewardMedals} medals
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "global" && (
          <div className="space-y-tok-3">
            <div className="text-[9px] uppercase tracking-widest text-text-dim">Sector Modifiers</div>
            {modifiers.length === 0 ? (
              <div className="text-text-dim italic">No active modifiers.</div>
            ) : (
              modifiers.map((id) => {
                const m = getModifier(id);
                if (!m) return null;
                return (
                  <div key={id} className="border-l-2 border-accent-red pl-tok-2 py-1">
                    <div className="text-accent-red font-bold text-[11px]">⚠ {m.name}</div>
                    <div className="text-text-secondary text-[10px] leading-snug">
                      {m.description}
                    </div>
                  </div>
                );
              })
            )}
            {combat.sentries.length > 0 && (
              <>
                <div className="text-[9px] uppercase tracking-widest text-text-dim pt-tok-2 border-t border-border-subtle">
                  Active Stratagems
                </div>
                {combat.sentries.map((s) => (
                  <div key={s.id} className="text-accent-green text-[11px]">
                    {s.name} <span className="text-text-dim">({s.turnsLeft}T)</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  bar,
  barColor,
}: {
  label: string;
  value: string;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-text-dim">{label}</span>
        <span className="text-accent-yellow font-display font-bold tabular-nums">{value}</span>
      </div>
      {bar !== undefined && barColor && (
        <div className="h-1.5 bg-black border border-border-strong overflow-hidden">
          <motion.div
            className={`h-full ${barColor}`}
            animate={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
            transition={{ type: "tween", duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
      )}
    </div>
  );
}
