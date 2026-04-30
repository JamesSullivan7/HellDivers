/**
 * PROGRESSION SYSTEM · Cosmetics data (NEW catalog)
 * ──────────────────────────────────────────────────────────────────────
 * The engine already owns `CAPES` + `TITLES` in lib/cosmetics.ts. This
 * module adds NEW cosmetic categories that didn't exist before:
 *
 *   - banners   (profile / lobby strip art)
 *   - cardbacks (custom back-of-card art shown when face-down)
 *   - shipnames (named destroyer pre-fixes)
 *
 * It also re-publishes capes + titles in the rich `CosmeticDef` shape so a
 * single typed surface drives the new UnlockRevealModal + WarbondGrid.
 *
 * Cosmetics never affect gameplay. They only drive UI identity.
 */

import type { CosmeticDef } from "../progressionTypes";

// ──────────────────────────────────────────────────────────────────────
//  CAPES — re-projected from lib/cosmetics.ts CAPES + new entries
//  (cape ids that already exist in lib/cosmetics.ts MUST keep the same id
//   so unlocking flows continue to mark them in account.unlockedCapes)
// ──────────────────────────────────────────────────────────────────────
export const CAPE_DEFS: CosmeticDef[] = [
  { id: "patriot_yellow", type: "cape", name: "Patriot",      description: "Standard Helldiver yellow. Default issue.",         rarity: "common",    cost: {},                       accent: "#F1D434", gradient: "from-helldiver-yellow to-yellow-600",  flavor: "Standard issue. Earned by being deployed." },
  { id: "freedom_red",    type: "cape", name: "Freedom",      description: "Crimson trim. Worn by veterans of Malevelon Creek.", rarity: "uncommon",  cost: { requisition: 80 },      accent: "#C8302F", gradient: "from-helldiver-red to-red-800" },
  { id: "snowfall_white", type: "cape", name: "Snowfall",     description: "Arctic camouflage. Cold-world deployments.",         rarity: "uncommon",  cost: { requisition: 80 },      accent: "#FFFFFF", gradient: "from-white to-gray-300" },
  { id: "jungle_green",   type: "cape", name: "Jungle Op",    description: "Forest infiltration pattern.",                       rarity: "uncommon",  cost: { requisition: 100 },     accent: "#10B981", gradient: "from-emerald-500 to-emerald-800" },
  { id: "voidcloth_purple", type: "cape", name: "Voidcloth",  description: "Illuminate-resistant weave with phase shimmer.",     rarity: "rare",      cost: { requisition: 150 },     accent: "#A855F7", gradient: "from-purple-500 to-fuchsia-800" },
  { id: "monochrome",     type: "cape", name: "Monochrome",   description: "Stripped, ash-colored field cape.",                  rarity: "uncommon",  cost: { requisition: 90 },      accent: "#9CA3AF", gradient: "from-gray-400 to-gray-700" },
  { id: "cape_demolition", type: "cape", name: "Demolition Crew", description: "Soot-blackened cape from veterans of Heeth.",     rarity: "rare",      cost: { requisition: 150 },     accent: "#3F2A14", gradient: "from-stone-700 to-amber-900", levelRequired: 10 },
  { id: "cape_eagle",     type: "cape", name: "Eagle's Wing", description: "Iridescent blue with a stylized Eagle silhouette.",   rarity: "rare",      cost: { requisition: 180 },     accent: "#2563EB", gradient: "from-sky-500 to-blue-900", levelRequired: 12 },
  { id: "cape_adjudicator", type: "cape", name: "Adjudicator", description: "Granted to Marshals. Liberty-gold binding.",         rarity: "legendary", cost: {},                       accent: "#F5C542", gradient: "from-amber-400 to-amber-800", levelRequired: 40, flavor: "Awarded — never sold." },
];

// ──────────────────────────────────────────────────────────────────────
//  TITLES — re-projected + new tier-gated titles
// ──────────────────────────────────────────────────────────────────────
export const TITLE_DEFS: CosmeticDef[] = [
  { id: "title_recruit",    type: "title", name: "RECRUIT",        description: "Default cadet title.",                          rarity: "common",   cost: {} },
  { id: "title_defender",   type: "title", name: "DEFENDER",       description: "For first liberation contributor.",            rarity: "common",   cost: { requisition: 50 } },
  { id: "title_veteran",    type: "title", name: "VETERAN",        description: "Awarded at Sergeant rank.",                    rarity: "uncommon", cost: { requisition: 100 }, levelRequired: 5 },
  { id: "title_eagle",      type: "title", name: "EAGLE-1",        description: "Bestowed on top air-strike specialists.",      rarity: "uncommon", cost: { requisition: 120 }, levelRequired: 8 },
  { id: "title_breaker",    type: "title", name: "ARMOR BREAKER",  description: "10 elite kills with armor-piercing strats.",   rarity: "uncommon", cost: { requisition: 120 }, levelRequired: 10 },
  { id: "title_commander",  type: "title", name: "COMMANDER",      description: "For Captains and above.",                      rarity: "rare",     cost: { requisition: 200 }, levelRequired: 12 },
  { id: "title_marshal",    type: "title", name: "MARSHAL",        description: "Reserved for divers above Level 30.",          rarity: "legendary", cost: { requisition: 300 }, levelRequired: 30 },
  { id: "title_immortal",   type: "title", name: "IMMORTAL",       description: "Liberty's chosen. Never falls.",               rarity: "legendary", cost: { requisition: 500 }, levelRequired: 50 },
  { id: "title_extractor",  type: "title", name: "EXTRACTOR",      description: "10 successful extractions — no reinforcements.", rarity: "rare",   cost: { requisition: 220 }, levelRequired: 15 },
  { id: "title_terminid",   type: "title", name: "TERMINID HUNTER", description: "Specialist on bug fronts.",                   rarity: "uncommon", cost: { requisition: 100 } },
  { id: "title_servant",    type: "title", name: "SERVANT OF FREEDOM", description: "Earned through Servants of Freedom warbond.", rarity: "legendary", cost: { requisition: 350 }, levelRequired: 30 },
];

