/**
 * FINAL POLISH LAYER · design tokens
 * ──────────────────────────────────────────────────────────────────────
 * The single source of truth for "polish numbers": timing curves, spring
 * configs, opacity ladders, glow radii, and the canonical easing curves
 * the polish components use.
 *
 * Rule: any number that lives in more than one polish component should
 * land here first. UI consistency means every breath, every flash, every
 * stagger reads from these tokens.
 */

// ──────────────────────────────────────────────────────────────────────
//  Timing — base units that drive the rest of the system
//  Aligned with prior systems (feedback, transitions, vfx) so the
//  whole app feels like it's on the same beat.
// ──────────────────────────────────────────────────────────────────────
export const POLISH_TIMING = {
  /** Snappy interactions — buttons, hover, focus. NEVER delay these. */
  instant: 80,
  /** Standard UI transitions — open / close / select. */
  fast: 160,
  /** Standard motion — page chrome, panel reveal. */
  base: 240,
  /** Cinematic micro-pause — landing a beat. */
  beat: 360,
  /** Cinematic pause before payoff — reward stagger, level-up flash. */
  pause: 540,
  /** Slow expressive moment — boss enrage hold. */
  hold: 700,
  /** A breath — the longest UI loop period. */
  breath: 2400,
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Easing — named cubic curves
// ──────────────────────────────────────────────────────────────────────
export const EASING = {
  /** Classic material "standard" — smooth in/out for chrome. */
  standard: [0.4, 0.0, 0.2, 1] as const,
  /** Decisive in — for pop-ins. */
  enter: [0.0, 0.0, 0.2, 1] as const,
  /** Decisive out — for slide-aways. */
  exit: [0.4, 0.0, 1, 1] as const,
  /** Anticipation curve — pulls back before forward. Used for cinematic moments. */
  anticipate: [0.16, 1, 0.3, 1] as const,
  /** Punchy bounce — used for damage / level up. */
  bounce: [0.34, 1.56, 0.64, 1] as const,
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Spring presets for framer-motion
// ──────────────────────────────────────────────────────────────────────
export const SPRINGS = {
  /** Tight, instant feel — buttons. */
  snap: { type: "spring", stiffness: 600, damping: 30, mass: 0.6 },
  /** Default spring — most UI. */
  base: { type: "spring", stiffness: 320, damping: 28, mass: 0.8 },
  /** Cinematic — reveals & celebrations. */
  cinematic: { type: "spring", stiffness: 180, damping: 22, mass: 1.0 },
  /** Heavy — boss / damage thumps. */
  heavy: { type: "spring", stiffness: 120, damping: 18, mass: 1.4 },
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Opacity ladder — keeps glow / dim states consistent
// ──────────────────────────────────────────────────────────────────────
export const OPACITY = {
  /** Page-dim on cinematic moments. */
  dim: 0.55,
  /** Disabled element. */
  disabled: 0.4,
  /** Idle sub-text. */
  subtle: 0.7,
  /** Active panel hint. */
  active: 0.92,
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Glow radii (px) — used by box-shadow on focus / selection / pulse
// ──────────────────────────────────────────────────────────────────────
export const GLOW = {
  hairline: 4,
  soft: 8,
  medium: 16,
  strong: 24,
  cinematic: 36,
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Spacing rhythm — match Tailwind's 4-px scale
// ──────────────────────────────────────────────────────────────────────
export const SPACING = {
  hairline: 1,
  tight: 2,
  micro: 4,
  small: 8,
  base: 12,
  comfy: 16,
  loose: 24,
  spacious: 32,
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Border radius scale (px)
// ──────────────────────────────────────────────────────────────────────
export const RADIUS = {
  none: 0,
  hairline: 1,
  sharp: 2,
  base: 4,
  round: 8,
  pill: 9999,
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Stagger schedules — used by sequences
// ──────────────────────────────────────────────────────────────────────
export const STAGGER = {
  /** Quick info reveal — currency tally, unlock chips. */
  fast: 0.06,
  /** Standard — card list slide-in. */
  base: 0.12,
  /** Cinematic — reward cards, level-up bullets. */
  cinematic: 0.18,
  /** Long emphasis — boss enrage beats. */
  long: 0.32,
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Polish color tokens — never hardcoded outside this module
// ──────────────────────────────────────────────────────────────────────
export const POLISH_COLOR = {
  yellow: "var(--color-accent-yellow, #f5c542)",
  orange: "var(--color-accent-orange, #ff8c2a)",
  red: "var(--color-accent-red, #ff4d4d)",
  cyan: "var(--color-accent-cyan, #60c4ff)",
  green: "#10B981",
  textPrimary: "var(--color-text-primary, #e8e9ea)",
  textDim: "var(--color-text-dim, #8a8d92)",
  bgPrimary: "var(--color-bg-primary, #0a0c10)",
  bgSecondary: "var(--color-bg-secondary, #14181f)",
  bgTertiary: "var(--color-bg-tertiary, #1c2230)",
  borderSubtle: "var(--color-border-subtle, #1f2937)",
  borderStrong: "var(--color-border-strong, #2c3645)",
} as const;

// ──────────────────────────────────────────────────────────────────────
//  Type aliases for ergonomic imports
// ──────────────────────────────────────────────────────────────────────
export type PolishTimingKey = keyof typeof POLISH_TIMING;
export type EasingKey = keyof typeof EASING;
export type SpringKey = keyof typeof SPRINGS;
