"use client";

/**
 * HUB · COMMAND CENTER (functional pass)
 * ──────────────────────────────────────────────────────────────────────
 * Fits in a single viewport (no scroll), uses SOLID side panels so the
 * bridge cinematic stays clean (no faded-black overlay over the image),
 * and surfaces what the player needs at a glance.
 *
 *   ┌──────────────┬───────────────────────────┬──────────────────┐
 *   │ PROFILE       │                           │ MISSION          │
 *   │ Currencies    │   BRIDGE CINEMATIC        │ Progress         │
 *   │ Dashboard     │   (clean, no darkening)   │ Rewards          │
 *   ├──────────────┴───────────────────────────┴──────────────────┤
 *   │              ▶ DEPLOY HELLDIVER                              │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Sizing target: ≥ 768px viewport height with no scrolling.
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
  generateActivity,
  listPlanets,
  loadWarState,
  type PlanetState,
  type WarState,
} from "@/lib/galacticWar";
import { MODIFIERS } from "@/lib/modifiers";
import HubCommandCenterBackground from "./hub/HubCommandCenterBackground";

// ──────────────────────────────────────────────────────────────────────
//  Tokens
// ──────────────────────────────────────────────────────────────────────
const C = {
  yellow: "#f5c542",
  yellowDim: "rgba(245,197,66,0.7)",
  orange: "#ff8a28",
  red: "#ff4d4d",
  cyan: "#60c4ff",
  green: "#10b981",
  bg0: "#0a0d12",
  panel: "#0e1218",         // solid panel background
  panelEdge: "#181f2a",     // panel inner highlight
  hairline: "rgba(245,197,66,0.16)",
  rule: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.92)",
  textMid: "rgba(255,255,255,0.65)",
  textDim: "rgba(255,255,255,0.4)",
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
      className="h-screen w-screen overflow-hidden text-white font-mono relative"
      style={{ background: C.bg0 }}
    >
      <HubCommandCenterBackground />

      <div
        className="relative z-50 h-full grid"
        style={{
          gridTemplateColumns: "300px minmax(0, 1fr) 340px",
          gridTemplateRows: "44px minmax(0, 1fr) 84px",
        }}
      >
        <TopStrip account={account} feed={feed} />

        <LeftPanel
          account={account}
          onWar={() => { sfx.click(); goToWar(); }}
          onLoadout={() => { sfx.click(); goToCharacter(); }}
          onArmory={() => { sfx.click(); goToArmory(); }}
          onResearch={() => { sfx.click(); goToCodex(); }}
          onSettings={() => { sfx.click(); goToCharacter(); }}
        />

        <CenterStage target={target} difficulty={difficulty} />

        <RightPanel
          account={account}
          war={war}
          target={target}
          difficulty={difficulty}
          modifierIds={modifiers}
        />

        <DeployBar
          target={target}
          difficulty={difficulty}
          onDeploy={() => { sfx.unlock(); sfx.beacon(); goToWar(); }}
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  TOP STRIP — slim row across all three columns
//  Holds the resources (currencies) + galactic feed ticker.
// ══════════════════════════════════════════════════════════════════════
function TopStrip({ account, feed }: { account: Account; feed: string[] }) {
  const samples = account.samples + account.rareSamples + account.superSamples;
  return (
    <header
      className="col-span-3 relative flex items-center px-5 gap-4"
      style={{
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bg0} 100%)`,
        borderBottom: `1px solid ${C.hairline}`,
      }}
    >
      {/* Hairline yellow accent at the very top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)` }}
      />

      {/* Galactic feed (left/center) */}
      <AnimatePresence mode="wait">
        {feed[0] && (
          <motion.div
            key={feed[0]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-1 min-w-0 items-center gap-3"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] uppercase tracking-[0.4em] shrink-0" style={{ color: C.textDim }}>
              GALACTIC FEED
            </span>
            <span className="text-[11px] truncate" style={{ color: C.textMid }}>
              {feed[0]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resources — inline pills, right-aligned */}
      <div className="flex items-center gap-5 shrink-0">
        <CurrencyPill glyph="★" label="MEDALS" value={account.medals} accent={C.yellow} />
        <CurrencyPill glyph="◆" label="SAMPLES" value={samples} accent={C.cyan} />
        <CurrencyPill glyph="Ⓡ" label="REQ" value={account.requisition} accent={C.orange} />
      </div>
    </header>
  );
}

function CurrencyPill({ glyph, label, value, accent }: { glyph: string; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="font-display font-black"
        style={{ color: accent, fontSize: 15, lineHeight: 1, textShadow: `0 0 6px ${accent}66` }}
      >
        {glyph}
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-[7px] uppercase tracking-widest" style={{ color: C.textDim }}>
          {label}
        </span>
        <span
          className="font-display font-black tabular-nums mt-0.5"
          style={{ color: accent, fontSize: 13 }}
        >
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  LEFT PANEL — profile + dashboard (Resources moved to TopStrip)
// ══════════════════════════════════════════════════════════════════════
function LeftPanel({
  account, onWar, onLoadout, onArmory, onResearch, onSettings,
}: {
  account: Account;
  onWar: () => void; onLoadout: () => void; onArmory: () => void;
  onResearch: () => void; onSettings: () => void;
}) {
  const rank = getHelldiverRank(account.level);
  const xpNext = xpToLevelUp(account.level);
  const xpPct = Math.min(100, (account.xp / xpNext) * 100);

  return (
    <aside
      className="row-span-1 flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bg0} 100%)`,
        borderRight: `1px solid ${C.hairline}`,
      }}
    >
      {/* PROFILE */}
      <section className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${C.rule}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0 border-2"
            style={{
              borderColor: C.yellow,
              background: `linear-gradient(135deg, ${C.yellow}28, ${C.yellow}08)`,
              boxShadow: `0 0 14px ${C.yellow}55, inset 0 0 8px ${C.yellow}22`,
              borderRadius: 1,
            }}
          >
            <span className="font-display font-black" style={{ color: C.yellow, fontSize: 22, lineHeight: 1, textShadow: `0 0 8px ${C.yellow}` }}>
              ☠
            </span>
          </div>
          <div className="flex flex-col leading-none min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
              Helldiver
            </span>
            <span
              className="text-[15px] font-display font-black tracking-wider truncate mt-1"
              style={{ color: C.yellow, textShadow: `0 0 4px ${C.yellow}55` }}
            >
              {account.helldiverName ?? "HELLDIVER"}
            </span>
          </div>
        </div>

        {/* Rank · Level — prominent yellow tag */}
        <div
          className="flex items-center justify-between px-3 py-2 mb-3"
          style={{
            background: `${C.yellow}15`,
            border: `1px solid ${C.yellow}55`,
            boxShadow: `inset 0 0 6px ${C.yellow}22`,
            borderRadius: 1,
          }}
        >
          <span
            className="text-[12px] uppercase tracking-[0.25em] font-display font-black"
            style={{ color: C.yellow }}
          >
            {rank.title}
          </span>
          <span
            className="text-[16px] font-display font-black tabular-nums"
            style={{ color: C.yellow, textShadow: `0 0 6px ${C.yellow}88` }}
          >
            LV {account.level}
          </span>
        </div>

        {/* XP bar */}
        <div className="flex items-baseline justify-between text-[9px] uppercase tracking-[0.25em] mb-1.5" style={{ color: C.textDim }}>
          <span>Experience</span>
          <span className="tabular-nums" style={{ color: C.textMid }}>
            {account.xp.toLocaleString()} / {xpNext.toLocaleString()}
          </span>
        </div>
        <div className="h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full"
            initial={false}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`,
              boxShadow: `0 0 6px ${C.yellow}cc`,
            }}
          />
        </div>
      </section>

      {/* DASHBOARD — bigger tiles, stronger pop */}
      <section className="px-3 py-4 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3
            className="text-[10px] uppercase tracking-[0.4em] font-display font-black"
            style={{ color: C.yellow, textShadow: `0 0 4px ${C.yellow}66` }}
          >
            ◆ Dashboard
          </h3>
          <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>5 routes</span>
        </div>

        <nav className="flex flex-col gap-2">
          <DashItem icon="✦" label="Galactic Map"  sub="Sector Deployment"      onClick={onWar} />
          <DashItem icon="◇" label="Loadout"        sub="Equipment · Stratagems" onClick={onLoadout} />
          <DashItem icon="⌥" label="Armory"         sub="Weapons · Stratagems"   onClick={onArmory} />
          <DashItem icon="◊" label="Research"       sub="Codex · Lore"           onClick={onResearch} />
          <DashItem icon="⚙" label="Settings"       sub="Audio · Accessibility"  onClick={onSettings} />
        </nav>
      </section>
    </aside>
  );
}

function DashItem({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-3 py-3 text-left relative overflow-hidden"
      style={{
        background: hovered
          ? `linear-gradient(90deg, ${C.yellow}1f 0%, ${C.yellow}06 60%, transparent 100%)`
          : `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%)`,
        border: `1px solid ${hovered ? C.yellow : C.rule}`,
        boxShadow: hovered
          ? `inset 4px 0 0 ${C.yellow}, 0 0 12px ${C.yellow}33`
          : `inset 4px 0 0 transparent`,
        borderRadius: 1,
        transition: "background 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
      }}
    >
      {/* Icon tile — bigger, bordered, glows on hover */}
      <div
        className="w-10 h-10 flex items-center justify-center shrink-0"
        style={{
          border: `1px solid ${hovered ? C.yellow : `${C.yellow}55`}`,
          background: hovered ? `${C.yellow}1a` : `${C.yellow}08`,
          boxShadow: hovered ? `0 0 10px ${C.yellow}66, inset 0 0 6px ${C.yellow}22` : `inset 0 0 4px ${C.yellow}10`,
          borderRadius: 1,
          transition: "background 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
        }}
      >
        <span
          className="font-display font-black leading-none transition-all duration-200"
          style={{
            color: C.yellow,
            fontSize: 18,
            textShadow: hovered ? `0 0 8px ${C.yellow}` : `0 0 4px ${C.yellow}55`,
          }}
        >
          {icon}
        </span>
      </div>

      {/* Labels */}
      <div className="flex flex-col leading-none min-w-0 flex-1">
        <span
          className="text-[13px] uppercase tracking-[0.18em] font-display font-black truncate"
          style={{
            color: hovered ? C.yellow : C.text,
            textShadow: hovered ? `0 0 4px ${C.yellow}66` : undefined,
            transition: "color 220ms ease",
          }}
        >
          {label}
        </span>
        <span className="text-[9px] uppercase tracking-[0.25em] mt-1 truncate" style={{ color: C.textDim }}>
          {sub}
        </span>
      </div>

      {/* Right chevron — slides in on hover */}
      <motion.span
        aria-hidden
        animate={{ x: hovered ? 0 : -4, opacity: hovered ? 1 : 0.25 }}
        transition={{ duration: 0.2 }}
        className="ml-auto font-display font-black shrink-0"
        style={{
          color: C.yellow,
          fontSize: 14,
          textShadow: hovered ? `0 0 6px ${C.yellow}88` : undefined,
        }}
      >
        ▶
      </motion.span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  CENTER STAGE — clean cinematic, soft target readout
// ══════════════════════════════════════════════════════════════════════
function CenterStage({
  target, difficulty,
}: {
  target: PlanetState | null;
  difficulty: number;
}) {
  return (
    <section className="row-span-1 relative overflow-hidden flex flex-col">
      <div className="flex-1" />

      {/* Bottom-left target readout */}
      <AnimatePresence mode="wait">
        {target && (
          <motion.div
            key={target.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute bottom-5 left-6 flex items-center gap-3 pointer-events-none"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.75)" }}
          >
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: C.yellow,
                boxShadow: `0 0 8px ${C.yellow}, 0 0 14px ${C.yellow}66`,
              }}
            />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>
                ORBITAL POSITION · STABLE
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span
                  className="text-[20px] font-display font-black tracking-[0.18em]"
                  style={{ color: C.text }}
                >
                  {target.name.toUpperCase()}
                </span>
                <span className="text-[14px] font-display font-black" style={{ color: C.yellow }}>
                  D{difficulty}
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.3em] mt-1" style={{ color: C.textDim }}>
                {target.sector} sector · {target.faction}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  RIGHT PANEL — mission progress + rewards
// ══════════════════════════════════════════════════════════════════════
function RightPanel({
  account, war, target, difficulty, modifierIds,
}: {
  account: Account;
  war: WarState | null;
  target: PlanetState | null;
  difficulty: number;
  modifierIds: string[];
}) {
  const rewards = useMemo(() => {
    if (!target) return null;
    return calcRunReward({ victory: true, nodesCleared: 7, faction: target.faction, difficulty });
  }, [target, difficulty]);

  const activeModifiers = MODIFIERS.filter((m) => modifierIds.includes(m.id));
  const targetAccent = target ? FACTION_COLOR[target.faction] : C.yellow;
  const winRate = account.totalRuns > 0
    ? Math.round((account.victories / account.totalRuns) * 100)
    : 0;

  return (
    <aside
      className="row-span-1 flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bg0} 100%)`,
        borderLeft: `1px solid ${C.hairline}`,
      }}
    >
      {/* MISSION */}
      <section className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${C.rule}` }}>
        <h3 className="text-[9px] uppercase tracking-[0.4em] mb-3" style={{ color: C.textDim }}>
          Mission Briefing
        </h3>
        {target ? (
          <>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display font-black tracking-[0.16em]"
                style={{ color: targetAccent, fontSize: 18, textShadow: `0 0 6px ${targetAccent}55` }}
              >
                {target.name.toUpperCase()}
              </span>
              <span className="text-[11px] uppercase tracking-[0.25em] font-black" style={{ color: C.yellow }}>
                D{difficulty}
              </span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ color: C.textDim }}>
              {target.sector} · {target.biome} · {target.faction}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: C.textMid }}>
              {war?.majorOrder?.briefing
                ?? `Liberate ${target.name} from ${target.faction} forces. Estimated theater: ${target.biome.toLowerCase()}.`}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-[8px] uppercase tracking-[0.3em] shrink-0" style={{ color: C.textDim }}>
                LIBERATION
              </span>
              <div className="flex-1 h-[3px]" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full"
                  style={{
                    width: `${target.liberation}%`,
                    background: targetAccent,
                    boxShadow: `0 0 4px ${targetAccent}aa`,
                  }}
                />
              </div>
              <span className="text-[10px] tabular-nums shrink-0" style={{ color: targetAccent }}>
                {target.liberation.toFixed(1)}%
              </span>
            </div>
          </>
        ) : (
          <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
            Awaiting target assignment.
          </p>
        )}
      </section>

      {/* TACTICAL */}
      <section className="px-5 py-4" style={{ borderBottom: `1px solid ${C.rule}` }}>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-[9px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>
            Threat Level
          </h3>
          <span className="text-[10px] uppercase tracking-[0.25em] font-black" style={{ color: C.yellow }}>
            {difficulty <= 2 ? "Trivial"
              : difficulty <= 4 ? "Medium"
                : difficulty <= 6 ? "Challenging"
                  : difficulty <= 8 ? "Extreme"
                    : "Helldive"}
          </span>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const idx = i + 1;
            const active = idx <= difficulty;
            const tone = idx >= 8 ? C.red : idx >= 5 ? C.orange : C.cyan;
            return (
              <div
                key={i}
                className="flex-1 h-[5px]"
                style={{
                  background: active ? tone : "rgba(255,255,255,0.06)",
                  boxShadow: active ? `0 0 4px ${tone}66` : undefined,
                  borderRadius: 1,
                }}
              />
            );
          })}
        </div>

        {activeModifiers.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {activeModifiers.slice(0, 2).map((m) => (
              <div key={m.id} className="flex items-baseline gap-2">
                <span style={{ color: C.orange, fontSize: 10 }}>⚠</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: C.orange }}>
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* REWARDS */}
      {rewards && (
        <section className="px-5 py-4" style={{ borderBottom: `1px solid ${C.rule}` }}>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-[9px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>
              Estimated Rewards
            </h3>
            <span className="text-[8px] uppercase tracking-[0.25em]" style={{ color: C.green }}>
              Victory
            </span>
          </div>
          <RewardLine glyph="★" label="Medals" value={rewards.medals} accent={C.yellow} />
          <RewardLine glyph="◆" label="Samples" value={rewards.samples + rewards.rareSamples + rewards.superSamples} accent={C.cyan} />
          <RewardLine glyph="Ⓡ" label="Requisition" value={rewards.requisition} accent={C.orange} />
          <RewardLine glyph="✦" label="XP" value={rewards.xp} accent={C.green} />
        </section>
      )}

      {/* SERVICE RECORD */}
      <section className="px-5 py-4 mt-auto">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-[9px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>
            Service Record
          </h3>
          <span className="text-[11px] tabular-nums font-black" style={{ color: C.yellow }}>
            {winRate}% WIN
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
          <div className="flex items-baseline justify-between">
            <span style={{ color: C.textDim }}>Runs</span>
            <span className="tabular-nums font-black" style={{ color: C.text }}>{account.totalRuns}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span style={{ color: C.textDim }}>Wins</span>
            <span className="tabular-nums font-black" style={{ color: C.green }}>{account.victories}</span>
          </div>
        </div>
      </section>
    </aside>
  );
}

function RewardLine({ glyph, label, value, accent }: { glyph: string; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <div className="flex items-center gap-2">
        <span style={{ color: accent, fontSize: 12, lineHeight: 1 }}>{glyph}</span>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.textMid }}>
          {label}
        </span>
      </div>
      <span className="font-display font-black tabular-nums" style={{ color: accent, fontSize: 13 }}>
        +{value.toLocaleString()}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  DEPLOY BAR — full-width bottom strip
// ══════════════════════════════════════════════════════════════════════
function DeployBar({
  target, difficulty, onDeploy,
}: {
  target: PlanetState | null;
  difficulty: number;
  onDeploy: () => void;
}) {
  return (
    <footer
      className="col-span-3 relative flex items-center px-6 gap-6"
      style={{
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bg0} 100%)`,
        borderTop: `1px solid ${C.hairline}`,
      }}
    >
      {/* Hairline yellow accent at the very top of the bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)` }}
      />

      {/* Mission context — left of button */}
      <div className="flex flex-col leading-none min-w-0">
        <span className="text-[9px] uppercase tracking-[0.35em]" style={{ color: C.textDim }}>
          Pre-Drop · Hellpod ready
        </span>
        <span className="text-[12px] uppercase tracking-[0.2em] font-display font-black mt-1.5" style={{ color: C.text }}>
          {target ? `Deploying to ${target.name.toUpperCase()}` : "No target selected"}
        </span>
      </div>

      <div className="flex-1" />

      {/* DEPLOY — the focal element */}
      <DeployButton onClick={onDeploy} target={target} difficulty={difficulty} />
    </footer>
  );
}

