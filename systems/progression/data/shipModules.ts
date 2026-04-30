/**
 * PROGRESSION SYSTEM · Ship Modules data
 * ──────────────────────────────────────────────────────────────────────
 * Rich definitions for the 8 ship modules that already exist on
 * `lib/account.ts::SHIP_MODULES`. We don't duplicate identity (the engine
 * still drives unlock state via `account.unlockedModules`); we add the
 * designer metadata the Armory + run-setup screens need:
 *
 *   - category (eagle / orbital / sentry / support / logistics / shield / rest)
 *   - tier (1..3) drives accent + sort
 *   - levelRequired
 *   - sample-cost split (commons vs rares vs supers)
 *   - flavor
 *
 * Module ids match the engine SHIP_MODULES so unlocking via this layer
 * also satisfies the engine's gameplay checks (e.g. `vitamin_d3`).
 */

import type { ShipModuleDef } from "../progressionTypes";

export const SHIP_MODULE_DEFS: ShipModuleDef[] = [
  // ── EAGLE ──────────────────────────────────────────────────────────
  {
    id: "eagle_storm",
    name: "Eagle Storm Rearm",
    description: "Eagle stratagems deal +1 damage.",
    category: "eagle",
    cost: { samples: 250 },
    levelRequired: 3,
    tier: 1,
    flavor: "Strafe runs come in tighter, hotter, and more frequent.",
  },

  // ── ORBITAL ────────────────────────────────────────────────────────
  {
    id: "orbital_targeting",
    name: "Targeting Software",
    description: "Orbital stratagems deal +1 damage.",
    category: "orbital",
    cost: { samples: 250 },
    levelRequired: 3,
    tier: 1,
    flavor: "Sub-millisecond firing solutions. Liberty-grade math.",
  },

  // ── SENTRY ─────────────────────────────────────────────────────────
  {
    id: "sentry_calibration",
    name: "Sentry Calibration",
    description: "Sentry damage +1 per tick.",
    category: "sentry",
    cost: { samples: 300 },
    levelRequired: 5,
    tier: 1,
    flavor: "Every spent round educates a citizen.",
  },

  // ── LOGISTICS ──────────────────────────────────────────────────────
  {
    id: "hellpod_storage",
    name: "Hellpod Optimization",
    description: "+1 max Requisition each combat.",
    category: "logistics",
    cost: { samples: 400 },
    levelRequired: 4,
    tier: 2,
  },
  {
    id: "streamlined_launch",
    name: "Streamlined Launch Process",
    description: "+1 hand size each combat.",
    category: "logistics",
    cost: { samples: 500, rareSamples: 4 },
    levelRequired: 8,
    tier: 2,
  },

  // ── SUPPORT ────────────────────────────────────────────────────────
  {
    id: "plasma_cutters",
    name: "Plasma Cutters",
    description: "Support weapons deal +1 damage.",
    category: "support",
    cost: { samples: 250 },
    levelRequired: 4,
    tier: 1,
  },

  // ── SHIELD / TUNING ────────────────────────────────────────────────
  {
    id: "ammunition_priming",
    name: "Liquid-Fueled Engines",
    description: "Stratagem effects +5%.",
    category: "shield",
    cost: { samples: 350, rareSamples: 2 },
    levelRequired: 7,
    tier: 2,
    flavor: "Burn-rate up; dignity up; democracy up.",
  },

  // ── REST / SURVIVAL ────────────────────────────────────────────────
  {
    id: "vitamin_d3",
    name: "Vitamin D3 Supplements",
    description: "Start each run with +20 max HP.",
    category: "rest",
    cost: { samples: 400, rareSamples: 5 },
    levelRequired: 6,
    tier: 2,
    flavor: "Sunlight is a war material.",
  },
];

// ──────────────────────────────────────────────────────────────────────
//  Lookups
// ──────────────────────────────────────────────────────────────────────
export function getShipModuleDef(id: string) {
  return SHIP_MODULE_DEFS.find((m) => m.id === id);
}

export function shipModulesByCategory(category: ShipModuleDef["category"]) {
  return SHIP_MODULE_DEFS.filter((m) => m.category === category);
}
