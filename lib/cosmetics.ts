export interface Cape {
  id: string;
  name: string;
  description: string;
  cost: number;
  colorClass: string; // tailwind bg gradient class
  hexAccent: string;  // raw hex for inline styles
}

export interface Title {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export const CAPES: Cape[] = [
  {
    id: "patriot_yellow",
    name: "Patriot",
    description: "Standard Helldiver yellow. Default issue.",
    cost: 0,
    colorClass: "from-helldiver-yellow to-yellow-600",
    hexAccent: "#F1D434",
  },
  {
    id: "freedom_red",
    name: "Freedom",
    description: "Crimson trim. Worn by veterans of Malevelon Creek.",
    cost: 0,
    colorClass: "from-helldiver-red to-red-800",
    hexAccent: "#C8302F",
  },
  {
    id: "snowfall_white",
    name: "Snowfall",
    description: "Arctic camouflage. Cold-world deployments.",
    cost: 0,
    colorClass: "from-white to-gray-300",
    hexAccent: "#FFFFFF",
  },
  {
    id: "jungle_green",
    name: "Jungle Op",
    description: "Forest infiltration pattern.",
    cost: 50,
    colorClass: "from-emerald-500 to-emerald-800",
    hexAccent: "#10B981",
  },
  {
    id: "voidcloth_purple",
    name: "Voidcloth",
    description: "Illuminate-resistant weave. Faint phase shimmer.",
    cost: 100,
    colorClass: "from-purple-500 to-fuchsia-800",
    hexAccent: "#A855F7",
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Stealth black with chrome trim.",
    cost: 200,
    colorClass: "from-gray-300 to-black",
    hexAccent: "#6B7280",
  },
  {
    id: "tactical_camo",
    name: "Tactical Camo",
    description: "Desert/urban hybrid. Squad coordinator favored.",
    cost: 350,
    colorClass: "from-yellow-700 to-amber-900",
    hexAccent: "#B45309",
  },
  {
    id: "democracy_officer",
    name: "Democracy Officer",
    description: "Issued only to those who report on others.",
    cost: 500,
    colorClass: "from-helldiver-yellow via-helldiver-orange to-helldiver-red",
    hexAccent: "#E97E3C",
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    description: "Awarded for liberation campaigns. Heavy chrome plating.",
    cost: 1000,
    colorClass: "from-sky-300 to-helldiver-steel",
    hexAccent: "#7DD3FC",
  },
];

export const TITLES: Title[] = [
  { id: "", name: "— No Title —", description: "Just a Helldiver.", cost: 0 },
  { id: "the_patriot", name: "The Patriot", description: "Loves Super Earth above all.", cost: 50 },
  { id: "liberator", name: "Liberator", description: "For those who push the front line.", cost: 100 },
  { id: "bug_stomper", name: "Bug Stomper", description: "Scourge of the Terminids.", cost: 100 },
  { id: "automaton_hunter", name: "Automaton Hunter", description: "Bot-killer extraordinaire.", cost: 100 },
  { id: "phase_breaker", name: "Phase Breaker", description: "Illuminate shields fall to you.", cost: 100 },
  { id: "iron_sword", name: "Iron Sword", description: "Hardened. Honored.", cost: 250 },
  { id: "hellpod_hero", name: "Hellpod Hero", description: "Can't keep them grounded.", cost: 350 },
  { id: "democracy_officer", name: "Democracy Officer", description: "Always watching. Always reporting.", cost: 500 },
  { id: "eagle_one", name: "Eagle-1", description: "The legendary callsign. Few earn it.", cost: 1000 },
  { id: "general_brasch", name: "General Brasch's Choice", description: "Selected personally.", cost: 1500 },
];

export function getCape(id: string): Cape {
  return CAPES.find((c) => c.id === id) ?? CAPES[0];
}

export function getTitle(id: string): Title {
  return TITLES.find((t) => t.id === id) ?? TITLES[0];
}

export const DEFAULT_CAPE = "patriot_yellow";
export const DEFAULT_TITLE = "";
