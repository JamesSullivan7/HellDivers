import type { Faction, NodeType } from "./types";

/**
 * Procedural per-node atmosphere lines. Picked at tree generation time and
 * stored on `MapNode.flavor`, surfaced in the map tooltip and on combat entry
 * for that dungeon-crawler mood.
 */

const CACHE_FLAVOR = [
  "A buried hellpod cracked open. Loot scattered in the dirt.",
  "Ration crate, half-buried, seal still intact.",
  "Abandoned Helldiver pack — owner not present.",
  "Resupply container venting cold steam.",
];
const HAZARD_FLAVOR = [
  "The ground here glistens. Something corrosive.",
  "Atmospheric anomaly. Compass spins. Stay alert.",
  "Toxic ground sample. Watch your step.",
  "Pressure pocket. Step wrong and the air bites you.",
];
const SIGNAL_FLAVOR = [
  "An old SEAF beacon. Still pinging. Reveals nearby contacts.",
  "Comms array, unattended. You can pull a sector scan.",
  "Long-range scout terminal. Up the data — see what's ahead.",
  "Hellpod uplink, still warm. Patch in.",
];

const FLAVOR: Record<NodeType, Record<Faction, string[]>> = {
  combat: {
    terminid: [
      "Pheromone trails crisscross the dirt. Something's been hunting in pairs.",
      "The chitter of mandibles drifts up from a fissure in the rock.",
      "A fresh kill — Helldiver gear, gnawed open. Recent.",
      "Spore blooms hang in the air. Visibility drops to a few meters.",
      "Tunnel exit. A warm draft pushes hive-musk into your face.",
      "Acid-etched bones piled in a circle. The ground is sticky.",
    ],
    automaton: {
      0: [],
      1: [],
      2: [],
    } as any, // sentinel so we can replace
    illuminate: {
      0: [],
    } as any,
  } as any,
  elite: {
    terminid: [
      "Heavy footfalls — armored. The dirt shakes when it moves.",
      "Larger pheromone cluster. A breeder. Bring everything.",
      "Charger tracks. Two tons of bug, point-blank threat.",
    ],
    automaton: [],
    illuminate: [],
  } as any,
  rest: {
    terminid: [
      "A shallow ravine, defensible enough. Field rations and a pull of water.",
      "Hellpod-marked extraction beacon. Brief respite.",
      "A pocket of breathable air clear of spores. Catch your breath.",
    ],
    automaton: [],
    illuminate: [],
  } as any,
  event: {
    terminid: [
      "Something off the path. Worth investigating?",
      "An anomaly — Super Earth Science Division would want to know.",
      "Movement on the comms. Friendly? Hostile?",
    ],
    automaton: [],
    illuminate: [],
  } as any,
  shop: {
    terminid: [
      "Smoke from a salvager's fire. Someone's set up shop in the dead zone.",
      "A grizzled vet under a tarp, surrounded by salvaged crates.",
      "A black-market vendor flags you down. Cash only.",
    ],
    automaton: [],
    illuminate: [],
  } as any,
  boss: {
    terminid: [
      "The hive's heart. A primal scream answers your hellpod from the canyon below.",
      "Acid mist boils up from a crater two football fields wide. You hear it breathing.",
    ],
    automaton: [
      "Factory complex ahead. The horizon flickers with arc-welder light.",
      "A tower of plate steel rises out of the dust. The march of feet shakes the ground.",
    ],
    illuminate: [
      "A Leviathan mothership darkens the sky. Tractor-beam columns scour the ground.",
      "The horizon ripples with phase-shield light. The leviathan is here.",
    ],
  } as any,
  cache: { terminid: [], automaton: [], illuminate: [] } as any,
  hazard: { terminid: [], automaton: [], illuminate: [] } as any,
  signal: { terminid: [], automaton: [], illuminate: [] } as any,
};

// Manually fill the three factions for the four most common types.
const COMBAT_AUTO = [
  "Burned-out Helldiver hellpod, scorched matte black. The bots passed through here.",
  "Rifle reports echo in the canyon — single shots, mechanical cadence.",
  "Trooper boot prints, one set, then six sets converging.",
  "A pile of melted slag where a sentry used to be.",
  "Static crackles on the open frequency. Comms have been jammed.",
  "The horizon glows orange — a fab is venting heat nearby.",
];
const COMBAT_ILL = [
  "The colors are wrong here. Reds where there shouldn't be reds.",
  "A low harmonic vibrates in your fillings. Something's resonating.",
  "Voteless prints in the dust. They walk in unison.",
  "A floating watcher drifted past, spotting nothing — yet.",
  "The temperature drops ten degrees in the span of a step.",
  "A standing stone hums. You don't remember it being there a moment ago.",
];

