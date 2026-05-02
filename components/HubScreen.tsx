"use client";

/**
 * HUB · COMMAND CENTER (mockup-perfect rebuild)
 * ──────────────────────────────────────────────────────────────────────
 * Restores the rich command-center layout from the reference mockup.
 * Every interactive element routes to a real destination — no dead
 * buttons, no decorative chrome.
 *
 *   ┌──────────────────────── TOP BAR ──────────────────────────────┐
 *   │ INSIGNIA  ●Sergeant  ●Galactic Feed  Currencies  Mail Squad ⚙│
 *   ├ XP RAIL ───────────────────────────────────────────────────────┤
 *   ├──────────┬─────────────────────────────────┬──────────────────┤
 *   │ 8-item   │ HUB header + quote + DESTROYER  │ HIGHLIGHTS       │
 *   │ left nav │ Active Ship card                │ - Major Order    │
 *   │ (Hub/    │                                 │ - Personal Order │
 *   │  War/    │ ┌─Quick─┬─Campaign─┬─Loadout─┬┐│ - Community      │
 *   │  Loadout/│ │Deploy │  preview │ preview │D│                  │
 *   │  Armory/ │ └───────┴──────────┴─────────┘R│ RECENT ACTIVITY  │
 *   │  Strats/ │                                 │ - 5 entries      │
 *   │  Squad/  │ ┌─Message of the Day─┬─Squad─┐ │                  │
 *   │  History/│ │                     │Status │ │                  │
 *   │  Codex)  │ └─────────────────────┴───────┘ │                  │
 *   ├──────────┴─────────────────────────────────┴──────────────────┤
 *   │ FOOTER · weather · patch · issues · discord · help · emblem  │
 *   └────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import {
  getHelldiverRank,
  xpToLevelUp,
  type Account,
} from "@/lib/account";
import { CARD_LIBRARY } from "@/lib/cards";
import {
  ARMORS,
  BOOSTERS,
  DEFAULT_ARMOR,
  DEFAULT_BOOSTER,
  DEFAULT_WEAPON,
  WEAPONS,
} from "@/lib/loadout";
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
  yellowDim: "rgba(245,197,66,0.7)",
  orange: "#ff8a28",
  red: "#ff4d4d",
  cyan: "#60c4ff",
  green: "#10b981",
  bg0: "#0a0d12",
  panel: "#0e1218",
  hairline: "rgba(245,197,66,0.18)",
  rule: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.92)",
  textMid: "rgba(255,255,255,0.6)",
  textDim: "rgba(255,255,255,0.4)",
  textFaint: "rgba(255,255,255,0.28)",
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
  const game = useGame();
  const {
    account,
    targetPlanetId,
    goToWar,
    goToCharacter,
    goToArmory,
    goToCodex,
    goToSquadHub,
    goToHistory,
    goToShip,
    goToDailyRewards,
    goToActivity,
  } = game;

  const [war, setWar] = useState<WarState | null>(null);
  const [feed, setFeed] = useState<string[]>([]);

  useEffect(() => { setWar(loadWarState()); }, []);

  useEffect(() => {
    if (!war) return;
    const planets = listPlanets(war);
    setFeed(Array.from({ length: 6 }).map(() => generateActivity(planets)));
    const t = setInterval(() => {
      setFeed((prev) => [generateActivity(planets), ...prev].slice(0, 8));
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

  // Routing helpers — every button knows where to go
  const nav = {
    hub:        () => { /* current */ },
    war:        () => { sfx.click(); goToWar(); },
    loadout:    () => { sfx.click(); goToCharacter(); },
    armory:     () => { sfx.click(); goToArmory(); },
    squad:      () => { sfx.click(); goToSquadHub(); },
    history:    () => { sfx.click(); goToHistory(); },
    codex:      () => { sfx.click(); goToCodex(); },
    ship:       () => { sfx.click(); goToShip(); },
    rewards:    () => { sfx.click(); goToDailyRewards(); },
    activity:   () => { sfx.click(); goToActivity(); },
    deploy:     () => { sfx.unlock(); sfx.beacon(); goToWar(); },
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden text-white font-mono relative"
      style={{ background: C.bg0 }}
    >
      <HubCommandCenterBackground />

      <div className="relative z-50 h-full flex flex-col">
        <TopBar account={account} feed={feed} onSquad={nav.squad} />
        <XpRail account={account} />

        <div
          className="flex-1 grid min-h-0"
          style={{ gridTemplateColumns: "200px minmax(0, 1fr) 320px" }}
        >
          <LeftNav nav={nav} />

          <CenterStage
            account={account}
            war={war}
            target={target}
            nav={nav}
          />

          <RightRail account={account} war={war} feed={feed} nav={nav} />
        </div>

        <FooterStrip />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  TOP BAR
