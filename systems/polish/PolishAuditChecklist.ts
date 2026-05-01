/**
 * FINAL POLISH LAYER · audit checklist
 * ──────────────────────────────────────────────────────────────────────
 * Designer-facing audit that codifies "what counts as polished" across
 * the project. Each item has:
 *
 *   id          — stable key for tracking pass/fail
 *   category    — section the audit lives in
 *   rule        — short imperative ("Buttons compress on press")
 *   detail      — long-form explanation
 *   automatable — true if a runtime checker can verify it (vs. visual review)
 *   reference   — file or component that owns the canonical implementation
 *
 * Use:
 *   - Render in a dev panel as a checklist
 *   - Run `auditPolishHints(...)` in tests / dev tools to surface
 *     automatable gaps
 *
 * The list is intentionally NOT exhaustive — it's the checklist a senior
 * polish designer would walk through on a build before sign-off.
 */

export type PolishAuditCategory =
  | "spacing"
  | "typography"
  | "color"
  | "buttons"
  | "cards"
  | "panels"
  | "icons"
  | "states"
  | "motion"
  | "audio"
  | "accessibility"
  | "mobile"
  | "consistency";

export interface PolishAuditItem {
  id: string;
  category: PolishAuditCategory;
  rule: string;
  detail: string;
  automatable: boolean;
  reference?: string;
}

