/**
 * FINAL POLISH LAYER · randomized variation
 * ──────────────────────────────────────────────────────────────────────
 * Helpers for adding *small, controlled* variation to repeated UI
 * actions so they don't feel robotic.
 *
 * Rules (from spec):
 *   - subtle by default
 *   - never affects gameplay outcomes unless intended
 *   - seeded randomness preferred during runs (so re-renders don't
 *     reshuffle particles or damage offsets within a single hit)
 */

// ──────────────────────────────────────────────────────────────────────
//  Mulberry32 PRNG — fast, deterministic, seedable
// ──────────────────────────────────────────────────────────────────────
export function createSeededRandom(seed: number | string): () => number {
  let s: number;
  if (typeof seed === "string") {
    // FNV-1a 32-bit hash
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    s = h >>> 0;
  } else {
    s = (seed >>> 0) || 1;
  }
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Standard variation helpers
// ──────────────────────────────────────────────────────────────────────

/** Symmetric jitter in pixels around 0. e.g. jitter(rand, 6) → [-6, +6]. */
export function jitter(rand: () => number, magnitude: number): number {
  return (rand() * 2 - 1) * magnitude;
}

/** Two-axis jitter for damage numbers / particles. */
export function jitterXY(rand: () => number, magnitude = 8) {
  return { x: jitter(rand, magnitude), y: jitter(rand, magnitude) };
}

/** Pitch multiplier for SFX — keep within ±N semitones (default 1). */
export function pitchVariation(rand: () => number, semitones = 1): number {
  const half = semitones;
  const cents = jitter(rand, half * 100);
  return Math.pow(2, cents / 1200);
}

/** Multiply a duration by ±variancePct. e.g. timingJitter(rand, 280, 0.08) */
export function timingJitter(
  rand: () => number,
  baseMs: number,
  variancePct = 0.08,
): number {
  return Math.round(baseMs * (1 + jitter(rand, variancePct)));
}

/** Pick one of `options` uniformly. */
export function pick<T>(rand: () => number, options: readonly T[]): T {
  return options[Math.floor(rand() * options.length)];
}

/** Weighted pick — items are [value, weight] tuples. */
export function pickWeighted<T>(
  rand: () => number,
  options: ReadonlyArray<readonly [T, number]>,
): T {
  const total = options.reduce((acc, [, w]) => acc + w, 0);
  let r = rand() * total;
  for (const [value, weight] of options) {
    r -= weight;
    if (r <= 0) return value;
  }
  return options[options.length - 1][0];
}

// ──────────────────────────────────────────────────────────────────────
//  Event-feed variations — small dictionary of synonymous phrasings so
//  repeated lines don't feel copy-pasted. Callers pass a seed (often the
//  event id) to keep wording stable across re-renders.
// ──────────────────────────────────────────────────────────────────────
export const EVENT_FEED_VARIATIONS = {
  hitTaken: ["TAKING FIRE", "INCOMING DAMAGE", "ABSORBING HIT", "STAGGERED"] as const,
  blocked: ["DEFLECTED", "ARMOR HELD", "SHIELD HOLDING", "ABSORBED"] as const,
  enemyDown: ["TARGET ELIMINATED", "CONTACT NEUTRALIZED", "TANGO DOWN", "ENEMY KILLED"] as const,
  reload: ["RELOADING", "RE-ARMING", "MAGAZINE SWAP", "RESUPPLY"] as const,
  affirm: ["COPY", "ROGER", "AFFIRMATIVE", "WILCO"] as const,
} as const;

export function variantPhrase<K extends keyof typeof EVENT_FEED_VARIATIONS>(
  rand: () => number,
  bucket: K,
): (typeof EVENT_FEED_VARIATIONS)[K][number] {
  return pick(rand, EVENT_FEED_VARIATIONS[bucket]);
}

// ──────────────────────────────────────────────────────────────────────
//  Default rand — module-level instance for casual variation that
//  doesn't need run-stability (e.g. event feed phrasing).
// ──────────────────────────────────────────────────────────────────────
let _moduleRand: (() => number) | undefined;
export function defaultRand(): () => number {
  if (!_moduleRand) _moduleRand = createSeededRandom(Date.now());
  return _moduleRand;
}