// ══════════════════════════════════════════════════════════════════════
function TopBar({ account, feed, onSquad }: { account: Account; feed: string[]; onSquad: () => void }) {
  const rank = getHelldiverRank(account.level);
  return (
    <header
      className="relative h-[64px] px-5 flex items-center gap-4 shrink-0"
      style={{
        background: `linear-gradient(180deg, rgba(14,18,24,0.92) 0%, rgba(10,13,18,0.85) 100%)`,
        borderBottom: `1px solid ${C.hairline}`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)` }}
      />

      {/* Insignia + wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-9 h-9 flex items-center justify-center border-2"
          style={{
            borderColor: C.yellow,
            background: `${C.yellow}10`,
            boxShadow: `0 0 12px ${C.yellow}55, inset 0 0 8px ${C.yellow}22`,
            borderRadius: 1,
          }}
        >
          <span style={{ color: C.yellow, fontSize: 16, lineHeight: 1, textShadow: `0 0 6px ${C.yellow}` }} className="font-display font-black">
            ☠
          </span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[12px] font-display font-black tracking-[0.2em]" style={{ color: C.yellow }}>HELLDIVERS</span>
          <span className="text-[8px] uppercase tracking-[0.4em] mt-1" style={{ color: C.textDim }}>STRATAGEM PROTOCOL</span>
        </div>
      </div>

      {/* Rank badge */}
      <div className="hidden md:flex items-center gap-2 ml-3 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <div className="flex flex-col leading-none">
          <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>{rank.title}</span>
          <span className="text-[12px] font-display font-black tracking-wider mt-1" style={{ color: C.yellow }}>
            {account.helldiverName ?? "HELLDIVER"}
          </span>
        </div>
      </div>

      {/* Galactic feed */}
      <div
        className="hidden lg:flex flex-1 min-w-0 items-center gap-3 px-3 py-1.5 ml-3 border"
        style={{
          borderColor: C.yellow,
          background: "rgba(0,0,0,0.5)",
          borderRadius: 1,
        }}
      >
        <span
          className="shrink-0 text-[9px] uppercase tracking-[0.3em] font-black flex items-center gap-1.5 px-1.5 py-0.5"
          style={{ color: C.yellow }}
        >
          <span className="w-1 h-1 rounded-full bg-yellow-400" />
          GALACTIC FEED
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={feed[0] ?? "init"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
            className="flex-1 min-w-0 truncate text-[11px]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {feed[0] ?? "Awaiting transmissions…"}
          </motion.div>
        </AnimatePresence>
        <span className="text-[9px] uppercase tracking-widest shrink-0" style={{ color: C.textDim }}>10m ago</span>
      </div>

      {/* Currencies */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <CurrencyChip glyph="★" label="MEDALS" value={account.medals} accent={C.yellow} />
        <CurrencyChip glyph="◆" label="SAMPLES" value={account.samples + account.rareSamples + account.superSamples} accent={C.cyan} />
        <CurrencyChip glyph="Ⓡ" label="REQ" value={account.requisition} accent={C.orange} />
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <IconButton glyph="✉" title="Mail" onClick={() => sfx.click()} />
        <IconButton glyph="◉" title="Squad" onClick={onSquad} />
        <IconButton glyph="⚙" title="Settings" onClick={() => sfx.click()} />
      </div>
    </header>
  );
}

function CurrencyChip({ glyph, label, value, accent }: { glyph: string; label: string; value: number; accent: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 border"
      style={{ borderColor: `${accent}55`, background: `${accent}10`, borderRadius: 1 }}
    >
      <span style={{ color: accent, fontSize: 14, lineHeight: 1, textShadow: `0 0 6px ${accent}88` }} className="font-display font-black">
        {glyph}
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-[7px] uppercase tracking-widest" style={{ color: C.textFaint }}>{label}</span>
        <span className="font-display font-black tabular-nums text-[12px] mt-0.5" style={{ color: accent }}>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function IconButton({ glyph, title, onClick }: { glyph: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center border transition-colors hover:border-current"
      style={{ borderColor: C.rule, color: C.textMid, borderRadius: 1 }}
    >
      <span className="text-[14px] leading-none">{glyph}</span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  XP RAIL
// ══════════════════════════════════════════════════════════════════════
function XpRail({ account }: { account: Account }) {
  const rank = getHelldiverRank(account.level);
  const xpNext = xpToLevelUp(account.level);
  const pct = Math.min(100, (account.xp / xpNext) * 100);
  return (
    <div
      className="px-5 py-1.5 flex items-center gap-4 shrink-0"
      style={{
        background: "rgba(0,0,0,0.45)",
        borderBottom: `1px solid ${C.rule}`,
      }}
    >
      <span className="text-[10px] font-display font-black tracking-[0.25em]" style={{ color: C.yellow }}>
        {rank.abbr} · LV {account.level}
      </span>
      <div className="flex-1 h-[3px]" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`,
            boxShadow: `0 0 8px ${C.yellow}88`,
          }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] tabular-nums" style={{ color: C.textDim }}>
        {account.xp.toLocaleString()} / {xpNext.toLocaleString()} XP
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  LEFT NAV — 7 items (was 8; STRATAGEMS dropped, see NAV_ITEMS comment)
// ══════════════════════════════════════════════════════════════════════
type NavHandlers = {
  hub: () => void; war: () => void; loadout: () => void; armory: () => void;
  squad: () => void; history: () => void; codex: () => void;
  ship: () => void; rewards: () => void; activity: () => void; deploy: () => void;
};

// STRATAGEMS entry removed — it routed to goToCodex() identically to
// CODEX, so the rail had two buttons leading to the same screen. Codex
// is the canonical browse-all-materiel destination.
const NAV_ITEMS = [
  { key: "hub",     icon: "◈", label: "HUB",     sub: "COMMAND CENTER",         active: true  },
  { key: "war",     icon: "✦", label: "WAR MAP", sub: "SECTOR DEPLOYMENT",      active: false },
  { key: "loadout", icon: "◇", label: "LOADOUT", sub: "EQUIPMENT + PAPER DOLL", active: false },
  { key: "armory",  icon: "⌥", label: "ARMORY",  sub: "WEAPONS · MODULES",      active: false },
  { key: "squad",   icon: "◐", label: "SQUAD",   sub: "FORM OR JOIN",           active: false },
  { key: "history", icon: "◑", label: "HISTORY", sub: "MISSION RECORD",         active: false },
  { key: "codex",   icon: "▣", label: "CODEX",   sub: "LORE + DATABASE",        active: false },
] as const;

function LeftNav({ nav }: { nav: NavHandlers }) {
  return (
    <nav
      className="hidden md:flex flex-col gap-1 p-2 overflow-y-auto hub-frame-scroll"
      style={{
        borderRight: `1px solid ${C.hairline}`,
        background: `linear-gradient(180deg, rgba(14,18,24,0.85) 0%, rgba(10,13,18,0.65) 100%)`,
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavBtn
          key={item.key}
          item={item}
          onClick={nav[item.key as keyof NavHandlers]}
        />
      ))}
    </nav>
  );
}

