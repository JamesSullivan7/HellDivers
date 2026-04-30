"use client";

/**
 * FIELD ENCOUNTER · cinematic command-briefing screen.
 *
 * Reads the per-event theme from lib/encounterTheme.ts so every encounter
 * adapts its visuals (background, accent color, particle effects, glow,
 * scanlines, type label/icon) to the encounter's faction × type × intensity
 * tuple — without changing the layout structure.
 *
 * Layout hierarchy:
 *   EventScreen
 *   ├─ EventBackground       blurred SEAF backdrop · scanlines · scan sweep · particles
 *   │  └─ HoverToneOverlay   warmer/redder tint based on the hovered choice
 *   └─ EventPanel            floating console with corner brackets + breathing
 *      ├─ EventHeader        FIELD ENCOUNTER · LIVE · type icon + label · faction
 *      ├─ EventTitle         heroic shimmering title
 *      ├─ NarrativeBlock     italic flavor with vertical accent
 *      ├─ DecisionCard ×N    risk/reward badges · cursor light sweep · keyboard hint
 *      └─ FooterTagline      DECISION IS FINAL · FOR SUPER EARTH
 *
 * Keyboard: 1 / 2 / 3 hotkeys for the corresponding option.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { audio, initAudioMixer } from "@/lib/audioMixer";
import { EVENTS, ChoiceEvent, ChoiceOption, EventEffect } from "@/lib/events";
import {
  getEncounterTheme,
  EncounterTheme,
  EncounterFaction,
  FALLBACK_BG,
} from "@/lib/encounterTheme";

// ──────────────────────────────────────────────────────────────────────
//  STATIC COLOR TOKENS (panel chrome — accent comes from the theme)
// ──────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0b0f14",
  panel: "#111821",
  text: "#e8eef5",
  dim: "rgba(232,238,245,0.40)",
  border: "rgba(255,255,255,0.10)",
  danger: "#ff4d4d",
  good: "#34d399",
  tech: "#4da6ff",
} as const;

const LOCK_DURATION_MS = 320;

// ──────────────────────────────────────────────────────────────────────
//  EFFECT → BADGE TRANSLATOR (risk / reward summary)
// ──────────────────────────────────────────────────────────────────────
type BadgeKind = "reward" | "risk";
type BadgeColor = "yellow" | "good" | "danger" | "tech";

interface EffectBadge {
  kind: BadgeKind;
  icon: string;
  text: string;
  color: BadgeColor;
}

const BADGE_BORDER: Record<BadgeColor, string> = {
  yellow: "border-helldiver-yellow",
  good: "border-emerald-400",
  danger: "border-helldiver-red",
  tech: "border-sky-400",
};

const BADGE_TEXT: Record<BadgeColor, string> = {
  yellow: "text-helldiver-yellow",
  good: "text-emerald-300",
  danger: "text-helldiver-red",
  tech: "text-sky-300",
};

function parseEffects(effects: EventEffect[]): EffectBadge[] {
  const out: EffectBadge[] = [];
  for (const e of effects) {
    switch (e.kind) {
      case "noop":
        break;
      case "damage":
        out.push({ kind: "risk", icon: "💥", text: `−${e.amount} HP`, color: "danger" });
        break;
      case "modifyMaxHp":
        if (e.amount >= 0) out.push({ kind: "reward", icon: "❤", text: `+${e.amount} max HP`, color: "good" });
        else out.push({ kind: "risk", icon: "❤", text: `${e.amount} max HP`, color: "danger" });
        break;
      case "heal":
        out.push({ kind: "reward", icon: "✚", text: `+${e.amount} HP`, color: "good" });
        break;
      case "gainCurrency": {
        if (e.medals) {
          if (e.medals > 0) out.push({ kind: "reward", icon: "◆", text: `+${e.medals} Medals`, color: "yellow" });
          else out.push({ kind: "risk", icon: "◆", text: `${e.medals} Medals`, color: "danger" });
        }
        if (e.samples) out.push({ kind: "reward", icon: "◇", text: `+${e.samples} Samples`, color: "tech" });
        if (e.requisition) {
          if (e.requisition > 0) out.push({ kind: "reward", icon: "◈", text: `+${e.requisition} Req`, color: "yellow" });
          else out.push({ kind: "risk", icon: "◈", text: `${e.requisition} Req`, color: "danger" });
        }
        break;
      }
      case "addCard":
        out.push({ kind: "reward", icon: "+", text: "Add stratagem", color: "good" });
        break;
      case "removeOneCard":
        out.push({ kind: "risk", icon: "−", text: "Lose stratagem", color: "danger" });
        break;
      case "applyRunBuff": {
        const lifetime = e.buff.lifetime === "next_combat" ? "1 fight" : "run";
        out.push({
          kind: "reward",
          icon: "★",
          text: `${e.buff.name} (${lifetime})`,
          color: e.buff.lifetime === "next_combat" ? "tech" : "yellow",
        });
        break;
      }
      case "loseReinforcement":
        out.push({ kind: "risk", icon: "☠", text: "−1 reinforcement", color: "danger" });
        break;
      case "gainReinforcement":
        out.push({ kind: "reward", icon: "↑", text: "+1 reinforcement", color: "good" });
        break;
    }
  }
  return out;
}

type ChoiceTone = "reward" | "risk" | "neutral";
function getChoiceTone(choice: ChoiceOption): ChoiceTone {
  const badges = parseEffects(choice.effects);
  const rewards = badges.filter((b) => b.kind === "reward").length;
  const risks = badges.filter((b) => b.kind === "risk").length;
  if (risks > rewards) return "risk";
  if (rewards > risks) return "reward";
  return "neutral";
}

// ──────────────────────────────────────────────────────────────────────
//  ROOT
// ──────────────────────────────────────────────────────────────────────
export default function EventScreen() {
  const { pendingEventId, resolveEventChoice, faction } = useGame();
  const event = pendingEventId ? EVENTS[pendingEventId] : null;
  const [lockedIdx, setLockedIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Resolve the encounter theme from the event tuple, falling back to the
  // current run's faction if the event itself isn't faction-tagged.
  const theme: EncounterTheme = useMemo(() => {
    if (!event) return getEncounterTheme();
    const eventFaction: EncounterFaction =
      (event.faction as EncounterFaction | undefined) ??
      (faction as EncounterFaction | undefined) ??
      "super_earth";
    return getEncounterTheme(eventFaction, event.type ?? "civilian", event.intensity ?? "medium");
  }, [event, faction]);

  // ── Audio: faction + encounter ambience driven by theme ──
  useEffect(() => {
    initAudioMixer();
    sfx.unlock();
    sfx.beacon();

    // Start the layered ambience matching this encounter
    sfx.factionAmbienceStart(theme.faction);
    sfx.encounterAmbienceStart(theme.type);

    // Intensity-driven warning chirp on critical encounters
    let spikeTimer: number | null = null;
    if (theme.intensity === "critical") {
      spikeTimer = window.setInterval(() => sfx.criticalChirp(), 6500);
    }

    return () => {
      sfx.factionAmbienceStop();
      sfx.encounterAmbienceStop();
      if (spikeTimer) window.clearInterval(spikeTimer);
    };
  }, [theme.faction, theme.type, theme.intensity]);

  // Keyboard hotkeys (1 / 2 / 3 …)
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      const idx = n - 1;
      if (idx >= 0 && idx < event.choices.length) {
        e.preventDefault();
        handleSelect(event.choices[idx], idx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, lockedIdx]);

  if (!event) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-mono"
        style={{ background: C.bg, color: C.dim }}
      >
        <div className="text-xs tracking-[0.4em] uppercase">◢ NO EVENT PAYLOAD ◣</div>
      </div>
    );
  }

  const handleSelect = (choice: ChoiceOption, idx: number) => {
    if (lockedIdx !== null) return;
    setLockedIdx(idx);
    sfx.unlock();
    sfx.beacon();
    setTimeout(() => {
      resolveEventChoice(choice.id);
    }, LOCK_DURATION_MS);
  };

  const hoveredChoice = hoverIdx !== null ? event.choices[hoverIdx] : null;
  const hoverTone: ChoiceTone = hoveredChoice ? getChoiceTone(hoveredChoice) : "neutral";

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden font-mono"
      style={{ background: C.bg, color: C.text }}
    >
      <EventBackground theme={theme} hoverTone={hoverTone} />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <EventPanel theme={theme}>
          <EventHeader event={event} theme={theme} />
          <EventTitle title={event.title} theme={theme} />
          <NarrativeBlock text={event.flavor} theme={theme} />

          <SectionLabel>Select Course of Action</SectionLabel>

          <div className="space-y-3 md:space-y-4">
            {event.choices.map((choice, idx) => (
              <DecisionCard
                key={choice.id}
                index={idx}
                choice={choice}
                theme={theme}
                hovered={hoverIdx === idx}
                locked={lockedIdx === idx}
                anyLocked={lockedIdx !== null}
                onHover={() => setHoverIdx(idx)}
                onLeave={() => setHoverIdx((cur) => (cur === idx ? null : cur))}
                onSelect={() => handleSelect(choice, idx)}
              />
            ))}
          </div>

          <FooterTagline theme={theme} />
        </EventPanel>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  BACKGROUND
// ──────────────────────────────────────────────────────────────────────
function EventBackground({
  theme,
  hoverTone,
}: {
  theme: EncounterTheme;
  hoverTone: ChoiceTone;
}) {
  // Deterministic particles (positions + delays) keyed on density so React
  // doesn't reshuffle on theme change.
  const particles = useMemo(
    () =>
      Array.from({ length: theme.particleDensity }).map((_, i) => ({
        left: `${(i * 73) % 100}%`,
        delay: (i % 7) * 0.6,
        duration: theme.particleSpeed + (i % 5) * 1.5,
        size: 1 + (i % 4),
        drift: i % 2 === 0 ? 30 : -30,
      })),
    [theme.particleDensity, theme.particleSpeed]
  );

  // Image-load fallback — if the per-combo path doesn't resolve, swap to FALLBACK_BG
  const [bgSrc, setBgSrc] = useState(theme.backgroundImage);
  useEffect(() => {
    setBgSrc(theme.backgroundImage);
    if (theme.backgroundImage === theme.backgroundFallback) return;
    const img = new Image();
    img.onload = () => setBgSrc(theme.backgroundImage);
    img.onerror = () => setBgSrc(theme.backgroundFallback);
    img.src = theme.backgroundImage;
  }, [theme.backgroundImage, theme.backgroundFallback]);

  return (
    <>
      {/* Base color */}
      <div className="absolute inset-0" style={{ background: C.bg }} />

      {/* Heavily blurred backdrop */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: theme.backgroundOpacity,
        }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage: `url(${bgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: `blur(${theme.backgroundBlur}px) brightness(0.55)`,
          transform: "scale(1.12)",
        }}
      />

      {/* Slow parallax breathing */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${bgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: `blur(${theme.backgroundBlur + 8}px)`,
          opacity: 0.16,
          mixBlendMode: "screen",
          transform: "scale(1.15)",
        }}
        animate={{ scale: [1.15, 1.22, 1.15] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Type-mood overlay (warm/cold/red etc) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: 1 }}
        style={{ background: theme.backgroundOverlay }}
      />

      {/* HOVER TONE — warmer / redder tint based on hovered choice */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity:
            hoverTone === "neutral"
              ? 0
              : hoverTone === "reward"
              ? 0.55
              : 0.65,
        }}
        transition={{ duration: 0.5 }}
        style={{
          background:
            hoverTone === "reward"
              ? `radial-gradient(ellipse at center, ${theme.glow.replace("0.55", "0.18")}, transparent 70%)`
              : hoverTone === "risk"
              ? "radial-gradient(ellipse at center, rgba(255,77,77,0.20), transparent 70%)"
              : "transparent",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Scanlines (intensity-controlled) */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          opacity: theme.scanlineOpacity,
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Holographic horizontal scan sweep — accent-colored */}
      <motion.div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(to right, transparent, ${theme.glow}, transparent)`,
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />

      {/* Drifting particles — color + density + speed all theme-driven */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.left,
              bottom: -8,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: theme.particleColor,
              boxShadow: `0 0 4px ${theme.particleColor}`,
            }}
            animate={{
              y: ["0vh", "-110vh"],
              x: [0, p.drift],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  PANEL
// ──────────────────────────────────────────────────────────────────────
function EventPanel({
  theme,
  children,
}: {
  theme: EncounterTheme;
  children: React.ReactNode;
}) {
  const flicker = theme.flickerAmplitude;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.8 }}
      className="relative w-full max-w-5xl"
      style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.65))" }}
    >
      <motion.div
        animate={{
          y: [0, -2, 0],
          // controlled flicker — only when intensity is high or critical
          opacity: flicker > 0 ? [1, 1 - flicker * 0.25, 1, 1, 1] : 1,
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer glow halo — color + amplitude both theme-driven */}
        <motion.div
          className="absolute -inset-1 pointer-events-none"
          style={{
            border: `1px solid ${theme.accent}`,
            boxShadow: `0 0 ${60 * theme.glowIntensity}px ${theme.glow}, inset 0 0 30px ${theme.glow.replace("0.55", "0.06")}`,
          }}
          animate={{ opacity: [0.5 + theme.glowIntensity * 0.15, 0.85, 0.5 + theme.glowIntensity * 0.15] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div
          className="relative border-2 backdrop-blur-md p-6 md:p-10"
          style={{
            borderColor: theme.accent,
            background: "linear-gradient(135deg, rgba(17,24,33,0.92) 0%, rgba(11,15,20,0.95) 100%)",
          }}
        >
          <Bracket pos="tl" color={theme.accent} />
          <Bracket pos="tr" color={theme.accent} />
          <Bracket pos="bl" color={theme.accent} />
          <Bracket pos="br" color={theme.accent} />
          <SegmentedEdge axis="top" color={theme.accent} />
          <SegmentedEdge axis="bottom" color={theme.accent} />
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Bracket({ pos, color }: { pos: "tl" | "tr" | "bl" | "br"; color: string }) {
  const cls = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  }[pos];
  return (
    <span
      className={clsx("absolute w-5 h-5 pointer-events-none", cls)}
      style={{ borderColor: color, margin: "-1px" }}
    />
  );
}

function SegmentedEdge({ axis, color }: { axis: "top" | "bottom"; color: string }) {
  return (
    <div
      className={clsx(
        "absolute left-1/2 -translate-x-1/2 h-px pointer-events-none flex gap-1.5 items-center",
        axis === "top" ? "top-0 -mt-px" : "bottom-0 -mb-px"
      )}
      style={{ width: "60%" }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="flex-1 h-px"
          style={{
            background: i % 3 === 1 ? color : `${color}66`,
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  HEADER
// ──────────────────────────────────────────────────────────────────────
function EventHeader({ event, theme }: { event: ChoiceEvent; theme: EncounterTheme }) {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <motion.span
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="text-base"
          style={{ color: theme.accent }}
        >
          ▶
        </motion.span>
        <span
          className="text-[10px] md:text-xs uppercase tracking-[0.5em] font-display font-black"
          style={{ color: theme.accent }}
        >
          Field Encounter
        </span>
        <span
          className="hidden md:inline w-1.5 h-1.5 rounded-full ml-2 animate-pulse"
          style={{ background: C.good }}
        />
        <span className="hidden md:inline text-[9px] tracking-[0.3em] uppercase" style={{ color: C.dim }}>
          Live · Decision Required
        </span>

        {/* Encounter type pill with icon */}
        <span className="hidden md:inline w-1 h-4 mx-1" style={{ background: C.border }} />
        <div
          className="hidden md:flex items-center gap-1.5 px-1.5 py-0.5 border text-[9px] uppercase tracking-[0.3em] font-display font-bold"
          style={{ borderColor: theme.accent, color: theme.accent }}
        >
          <span className="text-[12px] leading-none">{theme.typeIcon}</span>
          <span>{theme.typeLabel}</span>
        </div>
      </div>

      {/* Faction sector pill */}
      <div className="flex items-center gap-2">
        <div
          className="px-2 py-0.5 border text-[9px] uppercase tracking-[0.3em] font-display font-bold"
          style={{ borderColor: theme.secondary, color: theme.secondary }}
        >
          {event.faction
            ? `${event.faction} sector`
            : `${theme.faction.replace("_", " ")} sector`}
        </div>
        <div
          className="px-2 py-0.5 border text-[9px] uppercase tracking-[0.3em] font-display font-bold"
          style={{
            borderColor:
              theme.intensity === "critical"
                ? C.danger
                : theme.intensity === "high"
                ? "#ff8a28"
                : theme.intensity === "medium"
                ? theme.accent
                : C.dim,
            color:
              theme.intensity === "critical"
                ? C.danger
                : theme.intensity === "high"
                ? "#ff8a28"
                : theme.intensity === "medium"
                ? theme.accent
                : C.dim,
          }}
        >
          {theme.intensity}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  TITLE — heroic shimmer
// ──────────────────────────────────────────────────────────────────────
function EventTitle({ title, theme }: { title: string; theme: EncounterTheme }) {
  return (
    <div className="relative mb-4 md:mb-5 overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="font-display font-black tracking-tight leading-[1.05] text-3xl md:text-5xl"
        style={{
          color: C.text,
          textShadow: `0 0 ${24 * theme.glowIntensity}px ${theme.glow}, 0 2px 0 rgba(0,0,0,0.6)`,
        }}
      >
        {title}
      </motion.h1>
      {/* Slow shimmer sweep across the title */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(110deg, transparent 30%, ${theme.accent}55 50%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
        animate={{ x: ["-110%", "110%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  NARRATIVE
// ──────────────────────────────────────────────────────────────────────
function NarrativeBlock({ text, theme }: { text: string; theme: EncounterTheme }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.16 }}
      className="relative pl-4 md:pl-5 mb-7 md:mb-8"
    >
      <motion.span
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{
          background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accent}40 100%)`,
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <p
        className="italic leading-relaxed text-[13px] md:text-[15px]"
        style={{ color: "rgba(232,238,245,0.85)" }}
      >
        {text}
      </p>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  SECTION LABEL
// ──────────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 md:mb-4">
      <span className="w-2 h-px" style={{ background: C.dim }} />
      <span
        className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-mono"
        style={{ color: C.dim }}
      >
        {children}
      </span>
      <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  DECISION CARD — with cursor light sweep + theme accents
// ──────────────────────────────────────────────────────────────────────
interface DecisionCardProps {
  index: number;
  choice: ChoiceOption;
  theme: EncounterTheme;
  hovered: boolean;
  locked: boolean;
  anyLocked: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}

function DecisionCard({
  index,
  choice,
  theme,
  hovered,
  locked,
  anyLocked,
  onHover,
  onLeave,
  onSelect,
}: DecisionCardProps) {
  const badges = useMemo(() => parseEffects(choice.effects), [choice.effects]);
  const hasRisk = badges.some((b) => b.kind === "risk");
  const hasReward = badges.some((b) => b.kind === "reward");
  const dimmed = anyLocked && !locked;

  // Cursor-tracking light sweep
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouseX(e.clientX - rect.left);
  };

  const accent = theme.accent;
  const glow = theme.glow;

  return (
    <motion.button
      ref={cardRef}
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: dimmed ? 0.35 : 1, x: 0 }}
      transition={{ delay: 0.22 + index * 0.06, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={!anyLocked ? { scale: 1.015, y: -2 } : {}}
      whileTap={!anyLocked ? { scale: 0.985 } : {}}
      onMouseEnter={() => {
        if (anyLocked) return;
        onHover();
        // Themed hover: reward = bright chime, risk = low distortion, neutral = soft tick
        const tone = getChoiceTone(choice);
        if (tone === "reward") sfx.hoverReward();
        else if (tone === "risk") sfx.hoverRisk();
        else sfx.hoverNeutral();
      }}
      onMouseLeave={() => {
        setMouseX(null);
        onLeave();
      }}
      onMouseMove={handleMouseMove}
      onClick={onSelect}
      disabled={anyLocked && !locked}
      className={clsx(
        "relative w-full text-left p-4 md:p-5 border-2 transition-colors group overflow-hidden"
      )}
      style={{
        borderColor: locked || hovered ? accent : "rgba(255,255,255,0.14)",
        background: locked
          ? `${accent}1A`
          : hovered
          ? `${accent}0D`
          : "rgba(11,15,20,0.55)",
        boxShadow: locked
          ? `0 0 ${32 * theme.glowIntensity}px ${glow}, inset 0 0 24px ${glow.replace("0.55", "0.12")}`
          : hovered
          ? `0 0 22px ${glow.replace("0.55", "0.22")}, inset 0 0 18px ${glow.replace("0.55", "0.05")}`
          : "0 0 0 rgba(0,0,0,0)",
      }}
    >
      {/* Cursor light sweep */}
      {mouseX !== null && hovered && !anyLocked && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: mouseX - 80,
            width: 160,
            background: `linear-gradient(90deg, transparent, ${accent}28, transparent)`,
          }}
        />
      )}

      {/* Hover accent bar — left edge */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 origin-bottom"
        style={{ background: accent }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: hovered || locked ? 1 : 0.15 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      />

      {/* Lock-in pulse */}
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.6, scale: 1.02 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${accent}59, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirmed banner */}
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-3 px-2 py-0.5 font-display font-black text-[9px] uppercase tracking-[0.3em]"
            style={{ background: accent, color: C.bg }}
          >
            ▸ Decision Logged
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER ROW */}
      <div className="flex items-start justify-between gap-3 mb-2 relative">
        <div className="flex items-baseline gap-3 flex-1 min-w-0">
          <span
            className="font-display font-black text-base md:text-lg shrink-0 px-2 py-0.5 border"
            style={{
              color: hovered || locked ? accent : C.dim,
              borderColor: hovered || locked ? accent : "rgba(255,255,255,0.15)",
            }}
          >
            [{index + 1}]
          </span>
          <span
            className="font-display font-black text-base md:text-lg uppercase tracking-wider"
            style={{ color: hovered || locked ? accent : C.text }}
          >
            {choice.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasReward && (
            <motion.div
              className="px-1.5 py-0.5 border text-[9px] uppercase tracking-[0.25em] font-display font-black flex items-center gap-1"
              style={{ borderColor: C.good, color: C.good }}
              animate={hovered ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.8, repeat: hovered ? Infinity : 0 }}
            >
              🎯 Reward
            </motion.div>
          )}
          {hasRisk && (
            <motion.div
              className="px-1.5 py-0.5 border text-[9px] uppercase tracking-[0.25em] font-display font-black flex items-center gap-1"
              style={{ borderColor: C.danger, color: C.danger }}
              animate={hovered ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.7, repeat: hovered ? Infinity : 0 }}
            >
              ⚠ Risk
            </motion.div>
          )}
        </div>
      </div>

      {/* DESCRIPTION */}
      <motion.p
        className="text-[12px] md:text-[13px] leading-relaxed mb-3 relative"
        animate={{
          color: hovered || locked ? "rgba(232,238,245,1)" : "rgba(232,238,245,0.75)",
        }}
      >
        {choice.description}
      </motion.p>

      {/* OUTCOME BADGES */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 relative">
          {badges.map((b, i) => (
            <span
              key={i}
              className={clsx(
                "px-2 py-0.5 border text-[10px] uppercase tracking-widest font-mono flex items-center gap-1.5 bg-black/40",
                BADGE_BORDER[b.color],
                BADGE_TEXT[b.color]
              )}
            >
              <span className="text-[11px]">{b.icon}</span>
              <span className="font-bold">{b.text}</span>
            </span>
          ))}
        </div>
      )}

      {/* Keyboard hint */}
      <div
        className="absolute bottom-1.5 right-2 text-[9px] uppercase tracking-widest pointer-events-none"
        style={{ color: hovered ? accent : "rgba(255,255,255,0.18)" }}
      >
        Press {index + 1}
      </div>
    </motion.button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  FOOTER
// ──────────────────────────────────────────────────────────────────────
function FooterTagline({ theme }: { theme: EncounterTheme }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      transition={{ delay: 0.5 }}
      className="mt-6 md:mt-8 flex items-center justify-center gap-3 text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-mono"
      style={{ color: C.dim }}
    >
      <span style={{ color: theme.accent, opacity: 0.7 }}>◢</span>
      <span>Decision is final</span>
      <span style={{ color: theme.accent, opacity: 0.7 }}>•</span>
      <span>For Super Earth</span>
      <span style={{ color: theme.accent, opacity: 0.7 }}>◣</span>
    </motion.div>
  );
}
