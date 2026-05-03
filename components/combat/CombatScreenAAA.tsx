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
import { getCardById } from "@/lib/cards";
import EnemyView from "../EnemyView";
import BossFrame from "../boss/BossFrame";
import PlayerHand from "./PlayerHand";
import StarField from "../StarField";
import AnimationRunner from "@/systems/animation/AnimationRunner";
import EnrageCinematic from "../effects/EnrageCinematic";
import StratagemCard from "../cards/StratagemCard";
import type { PlayedCardSnapshot as QueuePlayedCardSnapshot } from "@/systems/feedback/feedbackQueue";

/** Path to the centered battlefield backdrop. Place image at this path:
 *    public/art/backgrounds/battlefield_seaf.png
 *  If the file is missing, the gradient/grid fallback below still renders cleanly.
 */
const BATTLEFIELD_BG = "/art/backgrounds/battlefield_seaf.png";

/** Re-exported for back-compat with CombatView. */
export type PlayedCardSnapshot = QueuePlayedCardSnapshot;

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
      // h-screen + overflow-hidden = the combat UI is *strictly* one viewport,
      // and any overflow inside (long enemy list, long buff list) scrolls
      // inside its own column instead of pushing the hand below the fold.
      className="h-screen flex flex-col text-white font-mono relative overflow-hidden"
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

      {/* ── MAIN GRID ──
          min-h-0 + side-panel overflow-y-auto means tall content scrolls
          INSIDE its column. Narrower columns (288 / 1fr / 340) give the
          battlefield more horizontal room and reduce the visual dead-space
          the user flagged. */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[288px_1fr_340px] min-h-0 relative z-10">
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
      <div className="px-3 md:px-4 py-1 flex items-center gap-3 flex-wrap min-h-[40px]">
        {/* Turn */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Turn</span>
          <motion.span
            key={turn}
            initial={{ scale: 1.3, color: COLOR.accent }}
            animate={{ scale: 1, color: COLOR.text }}
            transition={{ duration: 0.4 }}
            className="font-display font-black text-lg tabular-nums leading-none"
          >
            {String(turn).padStart(2, "0")}
          </motion.span>
        </div>

        <span className="w-px h-4" style={{ background: COLOR.border }} />

        {/* Enemy count */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Hostiles</span>
          <span className="font-display font-black text-lg tabular-nums leading-none" style={{ color: COLOR.enemy }}>
            {aliveEnemies}
          </span>
          <span className="text-[10px] tabular-nums" style={{ color: COLOR.dim }}>
            / {totalEnemies}
          </span>
        </div>

        <span className="w-px h-4" style={{ background: COLOR.border }} />

        {/* Difficulty */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Threat</span>
          <span className="font-display font-black text-sm tabular-nums leading-none" style={{ color: diffColor }}>
            D{difficulty}
          </span>
          <span className="text-[9px] uppercase tracking-widest" style={{ color: diffColor }}>
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
      // overflow-y-auto: tall buff lists scroll INSIDE the column instead of
      // stretching the whole layout. min-h-0 on parent grid lets this work.
      // justify-center: helldiver portrait + stats sit in the middle of the
      // column instead of top-aligned with empty space below. The void the
      // user saw between the helldiver info and the bottom of the grid
      // becomes evenly-distributed breathing room above and below.
      className="hidden lg:flex flex-col p-2 gap-2 border-r overflow-y-auto min-h-0 justify-center"
      style={{ borderColor: COLOR.border, background: "rgba(17,24,33,0.55)" }}
    >
      {/* Portrait card — fixed-height banner so the panel never dictates the
          column height. 132px keeps the cinematic Helldiver feel without
          eating the whole side rail. */}
      <div
        className="relative border overflow-hidden shrink-0"
        style={{
          height: 132,
          borderColor: lowHp ? COLOR.enemy : COLOR.player,
          boxShadow: lowHp
            ? "0 0 18px rgba(255,77,77,0.35)"
            : "0 0 12px rgba(77,166,255,0.18)",
        }}
      >
        <span className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 z-10" style={{ borderColor: COLOR.accent }} />
        <span className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 z-10" style={{ borderColor: COLOR.accent }} />
        <span className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 z-10" style={{ borderColor: COLOR.accent }} />
        <span className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 z-10" style={{ borderColor: COLOR.accent }} />

        <motion.div
          animate={{ scale: [1, 1.015, 1], y: [0, -1, 0] }}
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

        {/* Bottom panel — compact name + status */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 z-10 bg-gradient-to-t from-black/95 to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="font-display font-black text-[12px] leading-none" style={{ color: COLOR.player }}>
              HELLDIVER
            </div>
            <div className="text-[8px] uppercase tracking-[0.3em] flex items-center gap-1" style={{ color: COLOR.dim }}>
              <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", lowHp ? "bg-helldiver-red" : "bg-emerald-400")} />
              {lowHp ? "CRITICAL" : "OPERATIONAL"}
            </div>
          </div>
        </div>
      </div>

      {/* HP bar */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>HP</span>
          <span className={clsx("font-display font-black text-sm tabular-nums leading-none", lowHp ? "text-helldiver-red" : "text-emerald-400")}>
            {player.hp}<span className="text-white/30 text-[10px]"> / {player.maxHp}</span>
          </span>
        </div>
        <div className="h-2 bg-black border relative overflow-hidden" style={{ borderColor: COLOR.border }}>
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

      {/* Block + Reinforcements — same row to save vertical space */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Block</span>
            <span className="font-display font-black text-sm tabular-nums leading-none" style={{ color: COLOR.player }}>
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
        <div>
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Reinf</span>
          </div>
          <div className="flex gap-1 h-1.5 items-center">
            {Array.from({ length: Math.max(player.reinforcements, 0) }).map((_, i) => (
              <span key={i} className="w-2 h-1.5" style={{ background: COLOR.accent }} />
            ))}
            {player.reinforcements === 0 && <span className="text-helldiver-red text-[9px] font-bold leading-none">DEPLETED</span>}
          </div>
        </div>
      </div>

      {/* Active passives — compact */}
      {armor.passiveName && (
        <div className="border-t pt-1.5 shrink-0" style={{ borderColor: COLOR.border }}>
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>Armor</span>
            <span className="text-[11px] font-display font-bold leading-none" style={{ color: COLOR.accent }}>
              {armor.passiveName}
            </span>
          </div>
          <div className="text-[9.5px] text-white/50 italic leading-snug mt-0.5 line-clamp-2">{armor.passive}</div>
        </div>
      )}

      {/* Run buffs — scroll within column */}
      {runBuffs.length > 0 && (
        <div className="border-t pt-1.5 min-h-0" style={{ borderColor: COLOR.border }}>
          <div className="text-[9px] uppercase tracking-[0.3em] mb-1" style={{ color: COLOR.dim }}>Active Buffs</div>
          <div className="space-y-1">
            {runBuffs.map((b) => (
              <div
                key={b.id}
                className="border-l-2 pl-1.5 py-0.5"
                style={{ borderColor: b.lifetime === "next_combat" ? COLOR.player : COLOR.accent }}
              >
                <div
                  className="text-[10px] font-bold flex items-center justify-between leading-tight"
                  style={{ color: b.lifetime === "next_combat" ? COLOR.player : COLOR.accent }}
                >
                  <span className="truncate">{b.name}</span>
                  <span className="text-[8px] uppercase tracking-widest text-white/30 shrink-0 ml-1">
                    {b.lifetime === "next_combat" ? "1 fight" : "run"}
                  </span>
                </div>
                <div className="text-[9.5px] text-white/50 leading-snug line-clamp-2">{b.description}</div>
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
    <div className="relative flex flex-col items-center justify-center p-3 overflow-hidden min-h-0">
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

      {/* Center crosshair (hidden when a card is playing) — smaller crosshair
          since the battlefield is shorter now */}
      {!playedCard && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-24 h-24 opacity-15">
            <span className="absolute top-1/2 -translate-y-1/2 left-0 w-6 h-px" style={{ background: COLOR.accent }} />
            <span className="absolute top-1/2 -translate-y-1/2 right-0 w-6 h-px" style={{ background: COLOR.accent }} />
            <span className="absolute left-1/2 -translate-x-1/2 top-0 h-6 w-px" style={{ background: COLOR.accent }} />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-6 w-px" style={{ background: COLOR.accent }} />
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

      {/* PLAYED CARD OVERLAY — first deploy ("play") flies up dramatically;
          subsequent ticks ("tick") use a subtler treatment for sentry / DOT activations. */}
      <AnimatePresence>
        {playedCard && <PlayedCardLayer snapshot={playedCard} />}
      </AnimatePresence>

      {/* Animated horizon — slow ambient sway, slim decorative band */}
      <motion.div
        className="absolute bottom-0 inset-x-0 h-6 pointer-events-none"
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(to top, rgba(245,197,66,0.15), transparent)",
        }}
      />
      {/* "FOR SUPER EARTH" footer removed — pure vertical bloat that
          contributed to the hand-cards-clipped issue on shorter viewports. */}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  PLAYED-CARD LAYER (deploy + tick)
//  - kind="play"  : full drama. Springs in from y:360 / scale 0.55 → 1.18,
//                   double radiating yellow rings, "STRATAGEM DEPLOYED" tag.
//  - kind="tick"  : subtler. Smaller scale (0.92), single ring at the
//                   accent's lower opacity, "ACTIVATING" tag, faster exit.
// ──────────────────────────────────────────────────────────────────────
function PlayedCardLayer({ snapshot }: { snapshot: PlayedCardSnapshot }) {
  // Resolve the card from id (queue snapshot is lightweight).
  let card: Card | null = null;
  try {
    card = getCardById(snapshot.cardId);
  } catch {
    return null;
  }

  const isTick = snapshot.kind === "tick";
  const tagText = isTick ? "▸ ACTIVATING ◂" : "▸ STRATAGEM DEPLOYED ◂";
  const ringGlow = isTick
    ? "drop-shadow(0 0 28px rgba(245,197,66,0.4))"
    : "drop-shadow(0 0 50px rgba(245,197,66,0.55)) drop-shadow(0 0 18px rgba(255,255,255,0.25))";

  return (
    <motion.div
      key={snapshot.key}
      initial={
        isTick
          ? { y: -10, scale: 0.7, opacity: 0, rotate: -2 }
          : { y: 360, scale: 0.55, opacity: 0, rotate: -8 }
      }
      animate={
        isTick
          ? { y: 0, scale: 0.92, opacity: 1, rotate: 0 }
          : { y: 0, scale: 1.18, opacity: 1, rotate: 0 }
      }
      exit={
        isTick
          ? { y: -40, scale: 0.85, opacity: 0 }
          : { y: -120, scale: 1.45, opacity: 0, rotate: 4 }
      }
      transition={{
        type: "spring",
        stiffness: isTick ? 280 : 220,
        damping: isTick ? 26 : 22,
      }}
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
    >
      <div className="relative" style={{ filter: ringGlow }}>
        {/* Radiating ring(s) — only on play; ticks get one quick subtle ring */}
        {isTick ? (
          <motion.div
            className="absolute inset-0 -m-3 rounded-full pointer-events-none"
            style={{
              border: `1px solid ${COLOR.accent}`,
              boxShadow: `0 0 30px ${COLOR.accent}80`,
            }}
            initial={{ scale: 0.85, opacity: 0.7 }}
            animate={{ scale: 1.25, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        ) : (
          <>
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
          </>
        )}

        <StratagemCard card={card} affordable />

        {/* Tag */}
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 font-display font-black text-[10px] uppercase tracking-[0.3em] whitespace-nowrap"
          style={{
            background: isTick ? "rgba(245,197,66,0.85)" : COLOR.accent,
            color: COLOR.bg,
            border: isTick ? `1px solid ${COLOR.accent}` : "none",
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isTick ? 0.05 : 0.18 }}
        >
          {tagText}
        </motion.div>

        {/* Tick-specific bottom subtitle: which turn the sentry is on */}
        {isTick && (
          <motion.div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 font-display font-black text-[9px] uppercase tracking-[0.3em] whitespace-nowrap border bg-black/80"
            style={{ borderColor: COLOR.accent, color: COLOR.accent }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            ◊ Persistent Stratagem ◊
          </motion.div>
        )}
      </div>
    </motion.div>
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
      // overflow-y-auto + min-h-0: many enemies scroll inside the column
      className="flex flex-col p-2 gap-2 border-l overflow-y-auto min-h-0"
      style={{ borderColor: COLOR.border, background: "rgba(17,24,33,0.55)" }}
    >
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.4em] shrink-0" style={{ color: COLOR.dim }}>
        <span>◢ Hostile Contacts ◣</span>
        <span style={{ color: COLOR.enemy }}>{bosses.filter(b => b.hp > 0).length + minions.filter(m => m.hp > 0).length}</span>
      </div>

      {/* Bosses first. The wrapper motion.div uses `flex-1 min-h-0` so
          the inner EnemyCard / BossFrame share the column height equally
          (their internal flex:1 picks up from us). With this, 2 enemies
          fill the column 50/50, 3 enemies 33/33/33, etc. — no gap below
          the last card and no scroll. */}
      <AnimatePresence>
        {bosses.map((b) => (
          <motion.div
            key={b.id}
            className="flex-1 min-h-0 flex flex-col"
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

      {/* Minions stacked — same flex:1 sizing as bosses */}
      <AnimatePresence>
        {minions.map((e, i) => (
          <motion.div
            key={e.id}
            className="flex-1 min-h-0 flex flex-col"
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
      <div className="px-3 md:px-4 py-1 flex items-center gap-3 flex-wrap min-h-[40px]">
        {/* Requisition pips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: COLOR.dim }}>
            Requisition
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: maxRequisition }).map((_, i) => (
              <motion.div
                key={i}
                className="w-4 h-4 border flex items-center justify-center"
                style={{
                  borderColor: i < requisition ? COLOR.accent : COLOR.border,
                  background: i < requisition ? COLOR.accent : "transparent",
                }}
                animate={i < requisition ? { boxShadow: ["0 0 0 rgba(245,197,66,0)", "0 0 6px rgba(245,197,66,0.8)", "0 0 0 rgba(245,197,66,0)"] } : {}}
                transition={i < requisition ? { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 } : {}}
              >
                {i < requisition && (
                  <span className="text-[9px] font-display font-black leading-none" style={{ color: COLOR.bg }}>R</span>
                )}
              </motion.div>
            ))}
          </div>
          <motion.span
            key={requisition}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="font-display font-black text-lg tabular-nums ml-1 leading-none"
            style={{ color: COLOR.accent }}
          >
            {requisition}
          </motion.span>
          <span className="text-[10px]" style={{ color: COLOR.dim }}>/ {maxRequisition}</span>
        </div>

        <span className="w-px h-4 hidden md:block" style={{ background: COLOR.border }} />

        {/* Deck stats */}
        <div className="hidden md:flex items-center gap-3 text-[10px]">
          <DeckStat label="Hand" value={handCount} color={COLOR.text} />
          <DeckStat label="Deck" value={deckCount} color={COLOR.text} />
          <DeckStat label="Discard" value={discardCount} color={COLOR.dim} />
          {exhaustedCount > 0 && <DeckStat label="Exhausted" value={exhaustedCount} color={COLOR.enemy} />}
        </div>

        <div className="flex-1" />

        {/* End turn — slimmer CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onEndTurn}
          className="py-1.5 px-4 font-display font-black uppercase tracking-[0.3em] text-xs border-2 transition-all leading-none"
          style={{
            background: "linear-gradient(135deg, #ff8a28 0%, #ff4d4d 100%)",
            color: COLOR.bg,
            borderColor: COLOR.enemy,
            boxShadow: "0 0 16px rgba(255,77,77,0.35)",
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