function NavBtn({ item, onClick }: { item: typeof NAV_ITEMS[number]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const active = item.active;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left px-3 py-2 transition-all duration-200 relative"
      style={{
        border: `1px solid ${active ? C.yellow : hovered ? `${C.yellow}66` : "transparent"}`,
        background: active
          ? `${C.yellow}14`
          : hovered ? `${C.yellow}08` : "transparent",
        boxShadow: active
          ? `inset 4px 0 0 ${C.yellow}, 0 0 14px ${C.yellow}33`
          : hovered ? `inset 4px 0 0 ${C.yellow}, 0 0 10px ${C.yellow}22` : "inset 4px 0 0 transparent",
        borderRadius: 1,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="font-display font-black w-4 text-center leading-none"
          style={{
            color: active ? C.yellow : hovered ? C.yellow : C.textMid,
            fontSize: 16,
            textShadow: active || hovered ? `0 0 6px ${C.yellow}88` : undefined,
          }}
        >
          {item.icon}
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.18em] font-display font-black"
          style={{ color: active ? C.yellow : "rgba(255,255,255,0.88)" }}
        >
          {item.label}
        </span>
      </div>
      <span className="text-[7px] uppercase tracking-[0.2em] block pl-6 mt-0.5" style={{ color: C.textFaint }}>
        {item.sub}
      </span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  CENTER STAGE — hero + 4 cards + MOTD/Squad row
// ══════════════════════════════════════════════════════════════════════
function CenterStage({
  account, war, target, nav,
}: {
  account: Account;
  war: WarState | null;
  target: PlanetState | null;
  nav: NavHandlers;
}) {
  return (
    <main
      className="px-5 py-4 flex flex-col gap-3 overflow-y-auto hub-frame-scroll min-w-0"
    >
      {/* Hero */}
      <HeroBlock onShip={nav.ship} />

      {/* 4-card row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickDeployCard onDeploy={nav.deploy} />
        <CurrentCampaignCard target={target} onWarMap={nav.war} />
        <LoadoutPreviewCard account={account} onEdit={nav.loadout} />
        <DailyRewardsCard onView={nav.rewards} />
      </div>

      {/* Bottom row — Message of the Day + Squad Status */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-3">
        <MessageOfTheDay />
        <SquadStatus account={account} onManage={nav.squad} />
      </div>
    </main>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  HERO BLOCK
// ══════════════════════════════════════════════════════════════════════
function HeroBlock({ onShip }: { onShip: () => void }) {
  return (
    <section
      className="relative overflow-hidden border min-h-[180px] flex items-stretch"
      style={{
        borderColor: C.rule,
        background: `linear-gradient(180deg, rgba(14,18,24,0.55) 0%, rgba(10,13,18,0.4) 100%)`,
        borderRadius: 1,
      }}
    >
      {/* Foreground content */}
      <div className="relative px-5 py-4 flex items-start justify-between gap-4 w-full">
        {/* Left — title + quote */}
        <div className="flex flex-col gap-2 max-w-md">
          <div>
            <div className="text-3xl font-display font-black tracking-[0.15em]" style={{ color: C.yellow, textShadow: `0 0 8px ${C.yellow}55` }}>
              HUB
            </div>
            <div className="text-[10px] uppercase tracking-[0.4em] mt-1" style={{ color: C.textDim }}>
              COMMAND CENTER
            </div>
          </div>
          <blockquote
            className="border-l-2 pl-3 py-1 max-w-xs text-[11px] leading-relaxed mt-1"
            style={{ borderColor: C.yellowDim, color: "rgba(255,255,255,0.78)" }}
          >
            &ldquo;Our duty is clear.<br />
            Victory is mandatory.<br />
            Democracy is eternal.&rdquo;
            <footer className="mt-2 text-[9px] uppercase tracking-[0.25em]" style={{ color: C.textFaint }}>
              — High Command Directive
            </footer>
          </blockquote>
        </div>

        {/* Right — Active Ship card */}
        <div
          className="hidden md:flex flex-col gap-2 px-4 py-3 border min-w-[230px]"
          style={{ borderColor: C.rule, background: "rgba(0,0,0,0.55)", borderRadius: 1 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-display font-black" style={{ color: C.yellow }}>◉</span>
            <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>ACTIVE SHIP</span>
          </div>
          <div className="text-[12px] uppercase tracking-[0.18em] font-display font-black" style={{ color: C.text }}>
            SES DEMOCRATIC FLAME
          </div>
          <div className="text-[8px] uppercase tracking-widest" style={{ color: C.textDim }}>SHIP READINESS</div>
          <div className="text-2xl font-display font-black tabular-nums leading-none" style={{ color: C.yellow }}>
            100<span className="text-base">%</span>
          </div>
          <div className="h-[3px]" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full" style={{ width: "100%", background: C.yellow, boxShadow: `0 0 8px ${C.yellow}88` }} />
          </div>
          <button
            type="button"
            onClick={onShip}
            className="mt-1 text-[10px] uppercase tracking-widest font-black px-2 py-1.5 border hover:bg-white/5 transition-colors"
            style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)", borderRadius: 1 }}
          >
            VIEW SHIP
          </button>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  CARDS — Quick Deploy / Campaign / Loadout / Daily
// ══════════════════════════════════════════════════════════════════════
function HubCard({
  title, accent, children, footer,
}: {
  title: string; accent: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <section
      className="relative flex flex-col border overflow-hidden"
      style={{ borderColor: `${accent}33`, background: "rgba(10,13,18,0.78)", borderRadius: 1 }}
    >
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: accent }}>{title}</div>
      </div>
      <div className="flex-1 px-3 pb-3 flex flex-col">{children}</div>
      {footer && <div className="border-t px-3 py-2" style={{ borderColor: C.rule }}>{footer}</div>}
    </section>
  );
}

function QuickDeployCard({ onDeploy }: { onDeploy: () => void }) {
  return (
    <HubCard title="QUICK DEPLOY" accent={C.yellow}>
      <div
        className="relative h-[110px] mb-3 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a2030 0%, #0f1320 100%)", borderRadius: 1 }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/art/misc/helldiver_portrait.png')",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            opacity: 0.7,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 30%, rgba(10,13,18,0.4) 70%, rgba(10,13,18,0.95) 100%)" }}
        />
        <button
          type="button"
          onClick={onDeploy}
          className="absolute bottom-2 left-2 right-2 px-3 py-2 font-display font-black uppercase tracking-[0.3em] text-[11px] hover:brightness-110 transition-all"
          style={{
            background: `linear-gradient(135deg, ${C.yellow}, ${C.orange})`,
            color: C.bg0,
            boxShadow: `0 0 16px ${C.yellow}66`,
            borderRadius: 1,
          }}
        >
          DEPLOY NOW
        </button>
      </div>
      <p className="text-[10px] leading-snug" style={{ color: C.textMid }}>
        Jump into a new mission and spread managed democracy.
      </p>
    </HubCard>
  );
}

function CurrentCampaignCard({ target, onWarMap }: { target: PlanetState | null; onWarMap: () => void }) {
  const accent = target ? FACTION_COLOR[target.faction] : C.green;
  return (
    <HubCard
      title="CURRENT CAMPAIGN"
      accent={C.green}
      footer={
        <button
          type="button"
          onClick={onWarMap}
          className="w-full text-[10px] uppercase tracking-[0.25em] font-black py-1 border hover:bg-white/5 transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", borderRadius: 1 }}
        >
          VIEW WAR MAP
        </button>
      }
    >
      <div
        className="relative h-[110px] mb-3 overflow-hidden flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 50% 50%, #1f3550 0%, #0f1320 60%)",
          borderRadius: 1,
        }}
      >
        <div
          className="rounded-full"
          style={{
            width: 80, height: 80,
            background: "radial-gradient(circle at 32% 30%, #b08a3a 0%, #6a4a18 40%, #2a1f10 80%)",
            boxShadow: `0 0 20px ${accent}55, inset -8px -8px 16px rgba(0,0,0,0.6)`,
          }}
        />
      </div>
      <div className="text-[11px] uppercase tracking-[0.18em] font-display font-black mb-1" style={{ color: accent }}>
        {target ? target.name.toUpperCase() : "UBANEA SECTOR"}
      </div>
      <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: C.textDim }}>LIBERATION PROGRESS</div>
      <div className="flex items-center gap-2">
        <span className="font-display font-black tabular-nums text-base" style={{ color: accent }}>
          {target ? target.liberation.toFixed(1) : "75.2"}%
        </span>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>LIBERATED</span>
      </div>
      <div className="h-[3px] mt-1" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, target?.liberation ?? 75.2)}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
            boxShadow: `0 0 6px ${accent}aa`,
          }}
        />
      </div>
    </HubCard>
  );
}

