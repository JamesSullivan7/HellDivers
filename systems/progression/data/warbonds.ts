/**
 * PROGRESSION SYSTEM · Warbond data
 * ──────────────────────────────────────────────────────────────────────
 * Warbonds are pages of unlockable items — primarily stratagem cards but
 * also cosmetics + titles. Pages unlock with account level; individual
 * items inside have their own medal cost and (sometimes) level gate.
 *
 * Item refIds map to:
 *   - stratagems → lib/cards.ts CARD_LIBRARY ids
 *   - cosmetics  → either lib/cosmetics.ts CAPES/TITLES ids OR ids in
 *                  systems/progression/data/cosmetics.ts (banners + cardbacks)
 *
 * The manager handles the indirection — UI just consumes WarbondItem.
 */

import type { WarbondPage } from "../progressionTypes";

export const WARBOND_PAGES: WarbondPage[] = [
  // ── HELLDIVERS' MOBILIZE ───────────────────────────────────────────
  {
    id: "wb_helldivers_mobilize",
    name: "Helldivers Mobilize",
    blurb: "Standard issue stratagems for new recruits.",
    tier: 1,
    levelRequired: 1,
    items: [
      {
        id: "wbi_orbital_precision",
        name: "Orbital Precision Strike",
        type: "stratagem",
        refId: "orbital_precision",
        description: "Single-target orbital. 6 damage. Reliable opener.",
        cost: { medals: 60 },
        rarity: "common",
        flavor: "Cheap, accurate, ubiquitous.",
      },
      {
        id: "wbi_eagle_airstrike",
        name: "Eagle Airstrike",
        type: "stratagem",
        refId: "eagle_airstrike",
        description: "5 damage to all enemies.",
        cost: { medals: 60 },
        rarity: "common",
      },
      {
        id: "wbi_sentry_mg",
        name: "MG Sentry",
        type: "stratagem",
        refId: "sentry_mg",
        description: "Random 3 damage / turn for 4 turns.",
        cost: { medals: 60 },
        rarity: "common",
      },
    ],
  },

  // ── STEELED VETERANS (L5) ──────────────────────────────────────────
  {
    id: "wb_steeled_veterans",
    name: "Steeled Veterans",
    blurb: "Heavier stratagems forged for seasoned divers.",
    tier: 2,
    levelRequired: 5,
    items: [
      {
        id: "wbi_orbital_railcannon",
        name: "Orbital Railcannon Strike",
        type: "stratagem",
        refId: "orbital_railcannon",
        description: "30 damage to highest-HP target. Ignores armor.",
        cost: { medals: 250 },
        levelRequired: 5,
        rarity: "rare",
        flavor: "When subtlety fails — apply tungsten.",
      },
      {
        id: "wbi_support_eat",
        name: "EAT-17 Expendable",
        type: "stratagem",
        refId: "support_eat",
        description: "Free 10-damage shot. Exhausts.",
        cost: { medals: 60 },
        rarity: "common",
      },
      {
        id: "wbi_title_veteran",
        name: "Title — VETERAN",
        type: "title",
        refId: "title_veteran",
        description: "Earned title displayed beside callsign.",
        cost: { requisition: 100 },
        levelRequired: 5,
        rarity: "uncommon",
      },
    ],
  },

  // ── DEMOCRATIC DETONATION (L10) ────────────────────────────────────
  {
    id: "wb_democratic_detonation",
    name: "Democratic Detonation",
    blurb: "Explosive ordnance suite. Liberty through firepower.",
    tier: 3,
    levelRequired: 10,
    items: [
      {
        id: "wbi_eagle_500kg",
        name: "Eagle 500kg Bomb",
        type: "stratagem",
        refId: "eagle_500kg",
        description: "Massive single-target damage.",
        cost: { medals: 250 },
        levelRequired: 10,
        rarity: "rare",
        flavor: "Subtlety is for cowards.",
      },
      {
        id: "wbi_eagle_cluster",
        name: "Eagle Cluster Bomb",
        type: "stratagem",
        refId: "eagle_cluster",
        description: "Spread damage to all enemies.",
        cost: { medals: 120 },
        rarity: "uncommon",
      },
      {
        id: "wbi_cape_demolition",
        name: "Demolition Crew Cape",
        type: "cosmetic",
        refId: "cape_demolition",
        description: "Soot-blackened cape. Worn by veterans of Heeth.",
        cost: { requisition: 150 },
        levelRequired: 10,
        rarity: "uncommon",
      },
    ],
  },

  // ── CUTTING EDGE (L15) ─────────────────────────────────────────────
  {
    id: "wb_cutting_edge",
    name: "Cutting Edge",
    blurb: "Experimental energy-tech stratagems.",
    tier: 4,
    levelRequired: 15,
    items: [
      {
        id: "wbi_orbital_laser",
        name: "Orbital Laser",
        type: "stratagem",
        refId: "orbital_laser",
        description: "Sustained beam — multi-turn AOE damage.",
        cost: { medals: 250 },
        levelRequired: 15,
        rarity: "rare",
      },
      {
        id: "wbi_arc_thrower",
        name: "ARC-3 Arc Thrower",
        type: "stratagem",
        refId: "support_arc_thrower",
        description: "Chain lightning — bounces between enemies.",
        cost: { medals: 250 },
        levelRequired: 15,
        rarity: "rare",
        flavor: "Conducts liberty across multiple targets.",
      },
      {
        id: "wbi_cardback_arc",
        name: "Card Back — ARC TRACE",
        type: "cardback",
        refId: "cb_arc_trace",
        description: "Animated lightning lattice on card backs.",
        cost: { requisition: 200 },
        levelRequired: 15,
        rarity: "rare",
      },
    ],
  },

  // ── POLAR PATRIOTS (L20) ───────────────────────────────────────────
  {
    id: "wb_polar_patriots",
    name: "Polar Patriots",
    blurb: "Cold-world deployment kit. Ice doesn't slow Liberty.",
    tier: 5,
    levelRequired: 20,
    items: [
      {
        id: "wbi_eagle_smoke",
        name: "Eagle Smoke Strike",
        type: "stratagem",
        refId: "eagle_smoke",
        description: "Conceals helldivers — reduces incoming damage 1 turn.",
        cost: { medals: 120 },
        rarity: "uncommon",
      },
      {
        id: "wbi_banner_polar",
        name: "Polar Banner",
        type: "banner",
        refId: "ban_polar",
        description: "Aurora-trimmed profile banner.",
        cost: { requisition: 200 },
        levelRequired: 20,
        rarity: "rare",
      },
    ],
  },

  // ── SERVANTS OF FREEDOM (L30) ──────────────────────────────────────
  {
    id: "wb_servants_of_freedom",
    name: "Servants of Freedom",
    blurb: "End-game stratagems for Marshals and above.",
    tier: 6,
    levelRequired: 30,
    items: [
      {
        id: "wbi_orbital_walking_barrage",
        name: "Orbital Walking Barrage",
        type: "stratagem",
        refId: "orbital_walking_barrage",
        description: "Sweeping multi-turn AOE bombardment.",
        cost: { medals: 350 },
        levelRequired: 30,
        rarity: "legendary",
        flavor: "An empire's apology, delivered ballistically.",
      },
      {
        id: "wbi_title_marshal",
        name: "Title — MARSHAL",
        type: "title",
        refId: "title_marshal",
        description: "Reserved for divers above Level 30.",
        cost: { requisition: 300 },
        levelRequired: 30,
        rarity: "legendary",
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────
export function getWarbondPage(id: string) {
  return WARBOND_PAGES.find((p) => p.id === id);
}

export function findWarbondItem(itemId: string) {
  for (const p of WARBOND_PAGES) {
    const item = p.items.find((i) => i.id === itemId);
    if (item) return { page: p, item };
  }
  return undefined;
}

/** All warbond items flattened — convenient for searches. */
export function allWarbondItems() {
  return WARBOND_PAGES.flatMap((p) => p.items.map((item) => ({ page: p, item })));
}
