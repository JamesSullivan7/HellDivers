"use client";

/**
 * HUB · SUPER DESTROYER COMMAND CENTER
 * ──────────────────────────────────────────────────────────────────────
 * AAA military command interface. Three-column command layout with a
 * cinematic bridge viewport in the center, mission briefing terminal
 * on the right, vertical command nav on the left, and a heavy bottom
 * action zone with the loadout strip + DEPLOY CTA.
 *
 *   ┌──────────────────── TOP STRIP ─────────────────────┐
 *   │ INSIGNIA · TICKER · IDENTITY · CURRENCIES          │
 *   ├────────┬────────────────────────────┬──────────────┤
 *   │        │                            │              │
 *   │ NAV    │   COMMAND VIEWPORT         │  MISSION     │
 *   │        │   (bridge cinematic +      │  BRIEFING    │
 *   │ 5      │    minimal HUD overlay)    │  TACTICAL    │
 *   │ items  │                            │  REWARDS     │
 *   │        │                            │  RECORD      │
 *   ├────────┴────────────────────────────┴──────────────┤
 *   │ LOADOUT STRIP · DEPLOY HELLDIVER (large yellow)    │
 *   └─────────────────────────────────────────────────────┘
 *
 * The bridge cinematic background (HubCommandCenterBackground) lives
 * behind everything. Every panel is a translucent metal terminal that
 * lets the bridge breathe through.
 */

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
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
//  Color tokens — single source of truth for this screen
// ──────────────────────────────────────────────────────────────────────
const C = {
  yellow: "#f5c542",
  yellowDim: "rgba(245,197,66,0.6)",
  yellowFaint: "rgba(245,197,66,0.18)",
  yellowGlow: "rgba(245,197,66,0.35)",
  orange: "#ff8a28",
  red: "#ff4d4d",
  cyan: "#60c4ff",
  green: "#10b981",
  bg0: "#0a0d12",
  bg1: "#11161e",
  bg2: "#181f2a",
  steel: "#2c3645",
  panelGlass: "rgba(11, 14, 19, 0.78)",
  panelGlassDeep: "rgba(11, 14, 19, 0.92)",
  border: "rgba(245,197,66,0.18)",
  borderSoft: "rgba(255,255,255,0.06)",
  borderHard: "rgba(245,197,66,0.5)",
  textDim: "rgba(255,255,255,0.45)",
  textFaint: "rgba(255,255,255,0.3)",
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
  const { account, settings, difficulty, modifiers, targetPlanetId, goToWar, goToCharacter, goToArmory, goToCodex } = useGame();
  const [war, setWar] = useState<WarState | null>(null);
  const [feed, setFeed] = useState<string[]>([]);

  useEffect(() => {
    setWar(loadWarState());
  }, []);

  useEffect(() => {
    if (!war) return;
    const planets = listPlanets(war);
    setFeed(Array.from({ length: 5 }).map(() => generateActivity(planets)));
    const t = setInterval(() => {
      setFeed((prev) => [generateActivity(planets), ...prev].slice(0, 6));
    }, 4500);
    return () => clearInterval(t);
  }, [war]);

  // Active mission target — explicit selection > most-contested fallback.
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
          style={{ gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr) minmax(0, 360px)" }}
        >
          <LeftNav
            account={account}
            onWar={() => { sfx.click(); goToWar(); }}
            onLoadout={() => { sfx.click(); goToCharacter(); }}
            onArmory={() => { sfx.click(); goToArmory(); }}
            onResearch={() => { sfx.click(); goToCodex(); }}
            onSettings={() => { sfx.click(); goToCharacter(); }}
          />
          <CenterViewport target={target} feed={feed} />
          <RightDataPanel
            account={account}
            war={war}
            target={target}
            difficulty={difficulty}
            modifierIds={modifiers}
          />
        </main>

        <BottomActionZone
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
//  PANEL ATOMS — military terminal aesthetic
// ══════════════════════════════════════════════════════════════════════

/** Bracket-cornered panel frame. Children fill the inner content area. */
function HudPanel({
  title,
  metric,
  accent = C.yellow,
  children,
  className,
  innerClassName,
  bodyPad = true,
}: {
  title?: string;
  metric?: string;
  accent?: string;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  bodyPad?: boolean;
}) {
  return (
    <section
      className={clsx("relative", className)}
      style={{
        background: `linear-gradient(180deg, ${C.panelGlass} 0%, ${C.panelGlassDeep} 100%)`,
        border: `1px solid ${C.border}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.4)`,
        borderRadius: 1,
      }}
    >
      {/* Top accent stripe */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {/* Bracket corners */}
      <CornerBrackets accent={accent} />

      {title && (
        <header
          className="px-3 pt-2 pb-1.5 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${C.borderSoft}` }}
        >
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block"
              style={{ width: 6, height: 6, background: accent, boxShadow: `0 0 6px ${accent}` }}
            />
            <h3
              className="text-[9px] uppercase tracking-[0.3em] font-display font-black"
              style={{ color: accent, textShadow: `0 0 4px ${accent}66` }}
            >
              {title}
            </h3>
          </div>
          {metric && (
            <span
              className="text-[9px] uppercase tracking-widest tabular-nums"
              style={{ color: C.textDim }}
            >
              {metric}
            </span>
          )}
        </header>
      )}

      <div className={clsx(bodyPad && "px-3 py-2.5", innerClassName)}>{children}</div>
    </section>
  );
}

/** Four ◤◥◣◢ bracket corners — common military-UI flourish. */
function CornerBrackets({ accent = C.yellow, size = 10 }: { accent?: string; size?: number }) {
  const common: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: accent,
    pointerEvents: "none",
  };
  return (
    <>
      <span aria-hidden style={{ ...common, top: -1, left: -1, borderTop: "1px solid", borderLeft: "1px solid" }} />
      <span aria-hidden style={{ ...common, top: -1, right: -1, borderTop: "1px solid", borderRight: "1px solid" }} />
      <span aria-hidden style={{ ...common, bottom: -1, left: -1, borderBottom: "1px solid", borderLeft: "1px solid" }} />
      <span aria-hidden style={{ ...common, bottom: -1, right: -1, borderBottom: "1px solid", borderRight: "1px solid" }} />
    </>
  );
}

/** Metric row — label / value / optional unit. Used in mission briefing. */
function MetricRow({ label, value, unit, accent = C.yellow }: { label: string; value: React.ReactNode; unit?: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
      <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: C.textDim }}>{label}</span>
      <span className="font-display font-black tabular-nums text-[12px]" style={{ color: accent }}>
        {value}
        {unit && <span className="text-[9px] ml-1 uppercase tracking-widest" style={{ color: C.textDim }}>{unit}</span>}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  TOP STRIP — insignia · ticker · identity · currencies
// ══════════════════════════════════════════════════════════════════════
function TopStrip({ account, feed }: { account: Account; feed: string[] }) {
  const rank = getHelldiverRank(account.level);
  return (
    <header
      className="relative h-[56px] px-4 flex items-center gap-4 border-b backdrop-blur-md"
      style={{ background: C.panelGlassDeep, borderColor: C.borderSoft }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)` }}
      />

      {/* Insignia */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-9 h-9 flex items-center justify-center border-2"
          style={{
            borderColor: C.yellow,
            background: `${C.yellow}10`,
            boxShadow: `0 0 12px ${C.yellowGlow}, inset 0 0 8px ${C.yellow}22`,
            borderRadius: 1,
          }}
        >
          <span className="font-display font-black" style={{ color: C.yellow, fontSize: 16, lineHeight: 1, textShadow: `0 0 6px ${C.yellow}` }}>☠</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[12px] font-display font-black tracking-[0.2em]" style={{ color: C.yellow }}>HELLDIVERS</span>
          <span className="text-[8px] uppercase tracking-[0.4em] mt-1" style={{ color: C.textDim }}>STRATAGEM PROTOCOL</span>
        </div>
      </div>

      {/* Galactic feed ticker */}
      <div
        className="hidden lg:flex flex-1 min-w-0 items-center gap-2 px-3 py-1.5 ml-2 border"
        style={{ borderColor: C.borderSoft, background: "rgba(0,0,0,0.4)", borderRadius: 1 }}
      >
        <span
          className="shrink-0 text-[8px] uppercase tracking-[0.3em] font-black px-1.5 py-0.5 border flex items-center gap-1"
          style={{ color: C.yellow, borderColor: C.yellow, borderRadius: 1 }}
        >
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          GALACTIC FEED
        </span>
        <div className="flex-1 min-w-0 overflow-hidden">
          <motion.div
            key={feed[0] ?? "init"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] truncate"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {feed[0] ?? "Standby — awaiting transmission…"}
          </motion.div>
        </div>
      </div>

      {/* Identity + currencies */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <div className="hidden sm:flex flex-col leading-none mr-2 text-right">
          <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>{rank.title}</span>
          <span className="text-[12px] font-display font-black tracking-wider mt-0.5" style={{ color: C.yellow }}>
            {account.helldiverName ?? "HELLDIVER"}
          </span>
        </div>
        <CurrencyChip glyph="★" label="MEDALS" value={account.medals} accent={C.yellow} />
        <CurrencyChip glyph="◆" label="SAMPLES" value={account.samples + account.rareSamples + account.superSamples} accent={C.cyan} />
        <CurrencyChip glyph="Ⓡ" label="REQ" value={account.requisition} accent={C.orange} />
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
      <span className="font-display font-black text-[13px] leading-none" style={{ color: accent, textShadow: `0 0 6px ${accent}88` }}>{glyph}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[7px] uppercase tracking-widest" style={{ color: C.textFaint }}>{label}</span>
        <span className="font-display font-black tabular-nums text-[12px] mt-0.5" style={{ color: accent }}>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  LEFT NAV — 5 items + identity card
// ══════════════════════════════════════════════════════════════════════
interface NavItemDef {
  key: string;
  label: string;
  sub: string;
  /** Stratagem-code direction sequence — purely decorative tactical glyph. */
  code: ReadonlyArray<"U" | "D" | "L" | "R">;
  /** Optional status — drives the LED color on the button. */
  status?: "ready" | "new" | "locked";
  badge?: string;
}

const NAV_ITEMS: readonly NavItemDef[] = [
  { key: "war",      label: "GALACTIC MAP", sub: "SECTOR DEPLOYMENT",      code: ["U", "U", "R", "D", "L"], status: "ready" },
  { key: "loadout",  label: "LOADOUT",       sub: "EQUIPMENT · STRATAGEMS", code: ["D", "R", "U", "U"],      status: "ready" },
  { key: "armory",   label: "ARMORY",        sub: "WARBONDS · MODULES",     code: ["D", "U", "L", "R"],      status: "new", badge: "NEW" },
  { key: "research", label: "RESEARCH",      sub: "CODEX · LORE",           code: ["U", "L", "D", "R"],      status: "ready" },
  { key: "settings", label: "SETTINGS",      sub: "AUDIO · ACCESSIBILITY",  code: ["D", "D", "U", "U"],      status: "ready" },
] as const;

function LeftNav({
  account, onWar, onLoadout, onArmory, onResearch, onSettings,
}: {
  account: Account;
  onWar: () => void; onLoadout: () => void; onArmory: () => void;
  onResearch: () => void; onSettings: () => void;
}) {
  const handlers: Record<string, () => void> = {
    war: onWar, loadout: onLoadout, armory: onArmory, research: onResearch, settings: onSettings,
  };
  const rank = getHelldiverRank(account.level);
  const xpNext = xpToLevelUp(account.level);
  const xpPct = Math.min(100, (account.xp / xpNext) * 100);
  const serial = useMemo(() => deriveSerial(account.helldiverName ?? "HELLDIVER"), [account.helldiverName]);

  return (
    <nav
      className="hidden md:flex flex-col border-r relative overflow-hidden"
      style={{
        borderColor: C.borderSoft,
        background: `linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.62) 100%)`,
      }}
    >
      {/* Top hazard stripe — seals the panel like a ship console bezel */}
      <NavHazardStripe />

      {/* Inner edge glow on the right */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-px pointer-events-none"
        style={{ background: `linear-gradient(180deg, transparent, ${C.yellowFaint}, transparent)` }}
      />
      {/* Vertical "rivet rail" — six little dots evenly spaced */}
      <RivetRail />

      {/* INSIGNIA BLOCK */}
      <div className="px-4 pt-4 pb-3 relative">
        <div className="flex items-start gap-3">
          <HelldiversEmblem size={56} />
          <div className="flex flex-col leading-none pt-1 min-w-0 flex-1">
            <span
              className="text-[15px] font-display font-black tracking-[0.18em]"
              style={{ color: C.yellow, textShadow: `0 0 6px ${C.yellowGlow}` }}
            >
              HELLDIVERS
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span aria-hidden style={{ display: "inline-block", width: 8, height: 1, background: C.yellow }} />
              <span className="text-[8px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>STRATAGEM PROTOCOL</span>
            </div>
            <span className="text-[7px] uppercase tracking-[0.25em] mt-2" style={{ color: C.textFaint }}>
              S.E.S. DEMOCRATIC FLAME
            </span>
            <span className="text-[7px] uppercase tracking-[0.3em] tabular-nums" style={{ color: C.yellow }}>
              CV-77 · ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Section header */}
      <SectionLabel>Command Console</SectionLabel>

      {/* NAV ITEMS */}
      <ul className="flex flex-col">
        {NAV_ITEMS.map((item, i) => (
          <li key={item.key}>
            <NavButton
              index={i + 1}
              item={item}
              onClick={handlers[item.key]}
              showDivider={i < NAV_ITEMS.length - 1}
            />
          </li>
        ))}
      </ul>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Section header */}
      <SectionLabel>Helldiver Profile</SectionLabel>

      {/* SERVICE TAG */}
      <div
        className="m-3 mt-2 p-3 border relative"
        style={{
          borderColor: C.border,
          background: `linear-gradient(180deg, ${C.panelGlass} 0%, ${C.panelGlassDeep} 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 6px 18px rgba(0,0,0,0.5)`,
          borderRadius: 1,
        }}
      >
        <CornerBrackets accent={C.yellow} size={9} />

        {/* Top row — rank chevrons */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[7px] uppercase tracking-[0.4em] font-display font-black" style={{ color: C.yellow }}>
            ◢ ENLISTED
          </span>
          <RankChevrons level={account.level} />
        </div>

        {/* Middle — level tile + identity */}
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="relative w-12 h-12 flex flex-col items-center justify-center border-2 shrink-0"
            style={{
              borderColor: C.yellow,
              background: `linear-gradient(135deg, ${C.yellow}28, ${C.yellow}08)`,
              boxShadow: `0 0 10px ${C.yellowGlow}, inset 0 0 8px ${C.yellow}22`,
              borderRadius: 1,
            }}
          >
            <span aria-hidden style={{ position: "absolute", top: -1, left: -1, width: 5, height: 5, borderTop: `2px solid ${C.bg0}`, borderLeft: `2px solid ${C.bg0}` }} />
            <span aria-hidden style={{ position: "absolute", top: -1, right: -1, width: 5, height: 5, borderTop: `2px solid ${C.bg0}`, borderRight: `2px solid ${C.bg0}` }} />
            <span aria-hidden style={{ position: "absolute", bottom: -1, left: -1, width: 5, height: 5, borderBottom: `2px solid ${C.bg0}`, borderLeft: `2px solid ${C.bg0}` }} />
            <span aria-hidden style={{ position: "absolute", bottom: -1, right: -1, width: 5, height: 5, borderBottom: `2px solid ${C.bg0}`, borderRight: `2px solid ${C.bg0}` }} />
            <span className="text-[7px] uppercase tracking-widest" style={{ color: C.textDim }}>LV</span>
            <span
              className="text-[20px] font-display font-black tabular-nums leading-none"
              style={{ color: C.yellow, textShadow: `0 0 8px ${C.yellow}` }}
            >
              {account.level}
            </span>
          </div>
          <div className="flex flex-col leading-none min-w-0 flex-1">
            <span className="text-[7px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>{rank.title}</span>
            <span
              className="text-[12px] font-display font-black tracking-wider truncate mt-1"
              style={{ color: C.yellow, textShadow: `0 0 4px ${C.yellow}55` }}
            >
              {account.helldiverName ?? "HELLDIVER"}
            </span>
            <span className="text-[7px] uppercase tracking-[0.3em] tabular-nums mt-1" style={{ color: C.textFaint }}>
              S/N · {serial}
            </span>
          </div>
        </div>

        {/* XP — tick-marked progress */}
        <div className="flex items-center justify-between text-[7px] uppercase tracking-[0.3em] mb-1" style={{ color: C.textDim }}>
          <span>EXPERIENCE</span>
          <span className="tabular-nums" style={{ color: C.yellow }}>
            {account.xp.toLocaleString()} / {xpNext.toLocaleString()}
          </span>
        </div>
        <div className="relative h-[6px] border" style={{ borderColor: C.borderSoft, background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            className="absolute inset-y-0 left-0"
            initial={false}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`,
              boxShadow: `0 0 6px ${C.yellow}cc`,
            }}
          />
          {/* Tick marks every 10% */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((tick) => (
            <span
              key={tick}
              aria-hidden
              className="absolute top-0 bottom-0"
              style={{ left: `${tick}%`, width: 1, background: "rgba(0,0,0,0.4)" }}
            />
          ))}
        </div>
      </div>

      {/* Bottom hazard stripe */}
      <NavHazardStripe />
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  LEFT NAV · sub-components
// ──────────────────────────────────────────────────────────────────────

/** 8px-tall yellow/black diagonal hazard band that seals the nav top + bottom. */
function NavHazardStripe() {
  return (
    <div
      aria-hidden
      className="h-2 w-full shrink-0"
      style={{
        background: `repeating-linear-gradient(-45deg, ${C.yellow} 0 6px, ${C.bg0} 6px 12px)`,
        opacity: 0.7,
      }}
    />
  );
}

/** Vertical column of evenly-spaced rivet dots along the left edge of the nav. */
function RivetRail() {
  return (
    <div aria-hidden className="absolute left-1.5 top-12 bottom-12 flex flex-col justify-around pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 3,
            height: 3,
            background: `${C.yellow}55`,
            boxShadow: `inset 0 0 1px ${C.yellow}, 0 0 3px ${C.yellow}33`,
          }}
        />
      ))}
    </div>
  );
}