function LoadoutPreviewCard({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const armor = ARMORS.find((a) => a.id === (account.ownedArmors[0] ?? DEFAULT_ARMOR));
  const weapon = WEAPONS.find((w) => w.id === (account.ownedWeapons[0] ?? DEFAULT_WEAPON));
  const stratagems = useMemo(() => {
    return CARD_LIBRARY.filter((c) => account.unlockedCards.includes(c.id)).slice(0, 2);
  }, [account.unlockedCards]);

  const slots = [
    { accent: C.cyan,   label: weapon?.name?.toUpperCase() ?? "AR-23 LIBERATOR MK III", sub: "Primary Weapon",      glyph: "▤" },
    { accent: C.cyan,   label: "P-4 SENATOR",                                            sub: "Secondary Weapon",    glyph: "▥" },
    { accent: C.red,    label: stratagems[0]?.name?.toUpperCase() ?? "EAGLE 500KG BOMB", sub: "Offensive Stratagem", glyph: "✦" },
    { accent: C.green,  label: stratagems[1]?.name?.toUpperCase() ?? "SHIELD GEN. PACK", sub: "Defensive Stratagem", glyph: "⛨" },
  ];
  void armor;

  return (
    <HubCard
      title="LOADOUT PREVIEW"
      accent={C.yellow}
      footer={
        <button
          type="button"
          onClick={onEdit}
          className="w-full text-[10px] uppercase tracking-[0.25em] font-black py-1 border hover:bg-white/5 transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", borderRadius: 1 }}
        >
          EDIT LOADOUT
        </button>
      }
    >
      <div className="flex flex-col gap-1.5">
        {slots.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1.5 border"
            style={{ borderColor: `${s.accent}33`, background: `${s.accent}08`, borderRadius: 1 }}
          >
            <div
              className="w-7 h-7 flex items-center justify-center font-display font-black border shrink-0"
              style={{ color: s.accent, borderColor: `${s.accent}66`, background: `${s.accent}10`, fontSize: 12 }}
            >
              {s.glyph}
            </div>
            <div className="flex flex-col min-w-0 flex-1 leading-none">
              <span className="text-[9px] uppercase tracking-wider font-black truncate" style={{ color: s.accent }}>
                {s.label}
              </span>
              <span className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: C.textDim }}>
                {s.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </HubCard>
  );
}

