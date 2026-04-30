"use client";

/**
 * COMBAT · AAA Layout
 * ──────────────────────────────────────────────────────────────────────────
 * Spec-mapped layout (Slay-the-Spire clarity + Helldivers 2 aesthetic):
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │ COMBAT TOP BAR · turn · enemies · difficulty · active modifiers    │
 *   ├──────────┬───────────────────────────────────┬─────────────────────┤
 *   │          │                                   │                     │
 *   │ PLAYER   │      CENTER BATTLEFIELD           │  ENEMY STACK        │
 *   │ PANEL    │      (effects · floaters)         │  (vertical column)  │
 *   │          │                                   │                     │
 *   ├──────────┴───────────────────────────────────┴─────────────────────┤
 *   │ RESOURCE BAR · R pips · Hand/Deck/Discard counts · END TURN button │
 *   ├────────────────────────────────────────────────────────────────────┤
 *   │ HAND CAROUSEL (5–10 cards, horizontal scroll)                       │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * The center battlefield is intentionally minimal — it's the stage for
 * effects (damage floaters, hit flashes, stratagem cinematics). Enemies
 * live in the right column where their intent is always readable in one
 * glance, mirroring the AAA spec.
 */

import { ReactNode, useEffect } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { getModifier } from "@/lib/modifiers";
import { getArmorEffective } from "@/lib/loadout";
import { HELLDIVER_PORTRAIT } from "@/lib/artManifest";
import { Card, Enemy } from "@/lib/types";
import EnemyView from "../EnemyView";
import BossFrame from "../boss/BossFrame";
import PlayerHand from "./PlayerHand";
import StarField from "../StarField";
import AnimationRunner from "@/systems/animation/AnimationRunner";
import EnrageCinematic from "../effects/EnrageCinematic";
import StratagemCard from "../cards/StratagemCard";

/** Path to the centered battlefield backdrop. Place image at this path:
 *    public/art/backgrounds/battlefield_seaf.png
 *  If the file is missing, the gradient/grid fallback below still renders cleanly.
 */
const BATTLEFIELD_BG = "/art/backgrounds/battlefield_seaf.png";

export interface PlayedCardSnapshot {
  card: Card;
  /** Bumped on every play so AnimatePresence retriggers. */
  key: number;
}

const COLOR = {
  bg: "#0b0f14",
  panel: "#111821",
  accent: "#f5c542",
  enemy: "#ff4d4d",
  player: "#4da6ff",
  text: "#e8eef5",
  dim: "rgba(232,238,245,0.40)",
  border: "rgba(255,255,255,0.10)",
};

// ──────────────────────────────────────────────────────────────────────
//  ROOT
// ──────────────────────────────────────────────────────────────────────
interface Props {
  needsTarget: boolean;
  onCardClick: (idx: number) => void;
  onEnemyClick: (enemyId: string) => void;
  onEndTurn: () => void;
  overlays?: ReactNode;
  /** Card most recently played — animates to center then fades. */
  playedCard?: PlayedCardSnapshot | null;
}

