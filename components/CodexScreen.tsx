"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "@/lib/sfx";
import { CARD_LIBRARY } from "@/lib/cards";
import { ENEMY_TEMPLATES } from "@/lib/enemies";
import { ARMORS, WEAPONS, BOOSTERS } from "@/lib/loadout";
import { getEnemyArt, getCardArt, getArmorArt } from "@/lib/artManifest";
import HudFrame from "./HudFrame";
import HubFrame from "./hub/HubFrame";
import StratagemCard from "./cards/StratagemCard";
import { FactionIcon } from "@/lib/icons";
import { Armor, Faction, EnemyTemplate } from "@/lib/types";

type Tab = "stratagems" | "armors" | "weapons" | "boosters" | "enemies";

const STRATAGEM_FILTERS = ["all", "orbital", "eagle", "sentry", "support", "backpack", "utility"] as const;
const FACTION_FILTERS = ["all", "terminid", "automaton", "illuminate"] as const;
type StratagemFilter = (typeof STRATAGEM_FILTERS)[number];
type FactionFilter = (typeof FACTION_FILTERS)[number];

export default function CodexScreen() {
  const [tab, setTab] = useState<Tab>("stratagems");
  const [stratFilter, setStratFilter] = useState<StratagemFilter>("all");
  const [factionFilter, setFactionFilter] = useState<FactionFilter>("all");
  const [showOnlyMissingArt, setShowOnlyMissingArt] = useState(false);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "stratagems", label: "Stratagems", count: CARD_LIBRARY.length },
    { id: "armors", label: "Armors", count: ARMORS.length },
    { id: "weapons", label: "Weapons", count: WEAPONS.length },
    { id: "boosters", label: "Boosters", count: BOOSTERS.length },
    { id: "enemies", label: "Enemies", count: Object.keys(ENEMY_TEMPLATES).length },
  ];

  return (
    <HubFrame
      title="Codex"
      subtitle="Super Earth Field Codex · All Approved Materiel"
    >
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                sfx.click();
                setTab(t.id);
              }}
              className={clsx(
                "px-4 py-2 border-2 font-display font-bold tracking-widest text-xs transition-all flex items-center gap-2",
                tab === t.id
                  ? "bg-helldiver-yellow text-black border-helldiver-yellow shadow-[0_0_18px_rgba(255,211,77,0.5)]"
                  : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
              )}
            >
              <span>{t.label.toUpperCase()}</span>
              <span className={clsx(
                "px-1.5 py-0.5 text-[10px] tabular-nums border",
                tab === t.id ? "border-black/30" : "border-helldiver-steel/40"
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sub-filters per tab */}
        {tab === "stratagems" && (
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {STRATAGEM_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { sfx.click(); setStratFilter(f); }}
                className={clsx(
                  "px-3 py-1 border text-[10px] tracking-widest font-mono transition-colors",
                  stratFilter === f
                    ? "border-helldiver-yellow bg-helldiver-yellow text-black"
                    : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
                )}
              >
                {f.toUpperCase()}
              </button>
            ))}
            <div className="w-px h-5 bg-helldiver-steel mx-1" />
            <button
              onClick={() => { sfx.click(); setShowOnlyMissingArt((v) => !v); }}
              className={clsx(
                "px-3 py-1 border text-[10px] tracking-widest font-mono transition-colors",
                showOnlyMissingArt
                  ? "border-helldiver-orange bg-helldiver-orange text-black"
                  : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-orange hover:text-helldiver-orange"
              )}
            >
              {showOnlyMissingArt ? "✓ MISSING ART ONLY" : "□ MISSING ART ONLY"}
            </button>
          </div>
        )}

        {tab === "enemies" && (
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {FACTION_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { sfx.click(); setFactionFilter(f); }}
                className={clsx(
                  "px-3 py-1 border text-[10px] tracking-widest font-mono transition-colors",
                  factionFilter === f
                    ? "border-helldiver-yellow bg-helldiver-yellow text-black"
                    : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-yellow hover:text-helldiver-yellow"
                )}
              >
                {f.toUpperCase()}
              </button>
            ))}
            <div className="w-px h-5 bg-helldiver-steel mx-1" />
            <button
              onClick={() => { sfx.click(); setShowOnlyMissingArt((v) => !v); }}
              className={clsx(
                "px-3 py-1 border text-[10px] tracking-widest font-mono transition-colors",
                showOnlyMissingArt
                  ? "border-helldiver-orange bg-helldiver-orange text-black"
                  : "border-helldiver-steel text-helldiver-dim hover:border-helldiver-orange hover:text-helldiver-orange"
              )}
            >
              {showOnlyMissingArt ? "✓ MISSING ART ONLY" : "□ MISSING ART ONLY"}
            </button>
          </div>
        )}

        {/* Tab content */}
        {tab === "stratagems" && (
          <StratagemTab filter={stratFilter} onlyMissingArt={showOnlyMissingArt} />
        )}
        {tab === "armors" && <ArmorTab />}
        {tab === "weapons" && <WeaponTab />}
        {tab === "boosters" && <BoosterTab />}
        {tab === "enemies" && (
          <EnemyTab faction={factionFilter} onlyMissingArt={showOnlyMissingArt} />
        )}
      </div>
    </HubFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STRATAGEMS — render the actual game card so you see exactly what