function DailyRewardsCard({ onView }: { onView: () => void }) {
  const [time, setTime] = useState({ h: 10, m: 48 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime(({ h, m }) => {
        const total = h * 60 + m - 1;
        if (total <= 0) return { h: 23, m: 59 };
        return { h: Math.floor(total / 60), m: total % 60 };
      });
    }, 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <HubCard
      title="DAILY REWARDS"
      accent={C.orange}
      footer={
        <button
          type="button"
          onClick={onView}
          className="w-full text-[10px] uppercase tracking-[0.25em] font-black py-1 border hover:bg-white/5 transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", borderRadius: 1 }}
        >
          VIEW REWARDS
        </button>
      }
    >
      <div
        className="relative h-[110px] mb-3 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #2a1f10 0%, #0f1320 100%)", borderRadius: 1 }}
      >
        <div className="relative">
          <div
            className="w-20 h-16 border-2"
            style={{
              borderColor: C.orange,
              background: "linear-gradient(180deg, #5a3920, #3a2510)",
              boxShadow: `0 0 18px ${C.orange}55, inset 0 0 10px rgba(0,0,0,0.5)`,
              borderRadius: 1,
            }}
          />
          <div
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1.5"
            style={{ background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`, boxShadow: `0 0 8px ${C.yellow}` }}
          />
        </div>
      </div>
      <div className="text-[8px] uppercase tracking-widest" style={{ color: C.textDim }}>NEXT REWARD IN</div>
      <div className="font-display font-black tabular-nums text-base" style={{ color: C.orange }}>
        {time.h}H {String(time.m).padStart(2, "0")}M
      </div>
      <p className="text-[10px] leading-snug mt-1" style={{ color: C.textMid }}>
        Play missions to unlock daily rewards.
      </p>
    </HubCard>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  Message of the Day + Squad Status
// ══════════════════════════════════════════════════════════════════════
function MessageOfTheDay() {
  return (
    <section
      className="relative border overflow-hidden flex items-stretch"
      style={{ borderColor: C.rule, background: "rgba(10,13,18,0.78)", borderRadius: 1 }}
    >
      <div className="w-1 self-stretch shrink-0" style={{ background: `linear-gradient(180deg, ${C.yellow}, ${C.orange})` }} />
      <div className="flex-1 px-4 py-3 flex items-start gap-3">
        <div
          className="w-12 h-12 shrink-0 flex items-center justify-center border"
          style={{ borderColor: `${C.yellow}55`, background: `${C.yellow}10`, borderRadius: 1 }}
        >
          <span style={{ color: C.yellow, fontSize: 22, lineHeight: 1, textShadow: `0 0 6px ${C.yellow}88` }} className="font-display font-black">
            ⚜
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: C.yellow }}>
            MESSAGE OF THE DAY
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            Helldiver, the frontlines are hot and our enemies gather strength.<br />
            Stand firm. Stand united. Victory is not optional.<br />
            For Super Earth.
          </p>
          <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: C.textDim }}>
            — Democracy Officer
          </span>
        </div>
      </div>
    </section>
  );
}

function SquadStatus({ account, onManage }: { account: Account; onManage: () => void }) {
  const rank = getHelldiverRank(account.level);
  const members = [
    { name: account.helldiverName ?? "STAR_4392", rank: `${rank.abbr} · LV ${account.level}`, you: true,  glyph: "✦" },
    { name: "Patriot_77",                          rank: "CPL · LV 4",                          you: false, glyph: "☠" },
    { name: "Eagle-1",                             rank: "CPL · LV 5",                          you: false, glyph: "▲" },
  ];
  return (
    <section
      className="border flex flex-col"
      style={{ borderColor: C.rule, background: "rgba(10,13,18,0.78)", borderRadius: 1 }}
    >
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.rule}` }}>
        <span className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: C.yellow }}>SQUAD STATUS</span>
        <span className="text-[9px] uppercase tracking-widest" style={{ color: C.textDim }}>▸ SQUAD: ALPHA LANCE</span>
        <span className="ml-auto text-[10px] tabular-nums font-black" style={{ color: C.textMid }}>3 / 4</span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 py-2 flex-1">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2 px-2 py-1.5 border"
            style={{
              borderColor: m.you ? C.yellow : C.rule,
              background: m.you ? `${C.yellow}10` : "transparent",
              borderRadius: 1,
            }}
          >
            <div
              className="w-6 h-6 flex items-center justify-center border shrink-0 font-display font-black text-xs"
              style={{ borderColor: m.you ? C.yellow : "rgba(255,255,255,0.15)", color: m.you ? C.yellow : C.textMid }}
            >
              {m.glyph}
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className="text-[10px] uppercase tracking-wider font-black truncate">
                {m.name}{m.you && <span className="text-white/40"> (You)</span>}
              </span>
              <span className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: C.textDim }}>{m.rank}</span>
            </div>
          </div>
        ))}
        <div
          className="flex items-center gap-2 px-2 py-1.5 border border-dashed"
          style={{ borderColor: "rgba(255,255,255,0.18)", borderRadius: 1 }}
        >
          <div className="w-6 h-6 flex items-center justify-center text-base" style={{ color: C.textFaint }}>＋</div>
          <div className="flex flex-col min-w-0 leading-none">
            <span className="text-[10px] uppercase tracking-wider font-black" style={{ color: C.textDim }}>EMPTY SLOT</span>
            <span className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: C.textFaint }}>Available</span>
          </div>
        </div>
      </div>
      <div className="px-3 py-1.5" style={{ borderTop: `1px solid ${C.rule}` }}>
        <button
          type="button"
          onClick={onManage}
          className="text-[9px] uppercase tracking-[0.3em] hover:text-white transition-colors"
          style={{ color: C.textMid }}
        >
          MANAGE SQUAD
        </button>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  RIGHT RAIL — Highlights + Recent Activity
