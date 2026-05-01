"use client";

/**
 * HUB · COMMAND CENTER
 * ──────────────────────────────────────────────────────────────────────
 * AAA command-center layout matching the reference mockup.
 *
 * Grid:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ TOP BAR  · logo · callsign · feed · currencies · icons       │
 *   │ XP BAR   · rank · level · progress                            │
 *   ├──────┬──────────────────────────────────┬──────────────────┤
 *   │      │  Hero (destroyer + ship readout)  │  HIGHLIGHTS       │
 *   │ NAV  │  4-card row (deploy / campaign /  │   · major order   │
 *   │      │  loadout preview / daily rewards) │   · personal      │
 *   │      │  Message of the Day  ·  Squad     │   · community     │
 *   │      │                                    │  RECENT ACTIVITY  │
 *   ├──────┴──────────────────────────────────┴──────────────────┤
 *   │ FOOTER · weather · patch · issues · discord · help · logo    │
 *   └──────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import {
  getHelldiverRank,
  xpToLevelUp,
  type Account,
} from "@/lib/account";
import { ARMORS, WEAPONS, BOOSTERS, DEFAULT_ARMOR, DEFAULT_WEAPON, DEFAULT_BOOSTER } from "@/lib/loadout";
import { CARD_LIBRARY, getCardById } from "@/lib/cards";
import {
  generateActivity,
  getMajorOrderProgress,
  listPlanets,
  loadWarState,
  type WarState,
} from "@/lib/galacticWar";
import HubCommandCenterBackground from "./hub/HubCommandCenterBackground";

// ──────────────────────────────────────────────────────────────────────
//  Color tokens (kept inline — single component file)
// ──────────────────────────────────────────────────────────────────────
const COLOR = {
  yellow: "#f5c542",
  yellowDim: "rgba(245,197,66,0.7)",
  orange: "#ff8a28",
  cyan: "#60c4ff",
  green: "#10b981",
  red: "#ff4d4d",
  bg0: "#0a0d12",
  bg1: "#11161e",
  bg2: "#181f2a",
  border: "rgba(245,197,66,0.18)",
  borderSoft: "rgba(255,255,255,0.08)",
  borderHard: "rgba(245,197,66,0.5)",
} as const;

// ──────────────────────────────────────────────────────────────────────
//  ROOT
// ──────────────────────────────────────────────────────────────────────
export default function HubScreen() {
  const {
    account,
    goToWar,
    goToCharacter,
    goToArmory,
    goToCodex,
    goToSquadHub,
  } = useGame();

  const [war, setWar] = useState<WarState | null>(null);
  useEffect(() => {
    setWar(loadWarState());
  }, []);

  const [feed, setFeed] = useState<string[]>([]);
  useEffect(() => {
    if (!war) return;
    const planets = listPlanets(war);
    setFeed(Array.from({ length: 6 }).map(() => generateActivity(planets)));
    const t = setInterval(() => {
      setFeed((prev) => [generateActivity(planets), ...prev].slice(0, 8));
    }, 4500);
    return () => clearInterval(t);
  }, [war]);

  return (
    <div className="min-h-screen text-white font-mono relative overflow-hidden" style={{ background: COLOR.bg0 }}>
      <HubCommandCenterBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <TopBar account={account} feed={feed} />
        <XpRow account={account} />

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[180px_1fr_320px] gap-0 min-h-0">
          <LeftNav
            onWar={() => { sfx.click(); goToWar(); }}
            onLoadout={() => { sfx.click(); goToCharacter(); }}
            onArmory={() => { sfx.click(); goToArmory(); }}
            onStratagems={() => { sfx.click(); goToCodex(); }}
            onSquad={() => { sfx.click(); goToSquadHub(); }}
            onHistory={() => { sfx.click(); goToCharacter(); }}
            onCodex={() => { sfx.click(); goToCodex(); }}
          />
          <CenterStage
            account={account}
            war={war}
            onDeploy={() => { sfx.unlock(); sfx.beacon(); goToWar(); }}
            onEditLoadout={() => { sfx.click(); goToCharacter(); }}
            onViewWar={() => { sfx.click(); goToWar(); }}
          />
          <RightRail account={account} war={war} feed={feed} onAll={() => { sfx.click(); goToCharacter(); }} />
        </div>

        <FooterBar />
      </div>
    </div>
  );
}

// Background extracted to components/hub/HubCommandCenterBackground.tsx

// ──────────────────────────────────────────────────────────────────────
//  TOP BAR  ·  logo · callsign · feed · currencies · icons
// ──────────────────────────────────────────────────────────────────────
function TopBar({ account, feed }: { account: Account; feed: string[] }) {
  const rank = getHelldiverRank(account.level);
  return (
    <header
      className="relative border-b backdrop-blur-md"
      style={{ background: "rgba(10, 13, 18, 0.92)", borderColor: COLOR.borderSoft }}
    >
      {/* hairline cape stripe */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${COLOR.yellow}, transparent)` }}
      />

      <div className="px-4 md:px-6 py-2.5 flex items-center gap-4 flex-wrap min-h-[64px]">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="font-display font-black tracking-[0.2em] text-base" style={{ color: COLOR.yellow }}>
            HELLDIVERS
          </div>
          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.18)" }} />
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/55 font-mono">
            STRATAGEM PROTOCOL
          </div>
        </div>

        {/* Callsign + rank */}
        <div className="flex items-center gap-3 shrink-0 min-w-0 ml-2">
          <div className="flex flex-col leading-tight">
            <div className="text-[8px] uppercase tracking-[0.3em] text-white/45 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {rank.title}
            </div>
            <div className="text-sm font-display font-black tracking-wider" style={{ color: COLOR.yellow }}>
              {account.helldiverName ?? "HELLDIVER"}
            </div>
          </div>
        </div>

        {/* Galactic feed ticker */}
        <div className="hidden lg:flex flex-1 min-w-0 items-center gap-3 px-3 py-1.5 mx-2 border" style={{ borderColor: COLOR.borderSoft, background: "rgba(0,0,0,0.35)", borderRadius: 2 }}>
          <span className="shrink-0 text-[9px] uppercase tracking-[0.3em] font-black px-1.5 py-0.5 border" style={{ color: COLOR.yellow, borderColor: COLOR.yellow }}>
            ● GALACTIC FEED
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
              {feed[0] ?? "Awaiting transmissions…"}
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-white/35 shrink-0">
            10m ago
          </span>
        </div>

        {/* Currencies */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <CurrencyChip glyph="★" label="MEDALS" value={account.medals} accent={COLOR.yellow} />
          <CurrencyChip glyph="◆" label="SAMPLES" value={account.samples + account.rareSamples + account.superSamples} accent={COLOR.cyan} />
          <CurrencyChip glyph="Ⓡ" label="REQ" value={account.requisition} accent={COLOR.orange} />
        </div>

        {/* Icons cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          <IconButton glyph="✉" title="Mail" onClick={() => sfx.click()} />
          <IconButton glyph="◉" title="Squad" onClick={() => sfx.click()} />
          <IconButton glyph="⚙" title="Settings" onClick={() => sfx.click()} />
        </div>
      </div>
    </header>
  );
}

function CurrencyChip({ glyph, label, value, accent }: { glyph: string; label: string; value: number; accent: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 border"
      style={{ borderColor: `${accent}55`, background: `${accent}10`, borderRadius: 2 }}
    >
      <span className="font-display font-black text-[14px] leading-none" style={{ color: accent, textShadow: `0 0 6px ${accent}88` }}>
        {glyph}
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-[7px] uppercase tracking-widest text-white/40">{label}</span>
        <span className="font-display font-black tabular-nums text-[13px] mt-0.5" style={{ color: accent }}>
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
      className="w-8 h-8 flex items-center justify-center border transition-colors hover:border-current"
      style={{ borderColor: COLOR.borderSoft, color: "rgba(255,255,255,0.7)", borderRadius: 2 }}
    >
      <span className="text-[14px] leading-none">{glyph}</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  XP ROW
// ──────────────────────────────────────────────────────────────────────
function XpRow({ account }: { account: Account }) {
  const rank = getHelldiverRank(account.level);
  const xpNext = xpToLevelUp(account.level);
  const pct = Math.min(100, (account.xp / xpNext) * 100);
  return (
    <div
      className="px-4 md:px-6 py-1.5 flex items-center gap-4 border-b"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(0,0,0,0.35)" }}
    >
      <span className="text-[10px] font-display font-black tracking-[0.25em]" style={{ color: COLOR.yellow }}>
        {rank.abbr} · LV {account.level}
      </span>
      <div className="flex-1 h-[3px] relative overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="absolute inset-y-0 left-0"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, ${COLOR.yellow}, ${COLOR.orange})`,
            boxShadow: `0 0 8px ${COLOR.yellow}88`,
          }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] text-white/55 tabular-nums">
        {account.xp.toLocaleString()} / {xpNext.toLocaleString()} XP
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  LEFT NAV
// ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "hub", icon: "◈", label: "HUB", sub: "COMMAND CENTER", active: true },
  { key: "war", icon: "✦", label: "WAR MAP", sub: "SECTOR DEPLOYMENT", active: false },
  { key: "loadout", icon: "◇", label: "LOADOUT", sub: "EQUIPMENT + PAPER DOLL", active: false },
  { key: "armory", icon: "⌥", label: "ARMORY", sub: "OUTFITTER · WARBONDS · MODULES", active: false },
  { key: "stratagems", icon: "◊", label: "STRATAGEMS", sub: "BROWSE ALL MATERIEL", active: false },
  { key: "squad", icon: "◐", label: "SQUAD", sub: "FORM OR JOIN", active: false },
  { key: "history", icon: "◑", label: "HISTORY", sub: "MISSION RECORD", active: false },
  { key: "codex", icon: "▣", label: "CODEX", sub: "LORE + DATABASE", active: false },
] as const;

