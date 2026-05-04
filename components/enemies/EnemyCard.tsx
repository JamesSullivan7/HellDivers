"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Enemy, Faction } from "@/lib/types";
import EnemyImage from "./EnemyImage";
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
        // The card is just the image now — no flex column, no info
        // panel. relative + overflow-hidden lets the badges, HP bar,
        // and damage floats absolute-position over the image cleanly.
        "relative text-left overflow-hidden",
        "transition-all duration-200",
        needsTarget && targetable && !dead && "ring-2 ring-accent-yellow shadow-glow-yellow cursor-crosshair",
        !needsTarget && "cursor-default",
        dead && "opacity-30 grayscale pointer-events-none",
        enemy.enraged && "scale-[1.03] animate-pulse-yellow",
      )}
      style={{
        // The combat enemy card is now JUST the source image — same
        // chrome the codex uses (corner brackets, full source image
        // showing its built-in name banner). Width capped at 200 and
        // aspect 4:5 (matches the source jpg aspect) so 3 enemies
        // fit a typical column without scroll.
        width: "100%",
        maxWidth: "200px",
        aspectRatio: "4 / 5",
        margin: "0 auto",
        background: "rgba(7,11,16,0.85)",
        border: `1px solid ${enemy.isBoss ? "#ff4d4d" : "rgba(255,255,255,0.08)"}`,
        boxShadow: enemy.isBoss
          ? "0 0 18px rgba(255,77,77,0.35), inset 0 0 0 1px rgba(255,77,77,0.55)"
          : `0 0 0 1px ${accent}22`,
      }}
    >
      {/* Corner brackets — match codex enemy card */}
      <span aria-hidden className="absolute top-0 left-0 w-1.5 h-1.5 z-20 pointer-events-none" style={{ borderTop: `1px solid ${accent}`, borderLeft: `1px solid ${accent}` }} />
      <span aria-hidden className="absolute top-0 right-0 w-1.5 h-1.5 z-20 pointer-events-none" style={{ borderTop: `1px solid ${accent}`, borderRight: `1px solid ${accent}` }} />
      <span aria-hidden className="absolute bottom-0 left-0 w-1.5 h-1.5 z-20 pointer-events-none" style={{ borderBottom: `1px solid ${accent}`, borderLeft: `1px solid ${accent}` }} />
      <span aria-hidden className="absolute bottom-0 right-0 w-1.5 h-1.5 z-20 pointer-events-none" style={{ borderBottom: `1px solid ${accent}`, borderRight: `1px solid ${accent}` }} />

      {/*
        ART — full source image (not cropped). The source jpgs have
        their own gold name banner at the top and footer strip at
        the bottom — that IS the card. Using fit="contain" preserves
        the whole thing edge-to-edge.
      */}
      <div className="absolute inset-0 overflow-hidden">
        <EnemyImage faction={enemy.faction} templateId={enemy.templateId} fit="contain" />

        {/* HP bar — thin overlay at the very bottom edge of the image,
            on top of the source's gold footer strip. The bar colour
            is the only health signal; the numerics + name are baked
            into the source image already. */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-black/70">
          <motion.div
            className="h-full"
            style={{
              background: lowHp
                ? "linear-gradient(90deg, #ff4d4d, #ff8a28)"
                : "#10b981",
              boxShadow: lowHp ? "0 0 8px rgba(255,77,77,0.65)" : undefined,
            }}
            animate={{ width: `${hpPct}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          />
        </div>

        {/* HP numerics — small, top-left corner. Tiny so the source
            banner stays the focal point. */}
        <span
          className="absolute top-1 left-1 z-10 px-1 py-0.5 text-[8.5px] font-display font-black tabular-nums leading-none"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: `1px solid ${lowHp ? "#ff4d4d" : "#10b981"}`,
            color: lowHp ? "#ff4d4d" : "#10b981",
          }}
        >
          {enemy.hp}/{enemy.maxHp}
        </span>

        {/* Status badges — top-right, only when relevant */}
        <div className="absolute top-1 right-1 z-10 flex flex-col items-end gap-0.5 pointer-events-none">
          {enemy.isBoss && (
            <span className="text-[7.5px] font-display font-black px-1 leading-none py-0.5" style={{ background: "#ff4d4d", color: "#0a0d12" }}>
              BOSS
            </span>
          )}
          {enemy.armor > 0 && (
            <span className="text-[7.5px] tabular-nums font-display font-black px-1 leading-none py-0.5" style={{ border: "1px solid rgba(255,138,40,0.7)", color: "#ff8a28", background: "rgba(0,0,0,0.65)" }}>
              ARM {enemy.armor}
            </span>
          )}
          {enemy.shield > 0 && (
            <span className="text-[7.5px] tabular-nums font-display font-black px-1 leading-none py-0.5" style={{ border: "1px solid rgba(96,196,255,0.7)", color: "#60c4ff", background: "rgba(0,0,0,0.65)" }}>
              SHD {enemy.shield}
            </span>
          )}
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
