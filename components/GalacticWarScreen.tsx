"use client";

/**
 * STRATEGIC DEPLOYMENT MAP · Galactic War · Sector Command
 * ──────────────────────────────────────────────────────────────────────
 * AAA war-room UI: Major Order hero banner across the top, planet
 * theater grid on the left (status-tagged cards), unified intel panel
 * on the right (selected planet + live feed + deployment CTA).
 *
 * Wrapped in HubFrame for app-wide chrome consistency.
 */

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { Faction } from "@/lib/types";
import { rollModifiers, getModifier } from "@/lib/modifiers";
import {
  generateActivity,
  getMajorOrderProgress,
  loadWarState,
  listPlanets,
  type PlanetState,
  type WarState,
} from "@/lib/galacticWar";
import HubFrame from "./hub/HubFrame";

// ──────────────────────────────────────────────────────────────────────
//  Tokens
// ──────────────────────────────────────────────────────────────────────
const C = {
  yellow: "#FFC72C",
  yellowDim: "rgba(255,199,44,0.7)",
  orange: "#ff8a28",
  red: "#ff4d4d",
  green: "#22c55e",
  cyan: "#60c4ff",
  bg0: "#0A0F14",
  panel: "#0E141B",
  panelDeep: "#070b10",
  hairline: "rgba(255,199,44,0.18)",
  rule: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.92)",
  textMid: "rgba(255,255,255,0.62)",
  textDim: "rgba(255,255,255,0.38)",
} as const;

const DIFF_LABELS: Record<number, string> = {
  1: "TRIVIAL", 2: "EASY", 3: "MEDIUM", 4: "CHALLENGING", 5: "HARD",
  6: "EXTREME", 7: "SUICIDE MISSION", 8: "IMPOSSIBLE", 9: "HELLDIVE", 10: "SUPER HELLDIVE",
};

const FACTION_COLOR: Record<Faction, string> = {
  terminid: "#ff8a28",
  automaton: "#ff4d4d",
  illuminate: "#a855f7",
};

const FACTION_HALO: Record<Faction, string> = {
  terminid: "rgba(255,138,40,0.45)",
  automaton: "rgba(255,77,77,0.45)",
  illuminate: "rgba(167,139,250,0.45)",
};

type LibStatus = "liberated" | "contested" | "under_attack";
function statusOf(planet: PlanetState): LibStatus {
  if (planet.liberation >= 100) return "liberated";
  if (planet.liberation >= 50) return "contested";
  return "under_attack";
}

const STATUS_META: Record<LibStatus, { label: string; color: string; bg: string }> = {
  liberated:    { label: "LIBERATED",    color: C.green,  bg: "rgba(34,197,94,0.12)" },
  contested:    { label: "CONTESTED",    color: C.yellow, bg: "rgba(255,199,44,0.12)" },
  under_attack: { label: "UNDER ATTACK", color: C.red,    bg: "rgba(255,77,77,0.12)" },
};

const FACTION_META: Record<Faction, { label: string; glyph: string }> = {
  terminid:   { label: "TERMINIDS",   glyph: "▼" },
  automaton:  { label: "AUTOMATONS",  glyph: "■" },
  illuminate: { label: "ILLUMINATE",  glyph: "◆" },
};