/** Section divider header — "▸ COMMAND CONSOLE" style label between blocks. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4 py-1.5 flex items-center gap-2 border-y"
      style={{ borderColor: C.borderSoft, background: "rgba(0,0,0,0.4)" }}
    >
      <span aria-hidden style={{ color: C.yellow, fontSize: 8 }}>▸</span>
      <span className="text-[8px] uppercase tracking-[0.4em] font-display font-black" style={{ color: C.yellow }}>
        {children}
      </span>
      <span aria-hidden className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${C.yellowFaint}, transparent)` }} />
    </div>
  );
}

/** Helldivers eagle/star insignia rendered as inline SVG. */
function HelldiversEmblem({ size = 56 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Outer hex frame */}
      <svg viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0">
        <polygon
          points="50,4 90,27 90,73 50,96 10,73 10,27"
          fill="rgba(245,197,66,0.06)"
          stroke={C.yellow}
          strokeWidth="2.5"
          style={{ filter: `drop-shadow(0 0 6px ${C.yellow}88)` }}
        />
        <polygon
          points="50,12 82,30 82,70 50,88 18,70 18,30"
          fill="none"
          stroke={C.yellowDim}
          strokeWidth="0.8"
        />
        {/* Eagle wings */}
        <path d="M50 50 L18 38 L26 50 L18 62 Z" fill={C.yellow} opacity="0.9" />
        <path d="M50 50 L82 38 L74 50 L82 62 Z" fill={C.yellow} opacity="0.9" />
        {/* Center 5-point star */}
        <polygon
          points="50,32 54,44 67,44 56,52 60,64 50,57 40,64 44,52 33,44 46,44"
          fill={C.yellow}
          style={{ filter: `drop-shadow(0 0 3px ${C.yellow})` }}
        />
        {/* Tail / banner */}
        <polygon points="46,66 50,76 54,66" fill={C.yellow} opacity="0.85" />
      </svg>
      {/* Inner soft glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${C.yellowGlow} 0%, transparent 65%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

/** Three rank chevrons — fill color reflects level tier. */
function RankChevrons({ level }: { level: number }) {
  const filled = level >= 30 ? 3 : level >= 12 ? 2 : 1;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className="font-display font-black"
          style={{
            color: i <= filled ? C.yellow : "rgba(255,255,255,0.18)",
            fontSize: 9,
            lineHeight: 1,
            textShadow: i <= filled ? `0 0 4px ${C.yellow}88` : undefined,
          }}
        >
          ◢
        </span>
      ))}
    </div>
  );
}

