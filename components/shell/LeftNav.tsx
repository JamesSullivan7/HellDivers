"use client";

/**
 * LEFT NAVIGATION · embedded military control panel
 * ──────────────────────────────────────────────────────────────────────
 * AAA-quality refinement of the hub-side nav. Reads as a control surface
 * built into the warship's bulkhead — not a website sidebar.
 *
 * Design system:
 *   - Unified monoline SVG icon set (one stroke weight, one 18×18 box)
 *   - 8px vertical rhythm; every item is 48px tall
 *   - Embedded material: vertical gradient + faint noise + right-rim
 *     blue cabin light + inner shadow on the right edge
 *   - Active state: 3px gold rail on the left + warm yellow glow bleed
 *     + slight brightness lift + faint background wash
 *   - Hover: 200ms ease brightness + soft inner ring (no scale, no bounce)
 *   - Layout / item list: unchanged
 */

import { useState } from "react";
import clsx from "clsx";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { NavKey } from "@/types/shell";

// ──────────────────────────────────────────────────────────────────────
//  ICON SYSTEM — monoline, tactical, 18×18 box, 1.4 stroke weight
//  Every icon shares the same proportions so the rail looks like one
//  consistent control surface. They use `currentColor` so the active /
//  hover / dim color states cascade from the parent button.
// ──────────────────────────────────────────────────────────────────────
type IconProps = { className?: string };
const STROKE = 1.4;

const NavIcons = {
  war: (p: IconProps) => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <circle cx="9" cy="9" r="4" />
      <ellipse cx="9" cy="9" rx="7.5" ry="2.4" transform="rotate(-22 9 9)" />
      <circle cx="14.4" cy="5.4" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  mission: (p: IconProps) => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="square" {...p}>
      <circle cx="9" cy="9" r="5.5" />
      <circle cx="9" cy="9" r="2.2" />
      <line x1="9" y1="0.5" x2="9" y2="2.5" />
      <line x1="9" y1="15.5" x2="9" y2="17.5" />
      <line x1="0.5" y1="9" x2="2.5" y2="9" />
      <line x1="15.5" y1="9" x2="17.5" y2="9" />
    </svg>
  ),
  stratagems: (p: IconProps) => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <rect x="2.5" y="2.5" width="13" height="13" />
      <line x1="2.5" y1="9" x2="15.5" y2="9" />
      <line x1="9" y1="2.5" x2="9" y2="15.5" />
      <rect x="6.4" y="6.4" width="5.2" height="5.2" fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  ),
  armory: (p: IconProps) => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="square" {...p}>
      {/* Crossed armament outline */}
      <line x1="3" y1="3.5" x2="14.5" y2="14.5" />
      <line x1="14.5" y1="3.5" x2="3" y2="14.5" />
      <circle cx="3" cy="3.5" r="1.1" />
      <circle cx="14.5" cy="3.5" r="1.1" />
      <circle cx="3" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  squad: (p: IconProps) => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="square" {...p}>
      <circle cx="9" cy="4.2" r="1.6" />
      <circle cx="3.8" cy="13" r="1.6" />
      <circle cx="14.2" cy="13" r="1.6" />
      <line x1="9" y1="6" x2="4" y2="11.4" />
      <line x1="9" y1="6" x2="14" y2="11.4" />
      <line x1="5.4" y1="13" x2="12.6" y2="13" />
    </svg>
  ),
  history: (p: IconProps) => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="square" strokeLinejoin="miter" {...p}>
      <circle cx="9" cy="9" r="6" />
      <polyline points="9,4.5 9,9 12.4,11.2" />
      <line x1="9" y1="2.4" x2="9" y2="3.6" />
    </svg>
  ),
};

// ──────────────────────────────────────────────────────────────────────
//  ITEM REGISTRY
// ──────────────────────────────────────────────────────────────────────
interface NavItem {
  key: NavKey;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
  onActivate: (g: ReturnType<typeof useGame.getState>) => void;
}