export const POLISH_AUDIT: PolishAuditItem[] = [
  // ── SPACING ────────────────────────────────────────────────────────
  { id: "sp_scale_4px", category: "spacing", rule: "All gaps use the 4-px scale", detail: "Gaps and padding live on the SPACING token in polishTokens.ts (1/2/4/8/12/16/24/32). No raw pixel values in components.", automatable: false, reference: "systems/polish/polishTokens.ts" },
  { id: "sp_card_grid", category: "spacing", rule: "Card grids use STAGGER.cinematic", detail: "Reward / hand grids stagger entries by 0.18s for cinematic feel.", automatable: false },

  // ── TYPOGRAPHY ─────────────────────────────────────────────────────
  { id: "ty_one_display", category: "typography", rule: "One display font for headings only", detail: "Display-weight font reserved for level numbers, headlines, currency totals; UI body uses font-mono.", automatable: false },
  { id: "ty_uppercase_labels", category: "typography", rule: "All meta labels are UPPERCASE + tracking-widest", detail: "Section headers, tab labels, table headers; never sentence-case.", automatable: false },
  { id: "ty_tabular_nums", category: "typography", rule: "Numerics use tabular-nums", detail: "HP, currency, damage, durations — anything that ticks.", automatable: false },

  // ── COLOR ──────────────────────────────────────────────────────────
  { id: "co_palette_tokens", category: "color", rule: "Components reference POLISH_COLOR or CSS vars only", detail: "No raw hex outside the tokens file unless the value is a one-off swatch (e.g. cosmetic accent).", automatable: false },
  { id: "co_severity_consistency", category: "color", rule: "Severity colors match across systems", detail: "Critical = red across intent panel, balance flags, lethal pulse, defeat banner.", automatable: false },

  // ── BUTTONS ────────────────────────────────────────────────────────
  { id: "bt_hover_glow", category: "buttons", rule: "Buttons get hover glow", detail: "On hover, a 12-px box-shadow in the button accent appears. Tested at SPRINGS.snap.", automatable: false },
  { id: "bt_press_compress", category: "buttons", rule: "Buttons compress on press", detail: "scale 0.96 with SPRINGS.snap on active state.", automatable: false },
  { id: "bt_disabled_desaturate", category: "buttons", rule: "Disabled buttons desaturate AND lower opacity", detail: "opacity 0.4 (OPACITY.disabled), grayscale via filter.", automatable: false },
  { id: "bt_focus_ring", category: "buttons", rule: "Keyboard focus shows visible ring", detail: "All interactive elements have a 2-px outline-offset focus ring in accent yellow.", automatable: true },
  { id: "bt_danger_pulse", category: "buttons", rule: "Danger variants pulse subtly", detail: "Destructive actions get a slow red glow loop while idle.", automatable: false },

  // ── CARDS ──────────────────────────────────────────────────────────
  { id: "cd_hover_lift", category: "cards", rule: "Card hover lifts -3 to -5 px", detail: "y-translate via framer-motion, SPRINGS.base.", automatable: false },
  { id: "cd_selected_glow", category: "cards", rule: "Selected card has accent ring + glow", detail: "Yellow ring (ring-2) + 16-px glow.", automatable: false },
  { id: "cd_unplayable_warning", category: "cards", rule: "Unplayable cost flashes red", detail: "When trying to play a card with insufficient resources, cost pip pulses red once.", automatable: false },
  { id: "cd_drag_elasticity", category: "cards", rule: "Dragged cards have elastic snap-back", detail: "Releases use SPRINGS.cinematic for a satisfying return.", automatable: false },

  // ── PANELS ─────────────────────────────────────────────────────────
  { id: "pn_subtle_breath", category: "panels", rule: "Active panels breathe softly", detail: "BreathingGlow opacity loops from 0.85 → 1.0 over 2.4s. Disabled under reduced motion.", automatable: false, reference: "components/polish/BreathingGlow.tsx" },
  { id: "pn_consistent_border", category: "panels", rule: "All panel borders match", detail: "Single 1-px subtle border + occasionally a 2-px strong border for emphasis.", automatable: false },

  // ── ICONS ──────────────────────────────────────────────────────────
  { id: "ic_size_grid", category: "icons", rule: "Icons sized 12 / 16 / 20 / 24 / 32", detail: "No off-grid icon sizes.", automatable: false },
  { id: "ic_stroke_consistency", category: "icons", rule: "Icon stroke widths match per family", detail: "If a system uses 1.5-px strokes, all icons in that system match.", automatable: false },

  // ── STATES ─────────────────────────────────────────────────────────
  { id: "st_empty_states", category: "states", rule: "Every list has an empty state", detail: "EmptyState component used for missions, unlocks, history. No blank spaces.", automatable: true, reference: "components/states/EmptyState.tsx" },
  { id: "st_loading_states", category: "states", rule: "Every async slot has a loading state", detail: "LoadingState component used for map gen, war sync, combat handoff.", automatable: true, reference: "components/states/LoadingState.tsx" },
  { id: "st_error_states", category: "states", rule: "Every async slot has an error fallback", detail: "ErrorState component used for sync failures, lost connection.", automatable: true, reference: "components/states/ErrorState.tsx" },

  // ── MOTION ─────────────────────────────────────────────────────────
  { id: "mo_no_constant_motion", category: "motion", rule: "Nothing animates constantly outside breath loops", detail: "Particles and decorative motion are scoped to specific moments.", automatable: false },
  { id: "mo_reduced_motion_path", category: "motion", rule: "Every motion has a reduced-motion fallback", detail: "useReducedMotionSafe returns true when OS pref or user override is set; sequences honor it.", automatable: true, reference: "hooks/useReducedMotionSafe.ts" },
  { id: "mo_transitions_under_700", category: "motion", rule: "Most transitions complete under 700ms", detail: "Anything longer is reserved for cinematic moments (boss enrage, level up).", automatable: false },

  // ── AUDIO ──────────────────────────────────────────────────────────
  { id: "au_pitch_variation", category: "audio", rule: "Repeated SFX vary pitch ±1 semitone", detail: "polishRandom.pitchVariation feeds the audio mixer.", automatable: false, reference: "systems/polish/polishRandom.ts" },
  { id: "au_volume_sliders", category: "audio", rule: "Master/music/sfx/voice sliders exposed in settings", detail: "PolishSettingsPanel surfaces all 4 sliders.", automatable: false },

  // ── ACCESSIBILITY ──────────────────────────────────────────────────
  { id: "ax_reduced_motion", category: "accessibility", rule: "Reduce-motion toggle in settings", detail: "Persists to localStorage; overrides OS pref when set.", automatable: false },
  { id: "ax_reduced_flash", category: "accessibility", rule: "Reduce-flash toggle in settings", detail: "Suppresses screen flashes + flash overlays.", automatable: false },
  { id: "ax_reduced_shake", category: "accessibility", rule: "Reduce-shake toggle in settings", detail: "Suppresses screen shake while keeping other feedback.", automatable: false },
  { id: "ax_larger_text", category: "accessibility", rule: "Larger text toggle scales body 110%", detail: "Increases readable text without breaking layout.", automatable: false },
  { id: "ax_high_contrast", category: "accessibility", rule: "High contrast toggle bumps borders + opacity", detail: "Adds 1.5× border weight, raises text contrast to AA.", automatable: false },
  { id: "ax_simplified_vfx", category: "accessibility", rule: "Simplified VFX toggle reduces particle counts", detail: "Caps concurrent VFX and disables overlays for sensitive players.", automatable: false },

  // ── MOBILE ─────────────────────────────────────────────────────────
  { id: "mb_tap_targets", category: "mobile", rule: "Tap targets >= 44px on small viewports", detail: "Every interactive element passes the WCAG mobile guideline.", automatable: false },
  { id: "mb_safe_area", category: "mobile", rule: "Edges respect safe-area-insets", detail: "Notched devices use env(safe-area-inset-*) padding.", automatable: false },
  { id: "mb_swipe_hand", category: "mobile", rule: "Card hand supports swipe / horizontal scroll", detail: "Scrollable hand on small viewports; no hover-only affordances.", automatable: false },
  { id: "mb_sticky_endturn", category: "mobile", rule: "End Turn button sticky on mobile", detail: "Always visible; never scrolls away.", automatable: false },

  // ── CONSISTENCY ────────────────────────────────────────────────────
  { id: "cn_polish_tokens", category: "consistency", rule: "All polish numbers come from polishTokens.ts", detail: "Timing, easing, springs, opacity, glow, spacing, radius — single source of truth.", automatable: false, reference: "systems/polish/polishTokens.ts" },
  { id: "cn_severity_color_pairing", category: "consistency", rule: "Severity colors paired with shape (ladder)", detail: "Color-blind safety — never rely on color alone.", automatable: false },
];