/** Status LED dot for nav buttons — green/yellow/red driven by item.status. */
function StatusLed({ status }: { status?: NavItemDef["status"] }) {
  const color = status === "new" ? C.orange : status === "locked" ? C.red : C.green;
  return (
    <span
      aria-hidden
      className="inline-block rounded-full shrink-0"
      style={{
        width: 6,
        height: 6,
        background: color,
        boxShadow: `0 0 6px ${color}, inset 0 0 1px rgba(0,0,0,0.4)`,
      }}
    />
  );
}

/** Tiny stratagem-code arrow grid — purely decorative tactical glyph row. */
function StratagemCode({ code }: { code: ReadonlyArray<"U" | "D" | "L" | "R"> }) {
  const arrow: Record<"U" | "D" | "L" | "R", string> = { U: "▲", D: "▼", L: "◀", R: "▶" };
  return (
    <div className="flex items-center gap-0.5">
      {code.map((dir, i) => (
        <span
          key={i}
          aria-hidden
          className="font-display"
          style={{ color: `${C.yellow}88`, fontSize: 7, lineHeight: 1 }}
        >
          {arrow[dir]}
        </span>
      ))}
    </div>
  );
}

/** Numbered tactical nav button. */
function NavButton({
  index, item, onClick, showDivider,
}: {
  index: number;
  item: NavItemDef;
  onClick: () => void;
  showDivider: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group w-full text-left relative"
      style={{
        background: hovered ? `linear-gradient(90deg, ${C.yellow}1c, transparent 80%)` : "transparent",
        boxShadow: hovered ? `inset 4px 0 0 ${C.yellow}, inset 0 0 18px ${C.yellow}11` : "inset 4px 0 0 transparent",
        transition: "background 200ms ease, box-shadow 200ms ease",
      }}
    >
      <div className="flex items-stretch px-3 py-2.5 gap-2.5">
        {/* Index column */}
        <div className="flex flex-col items-center justify-center w-7 shrink-0">
          <span
            className="text-[7px] uppercase tracking-widest"
            style={{ color: hovered ? C.yellow : C.textFaint }}
          >
            {String(index).padStart(2, "0")}
          </span>
          <StatusLed status={item.status} />
        </div>

        {/* Vertical rule */}
        <span
          aria-hidden
          className="self-stretch w-px"
          style={{
            background: hovered ? C.yellowDim : C.borderSoft,
            boxShadow: hovered ? `0 0 4px ${C.yellow}55` : undefined,
          }}
        />

        {/* Body */}
        <div className="flex-1 min-w-0 flex flex-col leading-tight">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[12px] uppercase tracking-[0.18em] font-display font-black truncate"
              style={{ color: hovered ? C.yellow : "rgba(255,255,255,0.92)", textShadow: hovered ? `0 0 4px ${C.yellow}88` : undefined }}
            >
              {item.label}
            </span>
            {item.badge && (
              <span
                className="text-[7px] uppercase tracking-[0.25em] font-black px-1 py-px border shrink-0"
                style={{ color: C.orange, borderColor: C.orange, background: `${C.orange}14`, borderRadius: 1 }}
              >
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-[8px] uppercase tracking-[0.25em] mt-1" style={{ color: C.textFaint }}>
            {item.sub}
          </span>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <StratagemCode code={item.code} />
            <motion.span
              aria-hidden
              animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0.4 }}
              transition={{ duration: 0.18 }}
              className="font-display font-black"
              style={{ color: C.yellow, fontSize: 11, lineHeight: 1, textShadow: hovered ? `0 0 6px ${C.yellow}` : undefined }}
            >
              ▶
            </motion.span>
          </div>
        </div>
      </div>

      {/* Bottom divider between items */}
      {showDivider && (
        <div
          aria-hidden
          className="absolute inset-x-3 bottom-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${C.borderSoft}, transparent)` }}
        />
      )}
    </button>
  );
}