// ──────────────────────────────────────────────────────────────────────
//  BANNERS — profile / hub strip art
// ──────────────────────────────────────────────────────────────────────
export const BANNER_DEFS: CosmeticDef[] = [
  { id: "ban_default",  type: "banner", name: "Standard",       description: "Yellow-and-black hazard stripe.",     rarity: "common",   cost: {},                accent: "#F5C542", gradient: "from-yellow-500 to-zinc-900" },
  { id: "ban_red_alert", type: "banner", name: "Red Alert",     description: "Crimson alarm pattern.",              rarity: "uncommon", cost: { requisition: 80 }, accent: "#C8302F", gradient: "from-red-600 to-zinc-900" },
  { id: "ban_polar",    type: "banner", name: "Polar",          description: "Aurora trim with cold-world icons.",  rarity: "rare",     cost: { requisition: 200 }, accent: "#60C4FF", gradient: "from-cyan-400 to-blue-900",   levelRequired: 20 },
  { id: "ban_obsidian", type: "banner", name: "Obsidian",       description: "Black on black. Granted at L18.",     rarity: "rare",     cost: {},                 accent: "#1F2937", gradient: "from-zinc-800 to-black",       levelRequired: 18, flavor: "Granted — never sold." },
  { id: "ban_legion",   type: "banner", name: "Legion",         description: "Roman-numeral century markers.",      rarity: "legendary", cost: { requisition: 400 }, accent: "#F59E0B", gradient: "from-amber-500 to-stone-900",  levelRequired: 25 },
];

// ──────────────────────────────────────────────────────────────────────
//  CARD BACKS — back-of-card art for hand + deck
// ──────────────────────────────────────────────────────────────────────
export const CARDBACK_DEFS: CosmeticDef[] = [
  { id: "cb_standard",  type: "cardback", name: "Standard Issue", description: "Liberty crest on yellow.",         rarity: "common",   cost: {},                  accent: "#F5C542" },
  { id: "cb_iron_dive", type: "cardback", name: "Iron Dive",      description: "Pressed-steel embossed crest.",    rarity: "rare",     cost: {},                  accent: "#9CA3AF", levelRequired: 9, flavor: "Granted at Level 9." },
  { id: "cb_arc_trace", type: "cardback", name: "Arc Trace",      description: "Animated lightning lattice.",      rarity: "rare",     cost: { requisition: 200 }, accent: "#60C4FF", levelRequired: 15 },
  { id: "cb_terminid",  type: "cardback", name: "Terminid Trophy", description: "Stylized chitin trophy plate.",   rarity: "uncommon", cost: { requisition: 120 }, accent: "#10B981" },
];

// ──────────────────────────────────────────────────────────────────────
//  SHIP NAMES — destroyer prefixes
// ──────────────────────────────────────────────────────────────────────
export const SHIPNAME_DEFS: CosmeticDef[] = [
  { id: "sn_freedom",    type: "shipname", name: "S.E.S. Sword of Freedom",     description: "Default destroyer name.",     rarity: "common",   cost: {} },
  { id: "sn_democracy",  type: "shipname", name: "S.E.S. Hammer of Democracy",  description: "Earned with first victory.",  rarity: "uncommon", cost: { requisition: 100 } },
  { id: "sn_liberty",    type: "shipname", name: "S.E.S. Pillar of Liberty",    description: "Awarded at Captain rank.",    rarity: "rare",     cost: { requisition: 250 }, levelRequired: 12 },
];

// ──────────────────────────────────────────────────────────────────────
//  Aggregate catalog
// ──────────────────────────────────────────────────────────────────────
export const ALL_COSMETICS: CosmeticDef[] = [
  ...CAPE_DEFS,
  ...TITLE_DEFS,
  ...BANNER_DEFS,
  ...CARDBACK_DEFS,
  ...SHIPNAME_DEFS,
];

export function getCosmeticDef(id: string): CosmeticDef | undefined {
  return ALL_COSMETICS.find((c) => c.id === id);
}

export function cosmeticsByType(type: CosmeticDef["type"]): CosmeticDef[] {
  return ALL_COSMETICS.filter((c) => c.type === type);
}
