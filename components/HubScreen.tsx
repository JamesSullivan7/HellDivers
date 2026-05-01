"use client";

/**
 * HUB · SUPER DESTROYER COMMAND CENTER (minimal pass)
 * ──────────────────────────────────────────────────────────────────────
 * Calm, cinematic, minimal. The bridge does the heavy visual lifting;
 * the UI gets out of the way.
 *
 *   ┌──────────────────────── TOP STRIP ─────────────────────────┐
 *   │ HELLDIVERS · STRATAGEM PROTOCOL │ identity │ M  S  R       │
 *   ├────┬───────────────────────────────────┬────────────────────┤
 *   │    │                                   │                    │
 *   │ 5  │     CINEMATIC VIEWPORT            │  CONTEXT           │
 *   │ ic │     (bridge — no chrome)          │  (flat column,     │
 *   │ on │     tiny target readout only      │   no boxes)        │
 *   │ s  │                                   │                    │
 *   │    │                                   │                    │
 *   ├────┴───────────────────────────────────┴────────────────────┤
 *   │  XP · 5 stratagem chips · DEPLOY HELLDIVER                  │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Design rules:
 *   - One focal point in the chrome (DEPLOY)
 *   - Whitespace > separators
 *   - Yellow used SPARINGLY (active nav, DEPLOY, mission accent)
 *   - All transitions 200–280ms, no springs
 *   - The bridge cinematic is visible everywhere
 */

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import {
  calcRunReward,
  getHelldiverRank,
  xpToLevelUp,
  type Account,
} from "@/lib/account";
import {
  ARMORS,
  BOOSTERS,
  DEFAULT_ARMOR,
  DEFAULT_BOOSTER,
  DEFAULT_WEAPON,
  WEAPONS,
} from "@/lib/loadout";
import { CARD_LIBRARY } from "@/lib/cards";
import { MODIFIERS } from "@/lib/modifiers";
import {
  generateActivity,
  getMajorOrderProgress,
  listPlanets,
  loadWarState,
  type PlanetState,
  type WarState,
} from "@/lib/galacticWar";
import HubCommandCenterBackground from "./hub/HubCommandCenterBackground";

// ──────────────────────────────────────────────────────────────────────
//  Tokens
// ──────────────────────────────────────────────────────────────────────
const C = {
  yellow: "#f5c542",
  yellowDim: "rgba(245,197,66,0.55)",
  orange: "#ff8a28",
  red: "#ff4d4d",
  cyan: "#60c4ff",
  green: "#10b981",
  bg0: "#0a0d12",
  text: "rgba(255,255,255,0.92)",
  textDim: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.32)",
  hairline: "rgba(255,255,255,0.06)",
} as const;

const FACTION_COLOR: Record<PlanetState["faction"], string> = {
  terminid: "#f59e0b",
  automaton: "#ef4444",
  illuminate: "#a855f7",
};