/** Derive a stable serial number from the callsign for the service tag. */
function deriveSerial(name: string): string {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) >>> 0;
  const a = String(h % 9000 + 1000);
  const b = String((h >> 8) % 9000 + 1000);
  return `HD-${a}X-${b.slice(-2)}`;
}

// ══════════════════════════════════════════════════════════════════════
//  CENTER VIEWPORT — minimal HUD over bridge cinematic
// ══════════════════════════════════════════════════════════════════════
function CenterViewport({ target, feed }: { target: PlanetState | null; feed: string[] }) {
  return (
    <section className="relative overflow-hidden flex flex-col">
      {/* Frame brackets — extend the military terminal feel into the viewport */}
      <div className="absolute inset-3 pointer-events-none">
        <CornerBrackets accent={C.yellow} size={14} />
      </div>

      {/* Top terminal readout */}
      <div className="relative px-6 pt-5 flex items-center justify-center">
        <div
          className="px-4 py-1.5 border flex items-center gap-3 backdrop-blur-sm"
          style={{
            borderColor: C.borderHard,
            background: "rgba(0,0,0,0.55)",
            boxShadow: `0 0 14px ${C.yellowGlow}, inset 0 0 8px ${C.yellow}11`,
            borderRadius: 1,
          }}
        >
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: C.yellow, boxShadow: `0 0 6px ${C.yellow}` }}
          />
          <span className="text-[9px] uppercase tracking-[0.4em] font-display font-black" style={{ color: C.yellow }}>
            ORBITAL POSITION · STABLE
          </span>
          {target && (
            <>
              <span style={{ color: C.textFaint }}>·</span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: "rgba(255,255,255,0.85)" }}>
                {target.sector.toUpperCase()} / {target.name.toUpperCase()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Spacer — let the bridge breathe */}
      <div className="flex-1" />

      {/* Bottom subtle scanlines + crew chatter ticker */}
      <div className="relative px-6 pb-4">
        <div
          className="border-t flex flex-col gap-0.5 px-3 py-2"
          style={{
            borderColor: `${C.yellowFaint}`,
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.55))",
          }}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden className="w-1 h-1" style={{ background: C.yellow, boxShadow: `0 0 4px ${C.yellow}` }} />
            <span className="text-[8px] uppercase tracking-[0.4em] font-black" style={{ color: C.yellow }}>
              CREW CHATTER
            </span>
          </div>
          <div className="overflow-hidden h-[14px] relative">
            <motion.div
              key={feed[0] ?? "x"}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-[10px] truncate"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {feed[0] ?? "Standby — comms holding…"}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  RIGHT DATA PANEL — Mission · Tactical · Rewards · Service Record
