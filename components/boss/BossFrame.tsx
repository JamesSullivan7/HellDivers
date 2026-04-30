"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Enemy } from "@/lib/types";
import { SkullIcon } from "@/lib/icons";
import BossHero from "./BossHero";
import BossHPPanel from "./BossHPPanel";
import BossIntentPanel from "./BossIntentPanel";
import EnrageBar from "./EnrageBar";
import BurnEmbers from "../effects/BurnEmbers";
import ShieldRipple from "../effects/ShieldRipple";

interface FloatingNumber {
  id: number;
  amount: number;
  burn?: boolean;
}

const PER_BOSS_BORDER: Record<string, string> = {
  bile_titan: "border-faction-terminid",
  factory_strider: "border-faction-automaton",
  monolith: "border-faction-illuminate",
};

const PER_BOSS_GLOW: Record<string, string> = {
  bile_titan: "shadow-glow-green",
  factory_strider: "shadow-glow-red",
  monolith: "shadow-glow-purple",
};

interface Props {
  enemy: Enemy;
  targetable: boolean;
  needsTarget: boolean;
  onClick: () => void;
}

/**
 * Boss Frame — full-width cinematic encounter UI.
 * Replaces the card-style EnemyCard for any enemy with isBoss=true.
 *
 * Layout (per Batch 5):
 *   ┌─────────────────────────────────────┐
 *   │ NAME · PHASE · ENRAGE BAR           │ 56px
 *   ├─────────────────────────────────────┤
 *   │     BOSS VISUAL (HERO)              │ 220px
 *   ├──────────────┬──────────────────────┤
 *   │ HP / SHIELD  │ INTENT + PATTERN     │
 *   ├──────────────┴──────────────────────┤
 *   │ STATUS EFFECTS + GLOBAL EFFECTS     │ 40px
 *   └─────────────────────────────────────┘
 */
export default function BossFrame({ enemy, targetable, needsTarget, onClick }: Props) {
  const dead = enemy.hp <= 0;
  const lastHpRef = useRef(enemy.hp);
  const lastBurnRef = useRef(enemy.burn);
  const [floats, setFloats] = useState<FloatingNumber[]>([]);
  const idRef = useRef(0);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (enemy.hp < lastHpRef.current) {
      const dmg = lastHpRef.current - enemy.hp;
      const isBurn = lastBurnRef.current > 0 && dmg === lastBurnRef.current;
      const id = ++idRef.current;
      setFloats((p) => [...p, { id, amount: dmg, burn: isBurn }]);
      setShake((n) => n + 1);
      const t = setTimeout(() => setFloats((p) => p.filter((f) => f.id !== id)), 900);
      return () => clearTimeout(t);
    }
    lastHpRef.current = enemy.hp;
    lastBurnRef.current = enemy.burn;
  }, [enemy.hp, enemy.burn]);

  return (
    <motion.div
      animate={shake > 0 ? { x: [0, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.22 }}
      className={clsx(
        "relative w-full bg-bg-secondary border-2 overflow-hidden",
        PER_BOSS_BORDER[enemy.templateId] ?? "border-accent-red",
        PER_BOSS_GLOW[enemy.templateId] ?? "shadow-glow-red",
        dead && "opacity-30 grayscale pointer-events-none",
        enemy.enraged && "animate-pulse-yellow"
      )}
      style={{ borderRadius: "var(--radius-md)" }}
    >
      {/* corner brackets */}
      <span className={clsx("absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 z-base", PER_BOSS_BORDER[enemy.templateId] ?? "border-accent-red")} />
      <span className={clsx("absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 z-base", PER_BOSS_BORDER[enemy.templateId] ?? "border-accent-red")} />
      <span className={clsx("absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 z-base", PER_BOSS_BORDER[enemy.templateId] ?? "border-accent-red")} />
      <span className={clsx("absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 z-base", PER_BOSS_BORDER[enemy.templateId] ?? "border-accent-red")} />

      {/* HEADER — name + phase + enrage bar */}
      <div
        className="flex items-center justify-between px-tok-4 border-b border-border-subtle bg-bg-tertiary/85 backdrop-blur-md"
        style={{ height: "56px" }}
      >
        <div className="flex items-center gap-tok-3 min-w-0">
          <button
            onClick={onClick}
            disabled={!targetable || dead}
            className={clsx(
              "font-display font-black tracking-[0.15em] truncate transition-colors",
              targetable && !dead
                ? "text-accent-yellow hover:text-text-primary cursor-crosshair"
                : "text-accent-red"
            )}
            style={{ fontSize: "20px" }}
          >
            {enemy.name.toUpperCase()}
          </button>
          <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono shrink-0">
            {enemy.enraged ? "PHASE 2" : "PHASE 1"}
          </span>
        </div>
        <EnrageBar hp={enemy.hp} maxHp={enemy.maxHp} enraged={!!enemy.enraged} />
      </div>

      {/* HERO IMAGE */}
      <div onClick={targetable && !dead ? onClick : undefined} className={clsx(targetable && !dead && "cursor-crosshair")}>
        <BossHero templateId={enemy.templateId} faction={enemy.faction} enraged={!!enemy.enraged} />
      </div>

      {/* HP / INTENT split */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] border-y border-border-subtle">
        <BossHPPanel hp={enemy.hp} maxHp={enemy.maxHp} shield={enemy.shield} armor={enemy.armor} />
        <BossIntentPanel enemy={enemy} />
      </div>

      {/* STATUS / GLOBAL EFFECTS row */}
      <div
        className="flex items-center justify-between px-tok-4 bg-bg-tertiary/40"
        style={{ height: "40px" }}
      >
        <div className="flex items-center gap-tok-3 text-[10px] font-mono uppercase tracking-widest">
          {enemy.burn > 0 && (
            <span className="text-accent-red flex items-center gap-1">
              🔥 BURN <span className="font-bold tabular-nums">{enemy.burn}</span>
            </span>
          )}
        </div>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-text-dim">
          {needsTarget && targetable && !dead ? (
            <span className="text-accent-yellow animate-blink font-bold">▶ SELECT TARGET</span>
          ) : (
            "PRIMARY OBJECTIVE"
          )}
        </div>
      </div>

      {/* Status particle effects */}
      {!dead && enemy.burn > 0 && <BurnEmbers seed={enemy.id} count={10} />}
      {!dead && enemy.shield > 0 && <ShieldRipple />}

      {dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-overlay pointer-events-none">
          <SkullIcon className="w-20 h-20 text-accent-red" />
        </div>
      )}

      {/* Floating damage numbers */}
      <div className="pointer-events-none absolute inset-0 overflow-visible z-overlay">
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div
              key={f.id}
              initial={{ y: 10, opacity: 0, scale: 0.5 }}
              animate={{ y: -80, opacity: 1, scale: 1.6 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className={clsx(
                "absolute left-1/2 top-1/2 -translate-x-1/2 font-display font-black tabular-nums drop-shadow-[0_0_10px_currentColor]",
                f.burn ? "text-accent-red" : "text-accent-yellow"
              )}
              style={{ fontSize: "32px" }}
            >
              -{f.amount}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