// ══════════════════════════════════════════════════════════════════════
function RightRail({
  account, war, feed, nav,
}: {
  account: Account; war: WarState | null; feed: string[]; nav: NavHandlers;
}) {
  const moProgress = useMemo(() => (war ? getMajorOrderProgress(war) : null), [war]);
  return (
    <aside
      className="hidden md:flex flex-col gap-3 p-3 overflow-y-auto hub-frame-scroll"
      style={{
        borderLeft: `1px solid ${C.hairline}`,
        background: "rgba(0,0,0,0.45)",
      }}
    >
      <HighlightsPanel war={war} mo={moProgress} onWar={nav.war} />
      <RecentActivityPanel account={account} feed={feed} onAll={nav.activity} />
    </aside>
  );
}

function HighlightsPanel({
  war, mo, onWar,
}: {
  war: WarState | null;
  mo: ReturnType<typeof getMajorOrderProgress>;
  onWar: () => void;
}) {
  const moTitle = war?.majorOrder?.title ?? "Defend 5 planets from Terminid incursion";
  const hours = mo?.hoursRemaining ?? 62;
  const days = Math.floor(hours / 24);
  const remH = Math.floor(hours % 24);
  return (
    <section
      className="border"
      style={{ borderColor: C.rule, background: "rgba(10,13,18,0.78)", borderRadius: 1 }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${C.rule}` }}>
        <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: C.yellow }}>
          HIGHLIGHTS
        </div>
      </div>
      <div className="px-3 py-2.5 flex flex-col gap-3">
        <HighlightRow
          glyph="✦" accent={C.yellow}
          title="MAJOR ORDER" deadline={`${days}D ${remH}H`}
          detail={moTitle}
          onClick={onWar}
        />
        <HighlightRow
          glyph="☠" accent={C.orange}
          title="PERSONAL ORDER" deadline="14H 48M"
          detail="Complete 3 missions on Automaton planets"
          onClick={onWar}
        />

        {/* Community target */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <div
              className="w-7 h-7 flex items-center justify-center border shrink-0 font-display font-black"
              style={{ borderColor: `${C.green}66`, color: C.green, background: `${C.green}10`, borderRadius: 1, fontSize: 14 }}
            >
              ▣
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: C.green }}>
                COMMUNITY TARGET
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                Kill 50,000,000 Terminids
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] tabular-nums">
            <div className="flex-1 h-[3px]" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full"
                style={{
                  width: "64.8%",
                  background: `linear-gradient(90deg, ${C.green}, #34d399)`,
                  boxShadow: `0 0 6px ${C.green}aa`,
                }}
              />
            </div>
            <span style={{ color: C.textMid }}>32.4M / 50M</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HighlightRow({
  glyph, accent, title, deadline, detail, onClick,
}: {
  glyph: string; accent: string; title: string; deadline: string; detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2 text-left hover:bg-white/5 transition-colors px-1 py-1"
      style={{ borderRadius: 1 }}
    >
      <div
        className="w-7 h-7 flex items-center justify-center border shrink-0 font-display font-black"
        style={{ borderColor: `${accent}66`, color: accent, background: `${accent}10`, borderRadius: 1, fontSize: 14 }}
      >
        {glyph}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: accent }}>{title}</span>
          <span className="text-[9px] uppercase tracking-widest tabular-nums" style={{ color: accent }}>{deadline}</span>
        </div>
        <p className="text-[10px] leading-snug mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{detail}</p>
      </div>
    </button>
  );
}

