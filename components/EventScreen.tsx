"use client";

/**
 * FIELD ENCOUNTER · Cinematic command-briefing redesign.
 *
 * Layout hierarchy:
 *   EventScreen  ── full-screen container
 *   ├─ EventBackground   ── blurred SEAF backdrop · scanlines · particle drift
 *   ├─ EventPanel        ── floating command console with breathing animation
 *   │   ├─ EventHeader        small uppercase label · triangle indicator
 *   │   ├─ EventTitle         large condensed title with soft glow
 *   │   ├─ NarrativeBlock     italic flavor with vertical accent line
 *   │   ├─ SectionLabel       SELECT COURSE OF ACTION
 *   │   ├─ DecisionCard ×N    interactive tactical decision card
 *   │   └─ FooterTagline      DECISION IS FINAL · FOR SUPER EARTH
 *
 * Keyboard: 1 / 2 / 3 hotkeys for the corresponding option.
 * Click selection plays a quick lock-in pulse before resolving.
 */

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { EVENTS, ChoiceEvent, ChoiceOption, EventEffect } from "@/lib/events";

// ──────────────────────────────────────────────────────────────────────
//  COLOR TOKENS
// ──────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0b0f14",
  panel: "#111821",
  accent: "#f5c542",
  danger: "#ff4d4d",
  good: "#34d399",
  tech: "#4da6ff",
  text: "#e8eef5",
  dim: "rgba(232,238,245,0.40)",
  border: "rgba(255,255,255,0.10)",
} as const;

const BACKDROP = "/art/backgrounds/battlefield_seaf.png";
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

// ──────────────────────────────────────────────────────────────────────
//  ROOT
// ──────────────────────────────────────────────────────────────────────
export default function EventScreen() {
  const { pendingEventId, resolveEventChoice } = useGame();
  const event = pendingEventId ? EVENTS[pendingEventId] : null;
  const [lockedIdx, setLockedIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Incoming-transmission cue on mount
  useEffect(() => {
    sfx.unlock();
    sfx.beacon();
  }, []);

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

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden font-mono"
      style={{ background: C.bg, color: C.text }}
    >
      <EventBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <EventPanel>
          <EventHeader event={event} />
          <EventTitle title={event.title} />
          <NarrativeBlock text={event.flavor} />

          <SectionLabel>Select Course of Action</SectionLabel>

          <div className="space-y-3 md:space-y-4">
            {event.choices.map((choice, idx) => (
              <DecisionCard
                key={choice.id}
                index={idx}
                choice={choice}
                hovered={hoverIdx === idx}
                locked={lockedIdx === idx}
                anyLocked={lockedIdx !== null}
                onHover={() => setHoverIdx(idx)}
                onLeave={() => setHoverIdx((cur) => (cur === idx ? null : cur))}
                onSelect={() => handleSelect(choice, idx)}
              />
            ))}
          </div>

          <FooterTagline />
        </EventPanel>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  BACKGROUND — blurred SEAF backdrop · scanlines · particle drift
// ──────────────────────────────────────────────────────────────────────
function EventBackground() {
  // 12 floating dust particles (deterministic positions)
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        left: `${(i * 73) % 100}%`,
        delay: (i % 7) * 0.6,
        duration: 14 + (i % 5) * 3,
        size: 1 + (i % 4),
      })),
    []
  );

  return (
    <>
      {/* Base color */}
      <div className="absolute inset-0" style={{ background: C.bg }} />

      {/* Heavily blurred SEAF backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${BACKDROP})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(28px) brightness(0.55)",
          opacity: 0.55,
          transform: "scale(1.12)", // overshoot so blur edges don't show
        }}
      />

      {/* Slow parallax breathing — adds the "alive" feel */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${BACKDROP})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(36px)",
          opacity: 0.16,
          mixBlendMode: "screen",
          transform: "scale(1.15)",
        }}
        animate={{ scale: [1.15, 1.22, 1.15] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top + bottom dark gradient (focus the eye on the panel) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,15,20,0.85) 0%, rgba(11,15,20,0.55) 30%, rgba(11,15,20,0.55) 70%, rgba(11,15,20,0.92) 100%)",
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

      {/* Scanlines (horizontal) — very subtle */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* Holographic horizontal scan sweep */}
      <motion.div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(245,197,66,0.4), transparent)",
        }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />

      {/* Drifting dust particles */}
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
              background: "rgba(245,197,66,0.45)",
              boxShadow: "0 0 4px rgba(245,197,66,0.7)",
            }}
            animate={{
              y: ["0vh", "-110vh"],
              x: [0, (i % 2 === 0 ? 30 : -30)],
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
//  PANEL — floating command console with breathing animation
// ──────────────────────────────────────────────────────────────────────
function EventPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.8 }}
      className="relative w-full max-w-5xl"
      style={{
        // Subtle depth — outer halo + inner panel
        filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.65))",
      }}
    >
      {/* Slow breathing wrapper */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer glow ring — yellow, pulses slowly */}
        <motion.div
          className="absolute -inset-1 pointer-events-none"
          style={{
            border: `1px solid ${C.accent}`,
            boxShadow: `0 0 60px rgba(245,197,66,0.18), inset 0 0 30px rgba(245,197,66,0.06)`,
          }}
          animate={{ opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div
          className="relative border-2 backdrop-blur-md p-6 md:p-10"
          style={{
            borderColor: C.accent,
            background:
              "linear-gradient(135deg, rgba(17,24,33,0.92) 0%, rgba(11,15,20,0.95) 100%)",
          }}
        >
          {/* Corner brackets */}
          <Bracket pos="tl" />
          <Bracket pos="tr" />
          <Bracket pos="bl" />
          <Bracket pos="br" />

          {/* Segmented edge ticks */}
          <SegmentedEdge axis="top" />
          <SegmentedEdge axis="bottom" />

          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  }[pos];
  return (
    <span
      className={clsx("absolute w-5 h-5 pointer-events-none", cls)}
      style={{ borderColor: C.accent, margin: "-1px" }}
    />
  );
}