// ══════════════════════════════════════════════════════════════════════
function RightDataPanel({
  account, war, target, difficulty, modifierIds,
}: {
  account: Account;
  war: WarState | null;
  target: PlanetState | null;
  difficulty: number;
  modifierIds: string[];
}) {
  const moProgress = useMemo(() => (war ? getMajorOrderProgress(war) : null), [war]);
  const winRate = account.totalRuns > 0
    ? Math.round((account.victories / account.totalRuns) * 100)
    : 0;

  // Reward projection — nodesCleared assumed at full clear (avg 7 nodes)
  const rewards = useMemo(() => {
    if (!target) return null;
    return calcRunReward({
      victory: true,
      nodesCleared: 7,
      faction: target.faction,
      difficulty,
    });
  }, [target, difficulty]);

  const activeModifiers = MODIFIERS.filter((m) => modifierIds.includes(m.id));
  const targetAccent = target ? FACTION_COLOR[target.faction] : C.yellow;

  return (
    <aside
      className="hidden md:flex flex-col gap-2.5 p-3 border-l overflow-y-auto relative"
      style={{ borderColor: C.borderSoft, background: "rgba(0,0,0,0.4)" }}
    >
      {/* Inner edge glow */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-px pointer-events-none"
        style={{ background: `linear-gradient(180deg, transparent, ${C.yellowFaint}, transparent)` }}
      />

      {/* MISSION BRIEFING */}
      <HudPanel title="MISSION BRIEFING" metric={target ? "INCOMING" : "AWAITING"} accent={targetAccent}>
        {target ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 shrink-0 flex items-center justify-center border"
                style={{
                  borderColor: targetAccent,
                  background: `${targetAccent}10`,
                  borderRadius: "50%",
                  boxShadow: `0 0 10px ${targetAccent}55, inset -3px -3px 6px rgba(0,0,0,0.4)`,
                }}
              >
                <span style={{ color: targetAccent, fontSize: 14, lineHeight: 1 }}>●</span>
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[12px] uppercase tracking-[0.18em] font-display font-black truncate" style={{ color: targetAccent }}>
                  {target.name.toUpperCase()}
                </span>
                <span className="text-[8px] uppercase tracking-widest" style={{ color: C.textDim }}>
                  {target.sector} sector · {target.biome} · {target.faction}
                </span>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
              {moProgress && war?.majorOrder
                ? war.majorOrder.briefing
                : `Liberate ${target.name} from ${target.faction} forces. Estimated theater ${target.biome.toLowerCase()} conditions.`}
            </p>
            <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest" style={{ color: C.textDim }}>
              <span>LIBERATION</span>
              <div className="flex-1 h-[3px]" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full"
                  style={{
                    width: `${target.liberation}%`,
                    background: `linear-gradient(90deg, ${targetAccent}, ${targetAccent}88)`,
                    boxShadow: `0 0 4px ${targetAccent}`,
                  }}
                />
              </div>
              <span className="tabular-nums" style={{ color: targetAccent }}>{target.liberation.toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>
            No target selected — open the GALACTIC MAP to deploy.
          </p>
        )}
      </HudPanel>

      {/* TACTICAL ANALYSIS */}
      <HudPanel title="TACTICAL ANALYSIS" metric={`D${difficulty}`} accent={C.cyan}>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const idx = i + 1;
            const active = idx <= difficulty;
            return (
              <div
                key={i}
                className="flex-1 h-2 border"
                style={{
                  borderColor: active ? C.cyan : C.borderSoft,
                  background: active
                    ? idx >= 8 ? C.red : idx >= 5 ? C.orange : C.cyan
                    : "transparent",
                  boxShadow: active ? `0 0 4px ${idx >= 8 ? C.red : idx >= 5 ? C.orange : C.cyan}66` : undefined,
                  opacity: active ? 0.85 : 1,
                  borderRadius: 1,
                }}
              />
            );
          })}
        </div>
        <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>
          {difficulty <= 2 ? "TRIVIAL" : difficulty <= 4 ? "MEDIUM" : difficulty <= 6 ? "CHALLENGING" : difficulty <= 8 ? "EXTREME" : "HELLDIVE"}
        </div>

        <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: C.textDim }}>ACTIVE MODIFIERS</div>
        {activeModifiers.length === 0 ? (
          <div className="text-[10px] uppercase tracking-widest" style={{ color: C.textFaint }}>NONE</div>
        ) : (
          <ul className="flex flex-col gap-1">
            {activeModifiers.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-2 px-2 py-1 border text-[9px]"
                style={{ borderColor: `${C.orange}33`, background: `${C.orange}08`, borderRadius: 1 }}
              >
                <span aria-hidden style={{ color: C.orange, fontSize: 11, lineHeight: 1 }}>⚠</span>
                <div className="flex flex-col min-w-0">
                  <span className="uppercase tracking-wider font-black" style={{ color: C.orange }}>{m.name}</span>
                  <span style={{ color: C.textDim }}>{m.description}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </HudPanel>

      {/* EXPECTED REWARDS */}
      <HudPanel title="EXPECTED REWARDS" metric="VICTORY EST." accent={C.green}>
        {rewards ? (
          <div className="flex flex-col gap-0">
            <MetricRow label="Medals" value={`+${rewards.medals.toLocaleString()}`} accent={C.yellow} />
            <MetricRow label="Samples" value={`+${(rewards.samples + rewards.rareSamples + rewards.superSamples).toLocaleString()}`} accent={C.cyan} />
            <MetricRow label="Requisition" value={`+${rewards.requisition.toLocaleString()}`} accent={C.orange} />
            <MetricRow label="Experience" value={`+${rewards.xp.toLocaleString()}`} unit="XP" accent={C.green} />
          </div>
        ) : (
          <p className="text-[10px] uppercase tracking-widest" style={{ color: C.textDim }}>
            Select a target for projection.
          </p>
        )}
      </HudPanel>

      {/* SERVICE RECORD */}
      <HudPanel title="SERVICE RECORD" metric={`${winRate}% WIN`} accent={C.yellow}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          <MetricRow label="Total Runs" value={account.totalRuns} />
          <MetricRow label="Victories" value={account.victories} accent={C.green} />
          <MetricRow label="Stratagems" value={account.unlockedCards.length} accent={C.cyan} />
          <MetricRow label="Modules" value={account.unlockedModules.length} accent={C.cyan} />
        </div>
      </HudPanel>
    </aside>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  BOTTOM ACTION ZONE — loadout strip + DEPLOY CTA
// ══════════════════════════════════════════════════════════════════════
function BottomActionZone({
  account, target, difficulty, onDeploy, onLoadout,
}: {
  account: Account;
  target: PlanetState | null;
  difficulty: number;
  onDeploy: () => void;
  onLoadout: () => void;
}) {
  const armor = ARMORS.find((a) => a.id === (account.ownedArmors[0] ?? DEFAULT_ARMOR));
  const weapon = WEAPONS.find((w) => w.id === (account.ownedWeapons[0] ?? DEFAULT_WEAPON));
  const booster = BOOSTERS.find((b) => b.id === (account.ownedBoosters[0] ?? DEFAULT_BOOSTER));
  const stratagems = useMemo(() => {
    const unlocked = CARD_LIBRARY.filter((c) => account.unlockedCards.includes(c.id));
    return unlocked.slice(0, 5);
  }, [account.unlockedCards]);
  // Pad to 5 slots so empty squares are visible
  const slots = Array.from({ length: 5 }).map((_, i) => stratagems[i] ?? null);

  return (
    <footer
      className="relative border-t backdrop-blur-md"
      style={{
        background: `linear-gradient(180deg, rgba(11,14,19,0.85) 0%, rgba(11,14,19,0.98) 100%)`,
        borderColor: C.border,
      }}
    >
      {/* Top accent stripe */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)` }}
      />
      {/* Hazard chevrons — left + right edges */}
      <HazardStripe side="left" />
      <HazardStripe side="right" />

      <div className="px-4 md:px-6 py-3 flex items-stretch gap-4">
        {/* LOADOUT block */}
        <button
          type="button"
          onClick={onLoadout}
          className="flex-1 min-w-0 group text-left"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span aria-hidden className="w-1.5 h-1.5" style={{ background: C.yellow, boxShadow: `0 0 4px ${C.yellow}` }} />
              <span className="text-[9px] uppercase tracking-[0.3em] font-display font-black" style={{ color: C.yellow }}>
                LOADOUT
              </span>
            </div>
            <span className="text-[8px] uppercase tracking-[0.3em] group-hover:text-white transition-colors" style={{ color: C.textDim }}>
              EDIT →
            </span>
          </div>

          <div className="flex items-stretch gap-2">
            {/* Stratagem slots */}
            <div className="flex items-center gap-1.5">
              {slots.map((card, i) => (
                <StratagemSlot key={i} index={i} card={card} />
              ))}
            </div>

            {/* Vertical divider */}
            <div className="w-px self-stretch mx-1" style={{ background: C.borderSoft }} />

            {/* Equipment chips */}
            <div className="flex items-center gap-1.5">
              <EquipmentChip label="ARMOR" name={armor?.name ?? "—"} accent={C.cyan} glyph="◇" />
              <EquipmentChip label="PRIMARY" name={weapon?.name ?? "—"} accent={C.cyan} glyph="▤" />
              <EquipmentChip label="BOOSTER" name={booster?.name ?? "—"} accent="#a78bfa" glyph="✦" />
            </div>
          </div>
        </button>

        {/* DEPLOY CTA — heavy, intentional */}
        <DeployButton onClick={onDeploy} target={target} difficulty={difficulty} />
      </div>
    </footer>
  );
}

function HazardStripe({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{
        [side]: 0,
        width: 8,
        background: `repeating-linear-gradient(${side === "left" ? "-45deg" : "45deg"}, ${C.yellow} 0 6px, ${C.bg0} 6px 12px)`,
        opacity: 0.55,
      }}
    />
  );
}

function StratagemSlot({ index, card }: { index: number; card: { id: string; name: string; cost: number; type: string } | null }) {
  if (!card) {
    return (
      <div
        className="w-12 h-12 flex items-center justify-center border border-dashed"
        style={{
          borderColor: "rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.02)",
          borderRadius: 1,
        }}
        title={`Stratagem slot ${index + 1} — empty`}
      >
        <span style={{ color: C.textFaint, fontSize: 12 }}>＋</span>
      </div>
    );
  }
  return (
    <div
      className="relative w-12 h-12 border flex flex-col items-center justify-center"
      style={{
        borderColor: C.borderHard,
        background: `linear-gradient(180deg, ${C.bg2}, ${C.bg1})`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 6px ${C.yellowGlow}`,
        borderRadius: 1,
      }}
      title={`${card.name} · ${card.cost}R`}
    >
      <CornerBrackets accent={C.yellow} size={5} />
      <span className="font-display font-black text-[14px] leading-none" style={{ color: C.yellow, textShadow: `0 0 6px ${C.yellow}66` }}>
        {iconForType(card.type)}
      </span>
      <span className="text-[7px] uppercase tracking-widest mt-0.5 tabular-nums" style={{ color: C.textDim }}>
        {card.cost}R
      </span>
    </div>
  );
}

function iconForType(type: string): string {
  const map: Record<string, string> = {
    eagle: "✦",
    orbital: "◎",
    sentry: "▣",
    support: "▤",
    backpack: "⛨",
    utility: "◊",
  };
  return map[type] ?? "◆";
}

function EquipmentChip({ label, name, accent, glyph }: { label: string; name: string; accent: string; glyph: string }) {
  return (
    <div
      className="px-2 py-1.5 border flex items-center gap-2 min-w-[120px]"
      style={{ borderColor: `${accent}44`, background: `${accent}08`, borderRadius: 1 }}
    >
      <div
        className="w-7 h-7 flex items-center justify-center border shrink-0"
        style={{ borderColor: `${accent}66`, color: accent, fontSize: 13 }}
      >
        {glyph}
      </div>
      <div className="flex flex-col leading-none min-w-0">
        <span className="text-[7px] uppercase tracking-widest" style={{ color: C.textFaint }}>{label}</span>
        <span className="text-[10px] uppercase tracking-wider font-black truncate mt-0.5" style={{ color: accent }}>
          {name}
        </span>
      </div>
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
      whileTap={{ scale: 0.97 }}
      className="relative shrink-0 px-6 py-2 flex items-center gap-3 border-2 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${C.yellow} 0%, ${C.orange} 100%)`,
        borderColor: hovered ? "#ffffff" : C.yellow,
        boxShadow: hovered
          ? `0 0 28px ${C.yellow}aa, inset 0 0 16px rgba(255,255,255,0.25)`
          : `0 0 18px ${C.yellow}88, inset 0 0 10px rgba(255,255,255,0.15)`,
        borderRadius: 1,
        minWidth: 240,
      }}
    >
      {/* Sweep highlight on hover */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-16 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
        }}
        initial={{ x: "-200%" }}
        animate={{ x: hovered ? "400%" : "-200%" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      {/* Bracket corners — black on yellow */}
      <span aria-hidden style={{ position: "absolute", top: 2, left: 2, width: 8, height: 8, borderTop: "2px solid #0a0d12", borderLeft: "2px solid #0a0d12" }} />
      <span aria-hidden style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderTop: "2px solid #0a0d12", borderRight: "2px solid #0a0d12" }} />
      <span aria-hidden style={{ position: "absolute", bottom: 2, left: 2, width: 8, height: 8, borderBottom: "2px solid #0a0d12", borderLeft: "2px solid #0a0d12" }} />
      <span aria-hidden style={{ position: "absolute", bottom: 2, right: 2, width: 8, height: 8, borderBottom: "2px solid #0a0d12", borderRight: "2px solid #0a0d12" }} />

      <span aria-hidden className="font-display font-black text-2xl leading-none" style={{ color: C.bg0 }}>▶</span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[8px] uppercase tracking-[0.4em] font-black" style={{ color: "rgba(0,0,0,0.65)" }}>
          {target ? `D${difficulty} ${target.faction.toUpperCase()}` : "STANDBY"}
        </span>
        <span
          className="text-base uppercase tracking-[0.3em] font-display font-black mt-1"
          style={{ color: C.bg0, textShadow: `0 0 8px rgba(255,255,255,0.4)` }}
        >
          DEPLOY HELLDIVER
        </span>
      </div>
    </motion.button>
  );
}
