export interface Modifier {
  id: string;
  name: string;
  description: string;
  faction?: "terminid" | "automaton" | "illuminate" | "any";
}

export const MODIFIERS: Modifier[] = [
  {
    id: "heavy_fog",
    name: "Heavy Fog",
    description: "Enemy intents obscured. Plan blind.",
    faction: "any",
  },
  {
    id: "atmospheric_spores",
    name: "Atmospheric Spores",
    description: "−1 hand size. Reduced visibility.",
    faction: "any",
  },
  {
    id: "patrol_frequency",
    name: "Increased Patrol Frequency",
    description: "+1 enemy in every combat.",
    faction: "any",
  },
  {
    id: "increased_air_sec",
    name: "Increased Air Security",
    description: "Eagle stratagems cost +1 R.",
    faction: "any",
  },
  {
    id: "magnetic_storm",
    name: "Magnetic Storm",
    description: "Orbital damage reduced by 30%.",
    faction: "any",
  },
  {
    id: "acidic_atmosphere",
    name: "Acidic Atmosphere",
    description: "Take 1 damage at the end of every turn.",
    faction: "any",
  },
  {
    id: "enemy_armor",
    name: "Heightened Senses",
    description: "All enemies +1 armor.",
    faction: "any",
  },
  {
    id: "low_visibility",
    name: "Low Visibility",
    description: "Single-target cards have a 15% miss chance.",
    faction: "any",
  },
];

function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 0xffffffff;
  };
}

export function rollModifiers(
  faction: string,
  difficulty: number,
  seedExtra = Date.now()
): string[] {
  const count =
    difficulty <= 3 ? 0 : difficulty <= 6 ? 1 : difficulty <= 9 ? 2 : 3;
  if (count === 0) return [];
  let seed = (faction.charCodeAt(0) * 31 + difficulty * 7919 + seedExtra) >>> 0;
  const r = rng(seed);
  const pool = MODIFIERS.filter(
    (m) => m.faction === "any" || m.faction === faction
  );
  const out: string[] = [];
  const used = new Set<string>();
  let safety = 0;
  while (out.length < count && safety < 50) {
    const idx = Math.floor(r() * pool.length);
    const m = pool[idx];
    if (!used.has(m.id)) {
      used.add(m.id);
      out.push(m.id);
    }
    safety++;
  }
  return out;
}

export function getModifier(id: string): Modifier | undefined {
  return MODIFIERS.find((m) => m.id === id);
}