// players see in combat, including the wired-up art.
// ─────────────────────────────────────────────────────────────────────────
function StratagemTab({
  filter,
  onlyMissingArt,
}: {
  filter: StratagemFilter;
  onlyMissingArt: boolean;
}) {
  let cards = filter === "all" ? CARD_LIBRARY : CARD_LIBRARY.filter((c) => c.type === filter);
  if (onlyMissingArt) cards = cards.filter((c) => !getCardArt(c.id));

  return (
    <HudFrame label={`Stratagems · ${cards.length} of ${CARD_LIBRARY.length}`} accent="yellow" className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {cards.map((card, i) => {
          const hasArt = !!getCardArt(card.id);
          const indexInLib = CARD_LIBRARY.findIndex((c) => c.id === card.id);
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.4, i * 0.012) }}
              className="relative"
            >
              {/* Index badge */}
              <div className="absolute -top-1 -left-1 z-10 px-1.5 py-0.5 border border-helldiver-yellow bg-black text-helldiver-yellow text-[9px] font-display font-black tabular-nums">
                #{indexInLib + 1}
              </div>
              {/* Missing-art badge */}
              {!hasArt && (
                <div className="absolute -top-1 -right-1 z-10 px-1.5 py-0.5 border border-helldiver-orange bg-black text-helldiver-orange text-[9px] font-display font-black uppercase tracking-widest">
                  No Art
                </div>
              )}
              <StratagemCard
                card={card}
                affordable
                onClick={() => {}}
                small
              />
            </motion.div>
          );
        })}
      </div>
    </HudFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ARMORS — cinematic 3-zone command console (command bridge feel)
//   LEFT  · armor list (selectable rows)
//   CENTER· hero showcase (full-body Helldiver in armor)
//   RIGHT · stats + perk + tactical summary
//   BOTTOM· comparison strip (3-5 mini cards)
// ─────────────────────────────────────────────────────────────────────────

const ARMOR_PALETTE = {
  bg: "#0A0F14",
  panel: "#0E141C",
  panelDeep: "#070b10",
  gold: "#FFC72C",
  goldDim: "rgba(255,199,44,0.7)",
  goldFaint: "rgba(255,199,44,0.18)",
  navy: "#1a2332",
  hairline: "rgba(255,199,44,0.18)",
  rule: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.92)",
  textMid: "rgba(255,255,255,0.62)",
  textDim: "rgba(255,255,255,0.38)",
  green: "#22c55e",
  red: "#ff4d4d",
  orange: "#ff8a28",
} as const;

const WEIGHT_META: Record<string, { label: string; color: string; glyph: string; tactical: string }> = {
  scout:     { label: "LIGHT",  color: "#60c4ff", glyph: "▲", tactical: "Stealth recon. Maximum mobility, minimal protection." },
  frontline: { label: "MEDIUM", color: ARMOR_PALETTE.gold, glyph: "■", tactical: "Balanced engagement. Standard issue all-purpose chassis." },
  fortified: { label: "HEAVY",  color: "#ff8a28", glyph: "▼", tactical: "Frontline survivability. Heavy plating, slower draws." },
};

/** Designer flavor text per armor — the tactical summary on the right rail. */
const ARMOR_FLAVOR: Record<string, string> = {
  scout: "Adaptive carbon weave. Standard kit for forward observers, intel ops, and dive-and-fade engagements where extraction speed beats survivability.",
  frontline: "B-01 Tactical: the bedrock of every Super Earth deployment. No specialization, no weak points — the armor that brought democracy back.",
  fortified: "Reinforced ceramic + ablative under-plating. Built for Helldivers who hold the line, eat fire, and drag wounded comrades to extraction.",
  champion: "Med-Kit subsystems integrated under the chest plate. Self-sustains in extended engagements. Carry your own stims; carry your squad.",
  ground_breaker: "Engineering-rated power systems. Onboard charge regenerator keeps stratagem requisition flowing through long deployments.",
  hard_liner: "Siege-class plating. Not built to maneuver — built to endure. Worn by veterans of Malevelon Creek and the Tanis defense lines.",
};

const LOADOUT_EFFECT: Record<string, string> = {
  scout: "Extra hand draw · reduced HP — favors fast tempo runs and trick decks",
  frontline: "Default loadout — even floor for any stratagem strategy",
  fortified: "Block + HP at the cost of hand size — favors burst-attrition plays",
  champion: "Self-sustain — extra stims paper over chip damage between engagements",
  ground_breaker: "+1 max requisition each combat — favors high-cost stratagem chains",
  hard_liner: "Highest HP + block in the game — built for raw siege survivability",
};

