"use client";

import { useEffect, useState, ReactNode } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { sfx } from "@/lib/sfx";
import { CARD_LIBRARY } from "@/lib/cards";
import { ENEMY_TEMPLATES } from "@/lib/enemies";
import { ARMORS, WEAPONS, BOOSTERS } from "@/lib/loadout";
import { getEnemyArt, getCardArt, getArmorArt, getWeaponArt } from "@/lib/artManifest";
import HudFrame from "./HudFrame";
import HubFrame from "./hub/HubFrame";
import StratagemCard from "./cards/StratagemCard";
import { FactionIcon } from "@/lib/icons";
import { Armor, Faction, EnemyTemplate, Weapon, Booster, Card } from "@/lib/types";

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
    <HubFrame title="Codex">
      {/*
        h-full + flex-col so the active-tab area can claim the
        full remaining height. Tabs and filters stay fixed-size.
        ArmorTab in particular uses flex-1 + min-h-0 so it fits
        one viewport without page-scroll.
      */}
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 mb-3 shrink-0">
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
          <div className="flex flex-wrap items-center gap-1 mb-3 shrink-0">
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
          <div className="flex flex-wrap items-center gap-1 mb-3 shrink-0">
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

        {/* Tab content — flex-1 + min-h-0 lets the inner tab claim the
            full remaining height. Tabs that should fit one viewport
            (ArmorTab) use h-full inside; tabs that scroll a long grid
            (Stratagems / Weapons / Enemies) wrap their own scroll. */}
        <div className="flex-1 min-h-0">
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
      </div>
    </HubFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// CODEX LIGHTBOX — generic click-to-zoom modal used by every tab.
