"use client";

/**
 * HUB FRAME · shared themed shell
 * ──────────────────────────────────────────────────────────────────────
 * Wraps any "room" the player navigates to from the Hub (Armory,
 * Character/Loadout, Codex, Squad, History, Ship, Daily Rewards,
 * Activity, etc.) with a consistent theme:
 *
 *   - Bridge cinematic in the background
 *   - Solid top strip with the hub's chrome (logo + back button + currency)
 *   - Title block (large display heading + subtitle)
 *   - Scrollable content area
 *   - Optional right-side accent panel
 *
 * Usage:
 *   <HubFrame title="Armory" subtitle="Outfitter · Stratagems · Modules">
 *     ...page content...
 *   </HubFrame>
 *
 * The frame handles the back-to-hub button automatically. Every room
 * the player lands in feels like part of the same Super Destroyer.
 */

import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { getHelldiverRank, type Account } from "@/lib/account";
import HubCommandCenterBackground from "./HubCommandCenterBackground";

// ──────────────────────────────────────────────────────────────────────
//  Tokens (kept in sync with HubScreen)
// ──────────────────────────────────────────────────────────────────────
const C = {
  yellow: "#f5c542",
  orange: "#ff8a28",
  cyan: "#60c4ff",
  red: "#ff4d4d",
  green: "#10b981",
  bg0: "#0a0d12",
  panel: "#0e1218",
  hairline: "rgba(245,197,66,0.18)",
  rule: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.92)",
  textMid: "rgba(255,255,255,0.65)",
  textDim: "rgba(255,255,255,0.4)",
} as const;