const ITEMS: NavItem[] = [
  { key: "war",        label: "Galactic War", Icon: NavIcons.war,        onActivate: (g) => g.goToWar() },
  { key: "mission",    label: "Mission",      Icon: NavIcons.mission,    onActivate: (g) => g.goToWar() },
  { key: "stratagems", label: "Stratagems",   Icon: NavIcons.stratagems, onActivate: (g) => g.goToArmory() },
  { key: "armory",     label: "Armory",       Icon: NavIcons.armory,     onActivate: (g) => g.goToArmory() },
  { key: "squad",      label: "Squad",        Icon: NavIcons.squad,      onActivate: (g) => g.goToSquadHub() },
  { key: "history",    label: "History",      Icon: NavIcons.history,    onActivate: (g) => g.goToMenu() },
];

// Tactical palette — all values come from this so the look stays unified.
const C = {
  gold:       "#FFC72C",
  goldSoft:   "rgba(255,199,44,0.16)",
  goldFaint:  "rgba(255,199,44,0.06)",
  blueRim:    "rgba(96,180,255,0.06)",
  bg0:        "#0A0F14",
  bg1:        "#0E141C",
  rule:       "rgba(255,255,255,0.06)",
  ruleStrong: "rgba(255,255,255,0.10)",
  text:       "rgba(255,255,255,0.92)",
  textMid:    "rgba(255,255,255,0.55)",
  textDim:    "rgba(255,255,255,0.35)",
} as const;

// ──────────────────────────────────────────────────────────────────────
//  COMPONENT
// ──────────────────────────────────────────────────────────────────────
interface Props {
  active: NavKey;
}

export default function LeftNav({ active }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const game = useGame();

  return (
    <>
      {/* Mobile hamburger — kept; same role as before */}
      <button
        aria-label="Toggle navigation"
        onClick={() => setCollapsed((v) => !v)}
        className="lg:hidden fixed top-12 left-2 z-overlay px-2 py-1 text-xs tracking-widest font-display font-black"
        style={{
          color: C.gold,
          border: `1px solid ${C.ruleStrong}`,
          background: C.bg1,
        }}
      >
        ☰
      </button>

      <nav
        className={clsx(
          "shrink-0 flex flex-col relative",
          "lg:relative lg:translate-x-0 lg:w-[260px]",
          "fixed top-[44px] bottom-[32px] left-0 z-overlay w-[240px] transition-transform duration-200",
          collapsed ? "-translate-x-full" : "translate-x-0"
        )}
        style={{
          // Embedded panel — vertical gradient + right-edge inner shadow.
          // The inner shadow is what makes it read as a recessed bulkhead
          // rather than a flat overlay.
          background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 60%, ${C.bg0} 100%)`,
          borderRight: `1px solid ${C.rule}`,
          boxShadow: `inset -1px 0 0 rgba(255,255,255,0.02), inset -10px 0 24px rgba(0,0,0,0.55)`,
        }}
      >
        {/* Top hairline gold accent — ties this rail to the rest of the
            ship's UI (TopBar, HubFrame all share this top accent). */}
        <span
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }}
        />

        {/* Faint noise texture — gives the panel a "metal" feel without
            shipping a raster asset. SVG fractal turbulence at low opacity. */}
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />

        {/* Right-edge cabin rim light — soft cool glow simulating the
            blue panel light bleeding from the rest of the ship. */}
        <span
          aria-hidden
          className="absolute top-0 bottom-0 right-0 w-12 pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${C.blueRim} 0%, transparent 100%)`,
          }}
        />

        {/* Top + bottom edge falloff into darkness */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-16 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, ${C.bg0}, transparent)` }}
        />
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${C.bg0}, transparent)` }}
        />

        {/* HEADER — section label */}
        <div
          className="relative px-4 flex items-center gap-1.5"
          style={{ height: 44, borderBottom: `1px solid ${C.rule}` }}
        >
          <span
            aria-hidden
            className="block w-1 h-1"
            style={{ background: C.gold, boxShadow: `0 0 4px ${C.gold}` }}
          />
          <span
            className="font-display font-black uppercase"
            style={{
              color: C.textDim,
              fontSize: 9,
              letterSpacing: "0.42em",
            }}
          >
            Navigation
          </span>
        </div>

        {/* ITEM RAIL */}
        <div className="relative flex-1 overflow-y-auto py-2">
          {ITEMS.map((item) => (
            <NavRailItem
              key={item.key}
              item={item}
              isActive={active === item.key}
              onClick={() => {
                sfx.click();
                item.onActivate(game);
                setCollapsed(true);
              }}
            />
          ))}
        </div>

        {/* FOOTER — ship designation */}
        <div
          className="relative px-4 flex items-center gap-1.5"
          style={{ height: 36, borderTop: `1px solid ${C.rule}` }}
        >
          <span
            aria-hidden
            className="block w-1 h-1"
            style={{ background: C.textDim }}
          />
          <span
            className="font-display font-black uppercase truncate"
            style={{
              color: C.textDim,
              fontSize: 8.5,
              letterSpacing: "0.36em",
            }}
          >
            SES Democratic Flame
          </span>
        </div>
      </nav>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ITEM