function SegmentedEdge({ axis }: { axis: "top" | "bottom" }) {
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
            background: i % 3 === 1 ? C.accent : "rgba(245,197,66,0.4)",
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  HEADER
// ──────────────────────────────────────────────────────────────────────
function EventHeader({ event }: { event: ChoiceEvent }) {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="text-base"
          style={{ color: C.accent }}
        >
          ▶
        </motion.span>
        <span
          className="text-[10px] md:text-xs uppercase tracking-[0.5em] font-display font-black"
          style={{ color: C.accent }}
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
      </div>

      {event.faction && (
        <div
          className="px-2 py-0.5 border text-[9px] uppercase tracking-[0.3em] font-display font-bold"
          style={{ borderColor: C.tech, color: C.tech }}
        >
          {event.faction} sector
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  TITLE
// ──────────────────────────────────────────────────────────────────────
function EventTitle({ title }: { title: string }) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="font-display font-black tracking-tight leading-[1.05] text-3xl md:text-5xl mb-4 md:mb-5"
      style={{
        color: C.text,
        textShadow: "0 0 24px rgba(245,197,66,0.18), 0 2px 0 rgba(0,0,0,0.6)",
      }}
    >
      {title}
    </motion.h1>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  NARRATIVE
// ──────────────────────────────────────────────────────────────────────
function NarrativeBlock({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.16 }}
      className="relative pl-4 md:pl-5 mb-7 md:mb-8"
    >
      {/* Vertical accent line — gradient + breathing */}
      <motion.span
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{
          background: `linear-gradient(180deg, ${C.accent} 0%, rgba(245,197,66,0.25) 100%)`,
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
//  DECISION CARD
// ──────────────────────────────────────────────────────────────────────
interface DecisionCardProps {
  index: number;
  choice: ChoiceOption;
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

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: dimmed ? 0.35 : 1, x: 0 }}
      transition={{ delay: 0.22 + index * 0.06, type: "spring", stiffness: 260, damping: 24 }}
      whileHover={!anyLocked ? { scale: 1.015, y: -2 } : {}}
      whileTap={!anyLocked ? { scale: 0.985 } : {}}
      onMouseEnter={() => {
        if (anyLocked) return;
        onHover();
        sfx.click();
      }}
      onMouseLeave={onLeave}
      onClick={onSelect}
      disabled={anyLocked && !locked}
      className={clsx(
        "relative w-full text-left p-4 md:p-5 border-2 transition-colors group overflow-hidden",
        locked && "ring-2 ring-helldiver-yellow"
      )}
      style={{
        borderColor: locked ? C.accent : hovered ? C.accent : "rgba(255,255,255,0.14)",
        background: locked
          ? "rgba(245,197,66,0.10)"
          : hovered
            ? "rgba(245,197,66,0.05)"
            : "rgba(11,15,20,0.55)",
        boxShadow: locked
          ? `0 0 32px rgba(245,197,66,0.45), inset 0 0 24px rgba(245,197,66,0.12)`
          : hovered
            ? `0 0 22px rgba(245,197,66,0.18), inset 0 0 18px rgba(245,197,66,0.05)`
            : "0 0 0 rgba(0,0,0,0)",
      }}
    >
      {/* Hover accent bar — left edge */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 origin-bottom"
        style={{ background: C.accent }}
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
              background:
                "radial-gradient(ellipse at center, rgba(245,197,66,0.35), transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Confirmed banner during lock-in */}
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-3 px-2 py-0.5 font-display font-black text-[9px] uppercase tracking-[0.3em]"
            style={{ background: C.accent, color: C.bg }}
          >
            ▸ Decision Logged
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER ROW: number badge · title · risk/reward indicators */}
      <div className="flex items-start justify-between gap-3 mb-2 relative">
        <div className="flex items-baseline gap-3 flex-1 min-w-0">
          <span
            className="font-display font-black text-base md:text-lg shrink-0 px-2 py-0.5 border"
            style={{
              color: hovered || locked ? C.accent : C.dim,
              borderColor: hovered || locked ? C.accent : "rgba(255,255,255,0.15)",
            }}
          >
            [{index + 1}]
          </span>
          <span
            className="font-display font-black text-base md:text-lg uppercase tracking-wider"
            style={{ color: hovered || locked ? C.accent : C.text }}
          >
            {choice.label}
          </span>
        </div>

        {/* Risk / Reward indicators */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasReward && (
            <motion.div
              className="px-1.5 py-0.5 border text-[9px] uppercase tracking-[0.25em] font-display font-black flex items-center gap-1"
              style={{ borderColor: C.good, color: C.good }}
              animate={hovered ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.8, repeat: hovered ? Infinity : 0 }}
              title="Reward"
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
              title="Risk"
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
        style={{ color: hovered ? C.accent : "rgba(255,255,255,0.18)" }}
      >
        Press {index + 1}
      </div>
    </motion.button>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  FOOTER
// ──────────────────────────────────────────────────────────────────────
function FooterTagline() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      transition={{ delay: 0.5 }}
      className="mt-6 md:mt-8 flex items-center justify-center gap-3 text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-mono"
      style={{ color: C.dim }}
    >
      <span style={{ color: C.accent, opacity: 0.7 }}>◢</span>
      <span>Decision is final</span>
      <span style={{ color: C.accent, opacity: 0.7 }}>•</span>
      <span>For Super Earth</span>
      <span style={{ color: C.accent, opacity: 0.7 }}>◣</span>
    </motion.div>
  );
}
