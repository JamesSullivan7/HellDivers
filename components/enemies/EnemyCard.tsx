"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Enemy, Faction } from "@/lib/types";
import { useGame } from "@/lib/store";
import EnemyHeader from "./EnemyHeader";
import EnemyImage from "./EnemyImage";
import EnemyStats from "./EnemyStats";
import EnemyIntentPanel from "@/components/intent/EnemyIntentPanel";
import EnemyStatusRow from "./EnemyStatusRow";
import EnemyFooter from "./EnemyFooter";
import { SkullIcon } from "@/lib/icons";
import { enemyIdleDrift, enemyDeath } from "@/systems/animation/presets/combatAnimations";
import BurnEmbers from "../effects/BurnEmbers";
import ShieldRipple from "../effects/ShieldRipple";

const FACTION_BORDER_TOP: Record<Faction, string> = {
  terminid: "border-faction-terminid",
  automaton: "border-faction-automaton",
  illuminate: "border-faction-illuminate",
};

interface FloatingNumber {
  id: number;
  amount: number;
  burn?: boolean;
}

interface Props {
  enemy: Enemy;
  targetable: boolean;
  needsTarget: boolean;
  onClick: () => void;
}

export default function EnemyCard({ enemy, targetable, needsTarget, onClick }: Props) {
  const modifiers = useGame((s) => s.modifiers);
  const fogged = modifiers.includes("heavy_fog");
  const dead = enemy.hp <= 0;

  const lastHpRef = useRef(enemy.hp);
  const lastBurnRef = useRef(enemy.burn);
  const [floats, setFloats] = useState<FloatingNumber[]>([]);
  const idRef = useRef(0);
  const [shake, setShake] = useState(0);
  const [deathTriggered, setDeathTriggered] = useState(false);

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

  // Death sequence trigger — plays the spec'd flash → desaturate → collapse → fade
  useEffect(() => {
    if (dead && !deathTriggered) setDeathTriggered(true);
  }, [dead, deathTriggered]);

  // Compose animation state: shake on hit, idle drift when alive, death sequence on death
  const motionAnimate: any = dead
    ? "dying"
    : shake > 0
      ? { x: [0, -4, 4, -2, 2, 0], transition: { duration: 0.18 } }
      : "idle";

  const motionVariants: any = { ...enemyIdleDrift, ...enemyDeath };

  return (
    <motion.button
      disabled={dead || !targetable}
      onClick={onClick}
      variants={motionVariants}
      initial="alive"
      animate={motionAnimate}
      whileHover={targetable && !dead ? { y: -3 } : {}}
      className={clsx(
        "relative bg-bg-secondary text-left overflow-hidden border-2 border-t-0 flex flex-col",
        "transition-all duration-200",
        // Faction-color top border (per spec)
        "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:content-['']",
        enemy.faction === "terminid" && "before:bg-faction-terminid",
        enemy.faction === "automaton" && "before:bg-faction-automaton",
        enemy.faction === "illuminate" && "before:bg-faction-illuminate",
        enemy.isBoss
          ? "border-accent-red shadow-glow-red"
          : "border-border-strong hover:border-accent-yellow/60",
        needsTarget && targetable && !dead && "ring-2 ring-accent-yellow shadow-glow-yellow cursor-crosshair",
        !needsTarget && "cursor-default",
        dead && "opacity-30 grayscale pointer-events-none",
        enemy.enraged && "scale-[1.03] animate-pulse-yellow"
      )}
      style={{
        width: "260px",
        height: "300px",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <EnemyHeader name={enemy.name} faction={enemy.faction} />

      {/* Image (~70%) + Stats column (~30%) split */}
      <div className="grid grid-cols-[70%_30%] flex-1 min-h-0 border-y border-border-subtle">
        <EnemyImage faction={enemy.faction} templateId={enemy.templateId} name={enemy.name} />
        <EnemyStats hp={enemy.hp} maxHp={enemy.maxHp} shield={enemy.shield} armor={enemy.armor} />
      </div>

      <EnemyIntentPanel enemy={enemy} fogged={fogged} />
      <EnemyStatusRow burn={enemy.burn} />
      <EnemyFooter
        templateId={enemy.templateId}
        faction={enemy.faction}
        maxHp={enemy.maxHp}
        isBoss={enemy.isBoss}
      />

      {/* Status particle effects */}
      {!dead && enemy.burn > 0 && <BurnEmbers seed={enemy.id} />}
      {!dead && enemy.shield > 0 && <ShieldRipple />}

      {dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-overlay pointer-events-none">
          <SkullIcon className="w-12 h-12 text-accent-red" />
        </div>
      )}

      {/* Floating damage numbers */}
      <div className="pointer-events-none absolute inset-0 overflow-visible z-overlay">
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div
              key={f.id}
              initial={{ y: 10, opacity: 0, scale: 0.5 }}
              animate={{ y: -50, opacity: 1, scale: 1.4 }}
              exit={{ opacity: 0, y: -70 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className={clsx(
                "absolute left-1/2 top-1/2 -translate-x-1/2 font-display font-black tabular-nums drop-shadow-[0_0_8px_currentColor]",
                f.burn ? "text-accent-red" : "text-accent-yellow"
              )}
              style={{ fontSize: "24px" }}
            >
              -{f.amount}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