interface Props {
  title: string;
  subtitle?: string;
  /** Faction or category accent — drives the title underline color. */
  accent?: string;
  /** Optional badge in the upper-right of the title block (e.g. "ACTIVE"). */
  badge?: React.ReactNode;
  /** Bridge background ON by default — disable for darker rooms. */
  hideBridge?: boolean;
  /** Tighten the inner padding on dense screens. */
  dense?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function HubFrame({
  title, subtitle, accent = C.yellow, badge,
  hideBridge, dense, className, children,
}: Props) {
  const { account, goToMenu } = useGame();
  return (
    <div
      className="h-screen w-screen overflow-hidden text-white font-mono relative"
      style={{ background: C.bg0 }}
    >
      {!hideBridge && <HubCommandCenterBackground />}

      <div
        className="relative z-50 h-full grid"
        style={{ gridTemplateRows: "44px auto minmax(0, 1fr)" }}
      >
        <FrameTopStrip account={account} onBack={() => { sfx.click(); goToMenu(); }} />
        <FrameTitleBlock title={title} subtitle={subtitle} accent={accent} badge={badge} />

        <main
          className={clsx(
            "relative overflow-y-auto hub-frame-scroll",
            dense ? "px-6 py-4" : "px-8 py-6",
            className,
          )}
          style={{
            background: `linear-gradient(180deg, rgba(10,13,18,0.55) 0%, ${C.bg0} 30%, ${C.bg0} 100%)`,
          }}
        >
          {children}
        </main>

        {/* Webkit scrollbar — same look as the hub dashboard */}
        <style jsx global>{`
          .hub-frame-scroll {
            scrollbar-width: thin;
            scrollbar-color: ${C.yellow}55 transparent;
          }
          .hub-frame-scroll::-webkit-scrollbar { width: 8px; }
          .hub-frame-scroll::-webkit-scrollbar-track { background: transparent; }
          .hub-frame-scroll::-webkit-scrollbar-thumb {
            background: ${C.yellow}55;
            border-radius: 4px;
          }
          .hub-frame-scroll::-webkit-scrollbar-thumb:hover { background: ${C.yellow}88; }
        `}</style>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Top strip — back button on left, identity + currencies on right
// ──────────────────────────────────────────────────────────────────────
function FrameTopStrip({ account, onBack }: { account: Account; onBack: () => void }) {
  const rank = getHelldiverRank(account.level);
  const samples = account.samples + account.rareSamples + account.superSamples;
  return (
    <header
      className="relative flex items-center px-5 gap-4"
      style={{
        background: `linear-gradient(180deg, ${C.panel} 0%, ${C.bg0} 100%)`,
        borderBottom: `1px solid ${C.hairline}`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${C.yellow}, transparent)` }}
      />

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-1.5 transition-all"
        style={{
          border: `1px solid ${C.rule}`,
          borderRadius: 1,
          color: C.textMid,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.yellow;
          e.currentTarget.style.color = C.yellow;
          e.currentTarget.style.background = `${C.yellow}10`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.rule;
          e.currentTarget.style.color = C.textMid;
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span className="font-display font-black text-sm leading-none">◀</span>
        <span className="text-[10px] uppercase tracking-[0.3em] font-display font-black">
          Hub
        </span>
      </button>

      {/* Wordmark */}
      <span
        className="hidden md:inline font-display font-black tracking-[0.22em]"
        style={{ color: C.yellow, fontSize: 13 }}
      >
        HELLDIVERS
      </span>
      <span className="hidden md:inline text-[9px] uppercase tracking-[0.4em]" style={{ color: C.textDim }}>
        STRATAGEM PROTOCOL
      </span>

      <div className="flex-1" />

      {/* Identity */}
      <div className="hidden md:flex flex-col leading-none text-right">
        <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
          {rank.title}
        </span>
        <span className="text-[12px] font-display font-black tracking-wider mt-1" style={{ color: C.yellow }}>
          {account.helldiverName ?? "HELLDIVER"}
        </span>
      </div>

      {/* Currencies */}
      <div className="flex items-center gap-5">
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
        <span className="text-[7px] uppercase tracking-widest" style={{ color: C.textDim }}>{label}</span>
        <span className="font-display font-black tabular-nums mt-0.5" style={{ color: accent, fontSize: 13 }}>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Title block — heading + subtitle + optional badge
// ──────────────────────────────────────────────────────────────────────
function FrameTitleBlock({
  title, subtitle, accent, badge,
}: { title: string; subtitle?: string; accent: string; badge?: React.ReactNode }) {
  return (
    <div
      className="relative px-8 py-5"
      style={{
        background: `linear-gradient(180deg, ${C.panel} 0%, rgba(14,18,24,0.65) 100%)`,
        borderBottom: `1px solid ${C.hairline}`,
      }}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
            className="font-display font-black tracking-[0.16em]"
            style={{ color: accent, fontSize: 28, textShadow: `0 0 8px ${accent}55` }}
          >
            {title.toUpperCase()}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.32, delay: 0.08 }}
              className="text-[10px] uppercase tracking-[0.4em] mt-2"
              style={{ color: C.textDim }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Underline */}
      <div className="absolute bottom-0 left-8 right-8 h-px" style={{ background: `linear-gradient(90deg, ${accent}, transparent 60%)` }} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Themed atoms — re-exported for use inside framed rooms
// ──────────────────────────────────────────────────────────────────────

/** Card panel matching the hub theme. */
export function HubCard({
  title, accent = C.yellow, action, className, children,
}: {
  title?: string;
  accent?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={clsx("relative", className)}
      style={{
        background: `linear-gradient(180deg, rgba(14,18,24,0.92) 0%, rgba(10,13,18,0.92) 100%)`,
        border: `1px solid ${C.rule}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
        borderRadius: 1,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      {(title || action) && (
        <header className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.rule}` }}>
          {title && (
            <h3 className="text-[10px] uppercase tracking-[0.35em] font-display font-black" style={{ color: accent, textShadow: `0 0 4px ${accent}55` }}>
              {title}
            </h3>
          )}
          {action}
        </header>
      )}
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

/** Themed primary button. */
export function HubButton({
  children, onClick, variant = "primary", className, disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const palette = variant === "danger"
    ? { fg: C.red, bg: `${C.red}15`, border: C.red }
    : variant === "ghost"
      ? { fg: C.textMid, bg: "transparent", border: C.rule }
      : { fg: C.bg0, bg: `linear-gradient(135deg, ${C.yellow}, ${C.orange})`, border: C.yellow };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={clsx(
        "px-5 py-2 text-[10px] uppercase tracking-[0.3em] font-display font-black transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.fg,
        boxShadow: variant === "primary" ? `0 0 14px ${C.yellow}66` : undefined,
        borderRadius: 1,
      }}
    >
      {children}
    </motion.button>
  );
}

export const HUB_TOKENS = C;