function FactionTag({ faction }: { faction: Faction }) {
  const meta = FACTION_META[faction];
  const color = FACTION_COLOR[faction];
  return (
    <div
      className="inline-flex items-center gap-1.5 px-1.5 py-0.5 leading-none"
      style={{
        background: `${color}1a`,
        border: `1px solid ${color}55`,
        borderRadius: 1,
      }}
    >
      <span style={{ color, fontSize: 9, lineHeight: 1, textShadow: `0 0 4px ${color}88` }}>{meta.glyph}</span>
      <span
        className="text-[8px] uppercase tracking-[0.3em] font-display font-black"
        style={{ color }}
      >
        {meta.label}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ROOT
// ──────────────────────────────────────────────────────────────────────
export default function GalacticWarScreen() {
  const { goToLoadout, difficulty, setDifficulty } = useGame();
  const [war, setWar] = useState<WarState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => Date.now());
  const [feed, setFeed] = useState<{ id: string; text: string; tone: "info" | "success" | "warn"; ago: string }[]>([]);

  useEffect(() => {
    setWar(loadWarState());
    const onStorage = () => setWar(loadWarState());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, []);

  // Auto-select the first non-liberated planet so the right panel is never empty
  useEffect(() => {
    if (selectedId || !war) return;
    const planets = listPlanets(war);
    const target = planets.find((p) => p.liberation < 100) ?? planets[0];
    if (target) setSelectedId(target.id);
  }, [war, selectedId]);

  // Live intel feed
  useEffect(() => {
    if (!war) return;
    const planets = listPlanets(war);
    const seedFeed = () => {
      const tones: Array<"info" | "success" | "warn"> = ["warn", "warn", "success", "info", "warn", "success"];
      return Array.from({ length: 6 }).map((_, i) => ({
        id: `seed_${i}`,
        text: generateActivity(planets),
        tone: tones[i],
        ago: `${(i + 1) * 7}m ago`,
      }));
    };
    setFeed(seedFeed());
    const t = setInterval(() => {
      setFeed((prev) => {
        const tones: Array<"info" | "success" | "warn"> = ["warn", "success", "info"];
        const next = {
          id: `live_${Date.now()}`,
          text: generateActivity(planets),
          tone: tones[Math.floor(Math.random() * tones.length)],
          ago: "just now",
        };
        return [next, ...prev].slice(0, 7);
      });
    }, 6500);
    return () => clearInterval(t);
  }, [war]);

  const planets: PlanetState[] = war ? listPlanets(war) : [];
  const majorOrder = war?.majorOrder ?? null;
  const moProgress = useMemo(() => (war ? getMajorOrderProgress(war) : null), [war]);
  const selected = selectedId ? planets.find((p) => p.id === selectedId) ?? null : null;
  const modifierIds = useMemo(() => {
    if (!selected) return [];
    return rollModifiers(selected.faction, difficulty, seed);
  }, [selected, difficulty, seed]);

  return (
    <HubFrame
      title="Strategic Deployment Map"
      subtitle="Galactic War · Sector Command"
      badge={
        <div
          className="px-3 py-1.5 border flex items-center gap-2"
          style={{ borderColor: `${C.green}66`, background: `${C.green}14`, borderRadius: 1 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: C.green }}>
            COMMAND ACTIVE
          </span>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 max-w-[1600px] mx-auto"
      >
        {/* Major Order Hero Banner */}
        {majorOrder && (
          <MajorOrderHero
            title={majorOrder.title}
            briefing={majorOrder.briefing}
            liberated={moProgress?.liberated ?? 0}
            total={moProgress?.total ?? 3}
            reward={majorOrder.rewardMedals}
          />
        )}

        {/* Main grid: 70% planets / 30% intel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <PlanetTheaterGrid
            planets={planets}
            selectedId={selectedId}
            majorTargets={majorOrder?.targetPlanetIds ?? []}
            onSelect={(id) => { sfx.click(); setSelectedId(id); setSeed(Date.now()); }}
          />

          <IntelStack
            selected={selected}
            difficulty={difficulty}
            setDifficulty={(d) => { sfx.click(); setDifficulty(d); setSeed(Date.now()); }}
            modifierIds={modifierIds}
            feed={feed}
            onDeploy={() => {
              if (!selected) return;
              sfx.unlock();
              sfx.beacon();
              useGame.setState({ targetPlanetId: selected.id });
              goToLoadout(selected.faction, difficulty, modifierIds);
            }}
            onReroll={() => { sfx.click(); setSeed(Date.now()); }}
          />
        </div>
      </motion.div>
    </HubFrame>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAJOR ORDER HERO BANNER
// ══════════════════════════════════════════════════════════════════════
function MajorOrderHero({
  title, briefing, liberated, total, reward,
}: {
  title: string; briefing: string; liberated: number; total: number; reward: number;
}) {
  const pct = total > 0 ? (liberated / total) * 100 : 0;
  return (
    <section
      className="relative overflow-hidden"
      style={{
        border: `1px solid ${C.hairline}`,
        background: C.panelDeep,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
        borderRadius: 1,
      }}
    >
      {/* Cinematic backdrop — orbital combat scene */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/art/hub/command_center.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 60%",
          opacity: 0.45,
        }}
      />
      {/* Gold rim glow at top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)` }}
      />
      {/* Gradient masking so text reads */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            `linear-gradient(90deg, ${C.panelDeep} 0%, rgba(7,11,16,0.65) 35%, rgba(7,11,16,0.55) 70%, ${C.panelDeep} 100%)`,
        }}
      />
      {/* Subtle vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      <div className="relative flex flex-col lg:flex-row items-stretch min-h-[180px]">
        {/* LEFT 70% */}
        <div className="flex-1 px-7 py-5 flex flex-col gap-3 lg:max-w-[70%]">
          <div className="flex items-center gap-2">
            <span className="text-base" style={{ color: C.yellow }}>⚜</span>
            <span
              className="text-[10px] uppercase tracking-[0.45em] font-display font-black"
              style={{ color: C.yellow, textShadow: `0 0 4px ${C.yellow}66` }}
            >
              MAJOR ORDER
            </span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-display font-black tracking-[0.16em] leading-tight flex items-center gap-3"
            style={{ color: C.text, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            {title.toUpperCase()}
            <span
              className="inline-flex items-center justify-center w-7 h-7 border-2"
              style={{ borderColor: C.yellow, color: C.yellow, borderRadius: 1, fontSize: 14 }}
            >
              ☠
            </span>
          </h2>

          <p
            className="text-[12px] leading-relaxed max-w-[640px]"
            style={{ color: C.textMid, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            {briefing}
          </p>

          <div className="flex flex-col gap-1.5 mt-1 max-w-[640px]">
            <div className="flex items-baseline justify-between text-[9px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
              <span>Progress</span>
              <span className="tabular-nums" style={{ color: C.yellow }}>
                {liberated} / {total} planets liberated
              </span>
            </div>
            <div
              className="relative h-1.5 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)", borderRadius: 1 }}
            >
              <motion.div
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-y-0 left-0"
                style={{
                  background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`,
                  boxShadow: `0 0 8px ${C.yellow}aa`,
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT 30% — meta */}
        <div
          className="px-6 py-5 flex flex-col gap-4 lg:min-w-[260px] lg:border-l"
          style={{ borderColor: C.rule, background: "rgba(7,11,16,0.6)" }}
        >
          <div>
            <div className="text-[8px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>STATUS</div>
            <div className="text-base font-display font-black tracking-[0.25em] mt-1" style={{ color: C.green, textShadow: `0 0 6px ${C.green}66` }}>
              ACTIVE
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>REWARD</div>
            <div className="flex items-center gap-2 mt-1">
              <span style={{ color: C.yellow, fontSize: 16, lineHeight: 1, textShadow: `0 0 6px ${C.yellow}88` }}>★</span>
              <span className="font-display font-black tabular-nums tracking-wider text-base" style={{ color: C.yellow }}>
                +{reward.toLocaleString()} MEDALS
              </span>
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>EXPIRES</div>
            <div className="text-[12px] uppercase tracking-[0.25em] mt-1" style={{ color: C.textMid }}>NO EXPIRY</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PLANET THEATER GRID
// ══════════════════════════════════════════════════════════════════════
function PlanetTheaterGrid({
  planets, selectedId, majorTargets, onSelect,
}: {
  planets: PlanetState[];
  selectedId: string | null;
  majorTargets: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <section
      className="relative overflow-hidden flex flex-col"
      style={{
        border: `1px solid ${C.rule}`,
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bg0} 100%)`,
        borderRadius: 1,
      }}
    >
      <header
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${C.rule}` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5" style={{ background: C.yellow, boxShadow: `0 0 4px ${C.yellow}` }} />
          <h3
            className="text-[10px] uppercase tracking-[0.4em] font-display font-black"
            style={{ color: C.yellow }}
          >
            ACTIVE PLANETARY THEATERS
          </h3>
        </div>
        <span className="text-[9px] uppercase tracking-[0.3em] tabular-nums" style={{ color: C.textDim }}>
          {planets.length} WORLDS
        </span>
      </header>

      <div className="p-4">
        {planets.length === 0 ? (
          <div className="text-center py-12 text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
            Loading war room…
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[640px] overflow-y-auto hub-frame-scroll pr-1">
            {planets.map((planet) => (
              <PlanetTheaterCard
                key={planet.id}
                planet={planet}
                isSelected={selectedId === planet.id}
                isMajor={majorTargets.includes(planet.id)}
                onClick={() => onSelect(planet.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PlanetTheaterCard({
  planet, isSelected, isMajor, onClick,
}: {
  planet: PlanetState; isSelected: boolean; isMajor: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const status = statusOf(planet);
  const meta = STATUS_META[status];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative text-left flex flex-col overflow-hidden"
      style={{
        border: isSelected ? `2px solid ${C.yellow}` : `1px solid ${hovered ? `${C.yellow}66` : C.rule}`,
        background: `linear-gradient(180deg, rgba(14,20,27,0.92) 0%, rgba(7,11,16,0.92) 100%)`,
        boxShadow: isSelected
          ? `0 0 22px ${C.yellow}44, inset 0 0 14px ${C.yellow}22`
          : hovered ? `0 0 14px ${C.yellow}22` : undefined,
        borderRadius: 1,
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}
    >
      {/* Top-bar: faction designation + name + biome */}
      <div className="px-3 pt-3 pb-2 relative">
        <FactionTag faction={planet.faction} />
        <div className="flex items-center gap-2 mt-1.5 mb-0.5">
          {isMajor && (
            <span style={{ color: C.yellow, fontSize: 10, lineHeight: 1, textShadow: `0 0 4px ${C.yellow}88` }}>★</span>
          )}
          <span
            className="text-[12px] font-display font-black tracking-[0.12em] uppercase truncate"
            style={{ color: hovered || isSelected ? C.yellow : C.text }}
          >
            {planet.name}
          </span>
        </div>
        <div className="text-[9px] uppercase tracking-[0.25em] truncate" style={{ color: C.textDim }}>
          {planet.biome ?? "Unknown"}
        </div>
      </div>

      {/* Planet sphere */}
      <div className="relative flex justify-center py-3">
        <PlanetSphere
          biome={planet.biome}
          faction={planet.faction}
          liberated={status === "liberated"}
          size={92}
        />
      </div>

      {/* Liberation bar */}
      <div className="px-3 pt-1">
        <div
          className="text-[10px] uppercase tracking-[0.2em] tabular-nums mb-1"
          style={{ color: meta.color }}
        >
          {planet.liberation.toFixed(1)}% LIBERATED
        </div>
        <div className="relative h-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${planet.liberation}%`,
              background: meta.color,
              boxShadow: `0 0 4px ${meta.color}aa`,
            }}
          />
        </div>
      </div>

      {/* Status tag */}
      <div
        className="mt-2.5 mx-3 mb-3 py-1.5 flex items-center justify-center gap-2"
        style={{
          background: meta.bg,
          border: `1px solid ${meta.color}55`,
          borderRadius: 1,
        }}
      >
        <span style={{ color: meta.color, fontSize: 11, lineHeight: 1 }}>
          {status === "liberated" ? "✓" : status === "contested" ? "◇" : "★"}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.3em] font-display font-black"
          style={{ color: meta.color, textShadow: `0 0 4px ${meta.color}44` }}
        >
          {meta.label}
        </span>
      </div>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  PLANET SPHERE
// ══════════════════════════════════════════════════════════════════════
const BIOME_PALETTE: Record<string, [string, string, string]> = {
  "Sandy Mesa":         ["#f5d090", "#c98a4f", "#5a3618"],
  "Grassland":          ["#b8d893", "#6ea34a", "#2d4818"],
  "Tundra":             ["#e6f0f8", "#9bb8c8", "#4a6075"],
  "Swamp":              ["#9aa674", "#5e6a3f", "#26301a"],
  "Ashland":            ["#7a6957", "#4a3a2c", "#1a120a"],
  "Sandy Desert":       ["#f5d090", "#c98a4f", "#5a3618"],
  "Quake Desert":       ["#e8a070", "#c45a3a", "#6b2410"],
  "Ionized Grassland":  ["#bfeada", "#7fc4a8", "#2c6a55"],
  "Ethereal Jungle":    ["#9aa890", "#5e7058", "#2a2640"],
  "Foggy Swamp":        ["#a8b5a4", "#6f7d6c", "#2d362c"],
  "Frozen Boneyard":    ["#dde8f0", "#92a3b0", "#4a5a68"],
  "Shadowed Jungle":    ["#6b8568", "#3a5538", "#10220f"],
  "Copper Desert":      ["#e8a070", "#c47a3a", "#5a2810"],
  "Barren Moon":        ["#d8d8d8", "#7a7a7a", "#202020"],
  "Tropical Jungle":    ["#7fcc88", "#3d8a44", "#0f3818"],
  "Volcanic":           ["#f0a060", "#cc4020", "#400808"],
  "Ice World":          ["#e4ecf2", "#86a3b8", "#2c3a48"],
  "Urban":              ["#9aa3ad", "#5d6772", "#1f242b"],
  "Arctic":             ["#dde6ed", "#92a8b8", "#3a4a5a"],
  "Desert":             ["#e6c478", "#a07840", "#3e2810"],
};
function getBiomePalette(biome: string | undefined): [string, string, string] {
  if (!biome) return ["#a0a0a0", "#5a5a5a", "#1a1a1a"];
  return BIOME_PALETTE[biome] ?? ["#a0a0a0", "#5a5a5a", "#1a1a1a"];
}

/**
 * PLANET SPHERE — composite render.
 *
 * Layers (back → front):
 *   1. Outer faction halo glow (animated on liberated worlds)
 *   2. CSS-rendered globe (biome-tinted gradient) — the FALLBACK that
 *      always shows even if the faction image is missing
 *   3. Faction image overlay (terminid/automaton/illuminate.jpg) — the
 *      hero visual, dominates when present. Drops to opacity 0 on 404.
 *   4. Atmosphere ring + specular highlight + liberation pulse
 *
 * Drop the faction images at:
 *   /public/art/factions/terminid.jpg    (green)
 *   /public/art/factions/automaton.jpg   (red)
 *   /public/art/factions/illuminate.jpg  (purple)
 * and they'll auto-load.
 */
function PlanetSphere({
  biome, faction, liberated, size = 56,
}: {
  biome: string | undefined;
  faction: Faction;
  liberated: boolean;
  size?: number;
}) {
  const [light, mid, shadow] = getBiomePalette(biome);
  const halo = liberated ? "rgba(34,197,94,0.55)" : FACTION_HALO[faction];
  const factionImg = `/art/factions/${faction}.jpg`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      {/* 1. Outer halo (pulses on liberated) */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: `0 0 ${size * 0.6}px ${halo}, 0 0 ${size * 0.25}px ${halo}` }}
        animate={liberated ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
        transition={liberated ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
      />

      {/* 2. CSS globe fallback — always renders so missing images degrade gracefully */}
      <div
        className="absolute inset-[3px] rounded-full overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${light} 0%, ${mid} 38%, ${shadow} 95%)`,
          boxShadow: `inset -${size * 0.18}px -${size * 0.18}px ${size * 0.3}px rgba(0,0,0,0.65)`,
        }}
      >
        {/* 3. Faction image overlay — hero visual.
             eager loading so the planet visual is up immediately on first render. */}
        <img
          src={factionImg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
          style={{ display: "block", zIndex: 1 }}
          onError={(e) => {
            // No faction image yet — hide so the CSS globe shows through.
            (e.currentTarget as HTMLImageElement).style.opacity = "0";
          }}
        />
      </div>

      {/* 4a. Atmosphere ring (above the planet body) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: `1px solid ${halo}`,
          boxShadow: `inset 0 0 ${size * 0.3}px ${halo}`,
          filter: "blur(0.5px)",
        }}
      />

      {/* 4b. Subtle banding for terrain hint (overlay on the image) */}
      <div
        className="absolute inset-[3px] rounded-full opacity-20 pointer-events-none mix-blend-overlay"
        style={{ background: "repeating-linear-gradient(115deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 6px)" }}
      />

      {/* 4c. Specular highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "18%",
          left: "20%",
          width: size * 0.16,
          height: size * 0.16,
          background: `radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)`,
          filter: "blur(2px)",
        }}
      />

      {/* 4d. Liberation pulse — emerald wash on freed worlds */}
      {liberated && (
        <motion.div
          className="absolute inset-[3px] rounded-full pointer-events-none mix-blend-screen"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.4) 0%, transparent 70%)" }}
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  INTEL STACK — selected planet · live feed · deployment
// ══════════════════════════════════════════════════════════════════════
function IntelStack({
  selected, difficulty, setDifficulty, modifierIds, feed, onDeploy, onReroll,
}: {
  selected: PlanetState | null;
  difficulty: number;
  setDifficulty: (d: number) => void;
  modifierIds: string[];
  feed: { id: string; text: string; tone: "info" | "success" | "warn"; ago: string }[];
  onDeploy: () => void;
  onReroll: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 min-h-0">
      {/* SELECTED PLANET */}
      <SelectedPlanetPanel selected={selected} />

      {/* INTEL FEED */}
      <IntelFeedPanel feed={feed} />

      {/* DEPLOYMENT */}
      <DeploymentPanel
        selected={selected}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        modifierIds={modifierIds}
        onDeploy={onDeploy}
        onReroll={onReroll}
      />
    </div>
  );
}

function PanelHeader({ label, accent = C.yellow, right }: { label: string; accent?: string; right?: React.ReactNode }) {
  return (
    <header
      className="flex items-center justify-between px-3 py-2"
      style={{ borderBottom: `1px solid ${C.rule}` }}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5" style={{ background: accent, boxShadow: `0 0 4px ${accent}` }} />
        <h3
          className="text-[10px] uppercase tracking-[0.4em] font-display font-black"
          style={{ color: accent }}
        >
          {label}
        </h3>
      </div>
      {right && <div className="text-[9px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>{right}</div>}
    </header>
  );
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        border: `1px solid ${C.rule}`,
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bg0} 100%)`,
        borderRadius: 1,
      }}
    >
      {children}
    </section>
  );
}

function SelectedPlanetPanel({ selected }: { selected: PlanetState | null }) {
  return (
    <PanelShell>
      <PanelHeader label="SELECTED PLANET" />
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-3 py-3 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <PlanetSphere biome={selected.biome} faction={selected.faction} liberated={selected.liberation >= 100} size={64} />
              <div className="flex flex-col leading-tight min-w-0 flex-1 gap-1">
                <FactionTag faction={selected.faction} />
                <span
                  className="text-[14px] font-display font-black tracking-[0.16em] uppercase truncate mt-0.5"
                  style={{ color: C.text }}
                >
                  {selected.name}
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: C.textDim }}>
                  {selected.biome ?? "Unknown"} · {selected.sector} sector
                </span>
              </div>
            </div>

            {/* Liberation row */}
            <div>
              <div className="flex items-baseline justify-between mb-1 text-[9px] uppercase tracking-[0.25em]" style={{ color: C.textDim }}>
                <span>LIBERATION</span>
                <span className="tabular-nums" style={{ color: STATUS_META[statusOf(selected)].color }}>
                  {selected.liberation.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
                <motion.div
                  className="h-full"
                  initial={false}
                  animate={{ width: `${selected.liberation}%` }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: STATUS_META[statusOf(selected)].color,
                    boxShadow: `0 0 4px ${STATUS_META[statusOf(selected)].color}aa`,
                  }}
                />
              </div>
            </div>

            {/* Enemy + hazard grid */}
            <div className="grid grid-cols-2 gap-2 text-[9px] uppercase tracking-[0.2em]">
              <div>
                <div style={{ color: C.textDim }}>ENEMY PRESENCE</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span style={{ color: FACTION_COLOR[selected.faction], fontSize: 12 }}>●</span>
                  <span className="text-[11px] font-display font-black tracking-[0.18em]" style={{ color: FACTION_COLOR[selected.faction] }}>
                    {selected.faction.toUpperCase() + "S"}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ color: C.textDim }}>HAZARD LEVEL</div>
                <div className="flex items-center gap-1 mt-1">
                  {[0, 1, 2].map((i) => {
                    const lit = i < (selected.liberation < 30 ? 3 : selected.liberation < 70 ? 2 : 1);
                    const tone = i === 2 ? C.red : i === 1 ? C.orange : C.yellow;
                    return (
                      <span
                        key={i}
                        style={{
                          width: 14, height: 5,
                          background: lit ? tone : "rgba(255,255,255,0.08)",
                          boxShadow: lit ? `0 0 4px ${tone}88` : undefined,
                          borderRadius: 1,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="px-3 py-6 text-center text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
            Awaiting target.
          </div>
        )}
      </AnimatePresence>
    </PanelShell>
  );
}

function IntelFeedPanel({ feed }: { feed: { id: string; text: string; tone: "info" | "success" | "warn"; ago: string }[] }) {
  return (
    <PanelShell>
      <PanelHeader
        label="INTEL FEED"
        right={
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span style={{ color: C.green }}>LIVE</span>
          </div>
        }
      />
      <div className="px-2 py-2 flex flex-col gap-1 max-h-[180px] overflow-y-auto hub-frame-scroll">
        <AnimatePresence initial={false}>
          {feed.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-2 px-2 py-1 hover:bg-white/[0.03]"
            >
              <span
                aria-hidden
                className="font-display font-black shrink-0 leading-none"
                style={{
                  color: entry.tone === "warn" ? C.red : entry.tone === "success" ? C.green : C.yellow,
                  fontSize: 12,
                  marginTop: 1,
                }}
              >
                {entry.tone === "warn" ? "✕" : entry.tone === "success" ? "▶" : "◆"}
              </span>
              <div className="flex flex-col flex-1 min-w-0 leading-tight">
                <span className="text-[10px] truncate" style={{ color: C.textMid }}>
                  {entry.text}
                </span>
              </div>
              <span className="text-[8px] uppercase tracking-widest tabular-nums shrink-0" style={{ color: C.textDim }}>
                {entry.ago}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PanelShell>
  );
}

function DeploymentPanel({
  selected, difficulty, setDifficulty, modifierIds, onDeploy, onReroll,
}: {
  selected: PlanetState | null;
  difficulty: number;
  setDifficulty: (d: number) => void;
  modifierIds: string[];
  onDeploy: () => void;
  onReroll: () => void;
}) {
  const [diffOpen, setDiffOpen] = useState(false);
  const tone = difficulty >= 8 ? C.red : difficulty >= 5 ? C.orange : C.yellow;
  return (
    <PanelShell>
      <PanelHeader label="DEPLOYMENT" right={selected ? null : "SELECT TARGET"} />
      <div className="px-3 py-3 flex flex-col gap-3">
        {/* Difficulty selector */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[8px] uppercase tracking-[0.3em] mb-1" style={{ color: C.textDim }}>DIFFICULTY</div>
            <button
              type="button"
              onClick={() => { sfx.click(); setDiffOpen((o) => !o); }}
              className="w-full px-3 py-2 flex items-center justify-between text-left"
              style={{
                border: `1px solid ${tone}55`,
                background: `${tone}08`,
                borderRadius: 1,
              }}
            >
              <span className="text-[11px] uppercase tracking-[0.18em] font-display font-black" style={{ color: tone }}>
                {difficulty} · {DIFF_LABELS[difficulty]}
              </span>
              <span style={{ color: tone, fontSize: 10 }}>▼</span>
            </button>
            <AnimatePresence>
              {diffOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="mt-1 grid grid-cols-5 gap-1 overflow-hidden"
                >
                  {Array.from({ length: 10 }).map((_, i) => {
                    const d = i + 1;
                    const itemTone = d >= 8 ? C.red : d >= 5 ? C.orange : C.yellow;
                    const active = d === difficulty;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setDifficulty(d); setDiffOpen(false); }}
                        className="py-1 text-[10px] font-display font-black tabular-nums"
                        style={{
                          color: active ? "#000" : itemTone,
                          background: active ? itemTone : "transparent",
                          border: `1px solid ${itemTone}66`,
                          borderRadius: 1,
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-[0.3em] mb-1" style={{ color: C.textDim }}>SQUAD STATUS</div>
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ border: `1px solid ${C.rule}`, background: "rgba(255,255,255,0.02)", borderRadius: 1 }}
            >
              <span style={{ color: C.green, fontSize: 11 }}>●</span>
              <span className="text-[11px] uppercase tracking-[0.18em] font-display font-black" style={{ color: C.text }}>
                3 / 4 HELLDIVERS
              </span>
            </div>
          </div>
        </div>

        {/* Sector modifiers (compact) */}
        {modifierIds.length > 0 && (
          <div className="flex items-baseline justify-between gap-2 text-[9px] uppercase tracking-[0.25em]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span style={{ color: C.textDim }}>SECTOR:</span>
              {modifierIds.slice(0, 2).map((id) => {
                const m = getModifier(id);
                if (!m) return null;
                return (
                  <span
                    key={id}
                    className="px-1.5 py-0.5"
                    style={{ color: C.orange, border: `1px solid ${C.orange}44`, background: `${C.orange}10`, borderRadius: 1 }}
                    title={m.description}
                  >
                    ⚠ {m.name}
                  </span>
                );
              })}
              {modifierIds.length > 2 && (
                <span style={{ color: C.textDim }}>+{modifierIds.length - 2}</span>
              )}
            </div>
            <button
              type="button"
              onClick={onReroll}
              className="text-[9px] uppercase tracking-[0.25em] hover:text-yellow-300 transition-colors"
              style={{ color: C.yellow }}
            >
              ↻ Reroll
            </button>
          </div>
        )}

        {/* DEPLOY CTA */}
        <DeployCTA onClick={onDeploy} disabled={!selected} />
      </div>
    </PanelShell>
  );
}

function DeployCTA({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={clsx("relative w-full px-5 py-3 flex items-center gap-3 overflow-hidden", disabled && "opacity-50 cursor-not-allowed")}
      style={{
        background: `linear-gradient(135deg, ${C.yellow} 0%, ${C.orange} 100%)`,
        border: `2px solid ${C.yellow}`,
        boxShadow: hovered && !disabled
          ? `0 0 28px ${C.yellow}cc, 0 0 60px ${C.yellow}55`
          : `0 0 16px ${C.yellow}88`,
        borderRadius: 1,
        transition: "box-shadow 220ms ease",
      }}
    >
      {/* Sweep highlight on hover */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-16 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)" }}
        initial={{ x: "-150%" }}
        animate={{ x: hovered && !disabled ? "550%" : "-150%" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <span aria-hidden style={{ color: C.bg0, fontSize: 18, lineHeight: 1 }} className="font-display font-black">⪻⪻</span>
      <span className="flex-1 text-center font-display font-black tracking-[0.3em] uppercase text-[14px]" style={{ color: C.bg0 }}>
        ⊕ DEPLOY TO PLANET
      </span>
      <span aria-hidden style={{ color: C.bg0, fontSize: 18, lineHeight: 1 }} className="font-display font-black">⪼⪼</span>
    </motion.button>
  );
}