function ArmorTab() {
  const [selectedId, setSelectedId] = useState<string>(ARMORS[0]?.id ?? "");
  const selected = ARMORS.find((a) => a.id === selectedId) ?? ARMORS[0];

  if (!selected) return null;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${ARMOR_PALETTE.panel} 0%, ${ARMOR_PALETTE.bg} 100%)`,
        border: `1px solid ${ARMOR_PALETTE.rule}`,
        borderRadius: 1,
      }}
    >
      {/* Top hairline gold accent + scanline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${ARMOR_PALETTE.gold}, transparent)` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.5) 0 1px, transparent 1px 4px)",
        }}
      />

      {/* Section header */}
      <header
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${ARMOR_PALETTE.rule}` }}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="w-1.5 h-1.5" style={{ background: ARMOR_PALETTE.gold, boxShadow: `0 0 4px ${ARMOR_PALETTE.gold}` }} />
          <h3
            className="text-[10px] uppercase tracking-[0.4em] font-display font-black"
            style={{ color: ARMOR_PALETTE.gold }}
          >
            BODY ARMOR · GEAR LOCKER
          </h3>
        </div>
        <span className="text-[9px] uppercase tracking-[0.3em] tabular-nums" style={{ color: ARMOR_PALETTE.textDim }}>
          {ARMORS.length} CONFIGURATIONS
        </span>
      </header>

      {/* 3-zone main grid */}
      <div className="grid" style={{ gridTemplateColumns: "240px minmax(0,1fr) 320px" }}>
        {/* LEFT — armor list */}
        <ArmorList armors={ARMORS} selectedId={selectedId} onSelect={setSelectedId} />

        {/* CENTER — hero showcase */}
        <ArmorHero armor={selected} />

        {/* RIGHT — stats + perk + tactical */}
        <ArmorDetailRail armor={selected} />
      </div>

      {/* BOTTOM — comparison strip */}
      <ArmorComparisonStrip armors={ARMORS} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

function ArmorList({
  armors, selectedId, onSelect,
}: {
  armors: Armor[]; selectedId: string; onSelect: (id: string) => void;
}) {
  return (
    <nav
      className="flex flex-col"
      style={{ borderRight: `1px solid ${ARMOR_PALETTE.rule}` }}
    >
      {armors.map((a) => {
        const meta = WEIGHT_META[a.weightClass] ?? WEIGHT_META.frontline;
        const isSelected = a.id === selectedId;
        return (
          <ArmorListItem
            key={a.id}
            armor={a}
            classMeta={meta}
            isSelected={isSelected}
            onClick={() => { sfx.click(); onSelect(a.id); }}
          />
        );
      })}
    </nav>
  );
}

function ArmorListItem({
  armor, classMeta, isSelected, onClick,
}: {
  armor: Armor;
  classMeta: { label: string; color: string; glyph: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left px-3 py-3 transition-all duration-200 relative"
      style={{
        background: isSelected
          ? `linear-gradient(90deg, ${ARMOR_PALETTE.gold}1f, ${ARMOR_PALETTE.gold}06 60%, transparent)`
          : hovered
            ? `linear-gradient(90deg, ${ARMOR_PALETTE.gold}10, transparent 70%)`
            : "transparent",
        boxShadow: isSelected
          ? `inset 4px 0 0 ${ARMOR_PALETTE.gold}, 0 0 14px ${ARMOR_PALETTE.gold}22`
          : hovered
            ? `inset 3px 0 0 ${ARMOR_PALETTE.gold}88`
            : "inset 4px 0 0 transparent",
        borderBottom: `1px solid ${ARMOR_PALETTE.rule}`,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className="inline-flex items-center gap-1.5 px-1.5 py-0.5"
          style={{
            background: `${classMeta.color}1a`,
            border: `1px solid ${classMeta.color}55`,
            borderRadius: 1,
          }}
        >
          <span style={{ color: classMeta.color, fontSize: 8 }}>{classMeta.glyph}</span>
          <span className="text-[8px] uppercase tracking-[0.3em] font-display font-black" style={{ color: classMeta.color }}>
            {classMeta.label}
          </span>
        </span>
        {isSelected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="font-display font-black"
            style={{ color: ARMOR_PALETTE.gold, fontSize: 12 }}
          >
            ▶
          </motion.span>
        )}
      </div>
      <div
        className="text-[12px] uppercase tracking-[0.12em] font-display font-black truncate leading-tight"
        style={{
          color: isSelected ? ARMOR_PALETTE.gold : ARMOR_PALETTE.text,
          textShadow: isSelected ? `0 0 4px ${ARMOR_PALETTE.gold}66` : undefined,
        }}
      >
        {armor.name.replace(/^[A-Z0-9-]+\s/, "")}
      </div>
      <div className="text-[8px] uppercase tracking-[0.25em] mt-1 truncate" style={{ color: ARMOR_PALETTE.textDim }}>
        {armor.passiveName ?? "Standard"}
      </div>
    </button>
  );
}

function ArmorHero({ armor }: { armor: Armor }) {
  const meta = WEIGHT_META[armor.weightClass] ?? WEIGHT_META.frontline;
  const art = getArmorArt(armor.id);
  return (
    <div
      className="relative overflow-hidden"
      style={{
        minHeight: 480,
        background: `radial-gradient(ellipse at 50% 30%, rgba(255,199,44,0.06) 0%, transparent 65%), linear-gradient(180deg, #0d141d, #050810)`,
      }}
    >
      {/* Faction-neutral battlefield backdrop pulled from existing art */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/art/hub/command_center.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          opacity: 0.18,
          filter: "blur(2px) saturate(0.6)",
        }}
      />
      {/* Vignette + radial dim */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={armor.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
          className="absolute inset-0"
        >
          {/* Hero portrait — full image with idle breathing.
              Silhouette renders behind the image; on load the image
              fades in over it, on error the image stays opacity:0 and
              the silhouette remains the visible layer. */}
          <motion.div
            className="absolute inset-0 flex items-end justify-center"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArmorSilhouette weightClass={armor.weightClass} accent={meta.color} />
            {art && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={armor.id}
                src={art}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ display: "block", opacity: 0, transition: "opacity 320ms ease" }}
                onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
              />
            )}
          </motion.div>

          {/* Subtle ember/dust particles */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="absolute"
                style={{
                  left: `${15 + i * 18}%`,
                  bottom: "10%",
                  width: 2, height: 2,
                  background: ARMOR_PALETTE.gold,
                  boxShadow: `0 0 6px ${ARMOR_PALETTE.gold}`,
                  borderRadius: "50%",
                }}
                animate={{ y: [-0, -160, -240], opacity: [0, 0.55, 0] }}
                transition={{
                  duration: 5 + i * 0.6,
                  delay: i * 1.1,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Overlay UI: corner brackets */}
          <div className="absolute inset-4 pointer-events-none" aria-hidden>
            <span style={{ position: "absolute", top: 0, left: 0, width: 16, height: 16, borderTop: `1px solid ${ARMOR_PALETTE.gold}`, borderLeft: `1px solid ${ARMOR_PALETTE.gold}` }} />
            <span style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderTop: `1px solid ${ARMOR_PALETTE.gold}`, borderRight: `1px solid ${ARMOR_PALETTE.gold}` }} />
            <span style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16, borderBottom: `1px solid ${ARMOR_PALETTE.gold}`, borderLeft: `1px solid ${ARMOR_PALETTE.gold}` }} />
            <span style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderBottom: `1px solid ${ARMOR_PALETTE.gold}`, borderRight: `1px solid ${ARMOR_PALETTE.gold}` }} />
          </div>

          {/* Top-left readout: armor designation */}
          <div className="absolute top-5 left-6 pointer-events-none">
            <div className="text-[9px] uppercase tracking-[0.4em] mb-1" style={{ color: ARMOR_PALETTE.goldDim, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              ARMOR · DESIGNATION
            </div>
            <div
              className="font-display font-black tracking-[0.14em] leading-tight"
              style={{ color: ARMOR_PALETTE.gold, fontSize: 28, textShadow: `0 0 10px ${ARMOR_PALETTE.gold}55, 0 2px 6px rgba(0,0,0,0.7)` }}
            >
              {armor.name.toUpperCase()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] font-display font-black"
                style={{
                  color: meta.color,
                  background: `${meta.color}1a`,
                  border: `1px solid ${meta.color}66`,
                  borderRadius: 1,
                }}
              >
                CLASS · {meta.label}
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: ARMOR_PALETTE.textMid, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                {armor.passiveName ?? "STANDARD"}
              </span>
            </div>
          </div>

          {/* Bottom-left flavor text */}
          <div className="absolute bottom-5 left-6 right-6 pointer-events-none">
            <div className="text-[8px] uppercase tracking-[0.4em] mb-1.5" style={{ color: ARMOR_PALETTE.goldDim, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
              FIELD COMMUNIQUÉ
            </div>
            <p
              className="text-[11px] leading-relaxed max-w-[480px] italic"
              style={{ color: ARMOR_PALETTE.textMid, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
            >
              {ARMOR_FLAVOR[armor.id] ?? armor.passive}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Silhouette fallback when armor art is missing — drawn in CSS. */
function ArmorSilhouette({ weightClass, accent }: { weightClass: string; accent: string }) {
  // Three weight classes drive different body proportions
  const isHeavy = weightClass === "fortified";
  const isLight = weightClass === "scout";
  return (
    <div className="relative w-[260px] h-[420px] mb-10" aria-hidden>
      {/* Halo */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${accent}33, transparent 65%)`,
          filter: "blur(8px)",
        }}
      />
      {/* Body silhouette using box-shadows */}
      <svg viewBox="0 0 100 160" className="absolute inset-0 w-full h-full" style={{ filter: `drop-shadow(0 0 12px ${accent}44)` }}>
        {/* Helmet */}
        <ellipse cx="50" cy="22" rx={isHeavy ? 16 : isLight ? 11 : 13} ry={isHeavy ? 14 : isLight ? 11 : 12} fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        {/* Visor */}
        <rect x="42" y="20" width="16" height="3" fill={accent} opacity="0.7" />
        {/* Torso */}
        <path d={`M ${isHeavy ? 30 : isLight ? 36 : 32} 38 L ${isHeavy ? 70 : isLight ? 64 : 68} 38 L ${isHeavy ? 75 : isLight ? 65 : 70} 80 L ${isHeavy ? 25 : isLight ? 35 : 30} 80 Z`} fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        {/* Arms */}
        <rect x={isHeavy ? 18 : isLight ? 25 : 21} y="40" width="9" height="38" fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        <rect x={isHeavy ? 73 : isLight ? 66 : 70} y="40" width="9" height="38" fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        {/* Legs */}
        <rect x="35" y="80" width="11" height="55" fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        <rect x="54" y="80" width="11" height="55" fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        {/* Boots */}
        <rect x="33" y="135" width="14" height="6" fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        <rect x="53" y="135" width="14" height="6" fill="#0a0d12" stroke={accent} strokeWidth="0.6" />
        {/* Chest skull emblem */}
        <text x="50" y="60" textAnchor="middle" fontSize="6" fill={accent} opacity="0.7" fontWeight="900">☠</text>
      </svg>
    </div>
  );
}

function ArmorDetailRail({ armor }: { armor: Armor }) {
  const meta = WEIGHT_META[armor.weightClass] ?? WEIGHT_META.frontline;

  // Compute display values
  const baseHp = 100;
  const finalHp = baseHp + armor.hpMod;
  const block = armor.startingBlock;
  const baseHand = 5;
  const finalHand = baseHand + armor.handMod;
  const baseReq = 4;
  const finalReq = baseReq + armor.reqMod;

  return (
    <div
      className="flex flex-col"
      style={{ borderLeft: `1px solid ${ARMOR_PALETTE.rule}` }}
    >
      {/* STATS BLOCK */}
      <DetailSection label="VITALS · STATS BLOCK">
        <StatBar label="HP" value={finalHp} max={170} delta={armor.hpMod} accent={ARMOR_PALETTE.green} />
        <StatBar label="Block" value={block} max={10} delta={block} accent={ARMOR_PALETTE.gold} />
        <StatBar label="Hand Size" value={finalHand} max={8} delta={armor.handMod} accent="#60c4ff" />
        <StatBar label="Requisition" value={finalReq} max={8} delta={armor.reqMod} accent={ARMOR_PALETTE.orange} />
      </DetailSection>

      {/* PERK MODULE */}
      <DetailSection label="PERK · ARMOR PASSIVE">
        <div className="flex items-start gap-2.5">
          <div
            className="w-9 h-9 flex items-center justify-center shrink-0 border"
            style={{
              borderColor: meta.color,
              background: `${meta.color}10`,
              boxShadow: `0 0 8px ${meta.color}55`,
              borderRadius: 1,
            }}
          >
            <span style={{ color: meta.color, fontSize: 16, lineHeight: 1, textShadow: `0 0 4px ${meta.color}` }}>◆</span>
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[11px] uppercase tracking-[0.18em] font-display font-black"
              style={{ color: meta.color, textShadow: `0 0 4px ${meta.color}55` }}
            >
              {armor.passiveName ?? "Standard"}
            </div>
            <p className="text-[10px] leading-relaxed mt-1" style={{ color: ARMOR_PALETTE.textMid }}>
              {armor.passive}
            </p>
            {(armor.bonusStims || armor.reinforcementBonus) && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {armor.bonusStims ? (
                  <PerkChip label={`+${armor.bonusStims} STIMS`} accent={ARMOR_PALETTE.green} />
                ) : null}
                {armor.reinforcementBonus ? (
                  <PerkChip label={`+${armor.reinforcementBonus} REINFORCEMENTS`} accent={ARMOR_PALETTE.gold} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DetailSection>

      {/* LOADOUT EFFECT */}
      <DetailSection label="TACTICAL · LOADOUT EFFECT">
        <p className="text-[10px] leading-relaxed" style={{ color: ARMOR_PALETTE.textMid }}>
          {meta.tactical}
        </p>
        <div
          className="mt-2 px-2.5 py-1.5"
          style={{
            background: `${ARMOR_PALETTE.gold}08`,
            border: `1px solid ${ARMOR_PALETTE.goldFaint}`,
            borderRadius: 1,
          }}
        >
          <div className="text-[8px] uppercase tracking-[0.35em] mb-1" style={{ color: ARMOR_PALETTE.goldDim }}>
            FIELD ASSESSMENT
          </div>
          <p className="text-[10px] leading-snug" style={{ color: ARMOR_PALETTE.text }}>
            {LOADOUT_EFFECT[armor.id] ?? "Standard combat profile."}
          </p>
        </div>
      </DetailSection>
    </div>
  );
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      className="px-4 py-3.5"
      style={{ borderBottom: `1px solid ${ARMOR_PALETTE.rule}` }}
    >
      <div className="flex items-center gap-1.5 mb-2.5">
        <span aria-hidden style={{ width: 4, height: 4, background: ARMOR_PALETTE.gold }} />
        <h4 className="text-[8px] uppercase tracking-[0.4em] font-display font-black" style={{ color: ARMOR_PALETTE.gold }}>
          {label}
        </h4>
      </div>
      {children}
    </section>
  );
}

function StatBar({ label, value, max, delta, accent }: { label: string; value: number; max: number; delta: number; accent: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: ARMOR_PALETTE.textDim }}>{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-black tabular-nums text-[12px]" style={{ color: accent }}>
            {value}
          </span>
          {delta !== 0 && (
            <span
              className="text-[8px] uppercase tracking-widest tabular-nums font-display font-black"
              style={{ color: delta > 0 ? ARMOR_PALETTE.green : ARMOR_PALETTE.red }}
            >
              {delta > 0 ? `+${delta}` : `${delta}`}
            </span>
          )}
        </div>
      </div>
      <div className="h-1" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
        <motion.div
          className="h-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            background: accent,
            boxShadow: `0 0 4px ${accent}aa`,
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
}

function PerkChip({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="px-1.5 py-0.5 text-[8px] uppercase tracking-[0.25em] font-display font-black"
      style={{
        color: accent,
        background: `${accent}14`,
        border: `1px solid ${accent}55`,
        borderRadius: 1,
      }}
    >
      {label}
    </span>
  );
}

function ArmorComparisonStrip({
  armors, selectedId, onSelect,
}: {
  armors: Armor[]; selectedId: string; onSelect: (id: string) => void;
}) {
  // Show all 6 armors as small mini cards along the bottom
  return (
    <footer
      className="px-4 py-3"
      style={{
        borderTop: `1px solid ${ARMOR_PALETTE.rule}`,
        background: `linear-gradient(180deg, transparent 0%, ${ARMOR_PALETTE.panelDeep} 100%)`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span aria-hidden style={{ width: 4, height: 4, background: ARMOR_PALETTE.gold }} />
          <h4 className="text-[8px] uppercase tracking-[0.4em] font-display font-black" style={{ color: ARMOR_PALETTE.gold }}>
            COMPARE · QUICK SWAP
          </h4>
        </div>
        <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: ARMOR_PALETTE.textDim }}>
          CLICK TO INSPECT
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {armors.map((a) => {
          const meta = WEIGHT_META[a.weightClass] ?? WEIGHT_META.frontline;
          const isSelected = a.id === selectedId;
          return (
            <ArmorMiniCard
              key={a.id}
              armor={a}
              meta={meta}
              isSelected={isSelected}
              onClick={() => { sfx.click(); onSelect(a.id); }}
            />
          );
        })}
      </div>
    </footer>
  );
}

function ArmorMiniCard({
  armor, meta, isSelected, onClick,
}: {
  armor: Armor;
  meta: { label: string; color: string; glyph: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const baseHp = 100;
  const finalHp = baseHp + armor.hpMod;
  const block = armor.startingBlock;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative px-2.5 py-2 text-left transition-all duration-200 overflow-hidden"
      style={{
        border: isSelected ? `1px solid ${ARMOR_PALETTE.gold}` : `1px solid ${ARMOR_PALETTE.rule}`,
        background: isSelected ? `${ARMOR_PALETTE.gold}10` : hovered ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.3)",
        boxShadow: isSelected ? `0 0 12px ${ARMOR_PALETTE.gold}44, inset 0 0 8px ${ARMOR_PALETTE.gold}22` : undefined,
        borderRadius: 1,
        transform: hovered && !isSelected ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[7px] uppercase tracking-[0.3em] font-display font-black" style={{ color: meta.color }}>
          {meta.label}
        </span>
        {isSelected && (
          <span style={{ color: ARMOR_PALETTE.gold, fontSize: 9 }}>◆</span>
        )}
      </div>
      <div
        className="text-[10px] uppercase tracking-[0.12em] font-display font-black truncate leading-tight"
        style={{ color: isSelected ? ARMOR_PALETTE.gold : ARMOR_PALETTE.text }}
      >
        {armor.name.replace(/^[A-Z0-9-]+\s/, "")}
      </div>
      {/* Mini stat bars */}
      <div className="mt-2 grid grid-cols-2 gap-1">
        <div className="flex items-center gap-1">
          <span className="text-[7px] uppercase tracking-widest" style={{ color: ARMOR_PALETTE.textDim }}>HP</span>
          <div className="flex-1 h-[2px]" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full" style={{ width: `${Math.min(100, (finalHp / 170) * 100)}%`, background: ARMOR_PALETTE.green }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[7px] uppercase tracking-widest" style={{ color: ARMOR_PALETTE.textDim }}>BLK</span>
          <div className="flex-1 h-[2px]" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full" style={{ width: `${Math.min(100, (block / 10) * 100)}%`, background: ARMOR_PALETTE.gold }} />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// WEAPONS
// ─────────────────────────────────────────────────────────────────────────
function WeaponTab() {
  return (
    <HudFrame label={`Primary Weapons · ${WEAPONS.length}`} accent="yellow" className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {WEAPONS.map((w, i) => (
          <DataCard
            key={w.id}
            index={i + 1}
            id={w.id}
            name={w.name}
            subtitle="Primary · Auto-Fire"
            description={w.description}
            stats={[
              { label: "Damage", value: `${w.damage}`, accent: true },
              { label: "Hits/Turn", value: `${w.hitsPerTurn}` },
              { label: "Targeting", value: w.target.replace("_", " ").toUpperCase() },
              ...(w.ignoreArmor ? [{ label: "Special", value: "IGNORES ARMOR" }] : []),
            ]}
            accent="cyan"
            artUrl={null}
          />
        ))}
      </div>
    </HudFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BOOSTERS
// ─────────────────────────────────────────────────────────────────────────
function BoosterTab() {
  return (
    <HudFrame label={`Boosters · ${BOOSTERS.length}`} accent="yellow" className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BOOSTERS.map((b, i) => (
          <DataCard
            key={b.id}
            index={i + 1}
            id={b.id}
            name={b.name}
            subtitle="Booster · Drop-Pod Augment"
            description={b.description}
            stats={[]}
            accent="purple"
            artUrl={null}
          />
        ))}
      </div>
    </HudFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ENEMIES
// ─────────────────────────────────────────────────────────────────────────
const FACTION_TINT: Record<Faction, string> = {
  terminid: "from-helldiver-orange/20 via-bg-tertiary to-bg-secondary",
  automaton: "from-helldiver-red/20 via-bg-tertiary to-bg-secondary",
  illuminate: "from-sky-500/20 via-bg-tertiary to-bg-secondary",
};

const FACTION_TEXT: Record<Faction, string> = {
  terminid: "text-helldiver-orange",
  automaton: "text-helldiver-red",
  illuminate: "text-sky-400",
};

function EnemyTab({
  faction,
  onlyMissingArt,
}: {
  faction: FactionFilter;
  onlyMissingArt: boolean;
}) {
  const allTemplates = Object.values(ENEMY_TEMPLATES);
  let templates = faction === "all" ? allTemplates : allTemplates.filter((e) => e.faction === faction);
  if (onlyMissingArt) templates = templates.filter((e) => !getEnemyArt(e.id));

  return (
    <HudFrame label={`Hostiles · ${templates.length} of ${allTemplates.length}`} accent="yellow" className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {templates.map((tpl, i) => {
          const overall = allTemplates.findIndex((t) => t.id === tpl.id);
          return (
            <EnemyDataCard key={tpl.id} template={tpl} index={overall + 1} />
          );
        })}
      </div>
    </HudFrame>
  );
}

function EnemyDataCard({ template, index }: { template: EnemyTemplate; index: number }) {
  const art = getEnemyArt(template.id);
  return (
    <div className={clsx(
      "relative border-2 bg-gradient-to-br overflow-hidden",
      template.isBoss ? "border-helldiver-red shadow-[0_0_20px_rgba(255,77,77,0.35)]" : "border-helldiver-steel/60",
      FACTION_TINT[template.faction]
    )}>
      {/* Index badge */}
      <div className="absolute top-1 left-1 z-10 px-1.5 py-0.5 border border-helldiver-yellow bg-black text-helldiver-yellow text-[9px] font-display font-black tabular-nums">
        #{index}
      </div>
      {!art && (
        <div className="absolute top-1 right-1 z-10 px-1.5 py-0.5 border border-helldiver-orange bg-black text-helldiver-orange text-[9px] font-display font-black uppercase tracking-widest">
          No Art
        </div>
      )}
      {template.isBoss && (
        <div className="absolute top-7 right-1 z-10 px-1.5 py-0.5 border border-helldiver-red bg-black text-helldiver-red text-[9px] font-display font-black uppercase tracking-widest">
          ⚡ BOSS
        </div>
      )}

      {/* Portrait — full source card displayed (image dictates height) */}
      {art ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={art}
          alt={template.name}
          loading="lazy"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04), rgba(0,0,0,0.45))",
          }}
        />
      ) : (
        <div
          className={clsx("relative w-full flex items-center justify-center", FACTION_TEXT[template.faction])}
          style={{ aspectRatio: "4 / 5", background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04), rgba(0,0,0,0.45))" }}
        >
          <FactionIcon faction={template.faction} className="w-16 h-16 opacity-80" />
        </div>
      )}

      {/* Compact data strip — image stays the hero, this is just reference data */}
      <div className="px-2.5 py-1.5 border-t border-helldiver-steel/40 bg-black/60">
        {/* Stats row — single tight line */}
        <div className="flex items-center gap-2 text-[10px] tabular-nums font-mono mb-1">
          <span className="text-helldiver-dim uppercase tracking-widest text-[8px]">HP</span>
          <span className="text-emerald-400 font-bold">{template.hp}</span>
          <span className="text-helldiver-steel">·</span>
          <span className="text-helldiver-dim uppercase tracking-widest text-[8px]">ARM</span>
          <span className="text-helldiver-orange font-bold">{template.armor}</span>
          <span className="text-helldiver-steel">·</span>
          <span className="text-helldiver-dim uppercase tracking-widest text-[8px]">SHD</span>
          <span className="text-sky-400 font-bold">{template.shield ?? 0}</span>
        </div>

        {/* Compact combat pattern */}
        <div className="space-y-px">
          {template.intentPattern.map((it, i) => (
            <div key={i} className="text-[9px] flex items-center justify-between gap-2 leading-tight">
              <span className="text-gray-400 truncate">
                {i + 1}. {it.text}
              </span>
              {(it.kind === "attack" || it.kind === "attack_all") && it.damage !== undefined && (
                <span className={clsx(
                  "text-[9px] tabular-nums font-bold whitespace-nowrap",
                  it.kind === "attack_all" ? "text-helldiver-red" : "text-helldiver-orange"
                )}>
                  {it.kind === "attack_all" ? "AoE " : ""}{it.damage}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Enraged pattern for bosses */}
        {template.enragedPattern && (
          <div className="mt-1 pt-1 border-t border-helldiver-red/40">
            <div className="text-[8px] uppercase tracking-widest text-helldiver-red font-bold mb-0.5">
              ⚠ Enraged
            </div>
            <div className="space-y-px">
              {template.enragedPattern.map((it, i) => (
                <div key={i} className="text-[9px] flex items-center justify-between gap-2 leading-tight">
                  <span className="text-helldiver-red/90 truncate">{i + 1}. {it.text}</span>
                  {(it.kind === "attack" || it.kind === "attack_all") && it.damage !== undefined && (
                    <span className="text-[9px] tabular-nums font-bold text-helldiver-red whitespace-nowrap">
                      {it.kind === "attack_all" ? "AoE " : ""}{it.damage}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Reusable data card for armor/weapon/booster
// ─────────────────────────────────────────────────────────────────────────
const ACCENT_BORDER: Record<string, string> = {
  yellow: "border-helldiver-yellow",
  cyan: "border-sky-400",
  purple: "border-purple-400",
};
const ACCENT_TEXT: Record<string, string> = {
  yellow: "text-helldiver-yellow",
  cyan: "text-sky-300",
  purple: "text-purple-300",
};

function DataCard({
  index,
  id,
  name,
  subtitle,
  description,
  stats,
  accent,
  artUrl,
}: {
  index: number;
  id: string;
  name: string;
  subtitle: string;
  description: string;
  stats: { label: string; value: string; accent?: boolean }[];
  accent: "yellow" | "cyan" | "purple";
  artUrl: string | null;
}) {
  return (
    <div className={clsx("relative border-2 bg-helldiver-panel/60 overflow-hidden", ACCENT_BORDER[accent])}>
      <div className="absolute top-1 left-1 z-10 px-1.5 py-0.5 border border-helldiver-yellow bg-black text-helldiver-yellow text-[9px] font-display font-black tabular-nums">
        #{index}
      </div>
      {!artUrl && (
        <div className="absolute top-1 right-1 z-10 px-1.5 py-0.5 border border-helldiver-orange bg-black text-helldiver-orange text-[9px] font-display font-black uppercase tracking-widest">
          No Art
        </div>
      )}
      {/* Art slot — full source card displayed (image dictates height) */}
      {artUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={artUrl}
          alt={name}
          loading="lazy"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04), rgba(0,0,0,0.45))",
          }}
        />
      ) : (
        <div
          className={clsx("relative w-full flex items-center justify-center text-3xl opacity-30 font-display font-black", ACCENT_TEXT[accent])}
          style={{ aspectRatio: "4 / 5", background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04), rgba(0,0,0,0.45))" }}
        >
          ◇◇◇
        </div>
      )}
      <div className="px-3 py-2 border-y border-helldiver-steel/40">
        <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">{subtitle}</div>
        <div className={clsx("font-display font-black text-base tracking-tight leading-tight", ACCENT_TEXT[accent])}>
          {name}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mt-0.5 font-mono">{id}</div>
      </div>
      <div className="px-3 py-2 text-[10px] text-gray-300 leading-snug italic min-h-[40px]">
        {description}
      </div>
      {stats.length > 0 && (
        <div className="px-3 py-2 border-t border-helldiver-steel/40 grid grid-cols-2 gap-x-3 gap-y-1">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="text-helldiver-dim uppercase tracking-widest">{s.label}</span>
              <span className={clsx("font-display font-bold tabular-nums", s.accent ? "text-helldiver-yellow" : "text-gray-200")}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-widest text-helldiver-dim">{label}</div>
      <div className={clsx("font-display font-black text-base tabular-nums", color)}>{value}</div>
    </div>
  );
}
