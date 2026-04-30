/**
 * PROGRESSION SYSTEM · economy
 * ──────────────────────────────────────────────────────────────────────
 * Currency identity + reward-scaling helpers + balance guardrails.
 *
 *   medals       — earned per run, spent on Warbond stratagem unlocks
 *   samples      — earned per combat (rare drops on elites/bosses), spent on
 *                  Ship Modules (passive run upgrades)
 *   requisition  — earned per run, spent on cosmetics + dual-purpose with
 *                  the in-combat Helldiver requisition resource
 *
 * The engine already handles base reward math in `lib/account.ts::calcRunReward`.
 * This module:
 *
 *   1. exposes a consistent `clampReward(...)` helper to enforce sane caps
 *   2. surfaces typed flat tables for "what does each currency buy"
 *      so UI can answer "you need X more medals" without grepping data files
 *   3. defines *bonus* multipliers (cosmetic equips, level-up windows) the
 *      ProgressionManager applies on top of engine math.
 */

import type { CurrencyType, RunRewards } from "./progressionTypes";

// ──────────────────────────────────────────────────────────────────────
//  Sanity caps — prevent absurd one-mission payouts under exploits
// ──────────────────────────────────────────────────────────────────────
export const REWARD_CAPS = {
  xpPerRun: 6000,
  medalsPerRun: 1500,
  samplesPerRun: 200,
  rareSamplesPerRun: 40,
  superSamplesPerRun: 10,
  requisitionPerRun: 800,
} as const;

export function clampReward(r: RunRewards): RunRewards {
  return {
    xp: Math.min(REWARD_CAPS.xpPerRun, Math.max(0, r.xp)),
    medals: Math.min(REWARD_CAPS.medalsPerRun, Math.max(0, r.medals)),
    samples: Math.min(REWARD_CAPS.samplesPerRun, Math.max(0, r.samples)),
    rareSamples: r.rareSamples
      ? Math.min(REWARD_CAPS.rareSamplesPerRun, Math.max(0, r.rareSamples))
      : 0,
    superSamples: r.superSamples
      ? Math.min(REWARD_CAPS.superSamplesPerRun, Math.max(0, r.superSamples))
      : 0,
    requisition: Math.min(REWARD_CAPS.requisitionPerRun, Math.max(0, r.requisition)),
    bonusLabel: r.bonusLabel,
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Currency identity table — used by the CurrencyCounter component
// ──────────────────────────────────────────────────────────────────────
export interface CurrencyIdentity {
  type: CurrencyType;
  label: string;
  short: string;
  description: string;
  /** CSS color token / hex */
  accent: string;
  /** Glyph used by CurrencyCounter when no icon prop is provided */
  glyph: string;
}

export const CURRENCY_IDENTITY: Record<CurrencyType, CurrencyIdentity> = {
  medals: {
    type: "medals",
    label: "Medals",
    short: "M",
    description: "Earned per run. Spent on Warbond stratagem unlocks.",
    accent: "var(--color-accent-yellow, #f5c542)",
    glyph: "★",
  },
  samples: {
    type: "samples",
    label: "Samples",
    short: "S",
    description: "Combat drops. Spent on Ship Modules — passive run upgrades.",
    accent: "var(--color-accent-cyan, #60c4ff)",
    glyph: "◆",
  },
  requisition: {
    type: "requisition",
    label: "Requisition",
    short: "R",
    description: "Earned per run. Spent on cosmetics — capes, titles, banners.",
    accent: "var(--color-accent-orange, #ff8c2a)",
    glyph: "▲",
  },
};

// ──────────────────────────────────────────────────────────────────────
//  Per-objective bonuses (additive to engine reward) — keep modest
// ──────────────────────────────────────────────────────────────────────
export const OBJECTIVE_BONUSES = {
  bossDefeat: { medals: 100, samples: 4, rareSamples: 3 },
  fullClear: { medals: 60, samples: 2 },
  noReinforce: { medals: 40, requisition: 25 },
  speedRun: { medals: 50 },
} as const;

/** Combine a base reward with one or more objective bonuses (additively). */
export function applyBonuses(
  base: RunRewards,
  bonuses: Array<keyof typeof OBJECTIVE_BONUSES>,
): RunRewards {
  let medalsBonus = 0;
  let samplesBonus = 0;
  let rareBonus = 0;
  let reqBonus = 0;
  const labels: string[] = [];
  for (const id of bonuses) {
    const b = OBJECTIVE_BONUSES[id] as Record<string, number>;
    medalsBonus += b.medals ?? 0;
    samplesBonus += b.samples ?? 0;
    rareBonus += b.rareSamples ?? 0;
    reqBonus += b.requisition ?? 0;
    labels.push(id);
  }
  return clampReward({
    ...base,
    medals: base.medals + medalsBonus,
    samples: base.samples + samplesBonus,
    rareSamples: (base.rareSamples ?? 0) + rareBonus,
    superSamples: base.superSamples ?? 0,
    requisition: base.requisition + reqBonus,
    bonusLabel: labels.length ? `BONUS · ${labels.join(" · ")}` : base.bonusLabel,
  });
}

// ──────────────────────────────────────────────────────────────────────
//  Designer guardrail — "is this unlock balanced?"
//  Used by the dev-panel and surfacing badge tags. Pure heuristic.
// ──────────────────────────────────────────────────────────────────────
export type BalanceTag = "fair" | "expensive" | "premium" | "free";

export function balanceTagForCost(cost: { medals?: number; requisition?: number }): BalanceTag {
  const m = cost.medals ?? 0;
  const r = cost.requisition ?? 0;
  if (m === 0 && r === 0) return "free";
  if (m >= 200 || r >= 200) return "premium";
  if (m >= 100 || r >= 100) return "expensive";
  return "fair";
}