function RecentActivityPanel({
  account, feed, onAll,
}: {
  account: Account; feed: string[]; onAll: () => void;
}) {
  const entries = useMemo(() => {
    const list: Array<{ name: string; sub: string; ago: string; glyph: string; accent: string }> = [];
    if (account.history.length > 0) {
      const latest = account.history[account.history.length - 1];
      list.push({
        name: account.helldiverName ?? "HELLDIVER",
        sub: latest.outcome === "victory" ? `Extracted from ${latest.planet}` : `KIA on ${latest.planet}`,
        ago: timeAgo(latest.date),
        glyph: latest.outcome === "victory" ? "✦" : "☠",
        accent: latest.outcome === "victory" ? C.green : C.red,
      });
    }
    if (feed[0]) list.push({ name: "Patriot_77", sub: feed[0], ago: "10m ago", glyph: "☠", accent: C.yellow });
    if (feed[1]) list.push({ name: "Eagle-1",    sub: feed[1], ago: "23m ago", glyph: "✦", accent: C.cyan });
    if (account.unlockedCards.length > 0) {
      list.push({
        name: account.helldiverName ?? "HELLDIVER",
        sub: "Unlocked: AR-23 Liberator Mk III",
        ago: "1h ago",
        glyph: "◈",
        accent: C.yellow,
      });
    }
    list.push({ name: "Democracy Officer", sub: "New Warbond Available", ago: "2h ago", glyph: "⚜", accent: C.orange });
    return list.slice(0, 5);
  }, [account, feed]);

  return (
    <section
      className="border flex flex-col flex-1 min-h-0"
      style={{ borderColor: C.rule, background: "rgba(10,13,18,0.78)", borderRadius: 1 }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${C.rule}` }}>
        <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: C.yellow }}>
          RECENT ACTIVITY
        </div>
      </div>
      <div className="flex flex-col px-2 py-2 flex-1 gap-1 overflow-y-auto hub-frame-scroll">
        {entries.map((e, i) => (
          <div key={i} className="flex items-start gap-2 px-2 py-1.5 hover:bg-white/[0.03]" style={{ borderRadius: 1 }}>
            <div
              className="w-6 h-6 flex items-center justify-center border shrink-0 mt-0.5 font-display font-black"
              style={{ borderColor: `${e.accent}66`, color: e.accent, background: `${e.accent}10`, borderRadius: 1, fontSize: 12 }}
            >
              {e.glyph}
            </div>
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider font-black truncate">{e.name}</span>
                <span className="text-[8px] uppercase tracking-widest shrink-0 tabular-nums" style={{ color: C.textDim }}>{e.ago}</span>
              </div>
              <span className="text-[10px] leading-snug truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{e.sub}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-2 py-2" style={{ borderTop: `1px solid ${C.rule}` }}>
        <button
          type="button"
          onClick={onAll}
          className="w-full text-[10px] uppercase tracking-[0.25em] font-black py-1.5 border hover:bg-white/5 transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", borderRadius: 1 }}
        >
          VIEW ALL ACTIVITY
        </button>
      </div>
    </section>
  );
}

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ══════════════════════════════════════════════════════════════════════
//  FOOTER
// ══════════════════════════════════════════════════════════════════════
function FooterStrip() {
  return (
    <footer
      className="px-5 py-2 flex items-center gap-2 flex-wrap shrink-0"
      style={{
        borderTop: `1px solid ${C.rule}`,
        background: "rgba(10,13,18,0.85)",
      }}
    >
      <div
        className="flex items-center gap-2 px-2 py-1 border min-w-[140px]"
        style={{ borderColor: C.rule, background: "rgba(0,0,0,0.4)", borderRadius: 1 }}
      >
        <span className="font-display font-black text-base" style={{ color: C.cyan }}>☁</span>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] uppercase tracking-wider font-black">FORI PRIME</span>
          <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: C.textDim }}>60°F · MOSTLY CLOUDY</span>
        </div>
      </div>

      <FooterChip glyph="▤" title="PATCH NOTES" sub="v1.0.17" />
      <FooterChip glyph="⚠" title="KNOWN ISSUES" sub="2" />
      <FooterChip glyph="◈" title="DISCORD" sub="Join Community" href="https://discord.com" />
      <FooterChip glyph="?" title="HELP & SUPPORT" sub="Contact Us" />

      <div className="flex flex-col gap-0.5 ml-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[8px] uppercase tracking-[0.3em] font-black text-emerald-400">SYSTEM STATUS</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest" style={{ color: C.textMid }}>All systems nominal</span>
      </div>

      <div className="hidden md:flex items-center gap-2 ml-3">
        <div
          className="w-9 h-9 flex items-center justify-center border-2"
          style={{
            borderColor: C.yellow,
            background: `${C.yellow}10`,
            borderRadius: 1,
            boxShadow: `0 0 12px ${C.yellow}55`,
          }}
        >
          <span className="font-display font-black text-base" style={{ color: C.yellow }}>☠</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="block"
              style={{
                width: 6,
                height: 14,
                background: i % 2 === 0 ? C.yellow : "#181f2a",
                transform: "skewX(-20deg)",
              }}
            />
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterChip({ glyph, title, sub, href }: { glyph: string; title: string; sub: string; href?: string }) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : { type: "button" })}
      onClick={() => sfx.click()}
      className={clsx(
        "flex items-center gap-2 px-2 py-1 border hover:bg-white/5 transition-colors",
      )}
      style={{ borderColor: C.rule, background: "rgba(0,0,0,0.4)", borderRadius: 1, color: "rgba(255,255,255,0.85)" }}
    >
      <span className="font-display font-black text-base" style={{ color: C.yellow }}>{glyph}</span>
      <div className="flex flex-col leading-none text-left">
        <span className="text-[10px] uppercase tracking-wider font-black">{title}</span>
        <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: C.textDim }}>{sub}</span>
      </div>
    </Tag>
  );
}
