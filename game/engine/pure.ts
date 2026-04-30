/**
 * Pure combat helpers. No React. No DOM. No side effects.
 *
 * These functions are imported by both the client-side store (lib/store.ts)
 * and by Convex coop server functions (convex/coop.ts). Single source of truth
 * for combat math.
 */

import type { Enemy } from "@/lib/types";

// ── DETERMINISTIC RNG (for testable seeded combat) ──

/** Mulberry32 — small, fast, decent-quality 32-bit PRNG. */
export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── SHUFFLE ──

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── DAMAGE MATH ──

export interface DamageResult {
  /** New enemy HP. */
  hp: number;
  /** New enemy shield. */
  shield: number;
  /** Damage dealt to HP after shield + armor. */
  dealtToHp: number;
  /** Damage absorbed by shield. */
  absorbedByShield: number;
  /** True if this hit just killed the enemy. */
  killed: boolean;
}

/**
 * Apply damage to an enemy, with shield → armor priority per Helldivers rules.
 *
 * Order:
 *   1. Bonus vs armored (if applicable)
 *   2. Shield absorbs first
 *   3. Armor reduction (unless ignoreArmor)
 *   4. Subtract from HP
 */
export function computeDamage(
  enemy: Pick<Enemy, "hp" | "armor" | "shield">,
  baseDmg: number,
  opts: { ignoreArmor?: boolean; bonusVsArmor?: number } = {}
): DamageResult {
  let dmg = baseDmg;
  if (enemy.armor > 0 && opts.bonusVsArmor) dmg += opts.bonusVsArmor;

  let shield = enemy.shield;
  let hp = enemy.hp;

  // Shield absorbs first
  let absorbed = 0;
  if (shield > 0 && dmg > 0) {
    absorbed = Math.min(shield, dmg);
    shield -= absorbed;
    dmg -= absorbed;
  }

  // Armor reduction
  let dealt = 0;
  if (dmg > 0) {
    const after = opts.ignoreArmor ? dmg : Math.max(0, dmg - enemy.armor);
    hp = Math.max(0, hp - after);
    dealt = after;
  }

  return {
    hp,
    shield,
    dealtToHp: dealt,
    absorbedByShield: absorbed,
    killed: enemy.hp > 0 && hp === 0,
  };
}

// ── BLOCK / PLAYER DAMAGE ABSORPTION ──

export interface PlayerDamageResult {
  hp: number;
  block: number;
  remaining: number;
}

/** Apply incoming damage to a player. Block absorbs first. */
export function computePlayerDamage(
  player: { hp: number; block: number },
  amount: number
): PlayerDamageResult {
  let block = player.block;
  let hp = player.hp;
  let remaining = amount;
  if (block > 0) {
    const absorbed = Math.min(block, remaining);
    block -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    hp = Math.max(0, hp - remaining);
  }
  return { hp, block, remaining };
}

// ── BOSS ENRAGE CHECK ──

export function shouldEnrage(enemy: Pick<Enemy, "hp" | "maxHp" | "isBoss" | "enraged">): boolean {
  return (
    !!enemy.isBoss &&
    !enemy.enraged &&
    enemy.hp > 0 &&
    enemy.hp <= enemy.maxHp / 2
  );
}

// ── DECK MUTATIONS ──

export interface DeckPilesShape {
  deck: unknown[];
  hand: unknown[];
  discard: unknown[];
}

/**
 * Draw N cards. Reshuffles discard into deck if deck empties mid-draw.
 * Returns new (deck, hand, discard) snapshot — does not mutate input.
 */
export function drawCards<T>(
  piles: { deck: T[]; hand: T[]; discard: T[] },
  count: number,
  rand: () => number = Math.random
): { deck: T[]; hand: T[]; discard: T[]; reshuffled: boolean } {
  let deck = [...piles.deck];
  let hand = [...piles.hand];
  let discard = [...piles.discard];
  let reshuffled = false;
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffle(discard, rand);
      discard = [];
      reshuffled = true;
    }
    const card = deck.shift();
    if (card !== undefined) hand.push(card);
  }
  return { deck, hand, discard, reshuffled };
}

// ── DIFFICULTY SCALING ──

export function difficultyScale(difficulty: number): { hp: number; dmg: number } {
  return {
    hp: 1.0 + (difficulty - 1) * 0.17,
    dmg: 1.0 + (difficulty - 1) * 0.15,
  };
}