function LeftNav({
  onWar, onLoadout, onArmory, onStratagems, onSquad, onHistory, onCodex,
}: {
  onWar: () => void; onLoadout: () => void; onArmory: () => void;
  onStratagems: () => void; onSquad: () => void; onHistory: () => void; onCodex: () => void;
}) {
  const handlers: Record<string, () => void> = {
    hub: () => { /* current */ },
    war: onWar,
    loadout: onLoadout,
    armory: onArmory,
    stratagems: onStratagems,
    squad: onSquad,
    history: onHistory,
    codex: onCodex,
  };
  return (
    <nav
      className="hidden md:flex flex-col gap-1 p-2 border-r"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(0,0,0,0.25)" }}
    >
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={handlers[item.key]}
          className={clsx(
            "group relative text-left px-3 py-2 border transition-all duration-150",
            "flex flex-col gap-0.5",
          )}
          style={{
            borderColor: item.active ? COLOR.borderHard : "transparent",
            background: item.active ? `${COLOR.yellow}12` : "transparent",
            boxShadow: item.active ? `inset 4px 0 0 ${COLOR.yellow}, 0 0 14px ${COLOR.yellow}22` : undefined,
            borderRadius: 2,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-display font-black text-base leading-none"
              style={{ color: item.active ? COLOR.yellow : "rgba(255,255,255,0.6)" }}
            >
              {item.icon}
            </span>
            <span
              className="text-[11px] uppercase tracking-[0.2em] font-display font-black"
              style={{ color: item.active ? COLOR.yellow : "rgba(255,255,255,0.85)" }}
            >
              {item.label}
            </span>
          </div>
          <span className="text-[7px] uppercase tracking-[0.2em] text-white/35 pl-6">{item.sub}</span>
        </button>
      ))}
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  CENTER STAGE
// ──────────────────────────────────────────────────────────────────────
function CenterStage({
  account, war, onDeploy, onEditLoadout, onViewWar,
}: {
  account: Account; war: WarState | null;
  onDeploy: () => void; onEditLoadout: () => void; onViewWar: () => void;
}) {
  // Pick the most-contested planet as "current campaign"
  const activeCampaign = useMemo(() => {
    if (!war) return null;
    const planets = listPlanets(war);
    if (planets.length === 0) return null;
    const sorted = [...planets].sort((a, b) => Math.abs(50 - a.liberation) - Math.abs(50 - b.liberation));
    return sorted[0];
  }, [war]);

  // Loadout preview slots — first owned of each
  const armor = ARMORS.find((a) => a.id === (account.ownedArmors[0] ?? DEFAULT_ARMOR));
  const weapon = WEAPONS.find((w) => w.id === (account.ownedWeapons[0] ?? DEFAULT_WEAPON));
  const booster = BOOSTERS.find((b) => b.id === (account.ownedBoosters[0] ?? DEFAULT_BOOSTER));
  const stratagems = useMemo(() => {
    const unlocked = CARD_LIBRARY.filter((c) => account.unlockedCards.includes(c.id));
    return unlocked.slice(0, 2);
  }, [account.unlockedCards]);

  return (
    <main className="px-4 md:px-6 py-5 flex flex-col gap-4 overflow-y-auto min-w-0">
      {/* Hero block */}
      <HeroPanel onDeploy={onDeploy} />

      {/* 4-card row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickDeployCard onDeploy={onDeploy} />
        <CurrentCampaignCard campaign={activeCampaign} onView={onViewWar} />
        <LoadoutPreviewCard
          weapon={weapon}
          armor={armor}
          booster={booster}
          stratagems={stratagems}
          onEdit={onEditLoadout}
        />
        <DailyRewardsCard />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
        <MessageOfTheDay />
        <SquadStatus />
      </div>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  HERO PANEL  · translucent title plate over the bridge cinematic
//  The real bridge art lives in HubCommandCenterBackground (z-10) — this
//  panel just frames the HUB title, quote, and SES Democratic Flame card
//  with edge scrims so the text stays readable over the bright center.
// ──────────────────────────────────────────────────────────────────────
function HeroPanel({ onDeploy }: { onDeploy: () => void }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        // Hairline border tint instead of a solid plate — lets bridge show through.
        borderTop: `1px solid ${COLOR.borderSoft}`,
        borderBottom: `1px solid ${COLOR.borderSoft}`,
        borderRadius: 2,
      }}
    >
      {/* Edge scrims only — leaves the bright center of the bridge visible. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,13,18,0.92) 0%, rgba(10,13,18,0.55) 22%, rgba(10,13,18,0) 42%, rgba(10,13,18,0) 58%, rgba(10,13,18,0.55) 78%, rgba(10,13,18,0.92) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,13,18,0.4) 0%, rgba(10,13,18,0.15) 30%, rgba(10,13,18,0.15) 70%, rgba(10,13,18,0.4) 100%)",
        }}
      />

      {/* Foreground content */}
      <div className="relative px-5 md:px-8 py-6 flex items-start justify-between gap-4 min-h-[260px]">
        {/* Left — title + quote */}
        <div className="flex flex-col gap-3 max-w-md">
          <div>
            <div className="text-4xl font-display font-black tracking-[0.15em]" style={{ color: COLOR.yellow }}>
              HUB
            </div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-white/55 mt-1">
              COMMAND CENTER
            </div>
          </div>

          <blockquote
            className="border-l-2 pl-3 py-1 max-w-xs text-[11px] leading-relaxed text-white/80"
            style={{ borderColor: COLOR.yellowDim }}
          >
            "Our duty is clear.<br />
            Victory is mandatory.<br />
            Democracy is eternal."
            <footer className="mt-2 text-[9px] uppercase tracking-[0.25em] text-white/45">
              — High Command Directive
            </footer>
          </blockquote>
        </div>

        {/* Right — Active Ship card */}
        <div
          className="hidden md:flex flex-col gap-2 px-4 py-3 border min-w-[240px]"
          style={{ borderColor: COLOR.borderSoft, background: "rgba(0,0,0,0.5)", borderRadius: 2 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-display font-black" style={{ color: COLOR.yellow }}>◉</span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-white/45">ACTIVE SHIP</span>
          </div>
          <div className="text-[12px] uppercase tracking-[0.18em] font-display font-black text-white">
            SES DEMOCRATIC FLAME
          </div>
          <div className="mt-1">
            <div className="text-[8px] uppercase tracking-widest text-white/45">SHIP READINESS</div>
            <div className="text-2xl font-display font-black tabular-nums" style={{ color: COLOR.yellow }}>
              100<span className="text-base">%</span>
            </div>
            <div className="h-[3px] mt-1" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full" style={{ width: "100%", background: COLOR.yellow, boxShadow: `0 0 8px ${COLOR.yellow}88` }} />
            </div>
          </div>
          <button
            type="button"
            onClick={onDeploy}
            className="mt-2 text-[10px] uppercase tracking-widest font-black px-2 py-1.5 border hover:bg-white/5 transition-colors"
            style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)", borderRadius: 1 }}
          >
            VIEW SHIP
          </button>
        </div>
      </div>
    </section>
  );
}

// DestroyerSilhouette removed — the real bridge cinematic in
// HubCommandCenterBackground replaces the CSS-rendered placeholder.

// ──────────────────────────────────────────────────────────────────────
//  CARDS — Quick Deploy / Campaign / Loadout / Daily
// ──────────────────────────────────────────────────────────────────────
function HubCard({ title, accent, children, footer }: {
  title: string;
  accent?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const c = accent ?? COLOR.yellow;
  return (
    <section
      className="relative flex flex-col border overflow-hidden"
      style={{ borderColor: `${c}33`, background: "rgba(10,13,18,0.7)", borderRadius: 2 }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, ${c}, transparent)` }}
      />
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: c }}>
          {title}
        </div>
      </div>
      <div className="flex-1 px-3 pb-3 flex flex-col">{children}</div>
      {footer && (
        <div className="border-t px-3 py-2" style={{ borderColor: COLOR.borderSoft }}>
          {footer}
        </div>
      )}
    </section>
  );
}

function QuickDeployCard({ onDeploy }: { onDeploy: () => void }) {
  return (
    <HubCard title="QUICK DEPLOY">
      <div
        className="relative h-[120px] mb-3 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a2030 0%, #0f1320 100%)",
          borderRadius: 2,
        }}
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
          style={{
            background:
              "linear-gradient(180deg, transparent 30%, rgba(10,13,18,0.4) 70%, rgba(10,13,18,0.95) 100%)",
          }}
        />
        <button
          type="button"
          onClick={onDeploy}
          className="absolute bottom-2 left-2 right-2 px-3 py-2 font-display font-black uppercase tracking-[0.3em] text-[11px] hover:brightness-110 transition-all"
          style={{
            background: `linear-gradient(135deg, ${COLOR.yellow}, ${COLOR.orange})`,
            color: COLOR.bg0,
            boxShadow: `0 0 16px ${COLOR.yellow}66`,
            borderRadius: 1,
          }}
        >
          DEPLOY NOW
        </button>
      </div>
      <p className="text-[10px] leading-snug text-white/60">
        Jump into a new mission and spread managed democracy.
      </p>
    </HubCard>
  );
}

function CurrentCampaignCard({ campaign, onView }: { campaign: ReturnType<typeof listPlanets>[number] | null; onView: () => void }) {
  const planetName = campaign?.name ?? "UBANEA SECTOR";
  const liberation = campaign?.liberation ?? 75.2;
  return (
    <HubCard
      title="CURRENT CAMPAIGN"
      footer={
        <button
          type="button"
          onClick={onView}
          className="w-full text-[10px] uppercase tracking-[0.25em] font-black py-1 border hover:bg-white/5 transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", borderRadius: 1 }}
        >
          VIEW WAR MAP
        </button>
      }
    >
      <div
        className="relative h-[120px] mb-3 overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, #1f3550 0%, #0f1320 60%), linear-gradient(180deg, transparent, rgba(10,13,18,0.6))",
          borderRadius: 2,
        }}
      >
        {/* Planet body */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 18,
            width: 84,
            height: 84,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 32% 30%, #b08a3a 0%, #6a4a18 40%, #2a1f10 80%), radial-gradient(circle at 70% 70%, #444 0%, transparent 60%)",
            boxShadow: `0 0 24px ${COLOR.orange}55, inset -8px -8px 16px rgba(0,0,0,0.6)`,
          }}
        />
        {/* Atmosphere ring */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 14,
            width: 92,
            height: 92,
            borderRadius: "50%",
            border: `1px solid ${COLOR.orange}44`,
            boxShadow: `0 0 12px ${COLOR.orange}33`,
          }}
        />
      </div>

      <div className="text-[11px] uppercase tracking-[0.18em] font-display font-black mb-1" style={{ color: COLOR.green }}>
        {planetName.toUpperCase()}
      </div>
      <div className="text-[8px] uppercase tracking-widest text-white/45 mb-1">LIBERATION PROGRESS</div>
      <div className="flex items-center gap-2">
        <span className="font-display font-black tabular-nums text-base" style={{ color: COLOR.green }}>
          {liberation.toFixed(1)}%
        </span>
        <span className="text-[10px] text-white/45 uppercase tracking-widest">LIBERATED</span>
      </div>
      <div className="h-[3px] mt-1" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, liberation)}%`,
            background: `linear-gradient(90deg, ${COLOR.green}, #34d399)`,
            boxShadow: `0 0 8px ${COLOR.green}88`,
          }}
        />
      </div>
    </HubCard>
  );
}

function LoadoutPreviewCard({
  weapon, armor, booster, stratagems, onEdit,
}: {
  weapon?: { id: string; name: string };
  armor?: { id: string; name: string };
  booster?: { id: string; name: string };
  stratagems: ReturnType<typeof getCardById>[];
  onEdit: () => void;
}) {
  const slots: Array<{ accent: string; label: string; sub: string; glyph: string }> = [
    { accent: COLOR.cyan, label: weapon?.name?.toUpperCase() ?? "AR-23 LIBERATOR MK III", sub: "Primary Weapon", glyph: "▤" },
    { accent: COLOR.cyan, label: "P-4 SENATOR", sub: "Secondary Weapon", glyph: "▥" },
    { accent: COLOR.red, label: stratagems[0]?.name?.toUpperCase() ?? "EAGLE 500KG BOMB", sub: "Offensive Stratagem", glyph: "✦" },
    { accent: COLOR.green, label: stratagems[1]?.name?.toUpperCase() ?? "SHIELD GENERATOR PACK", sub: "Defensive Stratagem", glyph: "⛨" },
  ];
  return (
    <HubCard
      title="LOADOUT PREVIEW"
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
              className="w-7 h-7 flex items-center justify-center font-display font-black shrink-0 border"
              style={{ color: s.accent, borderColor: `${s.accent}66`, background: `${s.accent}10`, fontSize: 14 }}
            >
              {s.glyph}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider font-black truncate" style={{ color: s.accent }}>
                {s.label}
              </span>
              <span className="text-[8px] uppercase tracking-widest text-white/45">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </HubCard>
  );
}

function DailyRewardsCard() {
  // Stub: countdown to "next reward" — random remaining time within 24h
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
      footer={
        <button
          type="button"
          onClick={() => sfx.click()}
          className="w-full text-[10px] uppercase tracking-[0.25em] font-black py-1 border hover:bg-white/5 transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)", borderRadius: 1 }}
        >
          VIEW REWARDS
        </button>
      }
    >
      <div
        className="relative h-[120px] mb-3 flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2a1f10 0%, #0f1320 100%)",
          borderRadius: 2,
        }}
      >
        {/* Crate icon */}
        <div className="relative">
          <div
            className="w-20 h-16 border-2"
            style={{
              borderColor: COLOR.orange,
              background: "linear-gradient(180deg, #5a3920, #3a2510)",
              boxShadow: `0 0 20px ${COLOR.orange}55, inset 0 0 12px rgba(0,0,0,0.5)`,
              borderRadius: 2,
            }}
          />
          <div
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1.5"
            style={{ background: `linear-gradient(90deg, ${COLOR.yellow}, ${COLOR.orange})`, boxShadow: `0 0 8px ${COLOR.yellow}` }}
          />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 -mt-1.5"
            style={{ background: COLOR.yellow, boxShadow: `0 0 12px ${COLOR.yellow}`, borderRadius: 2 }}
          />
        </div>
      </div>
      <div className="text-[8px] uppercase tracking-widest text-white/45">NEXT REWARD IN</div>
      <div className="font-display font-black tabular-nums text-base" style={{ color: COLOR.orange }}>
        {time.h}H {String(time.m).padStart(2, "0")}M
      </div>
      <p className="text-[10px] leading-snug text-white/60 mt-1">
        Play missions to unlock daily rewards.
      </p>
    </HubCard>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  MESSAGE OF THE DAY  ·  SQUAD STATUS