//
// Click any card → fixed-position dim/blur backdrop fades in, the card
// content springs to centre at a larger size. ESC or backdrop-click
// dismiss. Body scroll is locked while open.
// ─────────────────────────────────────────────────────────────────────────
function CodexLightbox({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // ESC closes + body scroll-lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-[80] flex items-center justify-center p-6 cursor-zoom-out"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            background: "rgba(5,8,13,0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Stop propagation so clicks on the card itself don't dismiss */}
          <motion.div
            initial={{ scale: 0.82, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative cursor-default"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute -top-3 -right-3 z-10 w-8 h-8 flex items-center justify-center font-display font-black text-base transition-transform hover:scale-110"
              style={{
                background: "#FFC72C",
                color: "#0A0F14",
                border: "1px solid #0A0F14",
                boxShadow: "0 0 16px rgba(255,199,44,0.6)",
              }}
            >
              ×
            </button>
            {children}
          </motion.div>

          {/* Hint footer */}
          <div
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] font-display font-black"
            style={{ color: "rgba(255,199,44,0.55)" }}
          >
            Click outside · Press ESC to close
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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

  // Click-to-zoom — clicking any compact card opens the full-size card
  // in a centred lightbox so the player can read every line of effect copy.
  const [zoomed, setZoomed] = useState<Card | null>(null);

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
              <div className="absolute -top-1 -left-1 z-10 px-1.5 py-0.5 border border-helldiver-yellow bg-black text-helldiver-yellow text-[9px] font-display font-black tabular-nums pointer-events-none">
                #{indexInLib + 1}
              </div>
              {/* Missing-art badge */}
              {!hasArt && (
                <div className="absolute -top-1 -right-1 z-10 px-1.5 py-0.5 border border-helldiver-orange bg-black text-helldiver-orange text-[9px] font-display font-black uppercase tracking-widest pointer-events-none">
                  No Art
                </div>
              )}
              <StratagemCard
                card={card}
                affordable
                onClick={() => {
                  sfx.click();
                  setZoomed(card);
                }}
                small
              />
            </motion.div>
          );
        })}
      </div>

      {/* Zoomed card — full-size StratagemCard (280×410) */}
      <CodexLightbox open={!!zoomed} onClose={() => setZoomed(null)}>
        {zoomed && (
          <StratagemCard
            card={zoomed}
            affordable
            onClick={() => {}}
            size="normal"
          />
        )}
      </CodexLightbox>
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
      // h-full + flex-col + min-h-0 so the 3-zone grid claims the full
      // remaining viewport height. No page-scroll on the armor page.
      className="relative overflow-hidden h-full flex flex-col"
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

      {/* Section header — fixed-height so the grid below absorbs the rest */}
      <header
        className="px-4 py-2 flex items-center justify-between shrink-0"
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

      {/* 3-zone main grid — flex-1 to fill the remaining viewport height.
          Each column scrolls internally if its content exceeds the bounds.
          The redundant ArmorComparisonStrip was removed (its picker
          duplicates the left ArmorList). */}
      <div
        className="grid flex-1 min-h-0"
        style={{ gridTemplateColumns: "240px minmax(0,1fr) 320px" }}
      >
        {/* LEFT — armor list */}
        <ArmorList armors={ARMORS} selectedId={selectedId} onSelect={setSelectedId} />

        {/* CENTER — hero showcase */}
        <ArmorHero armor={selected} />

        {/* RIGHT — stats + perk + tactical */}
        <ArmorDetailRail armor={selected} />
      </div>
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
      className="flex flex-col overflow-y-auto min-h-0"
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
      // h-full so the hero fills the grid cell exactly; minHeight removed
      // because we now want the hero to *shrink* on shorter viewports
      // rather than force the page to scroll.
      className="relative overflow-hidden h-full"
      style={{
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
      className="flex flex-col overflow-y-auto min-h-0"
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
// WEAPONS — AAA card system
//
// Card structure (top → bottom):
//   1. TOP BAR     · weapon-class glyph · NAME · rarity pip strip
//   2. ART         · cinematic full-bleed portrait + bottom gradient
//   3. TYPE LINE   · "PRIMARY · <CATEGORY>"
//   4. STATS ROW   · DAMAGE · HITS · TARGET (icons + tabular numerics)
//   5. ABILITY     · in-engine effect copy
//   6. KEYWORDS    · subtle gold/role-tinted chips
//   7. BOTTOM BAR  · flavor line · faction skull · card ID
//
// Visual states: idle, hover (scale + glow), selected (gold border).
// Disabled state is exposed via `locked` prop (desaturated, sealed).
// ─────────────────────────────────────────────────────────────────────────

type WeaponClass =
  | "assault"
  | "marksman"
  | "explosive"
  | "energy"
  | "arc"
  | "shotgun"
  | "adaptive";
type WeaponRarity = "common" | "rare" | "epic" | "legendary";
type WeaponKeyword =
  | "PRECISION"
  | "ARMOR-PIERCING"
  | "EXPLOSIVE"
  | "PLASMA"
  | "ARC"
  | "FIRE"
  | "STAGGER"
  | "AUTO-FIRE"
  | "AOE"
  | "ADAPTIVE"
  | "CHAIN";

interface WeaponMeta {
  className: string;       // human-readable category line, e.g. "ASSAULT", "DMR"
  weaponClass: WeaponClass; // tints / icons
  rarity: WeaponRarity;
  keywords: WeaponKeyword[];
  flavor: string;          // bottom flavor line
  cardId: string;          // bottom-right ID stamp
}

const WEAPON_META: Record<string, WeaponMeta> = {
  ar2_coyote: {
    className: "ASSAULT CARBINE",
    weaponClass: "assault",
    rarity: "common",
    keywords: ["AUTO-FIRE"],
    flavor: "Standard issue. The first rifle every Helldiver fires. The last one some ever will.",
    cardId: "AR-002",
  },
  ar23p_liberator_penetrator: {
    className: "ASSAULT — PENETRATOR",
    weaponClass: "assault",
    rarity: "rare",
    keywords: ["AUTO-FIRE", "ARMOR-PIERCING"],
    flavor: "AR-23 base — re-bored chamber, hardened core. Cuts where the original could only chip.",
    cardId: "AR-023P",
  },
  r2124_constitution: {
    className: "BATTLE RIFLE — HEIRLOOM",
    weaponClass: "marksman",
    rarity: "rare",
    keywords: ["PRECISION", "AUTO-FIRE"],
    flavor: "Wood furniture. Brass fittings. Older than the war and outliving most of who fight it.",
    cardId: "R-2124",
  },
  r6_deadeye: {
    className: "MARKSMAN DMR",
    weaponClass: "marksman",
    rarity: "epic",
    keywords: ["PRECISION", "ARMOR-PIERCING"],
    flavor: "One target. One round. One less problem for democracy.",
    cardId: "R-006",
  },
  r36_eruptor: {
    className: "EXPLOSIVE BOLT-ACTION",
    weaponClass: "explosive",
    rarity: "epic",
    keywords: ["EXPLOSIVE", "AOE"],
    flavor: "Detonates on contact. Re-detonates on shrapnel. Re-re-detonates on doctrine.",
    cardId: "R-036",
  },
  jar5_dominator: {
    className: "EXPLOSIVE PISTOL",
    weaponClass: "explosive",
    rarity: "rare",
    keywords: ["EXPLOSIVE", "STAGGER"],
    flavor: "A handgun, technically. A field demolition charge, statistically.",
    cardId: "JAR-005",
  },
  cb9_exploding_crossbow: {
    className: "EXPLOSIVE CROSSBOW",
    weaponClass: "explosive",
    rarity: "epic",
    keywords: ["EXPLOSIVE", "PRECISION"],
    flavor: "Silent in flight. Loud on arrival. Approved for democratic stealth operations.",
    cardId: "CB-009",
  },
  sg8p_punisher_plasma: {
    className: "PLASMA SHOTGUN",
    weaponClass: "energy",
    rarity: "epic",
    keywords: ["PLASMA", "AOE"],
    flavor: "Charged superheated cores. Disperses on impact. Disperses what was hit too.",
    cardId: "SG-008P",
  },
  arc12_blitzer: {
    className: "ARC SHOTGUN",
    weaponClass: "arc",
    rarity: "epic",
    keywords: ["ARC", "CHAIN"],
    flavor: "Discharges raw atmospheric current. Targets are encouraged not to hold hands.",
    cardId: "ARC-012",
  },
  sg20_halt: {
    className: "STAGGER SHOTGUN",
    weaponClass: "shotgun",
    rarity: "rare",
    keywords: ["STAGGER", "AUTO-FIRE"],
    flavor: "Concussive shells. The enemy stops advancing. Sometimes permanently.",
    cardId: "SG-020",
  },
  sg451_cookout: {
    className: "INCENDIARY SHOTGUN",
    weaponClass: "shotgun",
    rarity: "rare",
    keywords: ["FIRE", "AUTO-FIRE"],
    flavor: "Thermite buckshot. Cooks armor open from the inside. Liberty served well-done.",
    cardId: "SG-451",
  },
  vg70_variable: {
    className: "ADAPTIVE — DUAL MODE",
    weaponClass: "adaptive",
    rarity: "legendary",
    keywords: ["ADAPTIVE", "ARMOR-PIERCING", "AUTO-FIRE"],
    flavor: "Reconfigures mid-engagement. Precision optic on one threat, devastator on the next.",
    cardId: "VG-070",
  },
};

const WEAPON_PALETTE = {
  bg: "#0A0F14",
  panel: "#0E141C",
  panelDeep: "#070b10",
  panelHover: "#10171F",
  gold: "#FFC72C",
  goldDim: "rgba(255,199,44,0.7)",
  goldFaint: "rgba(255,199,44,0.18)",
  rule: "rgba(255,255,255,0.06)",
  ruleStrong: "rgba(255,199,44,0.35)",
  text: "rgba(255,255,255,0.92)",
  textMid: "rgba(255,255,255,0.62)",
  textDim: "rgba(255,255,255,0.38)",
  red: "#ff4d4d",
} as const;

const RARITY_META: Record<WeaponRarity, { pips: number; label: string; color: string }> = {
  common:    { pips: 1, label: "STANDARD",    color: "rgba(255,255,255,0.55)" },
  rare:      { pips: 2, label: "FIELD-PROVEN", color: "#60c4ff" },
  epic:      { pips: 3, label: "ELITE ISSUE",  color: "#a855f7" },
  legendary: { pips: 4, label: "EXPERIMENTAL", color: WEAPON_PALETTE.gold },
};

const CLASS_GLYPH: Record<WeaponClass, string> = {
  assault: "▶▶",
  marksman: "◆",
  explosive: "✸",
  energy: "◉",
  arc: "⚡",
  shotgun: "▣",
  adaptive: "⟁",
};

const CLASS_TINT: Record<WeaponClass, string> = {
  assault: "#FFC72C",
  marksman: "#FFC72C",
  explosive: "#ff8a28",
  energy: "#a855f7",
  arc: "#60c4ff",
  shotgun: "#FFC72C",
  adaptive: "#FFC72C",
};

const KEYWORD_TINT: Record<WeaponKeyword, string> = {
  "PRECISION":      "#60c4ff",
  "ARMOR-PIERCING": "#FFC72C",
  "EXPLOSIVE":      "#ff8a28",
  "PLASMA":         "#a855f7",
  "ARC":            "#60c4ff",
  "FIRE":           "#ff4d4d",
  "STAGGER":        "#FFC72C",
  "AUTO-FIRE":      "rgba(255,255,255,0.55)",
  "AOE":            "#ff8a28",
  "ADAPTIVE":       "#FFC72C",
  "CHAIN":          "#60c4ff",
};

const TARGET_LABEL: Record<Weapon["target"], string> = {
  highest_hp: "PRIORITY",
  random:     "SPREAD",
  all:        "AREA",
};
const TARGET_GLYPH: Record<Weapon["target"], string> = {
  highest_hp: "◎",
  random:     "✦",
  all:        "▤",
};

function WeaponTab() {
  // selectedId still drives the gold-border highlight on the grid;
  // zoomedId drives the lightbox. They can be the same value (clicking
  // selects + zooms) but the model keeps them separable in case we want
  // to add a "browse mode" later that highlights without zooming.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomedId, setZoomedId] = useState<string | null>(null);
  const zoomedWeapon = zoomedId ? WEAPONS.find((w) => w.id === zoomedId) ?? null : null;
  const zoomedIndex = zoomedId ? WEAPONS.findIndex((w) => w.id === zoomedId) + 1 : 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${WEAPON_PALETTE.panelDeep} 0%, ${WEAPON_PALETTE.bg} 100%)`,
        border: `1px solid ${WEAPON_PALETTE.rule}`,
      }}
    >
      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${WEAPON_PALETTE.gold}, transparent)` }}
      />

      {/* Header strip */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${WEAPON_PALETTE.rule}` }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="w-1.5 h-1.5"
            style={{ background: WEAPON_PALETTE.gold, boxShadow: `0 0 6px ${WEAPON_PALETTE.gold}` }}
          />
          <h2
            className="font-display font-black uppercase tracking-[0.32em] text-sm"
            style={{ color: WEAPON_PALETTE.gold }}
          >
            Primary Armament Database
          </h2>
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.3em] tabular-nums"
          style={{ color: WEAPON_PALETTE.textDim }}
        >
          {WEAPONS.length} catalogued · {WEAPONS.filter((w) => getWeaponArt(w.id)).length} cinematic
        </span>
      </div>

      {/* Card grid — compact 196×287 cards, matching stratagem grid density */}
      <div className="p-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
          {WEAPONS.map((w, i) => (
            <WeaponCard
              key={w.id}
              weapon={w}
              index={i + 1}
              selected={selectedId === w.id}
              onClick={() => {
                sfx.click();
                setSelectedId(w.id);
                setZoomedId(w.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Zoomed weapon — render the same card at 2.2× via CSS `zoom`.
          Unlike `transform: scale`, `zoom` re-rasterises text at the new
          size so every spec stays crisp instead of going pixelated. */}
      <CodexLightbox open={!!zoomedWeapon} onClose={() => setZoomedId(null)}>
        {zoomedWeapon && (
          <div style={{ zoom: 2.2 }}>
            <WeaponCard
              weapon={zoomedWeapon}
              index={zoomedIndex}
              selected
              onClick={() => {}}
            />
          </div>
        )}
      </CodexLightbox>
    </div>
  );
}

interface WeaponCardProps {
  weapon: Weapon;
  index: number;
  selected: boolean;
  onClick: () => void;
  /** Optional locked/disabled state — desaturated + non-interactive overlay. */
  locked?: boolean;
}

function WeaponCard({ weapon, index, selected, onClick, locked = false }: WeaponCardProps) {
  const meta = WEAPON_META[weapon.id] ?? {
    className: "PRIMARY WEAPON",
    weaponClass: "assault" as WeaponClass,
    rarity: "common" as WeaponRarity,
    keywords: ["AUTO-FIRE"] as WeaponKeyword[],
    flavor: "Awaiting field assessment.",
    cardId: weapon.id.toUpperCase().slice(0, 8),
  };
  const rarity = RARITY_META[meta.rarity];
  const art = getWeaponArt(weapon.id);
  const classTint = CLASS_TINT[meta.weaponClass];
  // Cap to top 2 keyword chips so a 196px-wide card never wraps to 2 rows
  const visibleKeywords = meta.keywords.slice(0, 2);

  return (
    <motion.button
      type="button"
      onClick={locked ? undefined : onClick}
      whileHover={locked ? undefined : { y: -3, scale: 1.015 }}
      whileTap={locked ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      aria-pressed={selected}
      aria-disabled={locked}
      className={clsx(
        "group relative text-left overflow-hidden flex flex-col",
        locked ? "cursor-not-allowed" : "cursor-pointer"
      )}
      style={{
        // Match stratagem compact-card footprint exactly
        width: 196,
        height: 287,
        background: `linear-gradient(180deg, ${WEAPON_PALETTE.panel} 0%, ${WEAPON_PALETTE.panelDeep} 100%)`,
        border: `1px solid ${selected ? WEAPON_PALETTE.gold : WEAPON_PALETTE.rule}`,
        boxShadow: selected
          ? `0 0 0 1px ${WEAPON_PALETTE.gold}, 0 0 24px ${WEAPON_PALETTE.goldFaint}`
          : "0 4px 14px rgba(0,0,0,0.45)",
        filter: locked ? "saturate(0.2) brightness(0.5)" : undefined,
        transition: "border-color 180ms ease, box-shadow 180ms ease",
      }}
    >
      {/* Corner brackets — match stratagem card visual language */}
      <span aria-hidden className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l z-10" style={{ borderColor: selected ? WEAPON_PALETTE.gold : WEAPON_PALETTE.goldFaint }} />
      <span aria-hidden className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r z-10" style={{ borderColor: selected ? WEAPON_PALETTE.gold : WEAPON_PALETTE.goldFaint }} />
      <span aria-hidden className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l z-10" style={{ borderColor: selected ? WEAPON_PALETTE.gold : WEAPON_PALETTE.goldFaint }} />
      <span aria-hidden className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r z-10" style={{ borderColor: selected ? WEAPON_PALETTE.gold : WEAPON_PALETTE.goldFaint }} />

      {/* Hover gold ring */}
      {!locked && !selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            boxShadow: `inset 0 0 0 1px ${WEAPON_PALETTE.goldFaint}, 0 0 18px ${WEAPON_PALETTE.goldFaint}`,
          }}
        />
      )}

      {/* TOP BAR — 24px tall · glyph + name + rarity pips */}
      <div
        className="relative flex items-center gap-1.5 px-2 shrink-0"
        style={{
          height: 24,
          borderBottom: `1px solid ${selected ? WEAPON_PALETTE.ruleStrong : WEAPON_PALETTE.rule}`,
          background: selected
            ? `linear-gradient(90deg, ${WEAPON_PALETTE.gold}1a, transparent 70%)`
            : `linear-gradient(90deg, rgba(255,199,44,0.04), transparent 70%)`,
        }}
      >
        <span
          aria-hidden
          className="flex items-center justify-center text-[9px] font-black"
          style={{
            width: 16, height: 16,
            color: classTint,
            border: `1px solid ${WEAPON_PALETTE.rule}`,
            background: WEAPON_PALETTE.panelDeep,
          }}
          title={meta.weaponClass}
        >
          {CLASS_GLYPH[meta.weaponClass]}
        </span>
        <h3
          className="flex-1 font-display font-black uppercase tracking-[0.04em] truncate"
          style={{
            color: selected ? WEAPON_PALETTE.gold : WEAPON_PALETTE.text,
            fontSize: 9.5,
            lineHeight: 1.05,
          }}
        >
          {weapon.name}
        </h3>
        <RarityPips rarity={meta.rarity} />
      </div>

      {/* ART — fixed 110px tall · cinematic portrait */}
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ height: 110, background: WEAPON_PALETTE.panelDeep }}
      >
        {art ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={art}
              alt=""
              draggable={false}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              style={{ display: "block" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(5,8,16,0.95) 0%, rgba(5,8,16,0.2) 35%, transparent 60%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: WEAPON_PALETTE.textDim, fontSize: 28 }}
          >
            {CLASS_GLYPH[meta.weaponClass]}
          </div>
        )}

        {/* Index badge */}
        <span
          className="absolute top-1 left-1 px-1 py-px text-[8px] font-display font-black tabular-nums tracking-widest"
          style={{
            color: WEAPON_PALETTE.gold,
            background: "rgba(0,0,0,0.7)",
            border: `1px solid ${WEAPON_PALETTE.goldFaint}`,
          }}
        >
          #{String(index).padStart(2, "0")}
        </span>

        {/* Type-line over bottom gradient */}
        <div className="absolute left-2 right-2 bottom-1">
          <div
            className="font-display font-black uppercase truncate"
            style={{
              color: classTint,
              fontSize: 8.5,
              letterSpacing: "0.16em",
              textShadow: "0 1px 3px rgba(0,0,0,0.95)",
            }}
          >
            Primary · {meta.className}
          </div>
        </div>
      </div>

      {/* STATS ROW — 36px tall · 3 cells */}
      <div
        className="grid grid-cols-3 gap-px shrink-0"
        style={{
          background: WEAPON_PALETTE.rule,
          borderBottom: `1px solid ${WEAPON_PALETTE.rule}`,
        }}
      >
        <StatCell
          label="DMG"
          value={String(weapon.damage)}
          glyph="✦"
          accent={WEAPON_PALETTE.gold}
        />
        <StatCell
          label="HITS"
          value={String(weapon.hitsPerTurn)}
          glyph="≡"
          accent={WEAPON_PALETTE.text}
        />
        <StatCell
          label={TARGET_LABEL[weapon.target]}
          value={weapon.ignoreArmor ? "AP" : "—"}
          glyph={TARGET_GLYPH[weapon.target]}
          accent={weapon.ignoreArmor ? WEAPON_PALETTE.gold : WEAPON_PALETTE.text}
        />
      </div>

      {/* ABILITY + KEYWORDS — flex 1 fill */}
      <div className="flex-1 flex flex-col px-2 pt-1.5 pb-1 min-h-0">
        <p
          className="leading-snug overflow-hidden"
          style={{
            color: WEAPON_PALETTE.textMid,
            fontSize: 9.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {weapon.description}
        </p>
        {visibleKeywords.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {visibleKeywords.map((kw) => (
              <span
                key={kw}
                className="px-1 py-px font-display font-black uppercase whitespace-nowrap"
                style={{
                  color: KEYWORD_TINT[kw],
                  border: `1px solid ${KEYWORD_TINT[kw]}40`,
                  background: `${KEYWORD_TINT[kw]}10`,
                  fontSize: 7.5,
                  letterSpacing: "0.12em",
                  lineHeight: 1.4,
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM BAR — 22px tall · skull · id */}
      <div
        className="flex items-center justify-between gap-1.5 px-2 shrink-0"
        style={{
          height: 22,
          borderTop: `1px solid ${WEAPON_PALETTE.rule}`,
          background: WEAPON_PALETTE.panelDeep,
        }}
      >
        <SuperEarthSkull className="w-3 h-3 shrink-0" tint={WEAPON_PALETTE.goldDim} />
        <span
          className="flex-1 italic truncate"
          style={{ color: WEAPON_PALETTE.textDim, fontSize: 8 }}
          title={meta.flavor}
        >
          {meta.flavor}
        </span>
        <span
          className="font-display font-black tabular-nums tracking-widest shrink-0"
          style={{ color: WEAPON_PALETTE.goldDim, fontSize: 7.5 }}
        >
          {meta.cardId}
        </span>
      </div>

      {/* Selected gold rule */}
      {selected && !locked && (
        <span
          aria-hidden
          className="absolute left-0 right-0 bottom-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${WEAPON_PALETTE.gold}, transparent)`,
            boxShadow: `0 0 6px ${WEAPON_PALETTE.gold}`,
          }}
        />
      )}

      {/* LOCKED overlay */}
      {locked && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <span
            className="px-1.5 py-0.5 font-display font-black uppercase tracking-[0.28em]"
            style={{
              color: WEAPON_PALETTE.red,
              border: `1px solid ${WEAPON_PALETTE.red}`,
              background: "rgba(0,0,0,0.6)",
              fontSize: 8.5,
            }}
          >
            Sealed
          </span>
        </div>
      )}
    </motion.button>
  );
}

