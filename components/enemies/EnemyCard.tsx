"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Enemy, Faction } from "@/lib/types";
import { useGame } from "@/lib/store";
import EnemyImage from "./EnemyImage";
import EnemyIntentPanel from "@/components/intent/EnemyIntentPanel";
import { SkullIcon } from "@/lib/icons";
import { enemyIdleDrift, enemyDeath } from "@/systems/animation/presets/combatAnimations";
import BurnEmbers from "../effects/BurnEmbers";
import ShieldRipple from "../effects/ShieldRipple";

/**
 * Per-faction accent color used for the card chrome (corner brackets,
 * border, name colour). Mirrors the codex enemy card colour language.
 */
const FACTION_ACCENT: Record<Faction, string> = {
  terminid:   "#ff8a28",
  automaton:  "#ff4d4d",
  illuminate: "#a855f7",
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

  // ──────────────────────────────────────────────────────────────────────
  // NEW LAYOUT — single image area + ONE combined info panel
  //
  //  ┌─────────────────────────────┐
  //  │ ▓ ◣                  ARM 3 ▓│  TOP STRIP — faction chip + armor
  //  ├─────────────────────────────┤
  //  │                             │
  //  │     [FULL ENEMY IMAGE]      │  ART (flex-1, object-contain so
  //  │                             │  the whole creature is visible)
  //  ├─────────────────────────────┤
  //  │ STALKER          21 / 21    │  INFO PANEL (single)
  //  │ ████████████████████████░░░ │  - name + HP numerics
  //  │ ▶ AMBUSH 7 9                │  - HP bar
  //  │ THEN CLOAKING…              │  - intent line(s)
  //  └─────────────────────────────┘
  //
  // Matches the visual language of the stratagem / weapon / booster
  // cards (corner brackets, image-on-top + info-below, no nested
  // boxes). Combines the previous Header / Stats / Intent / Status /
  // Footer bands into one info panel + one image.
  // ──────────────────────────────────────────────────────────────────────

  const accent = FACTION_ACCENT[enemy.faction];
  const hpPct = Math.max(0, Math.min(100, (enemy.hp / Math.max(1, enemy.maxHp)) * 100));
  const lowHp = hpPct < 30;

  return (
    <motion.button
      disabled={dead || !targetable}
      onClick={onClick}
      variants={motionVariants}
      initial="alive"
      animate={motionAnimate}
      whileHover={targetable && !dead ? { y: -3 } : {}}
      className={clsx(
        "relative text-left overflow-hidden flex flex-col",
        "transition-all duration-200",
        needsTarget && targetable && !dead && "ring-2 ring-accent-yellow shadow-glow-yellow cursor-crosshair",
        !needsTarget && "cursor-default",
        dead && "opacity-30 grayscale pointer-events-none",
        enemy.enraged && "scale-[1.03] animate-pulse-yellow",
      )}
      style={{
        // flex 1 1 0 = each enemy claims an equal share of the
        // (now full-height) right column. Cap removed — with the hand
        // overlay no longer eating column space, enemies can grow to
        // fully fill their slot, which makes the image read as
        // "filling the card" the way the user asked.
        width: "100%",
        maxWidth: "240px",
        flex: "1 1 0",
        minHeight: 180,
        margin: "0 auto",
        background: "linear-gradient(180deg, rgba(14,18,24,0.92) 0%, rgba(7,11,16,0.92) 100%)",
        border: `1px solid ${enemy.isBoss ? "#ff4d4d" : "rgba(255,255,255,0.08)"}`,
        boxShadow: enemy.isBoss
          ? "0 0 18px rgba(255,77,77,0.35), inset 0 0 0 1px rgba(255,77,77,0.55)"
          : `0 0 0 1px ${accent}22`,
      }}
    >
      {/* Corner brackets — same visual language as StratagemCard */}
      <span aria-hidden className="absolute top-0 left-0 w-1.5 h-1.5 z-10 pointer-events-none" style={{ borderTop: `1px solid ${accent}`, borderLeft: `1px solid ${accent}` }} />
      <span aria-hidden className="absolute top-0 right-0 w-1.5 h-1.5 z-10 pointer-events-none" style={{ borderTop: `1px solid ${accent}`, borderRight: `1px solid ${accent}` }} />
      <span aria-hidden className="absolute bottom-0 left-0 w-1.5 h-1.5 z-10 pointer-events-none" style={{ borderBottom: `1px solid ${accent}`, borderLeft: `1px solid ${accent}` }} />
      <span aria-hidden className="absolute bottom-0 right-0 w-1.5 h-1.5 z-10 pointer-events-none" style={{ borderBottom: `1px solid ${accent}`, borderRight: `1px solid ${accent}` }} />

      {/* TOP STRIP — minimal: faction chip on left, armor / shield on right */}
      <div className="relative flex items-center justify-between px-2 h-5 shrink-0 z-10" style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <span
          className="text-[8px] font-display font-black uppercase tracking-[0.32em]"
          style={{ color: accent }}
        >
          {enemy.faction}
        </span>
        <div className="flex items-center gap-1">
          {enemy.armor > 0 && (
            <span className="text-[7.5px] tabular-nums font-display font-black px-1 leading-none py-0.5" style={{ border: "1px solid rgba(255,138,40,0.55)", color: "#ff8a28" }}>
              ARM {enemy.armor}
            </span>
          )}
          {enemy.shield > 0 && (
            <span className="text-[7.5px] tabular-nums font-display font-black px-1 leading-none py-0.5" style={{ border: "1px solid rgba(96,196,255,0.55)", color: "#60c4ff" }}>
              SHD {enemy.shield}
            </span>
          )}
          {enemy.isBoss && (
            <span className="text-[7.5px] font-display font-black px-1 leading-none py-0.5" style={{ background: "#ff4d4d", color: "#0a0d12" }}>
              BOSS
            </span>
          )}
        </div>
      </div>

      {/* ART — flex-1 with object-contain so the entire enemy is visible.
          EnemyImage already handles fallback silhouette + name overlay
          when the source art is missing. Soft dark gradient at the bottom
          blends into the info panel below. */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* fit="cover" so the creature image fills the card area
            edge-to-edge with no letterboxing. The user's last brief was
            "image fills the card" - cover trades a small crop for a
            full visual presence, which is what they asked for. */}
        <EnemyImage faction={enemy.faction} templateId={enemy.templateId} fit="cover" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(7,11,16,0.95) 0%, transparent 100%)" }}
        />
      </div>

      {/* COMBINED INFO PANEL — name, HP bar, intent. One block, no rules.
          This is the merged "top + bottom" sections the user asked for. */}
      <div
        className="relative px-2 pt-1 pb-1.5 shrink-0 z-10"
        style={{ background: "rgba(7,11,16,0.85)" }}
      >
        {/* Name + HP numerics on one row */}
        <div className="flex items-center justify-between gap-1.5">
          <span
            className="font-display font-black uppercase tracking-tight truncate flex-1 leading-none"
            style={{ color: accent, fontSize: 11 }}
          >
            {enemy.name}
          </span>
          <span
            className="tabular-nums text-[10px] font-display font-black leading-none shrink-0"
            style={{ color: lowHp ? "#ff4d4d" : "#10b981" }}
          >
            {enemy.hp}<span className="text-helldiver-dim">/{enemy.maxHp}</span>
          </span>
        </div>

        {/* HP bar — slim, animated */}
        <div className="mt-1 h-1 bg-black/70 border border-white/10 overflow-hidden">
          <motion.div
            className="h-full"
            style={{
              background: lowHp ? "linear-gradient(90deg, #ff4d4d, #ff8a28)" : "#10b981",
              boxShadow: lowHp ? "0 0 8px rgba(255,77,77,0.55)" : undefined,
            }}
            animate={{ width: `${hpPct}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          />
        </div>

        {/* Intent — uses the existing rich intent panel which carries
            severity glow, badges, peeks, etc. */}
        <div className="mt-1">
          <EnemyIntentPanel enemy={enemy} fogged={fogged} />
        </div>
      </div>

      {/* Status particle effects */}
      {!dead && enemy.burn > 0 && <BurnEmbers seed={enemy.id} />}
      {!dead && enemy.shield > 0 && <ShieldRipple />}

      {dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-overlay pointer-events-none">
          <SkullIcon className="w-12 h-12 text-accent-red" />
        </div>
      )}

      {/* Floating damage numbers — unchanged */}
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