// ──────────────────────────────────────────────────────────────────────
function MessageOfTheDay() {
  return (
    <section
      className="relative border overflow-hidden flex items-stretch"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(10,13,18,0.7)", borderRadius: 2 }}
    >
      <div
        className="w-1 self-stretch"
        style={{ background: `linear-gradient(180deg, ${COLOR.yellow}, ${COLOR.orange})` }}
      />
      <div className="flex-1 px-4 py-3 flex items-start gap-3">
        <div
          className="w-12 h-12 shrink-0 flex items-center justify-center border"
          style={{ borderColor: `${COLOR.yellow}55`, background: `${COLOR.yellow}10`, borderRadius: 2 }}
        >
          <span className="font-display font-black text-2xl" style={{ color: COLOR.yellow, textShadow: `0 0 6px ${COLOR.yellow}88` }}>
            ⚜
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: COLOR.yellow }}>
            MESSAGE OF THE DAY
          </div>
          <p className="text-[11px] leading-relaxed text-white/85">
            Helldiver, the frontlines are hot and our enemies gather strength.<br />
            Stand firm. Stand united. Victory is not optional.<br />
            For Super Earth.
          </p>
          <span className="text-[9px] uppercase tracking-widest text-white/45 mt-0.5">
            — Democracy Officer
          </span>
        </div>
      </div>
    </section>
  );
}

