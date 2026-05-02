"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { sfx } from "@/lib/sfx";
import { CARD_LIBRARY } from "@/lib/cards";
import { ENEMY_TEMPLATES } from "@/lib/enemies";
import { ARMORS, WEAPONS, BOOSTERS } from "@/lib/loadout";
import { getEnemyArt, getCardArt } from "@/lib/artManifest";
import HudFrame from "./HudFrame";
import HubFrame from "./hub/HubFrame";
import StratagemCard from "./cards/StratagemCard";
import { FactionIcon } from "@/lib/icons";
import { Faction, EnemyTemplate } from "@/lib/types";

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
// ARMORS
// ─────────────────────────────────────────────────────────────────────────
const WEIGHT_LABEL: Record<string, string> = {
  scout: "LIGHT",
  frontline: "MEDIUM",
  fortified: "HEAVY",
};

function ArmorTab() {
  return (
    <HudFrame label={`Body Armor · ${ARMORS.length}`} accent="yellow" className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ARMORS.map((a, i) => (
          <DataCard
            key={a.id}
            index={i + 1}
            id={a.id}
            name={a.name}
            subtitle={`${WEIGHT_LABEL[a.weightClass] ?? a.weightClass} · ${a.passiveName ?? "Standard"}`}
            description={a.passive}
            stats={[
              { label: "HP Mod", value: a.hpMod >= 0 ? `+${a.hpMod}` : `${a.hpMod}` },
              { label: "Block", value: `+${a.startingBlock}` },
              { label: "Hand", value: a.handMod >= 0 ? `+${a.handMod}` : `${a.handMod}` },
              { label: "Req Mod", value: a.reqMod >= 0 ? `+${a.reqMod}` : `${a.reqMod}` },
              ...(a.bonusStims ? [{ label: "Bonus Stims", value: `+${a.bonusStims}` }] : []),
              ...(a.reinforcementBonus ? [{ label: "Bonus Reinf", value: `+${a.reinforcementBonus}` }] : []),
            ]}
            accent="yellow"
            artUrl={null}
          />
        ))}
      </div>
    </HudFrame>
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

      {/* Portrait — full image, never cropped */}
      <div
        className="relative aspect-[4/5] overflow-hidden flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04), rgba(0,0,0,0.45))" }}
      >
        {art ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={art}
            alt={template.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className={clsx("flex items-center justify-center", FACTION_TEXT[template.faction])}>
            <FactionIcon faction={template.faction} className="w-16 h-16 opacity-80" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-3 py-2 border-y border-helldiver-steel/40">
        <div className={clsx("text-[10px] uppercase tracking-widest font-bold", FACTION_TEXT[template.faction])}>
          {template.faction}
        </div>
        <div className="font-display font-black text-base tracking-tight text-white leading-tight">
          {template.name}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mt-0.5 font-mono">
          {template.id}
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 grid grid-cols-3 gap-1 text-[11px] border-b border-helldiver-steel/40">
        <Stat label="HP" value={`${template.hp}`} color="text-emerald-400" />
        <Stat label="Armor" value={`${template.armor}`} color="text-helldiver-orange" />
        <Stat label="Shield" value={`${template.shield ?? 0}`} color="text-sky-400" />
      </div>

      {/* Intent pattern */}
      <div className="px-3 py-2">
        <div className="text-[9px] uppercase tracking-widest text-helldiver-dim mb-1">Combat Pattern</div>
        <div className="space-y-0.5">
          {template.intentPattern.map((it, i) => (
            <div key={i} className="text-[10px] flex items-center justify-between gap-2">
              <span className="text-gray-300 truncate">
                {i + 1}. {it.text}
              </span>
              {(it.kind === "attack" || it.kind === "attack_all") && it.damage !== undefined && (
                <span className={clsx(
                  "text-[10px] tabular-nums font-bold whitespace-nowrap",
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
          <div className="mt-2 pt-2 border-t border-helldiver-red/40">
            <div className="text-[9px] uppercase tracking-widest text-helldiver-red font-bold mb-1">
              ⚠ Enraged Pattern
            </div>
            <div className="space-y-0.5">
              {template.enragedPattern.map((it, i) => (
                <div key={i} className="text-[10px] flex items-center justify-between gap-2">
                  <span className="text-helldiver-red/90 truncate">{i + 1}. {it.text}</span>
                  {(it.kind === "attack" || it.kind === "attack_all") && it.damage !== undefined && (
                    <span className="text-[10px] tabular-nums font-bold text-helldiver-red whitespace-nowrap">
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
      {/* Art slot — full image displayed (4:5 aspect to match source portraits) */}
      <div
        className="relative aspect-[4/5] flex items-center justify-center overflow-hidden"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04), rgba(0,0,0,0.45))" }}
      >
        {artUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={artUrl} alt={name} className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <div className={clsx("text-3xl opacity-30 font-display font-black", ACCENT_TEXT[accent])}>
            ◇◇◇
          </div>
        )}
      </div>
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
