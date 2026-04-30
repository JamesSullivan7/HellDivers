/**
 * PROGRESSION SYSTEM · types
 * ──────────────────────────────────────────────────────────────────────
 * The progression layer wraps the engine's existing `Account` (lib/account.ts)
 * with a *richer designer-facing data model* and a transient UX state for
 * unlock-reveal modals, post-run summaries, and notification feeds.
 *
 * Design rule:
 *   - The engine's `Account` remains the persistence source of truth.
 *   - This module never duplicates that state — it derives PlayerProfile
 *     views from it and exposes a clean typed API for new screens.
 *   - All new cosmetic categories (banners, card backs, ship names)
 *     extend `Account` lazily via the manager (additive only).
 */

import type { Faction } from "@/lib/types";

// ──────────────────────────────────────────────────────────────────────
//  Currency model
// ──────────────────────────────────────────────────────────────────────
export type CurrencyType = "medals" | "samples" | "requisition";

export interface CurrencyTotals {
  medals: number;
  /** Total sample count — sum of common + rare + super for UI display. */
  samples: number;
  /** Optional breakdown, used when the UI wants to show all 3 sample tiers. */
  samplesBreakdown?: {
    common: number;
    rare: number;
    super: number;
  };
  requisition: number;
}

// ──────────────────────────────────────────────────────────────────────
//  PlayerProfile — unified view of the persistent account
// ──────────────────────────────────────────────────────────────────────
export interface PlayerProfile {
  id: string;
  callsign: string;
  level: number;
  xp: number;
  xpToNextLevel: number;

  currencies: CurrencyTotals;

  unlockedStratagems: string[];   // alias: unlockedCards
  unlockedModules: string[];
  unlockedCosmetics: string[];    // union of capes + titles + banners + cardBacks

  equippedCosmetics: {
    capeId: string;
    titleId: string;
    bannerId?: string;
    cardBackId?: string;
    shipNameId?: string;
  };

  missionHistory: MissionRecord[];
}

// ──────────────────────────────────────────────────────────────────────
//  Mission history — richer than RunRecord
// ──────────────────────────────────────────────────────────────────────
export interface MissionRecord {
  id: string;
  /** ISO date string for stable display. */
  date: string;
  planet: string;
  faction: Faction;
  difficulty: number;
  result: "victory" | "defeat";
  bossDefeated?: string;
  rewards: {
    xp: number;
    medals: number;
    samples: number;
    requisition: number;
  };
  cardsUsed: string[];
  durationSeconds: number;
}

// ──────────────────────────────────────────────────────────────────────
//  Warbond — pages of unlockables grouped thematically
// ──────────────────────────────────────────────────────────────────────
export type WarbondItemKind = "stratagem" | "cosmetic" | "title" | "banner" | "cardback";

export interface WarbondItem {
  id: string;
  name: string;
  type: WarbondItemKind;
  /** When this is a stratagem, the stratagem id from lib/cards.ts. */
  refId?: string;
  description: string;
  cost: {
    medals?: number;
    requisition?: number;
  };
  levelRequired?: number;
  /** Designer-set rarity — drives card border + unlock cinematic intensity. */
  rarity: "common" | "uncommon" | "rare" | "legendary";
  /** Free text for tooltip footer. */
  flavor?: string;
}

export interface WarbondPage {
  id: string;
  name: string;
  blurb: string;
  /** Faction theme — drives accent color. Optional. */
  faction?: Faction;
  /** Tier 1..n — pages unlock sequentially with level/medals. */
  tier: number;
  /** Account level required to *open* this page (items inside may have own gates). */
  levelRequired: number;
  items: WarbondItem[];
}

// ──────────────────────────────────────────────────────────────────────
//  Ship Modules — richer than the existing engine type
// ──────────────────────────────────────────────────────────────────────
export type ShipModuleCategory =
  | "eagle"
  | "orbital"
  | "sentry"
  | "support"
  | "logistics"
  | "shield"
  | "rest";

export interface ShipModuleDef {
  id: string;                 // matches Account.unlockedModules entry
  name: string;
  description: string;
  category: ShipModuleCategory;
  /** Sample cost split — most modules cost commons; rare ones cost rares too. */
  cost: {
    samples: number;
    rareSamples?: number;
    superSamples?: number;
  };
  levelRequired?: number;
  /** Short flavor banner used on the module card */
  flavor?: string;
  /** Tier 1..3 controls accent + sort order */
  tier: 1 | 2 | 3;
}

// ──────────────────────────────────────────────────────────────────────
//  Cosmetics catalog — rich definitions (banners + card backs are new)
// ──────────────────────────────────────────────────────────────────────
export type CosmeticType = "cape" | "title" | "banner" | "cardback" | "shipname";

export type CosmeticRarity = "common" | "uncommon" | "rare" | "legendary";

export interface CosmeticDef {
  id: string;
  type: CosmeticType;
  name: string;
  description: string;
  rarity: CosmeticRarity;
  cost: {
    medals?: number;
    requisition?: number;
  };
  levelRequired?: number;
  /** Hex color for swatch + preview accent. */
  accent?: string;
  /** Tailwind gradient class for capes / banners. */
  gradient?: string;
  /** Flavor text shown in the preview footer. */
  flavor?: string;
}

// ──────────────────────────────────────────────────────────────────────
//  Run rewards (post-mission payout) — input to ProgressionManager.claim
// ──────────────────────────────────────────────────────────────────────
export interface RunRewards {
  xp: number;
  medals: number;
  samples: number;          // counted as common
  rareSamples?: number;
  superSamples?: number;
  requisition: number;
  /** Optional bonus banner — shown above the totals row. */
  bonusLabel?: string;
}

// ──────────────────────────────────────────────────────────────────────
//  Notifications / unlock reveals
// ──────────────────────────────────────────────────────────────────────
export type UnlockKind =
  | "level_up"
  | "stratagem"
  | "ship_module"
  | "cosmetic"
  | "warbond_page"
  | "title";

export interface UnlockNotification {
  id: string;
  kind: UnlockKind;
  /** Human-readable headline ("LEVEL 12 ACHIEVED"). */
  headline: string;
  /** Optional sub-text ("Sergeant — new Warbond available"). */
  subhead?: string;
  /** id of the unlocked thing — stratagem id, module id, cosmetic id, etc. */
  refId?: string;
  rarity?: CosmeticRarity;
  /** Wall-clock when the notification was queued. */
  at: number;
  /** Whether the user has dismissed/seen the cinematic reveal. */
  viewed: boolean;
}

// ──────────────────────────────────────────────────────────────────────
//  Level-up rewards table (consumed by xpCurve.getLevelUpRewards)
// ──────────────────────────────────────────────────────────────────────
export interface LevelUpReward {
  level: number;
  medals?: number;
  requisition?: number;
  /** Optional warbond page id that opens at this level. */
  unlocksWarbondPage?: string;
  /** Optional cosmetic granted ("free" unlock at this level). */
  grantsCosmeticId?: string;
  /** Designer note for the level-up banner. */
  banner?: string;
}