function SquadStatus() {
  const members = [
    { name: "Star_4392", rank: "SGT · LV 6", you: true, glyph: "✦" },
    { name: "Patriot_77", rank: "CPL · LV 4", you: false, glyph: "☠" },
    { name: "Eagle-1", rank: "CPL · LV 5", you: false, glyph: "▲" },
  ];
  return (
    <section
      className="border flex flex-col"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(10,13,18,0.7)", borderRadius: 2 }}
    >
      <div
        className="px-3 py-2 border-b flex items-center gap-2"
        style={{ borderColor: COLOR.borderSoft }}
      >
        <span className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: COLOR.yellow }}>
          SQUAD STATUS
        </span>
        <span className="text-[9px] uppercase tracking-widest text-white/40">▸ SQUAD: ALPHA LANCE</span>
        <span className="ml-auto text-[10px] tabular-nums font-black text-white/55">3 / 4</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 px-3 py-2 flex-1">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-2 px-2 py-1.5 border"
            style={{ borderColor: m.you ? COLOR.borderHard : COLOR.borderSoft, background: m.you ? `${COLOR.yellow}10` : "transparent", borderRadius: 1 }}
          >
            <div
              className="w-7 h-7 flex items-center justify-center border shrink-0 font-display font-black"
              style={{ borderColor: m.you ? COLOR.yellow : "rgba(255,255,255,0.15)", color: m.you ? COLOR.yellow : "rgba(255,255,255,0.55)" }}
            >
              {m.glyph}
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className="text-[10px] uppercase tracking-wider font-black truncate">
                {m.name}{m.you && <span className="text-white/40"> (You)</span>}
              </span>
              <span className="text-[8px] uppercase tracking-widest text-white/45 mt-0.5">{m.rank}</span>
            </div>
          </div>
        ))}
        <div
          className="flex items-center gap-2 px-2 py-1.5 border border-dashed"
          style={{ borderColor: "rgba(255,255,255,0.18)", borderRadius: 1 }}
        >
          <div className="w-7 h-7 flex items-center justify-center text-white/35 text-base">＋</div>
          <div className="flex flex-col min-w-0 leading-none">
            <span className="text-[10px] uppercase tracking-wider font-black text-white/45">EMPTY SLOT</span>
            <span className="text-[8px] uppercase tracking-widest text-white/35 mt-0.5">Available</span>
          </div>
        </div>
      </div>

      <div className="px-3 py-1.5 border-t" style={{ borderColor: COLOR.borderSoft }}>
        <button
          type="button"
          onClick={() => sfx.click()}
          className="text-[9px] uppercase tracking-[0.3em] text-white/55 hover:text-white"
        >
          MANAGE SQUAD
        </button>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  RIGHT RAIL  ·  Highlights + Recent Activity