function DeployButton({ onClick, target, difficulty }: { onClick: () => void; target: PlanetState | null; difficulty: number }) {
  const [hovered, setHovered] = useState(false);
  const disabled = !target;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={clsx("relative shrink-0 px-7 py-3 flex items-center gap-3 overflow-hidden", disabled && "opacity-50 cursor-not-allowed")}
      style={{
        background: hovered && !disabled
          ? `linear-gradient(135deg, ${C.yellow} 0%, #ffae50 100%)`
          : `linear-gradient(135deg, ${C.yellow} 0%, ${C.orange} 100%)`,
        border: `2px solid ${C.yellow}`,
        boxShadow: hovered && !disabled
          ? `0 0 32px ${C.yellow}cc, 0 0 70px ${C.yellow}55, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `0 0 20px ${C.yellow}88, inset 0 1px 0 rgba(255,255,255,0.2)`,
        borderRadius: 1,
        transition: "background 240ms ease, box-shadow 240ms ease",
        minWidth: 260,
      }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-20 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)" }}
        initial={{ x: "-150%" }}
        animate={{ x: hovered && !disabled ? "350%" : "-150%" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      <span aria-hidden className="font-display font-black text-2xl leading-none" style={{ color: C.bg0 }}>▶</span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] uppercase tracking-[0.4em] font-black" style={{ color: "rgba(0,0,0,0.6)" }}>
          {target ? `D${difficulty} · ${target.faction.toUpperCase()}` : "STANDBY"}
        </span>
        <span
          className="text-[15px] uppercase tracking-[0.3em] font-display font-black mt-1"
          style={{ color: C.bg0 }}
        >
          DEPLOY HELLDIVER
        </span>
      </div>
    </motion.button>
  );
}