//  ┌─────────────────────────────────┐
//  │ ▌  [icon]   GALACTIC WAR        │  <- 48px tall · 8px rhythm
//  └─────────────────────────────────┘
//   ▲ vertical accent rail (3px, only when active)
// ──────────────────────────────────────────────────────────────────────
function NavRailItem({
  item, isActive, onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const Icon = item.Icon;

  // Color cascade — single source of truth for icon + text + accents
  const accent = isActive ? C.gold : hover ? C.text : C.textMid;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative w-full flex items-center gap-3 px-4 text-left transition-[color,background,box-shadow] duration-200 ease-out"
      style={{
        height: 48, // 48 = 6 × 8px rhythm
        color: accent,
        background: isActive
          ? `linear-gradient(90deg, ${C.goldSoft} 0%, ${C.goldFaint} 35%, transparent 65%)`
          : hover
            ? `linear-gradient(90deg, rgba(255,255,255,0.04), transparent 70%)`
            : "transparent",
        boxShadow: isActive
          ? `inset 0 0 24px ${C.goldFaint}`
          : hover
            ? `inset 0 0 0 1px rgba(255,199,44,0.08)`
            : "none",
      }}
    >
      {/* Vertical accent rail — only renders when active. 3px wide,
          full-height gold bar with a soft glow so it reads as a
          control panel "locked-in" indicator. */}
      {isActive && (
        <span
          aria-hidden
          className="absolute top-0 bottom-0 left-0"
          style={{
            width: 3,
            background: C.gold,
            boxShadow: `0 0 10px ${C.gold}, 0 0 22px rgba(255,199,44,0.5)`,
          }}
        />
      )}

      {/* Icon — strict 18×18, currentColor so it inherits state */}
      <span
        className="shrink-0 flex items-center justify-center"
        style={{ width: 18, height: 18 }}
      >
        <Icon className="w-full h-full" />
      </span>

      {/* Label — tactical, all caps, tracked, weight-matched */}
      <span
        className="font-display font-black uppercase truncate"
        style={{
          fontSize: 11,
          letterSpacing: "0.28em",
          textShadow: isActive ? `0 0 6px ${C.goldSoft}` : undefined,
        }}
      >
        {item.label}
      </span>

      {/* Trailing tick — visible only on active item, reinforces "locked" */}
      {isActive && (
        <span
          aria-hidden
          className="ml-auto font-display font-black"
          style={{
            color: C.gold,
            fontSize: 10,
            letterSpacing: "0",
            textShadow: `0 0 6px ${C.gold}`,
          }}
        >
          ◀
        </span>
      )}
    </button>
  );
}