// ──────────────────────────────────────────────────────────────────────
function RightRail({
  account, war, feed, onAll,
}: {
  account: Account;
  war: WarState | null;
  feed: string[];
  onAll: () => void;
}) {
  const moProgress = useMemo(() => (war ? getMajorOrderProgress(war) : null), [war]);
  return (
    <aside
      className="hidden md:flex flex-col gap-3 p-3 border-l overflow-y-auto"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(0,0,0,0.25)" }}
    >
      <HighlightsPanel account={account} war={war} mo={moProgress} />
      <RecentActivityPanel account={account} feed={feed} onAll={onAll} />
    </aside>
  );
}

function HighlightsPanel({
  account, war, mo,
}: {
  account: Account;
  war: WarState | null;
  mo: ReturnType<typeof getMajorOrderProgress>;
}) {
  const moTitle = war?.majorOrder?.title ?? "Defend 5 planets from Terminid incursion";
  const moHours = mo?.hoursRemaining ?? 62;
  const moDays = Math.floor(moHours / 24);
  const moRemH = Math.floor(moHours % 24);

  return (
    <section
      className="border"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(10,13,18,0.7)", borderRadius: 2 }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: COLOR.borderSoft }}>
        <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: COLOR.yellow }}>
          HIGHLIGHTS
        </div>
      </div>

      <div className="px-3 py-2 flex flex-col gap-3">
        <HighlightRow
          glyph="✦"
          accent={COLOR.yellow}
          title="MAJOR ORDER"
          deadline={`${moDays}D ${moRemH}H`}
          detail={moTitle}
        />
        <HighlightRow
          glyph="☠"
          accent={COLOR.orange}
          title="PERSONAL ORDER"
          deadline="14H 48M"
          detail="Complete 3 missions on Automaton planets"
        />

        {/* Community target */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <div
              className="w-7 h-7 flex items-center justify-center border shrink-0"
              style={{ borderColor: `${COLOR.green}66`, color: COLOR.green, background: `${COLOR.green}10`, borderRadius: 2 }}
            >
              <span className="font-display font-black text-base">▣</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: COLOR.green }}>
                COMMUNITY TARGET
              </div>
              <div className="text-[10px] text-white/85 mt-0.5">
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
                  background: `linear-gradient(90deg, ${COLOR.green}, #34d399)`,
                  boxShadow: `0 0 8px ${COLOR.green}88`,
                }}
              />
            </div>
            <span className="text-white/55">32.4M / 50M</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HighlightRow({ glyph, accent, title, deadline, detail }: {
  glyph: string; accent: string; title: string; deadline: string; detail: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 flex items-center justify-center border shrink-0"
        style={{ borderColor: `${accent}66`, color: accent, background: `${accent}10`, borderRadius: 2 }}
      >
        <span className="font-display font-black text-base">{glyph}</span>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: accent }}>
            {title}
          </span>
          <span className="text-[9px] uppercase tracking-widest tabular-nums" style={{ color: accent }}>
            {deadline}
          </span>
        </div>
        <p className="text-[10px] leading-snug text-white/85 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