// ──────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────
export function auditByCategory(): Record<PolishAuditCategory, PolishAuditItem[]> {
  const out = {} as Record<PolishAuditCategory, PolishAuditItem[]>;
  for (const item of POLISH_AUDIT) {
    (out[item.category] ??= []).push(item);
  }
  return out;
}

export function automatableAuditItems(): PolishAuditItem[] {
  return POLISH_AUDIT.filter((i) => i.automatable);
}

/**
 * Light-weight runtime audit. Each automatable item has a checker the
 * caller can register; this surfaces gaps without requiring a full test
 * runner.
 *
 *   const passed = await runPolishAudit({
 *     bt_focus_ring: () => document.activeElement?.matches(":focus-visible") ?? false,
 *     ...
 *   });
 */
export async function runPolishAudit(
  checkers: Partial<Record<string, () => boolean | Promise<boolean>>>,
): Promise<{ passed: PolishAuditItem[]; failed: PolishAuditItem[] }> {
  const passed: PolishAuditItem[] = [];
  const failed: PolishAuditItem[] = [];
  for (const item of automatableAuditItems()) {
    const checker = checkers[item.id];
    if (!checker) {
      failed.push(item);
      continue;
    }
    try {
      const ok = await checker();
      (ok ? passed : failed).push(item);
    } catch {
      failed.push(item);
    }
  }
  return { passed, failed };
}