const ELITE_AUTO = [
  "Heavy chassis tracks — Devastator-class. Ammo: heavy.",
  "A Hulk silhouette breaches the smoke ahead. Plant feet.",
  "Plate armor glints between trees. Two of them, at least.",
];
const ELITE_ILL = [
  "An Overseer hovers, pulsing orange. Eyes turn toward you.",
  "A Harvester kneels in a meadow, cooking the grass black.",
  "The Voteless are all looking the same direction. So is the Watcher above them.",
];

const REST_AUTO = [
  "Abandoned bot bunker. Power's cycled. You take ten.",
  "Wrecked transport, tarps still up. Field-strip ammo, eat.",
  "Cooled fabricator carcass. Quiet. Defensible.",
];
const REST_ILL = [
  "An eerily symmetrical clearing. The geometry is too clean. But empty.",
  "Hellpod safety beacon, still pinging. Sit. Drink something.",
  "A shoulder of rock breaks the wind. Brief calm.",
];

const EVENT_AUTO = [
  "A still-warm bot terminal. The screen is asking a question.",
  "An Eagle pilot's beacon flashing in the trees.",
  "Smoke on the ridge — could be an opportunity.",
];
const EVENT_ILL = [
  "A tear in the air. It seems to be considering you.",
  "A shrine the Voteless have been tending. They are not here right now.",
  "An obelisk pulses in time with your heart.",
];

const SHOP_AUTO = [
  "An ex-Engineer with a scorched Hellpod and a side-business.",
  "A salvager perched on bot wreckage, hawking parts.",
  "Black market terminal blinks orange. \"Cash only, diver.\"",
];
const SHOP_ILL = [
  "A figure in shielded armor selling things you didn't think you could buy.",
  "A scavenger has set up under a phase-storm shield. They smile too widely.",
  "Static-burned vendor with stim packs and questions.",
];

// Replace the sentinel placeholders with real arrays.
(FLAVOR.combat as any).automaton = COMBAT_AUTO;
(FLAVOR.combat as any).illuminate = COMBAT_ILL;
(FLAVOR.elite as any).automaton = ELITE_AUTO;
(FLAVOR.elite as any).illuminate = ELITE_ILL;
(FLAVOR.rest as any).automaton = REST_AUTO;
(FLAVOR.rest as any).illuminate = REST_ILL;
(FLAVOR.event as any).automaton = EVENT_AUTO;
(FLAVOR.event as any).illuminate = EVENT_ILL;
(FLAVOR.shop as any).automaton = SHOP_AUTO;
(FLAVOR.shop as any).illuminate = SHOP_ILL;

// Fill cache/hazard/signal pools for all factions (faction-agnostic copy).
(FLAVOR.cache as any).terminid = CACHE_FLAVOR;
(FLAVOR.cache as any).automaton = CACHE_FLAVOR;
(FLAVOR.cache as any).illuminate = CACHE_FLAVOR;
(FLAVOR.hazard as any).terminid = HAZARD_FLAVOR;
(FLAVOR.hazard as any).automaton = HAZARD_FLAVOR;
(FLAVOR.hazard as any).illuminate = HAZARD_FLAVOR;
(FLAVOR.signal as any).terminid = SIGNAL_FLAVOR;
(FLAVOR.signal as any).automaton = SIGNAL_FLAVOR;
(FLAVOR.signal as any).illuminate = SIGNAL_FLAVOR;

export function rollNodeFlavor(type: NodeType, faction: Faction): string {
  const pool: string[] = (FLAVOR as any)[type]?.[faction] ?? [];
  if (pool.length === 0) {
    // graceful default
    return type === "boss"
      ? "The primary objective looms ahead."
      : type === "rest"
        ? "Brief respite. Catch your breath."
        : type === "shop"
          ? "A vendor under a tarp, salvaging on the side."
          : type === "event"
            ? "Something off the path."
            : type === "cache"
              ? "Salvage in the dirt."
              : type === "hazard"
                ? "Something corrosive on the ground."
                : type === "signal"
                  ? "A working comms array. You can scan ahead."
                  : "Motion ahead. Lock and load.";
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