function RarityPips({ rarity }: { rarity: WeaponRarity }) {
  const r = RARITY_META[rarity];
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rarity: ${rarity}`}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="block w-1 h-2.5"
          style={{
            background: i < r.pips ? r.color : WEAPON_PALETTE.rule,
            boxShadow: i < r.pips ? `0 0 4px ${r.color}` : undefined,
          }}
        />
      ))}
    </span>
  );
}

function StatCell({
  label,
  value,
  glyph,
  accent,
}: {
  label: string;
  value: string;
  glyph: string;
  accent: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ background: WEAPON_PALETTE.panel, height: 36, paddingTop: 2, paddingBottom: 2 }}
    >
      <span
        className="font-display font-black tabular-nums leading-none"
        style={{ color: accent, fontSize: 14 }}
      >
        {value}
      </span>
      <span
        className="font-display font-black uppercase mt-0.5 truncate"
        style={{
          color: WEAPON_PALETTE.textDim,
          fontSize: 7,
          letterSpacing: "0.18em",
          maxWidth: "100%",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SuperEarthSkull({ className, tint }: { className?: string; tint: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      fill="none"
      stroke={tint}
      strokeWidth={1.4}
    >
      <circle cx="16" cy="14" r="7" />
      <rect x="12" y="20" width="8" height="3" />
      <circle cx="13" cy="14" r="1.4" fill={tint} stroke="none" />
      <circle cx="19" cy="14" r="1.4" fill={tint} stroke="none" />
      <line x1="16" y1="16" x2="16" y2="18" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BOOSTERS
// ─────────────────────────────────────────────────────────────────────────
function BoosterTab() {
  const [zoomed, setZoomed] = useState<{ booster: Booster; index: number } | null>(null);

  return (
    <HudFrame label={`Boosters · ${BOOSTERS.length}`} accent="yellow" className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BOOSTERS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              sfx.click();
              setZoomed({ booster: b, index: i + 1 });
            }}
            className="text-left transition-transform hover:scale-[1.02] hover:z-10 cursor-zoom-in"
          >
            <DataCard
              index={i + 1}
              id={b.id}
              name={b.name}
              subtitle="Booster · Drop-Pod Augment"
              description={b.description}
              stats={[]}
              accent="purple"
              artUrl={null}
            />
          </button>
        ))}
      </div>

      {/* Zoomed booster — DataCard rendered inside a fixed-width container
          so the layout doesn't depend on grid context */}
      <CodexLightbox open={!!zoomed} onClose={() => setZoomed(null)}>
        {zoomed && (
          <div style={{ width: 480, fontSize: "1.15rem" }}>
            <DataCard
              index={zoomed.index}
              id={zoomed.booster.id}
              name={zoomed.booster.name}
              subtitle="Booster · Drop-Pod Augment"
              description={zoomed.booster.description}
              stats={[]}
              accent="purple"
              artUrl={null}
            />
          </div>
        )}
      </CodexLightbox>
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

  const [zoomed, setZoomed] = useState<{ template: EnemyTemplate; index: number } | null>(null);

  return (
    <HudFrame label={`Hostiles · ${templates.length} of ${allTemplates.length}`} accent="yellow" className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {templates.map((tpl, i) => {
          const overall = allTemplates.findIndex((t) => t.id === tpl.id);
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                sfx.click();
                setZoomed({ template: tpl, index: overall + 1 });
              }}
              className="text-left transition-transform hover:scale-[1.02] hover:z-10 cursor-zoom-in"
            >
              <EnemyDataCard template={tpl} index={overall + 1} />
            </button>
          );
        })}
      </div>

      {/* Zoomed enemy — fixed width so the portrait gets its full glory */}
      <CodexLightbox open={!!zoomed} onClose={() => setZoomed(null)}>
        {zoomed && (
          <div style={{ width: 460 }}>
            <EnemyDataCard template={zoomed.template} index={zoomed.index} />
          </div>
        )}
      </CodexLightbox>
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