function RecentActivityPanel({
  account, feed, onAll,
}: {
  account: Account;
  feed: string[];
  onAll: () => void;
}) {
  // Synthesize entries: latest run history + feed lines + an unlock + a "warbond available" stub
  const entries = useMemo(() => {
    const list: Array<{ name: string; sub: string; ago: string; glyph: string; accent: string }> = [];
    if (account.history.length > 0) {
      const latest = account.history[account.history.length - 1];
      list.push({
        name: account.helldiverName ?? "HELLDIVER",
        sub: latest.outcome === "victory" ? `Extracted from ${latest.planet}` : `KIA on ${latest.planet}`,
        ago: timeAgo(latest.date),
        glyph: latest.outcome === "victory" ? "✦" : "☠",
        accent: latest.outcome === "victory" ? COLOR.green : COLOR.red,
      });
    }
    if (feed[0]) list.push({ name: "Patriot_77", sub: feed[0], ago: "10m ago", glyph: "☠", accent: COLOR.yellow });
    if (feed[1]) list.push({ name: "Eagle-1", sub: feed[1], ago: "23m ago", glyph: "✦", accent: COLOR.cyan });
    if (account.unlockedCards.length > 0) {
      list.push({
        name: account.helldiverName ?? "HELLDIVER",
        sub: "Unlocked: AR-23 Liberator Mk III",
        ago: "1h ago",
        glyph: "◈",
        accent: COLOR.yellow,
      });
    }
    list.push({ name: "Democracy Officer", sub: "New Warbond Available", ago: "2h ago", glyph: "⚜", accent: COLOR.orange });
    return list.slice(0, 5);
  }, [account, feed]);

  return (
    <section
      className="border flex-1 flex flex-col"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(10,13,18,0.7)", borderRadius: 2 }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: COLOR.borderSoft }}>
        <div className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: COLOR.yellow }}>
          RECENT ACTIVITY
        </div>
      </div>

      <div className="flex flex-col px-2 py-2 flex-1 gap-1.5">
        {entries.map((e, i) => (
          <div key={i} className="flex items-start gap-2 px-2 py-1.5 hover:bg-white/[0.03]" style={{ borderRadius: 1 }}>
            <div
              className="w-6 h-6 flex items-center justify-center border shrink-0 mt-0.5"
              style={{ borderColor: `${e.accent}66`, color: e.accent, background: `${e.accent}10`, borderRadius: 2 }}
            >
              <span className="font-display font-black text-sm">{e.glyph}</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider font-black truncate">{e.name}</span>
                <span className="text-[8px] uppercase tracking-widest text-white/40 shrink-0 tabular-nums">{e.ago}</span>
              </div>
              <span className="text-[10px] text-white/65 leading-snug truncate">{e.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t px-2 py-2" style={{ borderColor: COLOR.borderSoft }}>
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
  const diffMs = Date.now() - ts;
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ──────────────────────────────────────────────────────────────────────
//  FOOTER
// ──────────────────────────────────────────────────────────────────────
function FooterBar() {
  return (
    <footer
      className="px-4 md:px-6 py-2 border-t flex items-center gap-2 flex-wrap"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(10,13,18,0.85)" }}
    >
      {/* Weather widget */}
      <div
        className="flex items-center gap-2 px-2 py-1 border min-w-[140px]"
        style={{ borderColor: COLOR.borderSoft, background: "rgba(0,0,0,0.4)", borderRadius: 2 }}
      >
        <span className="font-display font-black text-base" style={{ color: COLOR.cyan }}>☁</span>
        <div className="flex flex-col leading-none">
          <span className="text-[10px] uppercase tracking-wider font-black">FORI PRIME</span>
          <span className="text-[9px] uppercase tracking-widest text-white/45 mt-0.5">60°F · MOSTLY CLOUDY</span>
        </div>
      </div>

      <FooterChip glyph="▤" title="PATCH NOTES" sub="v1.0.17" />
      <FooterChip glyph="⚠" title="KNOWN ISSUES" sub="2" />
      <FooterChip glyph="◈" title="DISCORD" sub="Join Community" href="https://discord.com" />
      <FooterChip glyph="?" title="HELP & SUPPORT" sub="Contact Us" />

      {/* System status */}
      <div className="flex flex-col gap-0.5 ml-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[8px] uppercase tracking-[0.3em] text-emerald-400 font-black">SYSTEM STATUS</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-white/55">All systems nominal</span>
      </div>

      {/* Skull/wings logo */}
      <div className="hidden md:flex items-center gap-2 ml-3">
        <div
          className="w-9 h-9 flex items-center justify-center border-2"
          style={{ borderColor: COLOR.yellow, background: `${COLOR.yellow}10`, borderRadius: 2, boxShadow: `0 0 12px ${COLOR.yellow}55` }}
        >
          <span className="font-display font-black text-base" style={{ color: COLOR.yellow }}>☠</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="block"
              style={{
                width: 6,
                height: 14,
                background: i % 2 === 0 ? COLOR.yellow : COLOR.bg2,
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
      className="flex items-center gap-2 px-2 py-1 border hover:bg-white/5 transition-colors"
      style={{ borderColor: COLOR.borderSoft, background: "rgba(0,0,0,0.4)", borderRadius: 2, color: "rgba(255,255,255,0.85)" }}
    >
      <span className="font-display font-black text-base" style={{ color: COLOR.yellow }}>{glyph}</span>
      <div className="flex flex-col leading-none text-left">
        <span className="text-[10px] uppercase tracking-wider font-black">{title}</span>
        <span className="text-[9px] uppercase tracking-widest text-white/45 mt-0.5">{sub}</span>
      </div>
    </Tag>
  );
}
