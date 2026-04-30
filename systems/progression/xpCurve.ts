/**
 * PROGRESSION SYSTEM · XP curve + level-up rewards
 * ──────────────────────────────────────────────────────────────────────
 * Single source of truth for the leveling math.
 *
 * Curve:
 *   xpToNextLevel(level) = floor(100 * level^1.35)
 *
 * Result by level (rounded):
 *   1 → 100   2 → 254   3 → 437   5 → 859
 *  10 → 2238 20 → 5640 30 → 9750 50 → 19,200
 *
 * Early levels feel fast (a single combat is a level); late levels require
 * 2–3 runs each. Total XP to L50 ≈ 350k — about 100 runs at average reward.
 *
 * The engine's `applyXp(account, amount)` (lib/account.ts) currently calls
 * its own `xpToLevelUp` — we keep this curve consistent so the manager and
 * the engine agree on the same numbers. If the engine ever wants to swap,
 * `xpToNextLevel(level)` is the canonical formula.
 */

import type { LevelUpReward } from "./progressionTypes";

// ──────────────────────────────────────────────────────────────────────
//  Curve
// ──────────────────────────────────────────────────────────────────────
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(Math.max(1, level), 1.35));
}

/** Cumulative XP required to *reach* the start of `level` from level 1. */
export function totalXpToReachLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

/** Apply a flat XP delta and cascade through level-ups. Pure. */
export function applyXpToProgress(
  level: number,
  xp: number,
  amount: number,
): { level: number; xp: number; levelUps: number[] } {
  let nextLevel = level;
  let nextXp = xp + amount;
  const levelUps: number[] = [];
  while (nextXp >= xpToNextLevel(nextLevel)) {
    nextXp -= xpToNextLevel(nextLevel);
    nextLevel += 1;
    levelUps.push(nextLevel);
  }
  return { level: nextLevel, xp: nextXp, levelUps };
}

/** Returns 0..1 progress through the current level. */
export function levelProgressRatio(level: number, xp: number): number {
  const need = xpToNextLevel(level);
  if (need <= 0) return 0;
  return Math.min(1, Math.max(0, xp / need));
}

// ──────────────────────────────────────────────────────────────────────
//  Level-up rewards table
//  Designer note: every level pays out, but milestone levels (5, 10, 15…)
//  unlock new Warbond pages or grant a free cosmetic. This keeps level-ups
//  consistently exciting without trivializing tension.
// ──────────────────────────────────────────────────────────────────────
const LEVEL_REWARDS: LevelUpReward[] = [
  { level: 2,  medals: 25,  banner: "FIELD CLEARANCE — REINFORCEMENTS APPROVED" },
  { level: 3,  medals: 30 },
  { level: 4,  medals: 40, requisition: 25 },
  { level: 5,  medals: 60, unlocksWarbondPage: "wb_steeled_veterans", banner: "WARBOND UNLOCKED · STEELED VETERANS" },
  { level: 6,  medals: 50 },
  { level: 7,  medals: 60, requisition: 40 },
  { level: 8,  medals: 70 },
  { level: 9,  medals: 80, grantsCosmeticId: "cb_iron_dive", banner: "FIELD COMMENDATION — IRON DIVE CARD BACK GRANTED" },
  { level: 10, medals: 120, unlocksWarbondPage: "wb_democratic_detonation", banner: "WARBOND UNLOCKED · DEMOCRATIC DETONATION" },
  { level: 12, medals: 90, requisition: 60 },
  { level: 15, medals: 150, unlocksWarbondPage: "wb_cutting_edge", banner: "WARBOND UNLOCKED · CUTTING EDGE" },
  { level: 18, medals: 110, grantsCosmeticId: "ban_obsidian", banner: "FIELD COMMENDATION — OBSIDIAN BANNER GRANTED" },
  { level: 20, medals: 200, requisition: 100, unlocksWarbondPage: "wb_polar_patriots", banner: "WARBOND UNLOCKED · POLAR PATRIOTS" },
  { level: 25, medals: 220 },
  { level: 30, medals: 280, unlocksWarbondPage: "wb_servants_of_freedom", banner: "WARBOND UNLOCKED · SERVANTS OF FREEDOM" },
  { level: 40, medals: 380, grantsCosmeticId: "cape_adjudicator", banner: "FIELD COMMENDATION — ADJUDICATOR'S CAPE GRANTED" },
  { level: 50, medals: 500, banner: "RANK MAX — IMMORTAL HELLDIVER STATUS" },
];

export function getLevelUpReward(level: number): LevelUpReward | undefined {
  return LEVEL_REWARDS.find((r) => r.level === level);
}

export function getLevelUpRewards(levels: number[]): LevelUpReward[] {
  return levels.map(getLevelUpReward).filter((r): r is LevelUpReward => !!r);
}

/** All milestones — used by ArmoryScreen tooltips ("Unlocked at L5"). */
export const ALL_LEVEL_REWARDS = LEVEL_REWARDS;

// ──────────────────────────────────────────────────────────────────────
//  Helldiver rank labels — keyed by level breakpoint.
//  We re-export for the LevelBadge component without coupling to lib/account.
// ──────────────────────────────────────────────────────────────────────
export interface RankLabel {
  level: number;
  title: string;
  abbr: string;
}

export const RANK_LABELS: RankLabel[] = [
  { level: 1,  title: "Cadet",          abbr: "CDT" },
  { level: 3,  title: "Reserve",        abbr: "RES" },
  { level: 5,  title: "Sergeant",       abbr: "SGT" },
  { level: 8,  title: "Lieutenant",     abbr: "LT"  },
  { level: 12, title: "Captain",        abbr: "CPT" },
  { level: 16, title: "Major",          abbr: "MAJ" },
  { level: 20, title: "Colonel",        abbr: "COL" },
  { level: 25, title: "Commander",      abbr: "CMD" },
  { level: 30, title: "General",        abbr: "GEN" },
  { level: 40, title: "Marshal",        abbr: "MRSH" },
  { level: 50, title: "Hero of Liberty", abbr: "HERO" },
];

export function rankForLevel(level: number): RankLabel {
  let current = RANK_LABELS[0];
  for (const r of RANK_LABELS) {
    if (level >= r.level) current = r;
  }
  return current;
}