// ──────────────────────────────────────────────────────────────────────
//  ROOT
// ──────────────────────────────────────────────────────────────────────
export default function HubScreen() {
  const {
    account,
    difficulty,
    modifiers,
    targetPlanetId,
    goToWar,
    goToCharacter,
    goToArmory,
    goToCodex,
  } = useGame();
  const [war, setWar] = useState<WarState | null>(null);
  const [feed, setFeed] = useState<string[]>([]);

  useEffect(() => {
    setWar(loadWarState());
  }, []);

  useEffect(() => {
    if (!war) return;
    const planets = listPlanets(war);
    setFeed(Array.from({ length: 4 }).map(() => generateActivity(planets)));
    const t = setInterval(() => {
      setFeed((prev) => [generateActivity(planets), ...prev].slice(0, 6));
    }, 5000);
    return () => clearInterval(t);
  }, [war]);

  const target = useMemo<PlanetState | null>(() => {
    if (!war) return null;
    if (targetPlanetId && war.planets[targetPlanetId]) return war.planets[targetPlanetId];
    const planets = listPlanets(war);
    if (planets.length === 0) return null;
    return [...planets].sort(
      (a, b) => Math.abs(50 - a.liberation) - Math.abs(50 - b.liberation),
    )[0];
  }, [war, targetPlanetId]);

  return (
    <div
      className="min-h-screen relative overflow-hidden font-mono text-white"
      style={{ background: C.bg0 }}
    >
      <HubCommandCenterBackground />

      <div
        className="relative z-50 min-h-screen grid"
        style={{ gridTemplateRows: "auto minmax(0,1fr) auto" }}
      >
        <TopStrip account={account} feed={feed} />

        <main
          className="grid min-w-0"
          style={{ gridTemplateColumns: "60px minmax(0,1fr) 320px" }}
        >
          <LeftNav
            onWar={() => { sfx.click(); goToWar(); }}
            onLoadout={() => { sfx.click(); goToCharacter(); }}
            onArmory={() => { sfx.click(); goToArmory(); }}
            onResearch={() => { sfx.click(); goToCodex(); }}
            onSettings={() => { sfx.click(); goToCharacter(); }}
          />
          <CenterViewport target={target} difficulty={difficulty} />
          <ContextColumn
            account={account}
            war={war}
            target={target}
            difficulty={difficulty}
            modifierIds={modifiers}
          />
        </main>

        <BottomBar
          account={account}
          target={target}
          difficulty={difficulty}
          onDeploy={() => { sfx.unlock(); sfx.beacon(); goToWar(); }}
          onLoadout={() => { sfx.click(); goToCharacter(); }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  TOP STRIP — wordmark + identity + currency, no boxes
// ══════════════════════════════════════════════════════════════════════
function TopStrip({ account, feed }: { account: Account; feed: string[] }) {
  const rank = getHelldiverRank(account.level);
  const samples = account.samples + account.rareSamples + account.superSamples;
  return (
    <header
      className="relative h-[52px] px-5 flex items-center gap-6"
      style={{
        background: "linear-gradient(180deg, rgba(10,13,18,0.85) 0%, rgba(10,13,18,0.45) 100%)",
        borderBottom: `1px solid ${C.hairline}`,
      }}
    >
      {/* Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="font-display font-black tracking-[0.22em]"
          style={{ color: C.yellow, fontSize: 14 }}
        >
          HELLDIVERS
        </span>
        <span className="hidden md:inline text-[9px] uppercase tracking-[0.4em]" style={{ color: C.textFaint }}>
          STRATAGEM PROTOCOL
        </span>
      </div>

      {/* Live ticker — bare text, no frame */}
      <AnimatePresence mode="wait">
        {feed[0] && (
          <motion.div
            key={feed[0]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:flex flex-1 min-w-0 items-center gap-3"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.3em] shrink-0" style={{ color: C.textFaint }}>
              GALACTIC FEED
            </span>
            <span className="text-[11px] truncate" style={{ color: C.textDim }}>
              {feed[0]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identity + currencies — flat text, generous spacing */}
      <div className="flex items-center gap-6 shrink-0 ml-auto">
        <div className="flex flex-col leading-none text-right">
          <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textFaint }}>
            {rank.title}
          </span>
          <span
            className="text-[12px] font-display font-black tracking-wider mt-1"
            style={{ color: C.yellow }}
          >
            {account.helldiverName ?? "HELLDIVER"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <CurrencyText glyph="★" value={account.medals} accent={C.yellow} />
          <CurrencyText glyph="◆" value={samples} accent={C.cyan} />
          <CurrencyText glyph="Ⓡ" value={account.requisition} accent={C.orange} />
        </div>
      </div>
    </header>
  );
}

function CurrencyText({ glyph, value, accent }: { glyph: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="font-display font-black"
        style={{ color: accent, fontSize: 13, lineHeight: 1, textShadow: `0 0 6px ${accent}55` }}
      >
        {glyph}
      </span>
      <span className="font-display font-black tabular-nums" style={{ color: C.text, fontSize: 13 }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  LEFT NAV — thin icon strip with hover labels
// ══════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { key: "war",      label: "Galactic Map", icon: "✦" },
  { key: "loadout",  label: "Loadout",       icon: "◇" },
  { key: "armory",   label: "Armory",        icon: "⌥" },
  { key: "research", label: "Research",      icon: "◊" },
  { key: "settings", label: "Settings",      icon: "⚙" },
] as const;

function LeftNav({
  onWar, onLoadout, onArmory, onResearch, onSettings,
}: {
  onWar: () => void; onLoadout: () => void; onArmory: () => void;
  onResearch: () => void; onSettings: () => void;
}) {
  const handlers: Record<string, () => void> = {
    war: onWar, loadout: onLoadout, armory: onArmory, research: onResearch, settings: onSettings,
  };
  return (
    <nav
      className="hidden md:flex flex-col items-center justify-center gap-2 py-6"
      style={{ borderRight: `1px solid ${C.hairline}` }}
    >
      {NAV_ITEMS.map((item) => (
        <NavIcon key={item.key} icon={item.icon} label={item.label} onClick={handlers[item.key]} />
      ))}
    </nav>
  );
}

function NavIcon({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-10 h-10 flex items-center justify-center transition-all duration-200"
        style={{
          color: hovered ? C.yellow : C.textDim,
          textShadow: hovered ? `0 0 10px ${C.yellow}88` : undefined,
        }}
      >
        <span className="font-display font-black text-lg leading-none">{icon}</span>
      </button>

      {/* Hover label — soft right-side popout */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute left-[100%] top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap pointer-events-none text-[10px] uppercase tracking-[0.3em]"
            style={{
              color: C.yellow,
              textShadow: `0 0 8px ${C.yellow}55`,
            }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  CENTER VIEWPORT — bridge cinematic, near-zero chrome
// ══════════════════════════════════════════════════════════════════════
function CenterViewport({ target, difficulty }: { target: PlanetState | null; difficulty: number }) {
  return (
    <section className="relative overflow-hidden flex flex-col">
      {/* Single soft-glow target readout, bottom-left of the viewport */}
      <div className="flex-1" />
      <div className="px-8 pb-6">
        <AnimatePresence mode="wait">
          {target && (
            <motion.div
              key={target.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: C.yellow,
                  boxShadow: `0 0 8px ${C.yellow}, 0 0 14px ${C.yellow}66`,
                  animation: "pulse 2.4s ease-in-out infinite",
                }}
              />
              <div className="flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-[0.4em]" style={{ color: C.textFaint }}>
                  ORBITAL POSITION · STABLE
                </span>
                <span
                  className="text-[18px] font-display font-black tracking-[0.18em] mt-1.5"
                  style={{ color: C.text }}
                >
                  {target.name.toUpperCase()}
                  <span className="ml-3 text-[12px]" style={{ color: C.yellow }}>
                    D{difficulty}
                  </span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] mt-1" style={{ color: C.textFaint }}>
                  {target.sector} sector · {target.faction}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  CONTEXT COLUMN — flat vertical text, no boxes, spacing-driven
// ══════════════════════════════════════════════════════════════════════
function ContextColumn({
  account, war, target, difficulty, modifierIds,
}: {
  account: Account;
  war: WarState | null;
  target: PlanetState | null;
  difficulty: number;
  modifierIds: string[];
}) {
  const moProgress = useMemo(() => (war ? getMajorOrderProgress(war) : null), [war]);
  void moProgress; // currently informational; reserved
  const rewards = useMemo(() => {
    if (!target) return null;
    return calcRunReward({ victory: true, nodesCleared: 7, faction: target.faction, difficulty });
  }, [target, difficulty]);

  const activeModifiers = MODIFIERS.filter((m) => modifierIds.includes(m.id));
  const targetAccent = target ? FACTION_COLOR[target.faction] : C.yellow;

  return (
    <aside
      className="hidden md:flex flex-col px-6 py-7 gap-7 overflow-y-auto"
      style={{
        borderLeft: `1px solid ${C.hairline}`,
        background: "linear-gradient(270deg, rgba(10,13,18,0.6) 0%, rgba(10,13,18,0.35) 100%)",
      }}
    >
      {/* MISSION */}
      <Section label="Mission">
        {target ? (
          <>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display font-black tracking-[0.16em]"
                style={{ color: targetAccent, fontSize: 22, textShadow: `0 0 8px ${targetAccent}44` }}
              >
                {target.name.toUpperCase()}
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textFaint }}>
                D{difficulty}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: C.textFaint }}>
              {target.sector} · {target.biome} · {target.faction}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
              {war?.majorOrder?.briefing
                ?? `Liberate ${target.name} from ${target.faction} forces. Estimated theater: ${target.biome.toLowerCase()}.`}
            </p>

            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] mt-4" style={{ color: C.textFaint }}>
              <span>Liberation</span>
              <div className="flex-1 h-px" style={{ background: C.hairline }}>
                <div
                  className="h-full"
                  style={{
                    width: `${target.liberation}%`,
                    background: targetAccent,
                    boxShadow: `0 0 4px ${targetAccent}aa`,
                  }}
                />
              </div>
              <span className="tabular-nums" style={{ color: C.text }}>{target.liberation.toFixed(1)}%</span>
            </div>
          </>
        ) : (
          <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: C.textFaint }}>
            Awaiting target assignment.
          </p>
        )}
      </Section>

      {/* DIFFICULTY (only renders the readout — modifiers below if any) */}
      <Section label="Tactical">
        <div className="flex items-center gap-1.5 mb-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const idx = i + 1;
            const active = idx <= difficulty;
            const tone = idx >= 8 ? C.red : idx >= 5 ? C.orange : C.cyan;
            return (
              <div
                key={i}
                className="flex-1 h-[3px]"
                style={{
                  background: active ? tone : C.hairline,
                  boxShadow: active ? `0 0 4px ${tone}66` : undefined,
                }}
              />
            );
          })}
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
          {difficulty <= 2 ? "Trivial"
            : difficulty <= 4 ? "Medium"
              : difficulty <= 6 ? "Challenging"
                : difficulty <= 8 ? "Extreme"
                  : "Helldive"}
        </div>

        {activeModifiers.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {activeModifiers.map((m) => (
              <div key={m.id} className="flex items-baseline gap-2">
                <span style={{ color: C.orange, fontSize: 10 }}>⚠</span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.orange }}>
                    {m.name}
                  </span>
                  <span className="text-[10px] leading-snug" style={{ color: C.textDim }}>
                    {m.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* REWARDS */}
      {rewards && (
        <Section label="Estimated Rewards">
          <div className="flex flex-col gap-2">
            <RewardLine glyph="★" label="Medals" value={rewards.medals} accent={C.yellow} />
            <RewardLine
              glyph="◆"
              label="Samples"
              value={rewards.samples + rewards.rareSamples + rewards.superSamples}
              accent={C.cyan}
            />
            <RewardLine glyph="Ⓡ" label="Requisition" value={rewards.requisition} accent={C.orange} />
            <RewardLine glyph="✦" label="Experience" value={rewards.xp} unit="XP" accent={C.green} />
          </div>
        </Section>
      )}

      {/* SERVICE — single line, deeply muted */}
      <div className="mt-auto pt-4" style={{ borderTop: `1px solid ${C.hairline}` }}>
        <div className="flex items-baseline justify-between text-[9px] uppercase tracking-[0.3em]">
          <span style={{ color: C.textFaint }}>Service Record</span>
          <span style={{ color: C.textDim }}>
            {account.victories}/{account.totalRuns} · {account.totalRuns > 0
              ? Math.round((account.victories / account.totalRuns) * 100)
              : 0}% win
          </span>
        </div>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3
        className="text-[8px] uppercase tracking-[0.45em] font-display font-black mb-3"
        style={{ color: C.yellow }}
      >
        {label}
      </h3>
      {children}
    </section>
  );
}

function RewardLine({ glyph, label, value, unit, accent }: { glyph: string; label: string; value: number; unit?: string; accent: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <div className="flex items-baseline gap-2">
        <span style={{ color: accent, fontSize: 11, lineHeight: 1 }}>{glyph}</span>
        <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: C.textDim }}>
          {label}
        </span>
      </div>
      <span className="font-display font-black tabular-nums" style={{ color: accent, fontSize: 13 }}>
        +{value.toLocaleString()}
        {unit && <span className="text-[9px] ml-1 uppercase tracking-widest" style={{ color: C.textFaint }}>{unit}</span>}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  BOTTOM BAR — XP · stratagem chips · DEPLOY
// ══════════════════════════════════════════════════════════════════════
function BottomBar({
  account, target, difficulty, onDeploy, onLoadout,
}: {
  account: Account;
  target: PlanetState | null;
  difficulty: number;
  onDeploy: () => void;
  onLoadout: () => void;
}) {
  const xpNext = xpToLevelUp(account.level);
  const xpPct = Math.min(100, (account.xp / xpNext) * 100);
  const rank = getHelldiverRank(account.level);

  const stratagems = useMemo(() => {
    return CARD_LIBRARY.filter((c) => account.unlockedCards.includes(c.id)).slice(0, 5);
  }, [account.unlockedCards]);
  const slots = Array.from({ length: 5 }).map((_, i) => stratagems[i] ?? null);

  return (
    <footer
      className="relative px-6 py-4 flex items-center gap-6"
      style={{
        background: "linear-gradient(180deg, rgba(10,13,18,0.55) 0%, rgba(10,13,18,0.92) 100%)",
        borderTop: `1px solid ${C.hairline}`,
      }}
    >
      {/* XP — minimal */}
      <div className="hidden md:flex flex-col gap-1.5 min-w-[180px] shrink-0">
        <div className="flex items-baseline justify-between text-[9px] uppercase tracking-[0.3em]">
          <span style={{ color: C.textFaint }}>{rank.abbr} · LV {account.level}</span>
          <span className="tabular-nums" style={{ color: C.textDim }}>
            {account.xp.toLocaleString()} / {xpNext.toLocaleString()}
          </span>
        </div>
        <div className="h-px" style={{ background: C.hairline }}>
          <motion.div
            className="h-full"
            initial={false}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`,
              boxShadow: `0 0 4px ${C.yellow}aa`,
              height: 1,
            }}
          />
        </div>
      </div>

      {/* Stratagem chips — small, no borders, hover-lift */}
      <button
        type="button"
        onClick={onLoadout}
        className="hidden lg:flex flex-1 items-center gap-2 group"
      >
        <span className="text-[8px] uppercase tracking-[0.4em]" style={{ color: C.textFaint }}>LOADOUT</span>
        <div className="flex items-center gap-1.5">
          {slots.map((card, i) => (
            <StratagemChip key={i} card={card} />
          ))}
        </div>
        <span
          className="text-[9px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1"
          style={{ color: C.yellow }}
        >
          Edit →
        </span>
      </button>

      {/* DEPLOY — the only loud thing in the chrome */}
      <DeployButton onClick={onDeploy} target={target} difficulty={difficulty} />
    </footer>
  );
}

function StratagemChip({ card }: { card: { id: string; name: string; cost: number; type: string } | null }) {
  if (!card) {
    return (
      <div
        className="w-9 h-9 flex items-center justify-center"
        style={{ border: `1px dashed ${C.hairline}` }}
      >
        <span style={{ color: C.textFaint, fontSize: 11 }}>+</span>
      </div>
    );
  }
  const glyph: Record<string, string> = {
    eagle: "✦", orbital: "◎", sentry: "▣", support: "▤", backpack: "⛨", utility: "◊",
  };
  return (
    <div
      className="relative w-9 h-9 flex flex-col items-center justify-center transition-all duration-200 hover:bg-white/5"
      style={{ border: `1px solid ${C.hairline}` }}
      title={`${card.name} · ${card.cost}R`}
    >
      <span className="font-display font-black leading-none" style={{ color: C.yellow, fontSize: 12 }}>
        {glyph[card.type] ?? "◆"}
      </span>
      <span className="text-[7px] uppercase tracking-widest tabular-nums mt-0.5" style={{ color: C.textFaint }}>
        {card.cost}R
      </span>
    </div>
  );
}

function DeployButton({ onClick, target, difficulty }: { onClick: () => void; target: PlanetState | null; difficulty: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.98 }}
      className="relative shrink-0 px-7 py-2.5 flex items-center gap-3 overflow-hidden ml-auto"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${C.yellow} 0%, #ff9f3a 100%)`
          : `linear-gradient(135deg, ${C.yellow} 0%, ${C.orange} 100%)`,
        border: `1px solid ${C.yellow}`,
        boxShadow: hovered
          ? `0 0 30px ${C.yellow}cc, 0 0 60px ${C.yellow}55, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `0 0 18px ${C.yellow}88, inset 0 1px 0 rgba(255,255,255,0.2)`,
        transition: "background 240ms ease, box-shadow 240ms ease",
        minWidth: 220,
      }}
    >
      {/* Hover sweep */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-16 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
        initial={{ x: "-150%" }}
        animate={{ x: hovered ? "350%" : "-150%" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      <span aria-hidden className="font-display font-black text-xl leading-none" style={{ color: C.bg0 }}>▶</span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[8px] uppercase tracking-[0.4em] font-black" style={{ color: "rgba(0,0,0,0.6)" }}>
          {target ? `D${difficulty} · ${target.faction.toUpperCase()}` : "STANDBY"}
        </span>
        <span
          className="text-[14px] uppercase tracking-[0.3em] font-display font-black mt-1"
          style={{ color: C.bg0 }}
        >
          DEPLOY HELLDIVER
        </span>
      </div>
    </motion.button>
  );
}
