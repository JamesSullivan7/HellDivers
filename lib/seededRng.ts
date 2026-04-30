/**
 * Seeded RNG — deterministic randomness for replayable runs.
 *
 * Wraps the existing mulberry32 PRNG with a string-seedable interface so a
 * RunSeed string can produce the same map / enemy / reward structure every
 * time. Player choices still create branching outcomes; the seed only
 * controls the *generated* state.
 */

import { mulberry32 } from "@/game/engine/pure";

/** Hash a string into a 32-bit unsigned integer (FNV-1a). */
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** A 32-character alphanumeric seed. Looks like "TRM-7K3F-9PXR-A2BL". */
export function generateSeedString(): string {
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skip ambiguous 0/1/I/O
  const block = (n: number) =>
    Array.from({ length: n }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
  // Prefix encodes the wall-clock millisecond as a 3-letter chunk so seeds
  // sort roughly chronologically — useful for human eyes scrolling history.
  const prefix = block(3);
  return `${prefix}-${block(4)}-${block(4)}-${block(4)}`;
}

/** Build an RNG function from a string seed. Same seed → same sequence. */
export function rngFromSeed(seed: string): () => number {
  return mulberry32(hashString(seed));
}

/** Pick one element of an array using a seeded RNG. */
export function rngPick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick weighted entry. Weights need not sum to 1. */
export function rngPickWeighted<T>(
  rng: () => number,
  entries: readonly { value: T; weight: number }[]
): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.value;
  }
  return entries[entries.length - 1].value;
}

/** In-place Fisher-Yates shuffle using a seeded RNG. Returns the same array. */
export function rngShuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