export default function CombatScreenAAA({
  needsTarget,
  onCardClick,
  onEnemyClick,
  onEndTurn,
  overlays,
  playedCard,
}: Props) {
  const { combat, player, modifiers, difficulty, runBuffs, missionType } = useGame();

  const bosses = combat.enemies.filter((e) => e.isBoss);
  const minions = combat.enemies.filter((e) => !e.isBoss);
  const aliveCount = combat.enemies.filter((e) => e.hp > 0).length;
  const hasBoss = bosses.some((e) => e.hp > 0);

  // Ambient combat hum + boss rumble
  useEffect(() => {
    sfx.ambientStart();
    return () => sfx.ambientStop();
  }, []);
  useEffect(() => {
    if (hasBoss) sfx.bossRumbleStart();
    else sfx.bossRumbleStop();
    return () => sfx.bossRumbleStop();
  }, [hasBoss]);

  return (
    <div
      className="min-h-screen flex flex-col text-white font-mono relative overflow-hidden"
      style={{ background: COLOR.bg }}
    >
      <CombatBackground hasBoss={hasBoss} />

      {/* Effects layers above background, below UI */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        <AnimationRunner />
        <EnrageCinematic />
      </div>

      {overlays}

      {/* ── TOP BAR ── */}
      <CombatTopBar
        turn={combat.turn}
        aliveEnemies={aliveCount}
        totalEnemies={combat.enemies.length}
        difficulty={difficulty}
        modifierIds={modifiers}
        missionType={missionType}
      />

      {/* ── MAIN GRID ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[360px_1fr_420px] min-h-0 relative z-10">
        {/* LEFT — Player Panel */}
        <PlayerPanel runBuffs={runBuffs} />

        {/* CENTER — Battlefield (minimal UI, stage for effects) */}
        <Battlefield
          needsTarget={needsTarget}
          selectedCardIndex={combat.selectedCardIndex}
          playedCard={playedCard ?? null}
        />

        {/* RIGHT — Enemy Stack */}
        <EnemyStack
          bosses={bosses}
          minions={minions}
          needsTarget={needsTarget}
          onEnemyClick={onEnemyClick}
        />
      </div>

      {/* ── RESOURCE BAR + END TURN ── */}
      <ResourceBar
        requisition={player.requisition}
        maxRequisition={player.maxRequisition}
        handCount={combat.hand.length}
        deckCount={combat.deck.length}
        discardCount={combat.discard.length}
        exhaustedCount={combat.exhausted.length}
        onEndTurn={onEndTurn}
      />

      {/* ── HAND ── */}
      <PlayerHand onCardClick={onCardClick} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  BACKGROUND
// ──────────────────────────────────────────────────────────────────────
function CombatBackground({ hasBoss }: { hasBoss: boolean }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: COLOR.bg }} />
      <div className="absolute inset-0 opacity-50">
        <StarField />
      </div>
      {/* Battle sky wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: hasBoss
            ? "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,77,77,0.10), transparent 60%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(245,197,66,0.04), transparent 70%)"
            : "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(77,166,255,0.07), transparent 60%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(245,197,66,0.04), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  TOP BAR
// ──────────────────────────────────────────────────────────────────────
const DIFF_LABEL: Record<number, string> = {
  1: "TRIVIAL", 2: "EASY", 3: "MEDIUM", 4: "CHALLENGING", 5: "HARD",
  6: "EXTREME", 7: "SUICIDE MISSION", 8: "IMPOSSIBLE", 9: "HELLDIVE", 10: "SUPER HELLDIVE",
};

function CombatTopBar({
  turn,
  aliveEnemies,
  totalEnemies,
  difficulty,
  modifierIds,
  missionType,
}: {
  turn: number;
  aliveEnemies: number;
  totalEnemies: number;
  difficulty: number;
  modifierIds: string[];
  missionType: string;
}) {
  const diffColor = difficulty >= 8 ? COLOR.enemy : difficulty >= 5 ? "#ff8a28" : COLOR.accent;
  return (
    <header
      className="border-b backdrop-blur-md relative z-20"
      style={{ borderColor: COLOR.border, background: "rgba(17,24,33,0.85)" }}
    >
      <div className="px-4 md:px-6 py-2 flex items-center gap-4 flex-wrap min-h-[56px]">
        {/* Turn */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Turn</span>
          <motion.span
            key={turn}
            initial={{ scale: 1.3, color: COLOR.accent }}
            animate={{ scale: 1, color: COLOR.text }}
            transition={{ duration: 0.4 }}
            className="font-display font-black text-2xl tabular-nums"
          >
            {String(turn).padStart(2, "0")}
          </motion.span>
        </div>

        <span className="w-px h-6" style={{ background: COLOR.border }} />

        {/* Enemy count */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Hostiles</span>
          <span className="font-display font-black text-2xl tabular-nums" style={{ color: COLOR.enemy }}>
            {aliveEnemies}
          </span>
          <span className="text-[10px] tabular-nums" style={{ color: COLOR.dim }}>
            / {totalEnemies}
          </span>
        </div>

        <span className="w-px h-6" style={{ background: COLOR.border }} />

        {/* Difficulty */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Threat</span>
          <span className="font-display font-black text-base tabular-nums" style={{ color: diffColor }}>
            D{difficulty}
          </span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: diffColor }}>
            {DIFF_LABEL[difficulty]}
          </span>
        </div>

        <div className="flex-1" />

        {/* Mission type pill */}
        <div
          className="px-2 py-1 border text-[9px] uppercase tracking-[0.3em] font-display font-black flex items-center gap-1.5"
          style={{ borderColor: COLOR.accent, color: COLOR.accent }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {missionType.replace(/_/g, " ")}
        </div>

        {/* Active modifiers */}
        {modifierIds.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>
              Modifiers
            </span>
            <div className="flex gap-1">
              {modifierIds.map((id) => {
                const m = getModifier(id);
                if (!m) return null;
                return (
                  <div
                    key={id}
                    className="px-1.5 py-0.5 border text-[10px] uppercase tracking-widest font-bold cursor-help group relative"
                    style={{ borderColor: "#ff8a28", color: "#ff8a28" }}
                    title={`${m.name}: ${m.description}`}
                  >
                    ⚠ {m.name.split(" ")[0]}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  PLAYER PANEL (LEFT)
// ──────────────────────────────────────────────────────────────────────
function PlayerPanel({ runBuffs }: { runBuffs: any[] }) {
  const { player, loadout } = useGame();
  const armor = getArmorEffective(loadout.armorId, loadout.armorTier ?? 1);
  const hpPct = (player.hp / player.maxHp) * 100;
  const blockPct = player.maxHp > 0 ? Math.min(100, (player.block / player.maxHp) * 100) : 0;
  const lowHp = hpPct < 30;

  return (
    <aside
      className="hidden lg:flex flex-col p-3 gap-3 border-r overflow-y-auto"
      style={{ borderColor: COLOR.border, background: "rgba(17,24,33,0.55)" }}
    >
      {/* Portrait card */}
      <div
        className="relative aspect-[4/5] border overflow-hidden"
        style={{
          borderColor: lowHp ? COLOR.enemy : COLOR.player,
          boxShadow: lowHp
            ? "0 0 24px rgba(255,77,77,0.35)"
            : "0 0 18px rgba(77,166,255,0.18)",
        }}
      >
        <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 z-10" style={{ borderColor: COLOR.accent }} />
        <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 z-10" style={{ borderColor: COLOR.accent }} />
        <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 z-10" style={{ borderColor: COLOR.accent }} />
        <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 z-10" style={{ borderColor: COLOR.accent }} />

        <motion.div
          animate={{ scale: [1, 1.015, 1], y: [0, -2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HELLDIVER_PORTRAIT} alt="" className="w-full h-full object-cover object-top" draggable={false} />
        </motion.div>

        {/* Damage flash overlay */}
        <AnimatePresence>
          {lowHp && (
            <motion.div
              key="lowhp"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(255,77,77,0.4))" }}
            />
          )}
        </AnimatePresence>

        {/* Bottom panel */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 z-10 bg-gradient-to-t from-black/90 to-transparent">
          <div className="text-[8px] uppercase tracking-[0.4em] flex items-center gap-1.5" style={{ color: COLOR.dim }}>
            <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", lowHp ? "bg-helldiver-red" : "bg-emerald-400")} />
            {lowHp ? "CRITICAL" : "OPERATIONAL"}
          </div>
          <div className="font-display font-black text-sm mt-0.5 leading-tight" style={{ color: COLOR.player }}>
            HELLDIVER
          </div>
        </div>
      </div>

      {/* HP bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>HP</span>
          <span className={clsx("font-display font-black text-base tabular-nums", lowHp ? "text-helldiver-red" : "text-emerald-400")}>
            {player.hp}<span className="text-white/30 text-xs"> / {player.maxHp}</span>
          </span>
        </div>
        <div className="h-2.5 bg-black border relative overflow-hidden" style={{ borderColor: COLOR.border }}>
          <motion.div
            className="h-full"
            style={{
              background: lowHp
                ? "linear-gradient(to right, #ff4d4d, #ff8a28)"
                : "linear-gradient(to right, #10b981, #34d399)",
            }}
            animate={{ width: `${hpPct}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          />
          {lowHp && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ background: "rgba(255,77,77,0.3)" }}
            />
          )}
        </div>
      </div>

      {/* Block bar (always shown) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Block</span>
          <span className="font-display font-black text-base tabular-nums" style={{ color: COLOR.player }}>
            {player.block}
          </span>
        </div>
        <div className="h-1.5 bg-black border overflow-hidden" style={{ borderColor: COLOR.border }}>
          <motion.div
            className="h-full"
            style={{ background: COLOR.player }}
            animate={{ width: `${blockPct}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          />
        </div>
      </div>

      {/* Reinforcements */}
      <div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="uppercase tracking-widest" style={{ color: COLOR.dim }}>Reinforcements</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.max(player.reinforcements, 0) }).map((_, i) => (
              <span key={i} className="w-2 h-2" style={{ background: COLOR.accent }} />
            ))}
            {player.reinforcements === 0 && <span className="text-helldiver-red text-[10px] font-bold">DEPLETED</span>}
          </div>
        </div>
      </div>

      {/* Active passives */}
      {armor.passiveName && (
        <div className="border-t pt-2" style={{ borderColor: COLOR.border }}>
          <div className="text-[9px] uppercase tracking-[0.3em] mb-1" style={{ color: COLOR.dim }}>Armor</div>
          <div className="text-[11px] font-display font-bold" style={{ color: COLOR.accent }}>
            {armor.passiveName}
          </div>
          <div className="text-[10px] text-white/50 italic leading-snug mt-0.5 line-clamp-2">{armor.passive}</div>
        </div>
      )}

      {/* Run buffs */}
      {runBuffs.length > 0 && (
        <div className="border-t pt-2" style={{ borderColor: COLOR.border }}>
          <div className="text-[9px] uppercase tracking-[0.3em] mb-1.5" style={{ color: COLOR.dim }}>Active Buffs</div>
          <div className="space-y-1.5">
            {runBuffs.map((b) => (
              <div
                key={b.id}
                className="border-l-2 pl-2 py-0.5"
                style={{ borderColor: b.lifetime === "next_combat" ? COLOR.player : COLOR.accent }}
              >
                <div
                  className="text-[10px] font-bold flex items-center justify-between"
                  style={{ color: b.lifetime === "next_combat" ? COLOR.player : COLOR.accent }}
                >
                  <span>{b.name}</span>
                  <span className="text-[8px] uppercase tracking-widest text-white/30">
                    {b.lifetime === "next_combat" ? "1 fight" : "run"}
                  </span>
                </div>
                <div className="text-[10px] text-white/50 leading-snug">{b.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  CENTER BATTLEFIELD (effects stage)
// ──────────────────────────────────────────────────────────────────────
function Battlefield({
  needsTarget,
  selectedCardIndex,
  playedCard,
}: {
  needsTarget: boolean;
  selectedCardIndex: number | null;
  playedCard: PlayedCardSnapshot | null;
}) {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-6 overflow-hidden min-h-[320px]">
      {/* SEAF battle backdrop — main mood-setter */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${BATTLEFIELD_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.55,
        }}
      />
      {/* Slow parallax breathing on the backdrop */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${BATTLEFIELD_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.18,
          mixBlendMode: "screen",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Darken + tint so the backdrop never fights foreground UI */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,15,20,0.55) 0%, rgba(11,15,20,0.35) 40%, rgba(11,15,20,0.85) 100%)",
        }}
      />

      {/* Battlefield grid lines — very subtle */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,197,66,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(245,197,66,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Center crosshair (hidden when a card is playing) */}
      {!playedCard && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-32 h-32 opacity-20">
            <span className="absolute top-1/2 -translate-y-1/2 left-0 w-8 h-px" style={{ background: COLOR.accent }} />
            <span className="absolute top-1/2 -translate-y-1/2 right-0 w-8 h-px" style={{ background: COLOR.accent }} />
            <span className="absolute left-1/2 -translate-x-1/2 top-0 h-8 w-px" style={{ background: COLOR.accent }} />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-8 w-px" style={{ background: COLOR.accent }} />
          </div>
        </div>
      )}

      {/* Pulsing target prompt */}
      <AnimatePresence>
        {needsTarget && selectedCardIndex !== null && !playedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 px-6 py-3 border-2 backdrop-blur-sm"
            style={{ borderColor: COLOR.accent, background: "rgba(245,197,66,0.12)" }}
          >
            <div className="text-[10px] uppercase tracking-[0.4em] mb-1" style={{ color: COLOR.accent }}>
              ▶ Awaiting Target
            </div>
            <div className="text-sm text-white">
              Click a hostile in the right panel to deploy your stratagem.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYED CARD OVERLAY — flies up from the hand to the center */}
      <AnimatePresence>
        {playedCard && (
          <motion.div
            key={playedCard.key}
            initial={{ y: 360, scale: 0.55, opacity: 0, rotate: -8 }}
            animate={{ y: 0, scale: 1.18, opacity: 1, rotate: 0 }}
            exit={{ y: -120, scale: 1.45, opacity: 0, rotate: 4 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div
              className="relative"
              style={{
                filter: "drop-shadow(0 0 50px rgba(245,197,66,0.55)) drop-shadow(0 0 18px rgba(255,255,255,0.25))",
              }}
            >
              {/* Radiating ring */}
              <motion.div
                className="absolute inset-0 -m-6 rounded-full pointer-events-none"
                style={{
                  border: `2px solid ${COLOR.accent}`,
                  boxShadow: `0 0 60px ${COLOR.accent}`,
                }}
                initial={{ scale: 0.6, opacity: 0.9 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.0, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 -m-12 rounded-full pointer-events-none"
                style={{ border: `1px solid ${COLOR.accent}` }}
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
              />
              <StratagemCard card={playedCard.card} affordable />
              {/* DEPLOYED tag */}
              <motion.div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 font-display font-black text-[10px] uppercase tracking-[0.3em] whitespace-nowrap"
                style={{ background: COLOR.accent, color: COLOR.bg }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                ▸ STRATAGEM DEPLOYED ◂
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated horizon — slow ambient sway */}
      <motion.div
        className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(to top, rgba(245,197,66,0.15), transparent)",
        }}
      />

      {/* Idle text */}
      {!needsTarget && !playedCard && (
        <div className="text-[10px] uppercase tracking-[0.4em] absolute bottom-3 left-1/2 -translate-x-1/2" style={{ color: COLOR.dim }}>
          ◢ FOR SUPER EARTH ◣
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ENEMY STACK (RIGHT)
// ──────────────────────────────────────────────────────────────────────
function EnemyStack({
  bosses,
  minions,
  needsTarget,
  onEnemyClick,
}: {
  bosses: Enemy[];
  minions: Enemy[];
  needsTarget: boolean;
  onEnemyClick: (id: string) => void;
}) {
  return (
    <aside
      className="flex flex-col p-3 gap-3 border-l overflow-y-auto"
      style={{ borderColor: COLOR.border, background: "rgba(17,24,33,0.55)" }}
    >
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.4em]" style={{ color: COLOR.dim }}>
        <span>◢ Hostile Contacts ◣</span>
        <span style={{ color: COLOR.enemy }}>{bosses.filter(b => b.hp > 0).length + minions.filter(m => m.hp > 0).length}</span>
      </div>

      {/* Bosses first */}
      <AnimatePresence>
        {bosses.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <BossFrame
              enemy={b}
              targetable={needsTarget}
              needsTarget={needsTarget}
              onClick={() => onEnemyClick(b.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Minions stacked */}
      <AnimatePresence>
        {minions.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 320, damping: 24, delay: i * 0.04 }}
          >
            <EnemyView
              enemy={e}
              targetable={needsTarget}
              needsTarget={needsTarget}
              onClick={() => onEnemyClick(e.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {bosses.length + minions.length === 0 && (
        <div className="text-[10px] uppercase tracking-widest text-center py-8" style={{ color: COLOR.dim }}>
          — NO HOSTILE CONTACTS —
        </div>
      )}
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  RESOURCE BAR (above hand)
// ──────────────────────────────────────────────────────────────────────
function ResourceBar({
  requisition,
  maxRequisition,
  handCount,
  deckCount,
  discardCount,
  exhaustedCount,
  onEndTurn,
}: {
  requisition: number;
  maxRequisition: number;
  handCount: number;
  deckCount: number;
  discardCount: number;
  exhaustedCount: number;
  onEndTurn: () => void;
}) {
  return (
    <div
      className="border-t border-b backdrop-blur-md relative z-20"
      style={{ borderColor: COLOR.border, background: "rgba(17,24,33,0.85)" }}
    >
      <div className="px-4 md:px-6 py-2 flex items-center gap-4 flex-wrap">
        {/* Requisition pips */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>
            Requisition
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxRequisition }).map((_, i) => (
              <motion.div
                key={i}
                className="w-5 h-5 border-2 flex items-center justify-center"
                style={{
                  borderColor: i < requisition ? COLOR.accent : COLOR.border,
                  background: i < requisition ? COLOR.accent : "transparent",
                }}
                animate={i < requisition ? { boxShadow: ["0 0 0 rgba(245,197,66,0)", "0 0 8px rgba(245,197,66,0.8)", "0 0 0 rgba(245,197,66,0)"] } : {}}
                transition={i < requisition ? { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 } : {}}
              >
                {i < requisition && (
                  <span className="text-[10px] font-display font-black" style={{ color: COLOR.bg }}>R</span>
                )}
              </motion.div>
            ))}
          </div>
          <motion.span
            key={requisition}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="font-display font-black text-xl tabular-nums ml-1"
            style={{ color: COLOR.accent }}
          >
            {requisition}
          </motion.span>
          <span className="text-xs" style={{ color: COLOR.dim }}>/ {maxRequisition}</span>
        </div>

        <span className="w-px h-6 hidden md:block" style={{ background: COLOR.border }} />

        {/* Deck stats */}
        <div className="hidden md:flex items-center gap-3 text-[10px]">
          <DeckStat label="Hand" value={handCount} color={COLOR.text} />
          <DeckStat label="Deck" value={deckCount} color={COLOR.text} />
          <DeckStat label="Discard" value={discardCount} color={COLOR.dim} />
          {exhaustedCount > 0 && <DeckStat label="Exhausted" value={exhaustedCount} color={COLOR.enemy} />}
        </div>

        <div className="flex-1" />

        {/* End turn — large bottom-right CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onEndTurn}
          className="py-2.5 px-6 font-display font-black uppercase tracking-[0.3em] text-sm border-2 transition-all"
          style={{
            background: "linear-gradient(135deg, #ff8a28 0%, #ff4d4d 100%)",
            color: COLOR.bg,
            borderColor: COLOR.enemy,
            boxShadow: "0 0 20px rgba(255,77,77,0.35)",
          }}
        >
          END TURN ▶
        </motion.button>
      </div>
    </div>
  );
}

function DeckStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="uppercase tracking-widest" style={{ color: COLOR.dim }}>{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="font-display font-black tabular-nums"
        style={{ color }}
      >
        {value}
      </motion.span>
    </div>
  );
}
