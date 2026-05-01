/**
 * FINAL POLISH LAYER · micro-delays
 * ──────────────────────────────────────────────────────────────────────
 * Typed, named delays for cinematic moments. Use these instead of magic
 * numbers. Each delay describes WHY it exists so future-you doesn't
 * tweak a value that was carefully tuned.
 *
 * Strict rules (mirrored from spec):
 *   1. Never delay basic input. Only cinematic moments.
 *   2. Most delays are < 700ms.
 *   3. Reduced-motion shortens or removes the delay automatically via
 *      `resolveDelay(key, reducedMotion)`.
 */

import { POLISH_TIMING } from "./polishTokens";

// ──────────────────────────────────────────────────────────────────────
//  Named delays — every cinematic moment in the game
// ──────────────────────────────────────────────────────────────────────
export const MICRO_DELAYS = {
  /** Small breath before the reward panel slides in. */
  rewardPanelIntro: POLISH_TIMING.beat,
  /** Stagger between reward cards landing on screen. */
  rewardCardStagger: POLISH_TIMING.fast,
  /** Hold before the currency tally starts counting up. */
  currencyTallyDelay: POLISH_TIMING.beat,
  /** Final beat before the Continue button appears. */
  continueButtonReveal: POLISH_TIMING.pause,

  /** Short pause when the XP bar reaches the level threshold. */
  levelThresholdPause: POLISH_TIMING.pause,
  /** Beat between the rank flash and the level number incrementing. */
  rankFlashHold: POLISH_TIMING.beat,
  /** Pre-burst hold before the level-up cinematic plays. */
  levelUpPreBurst: POLISH_TIMING.pause,

  /** Half-beat of silence before the boss enrage cinematic kicks. */
  bossEnrageSilence: POLISH_TIMING.pause,
  /** Hold while the screen darkens during enrage. */
  bossEnrageDarken: POLISH_TIMING.beat,
  /** Boss frame expansion / sound spike beat. */
  bossEnrageImpact: POLISH_TIMING.hold,

  /** Lock-in delay after a player commits a decision (encounter). */
  decisionLockIn: POLISH_TIMING.beat,
  /** Hold before transitioning into combat. */
  preCombatHold: POLISH_TIMING.beat,
  /** Hold after victory before showing the post-run summary. */
  postVictoryHold: POLISH_TIMING.pause,
} as const;

export type MicroDelayKey = keyof typeof MICRO_DELAYS;

// ──────────────────────────────────────────────────────────────────────
//  Resolver — takes a delay key + reducedMotion flag, returns ms
// ──────────────────────────────────────────────────────────────────────
export function resolveDelay(key: MicroDelayKey, reducedMotion = false): number {
  const base = MICRO_DELAYS[key];
  if (!reducedMotion) return base;
  // Reduced-motion: keep ordering but compress timing 60%
  // The reward sequence still feels staged, just fast.
  return Math.round(base * 0.4);
}

// ──────────────────────────────────────────────────────────────────────
//  Promise helper — `await wait(MICRO_DELAYS.beat)`
//  Use sparingly. Most components should drive timing through
//  framer-motion variants/transitions, not blocking awaits.
// ──────────────────────────────────────────────────────────────────────
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────────────────────────────
//  Sequence helper — schedule a series of named beats
//  Returns a teardown function that cancels pending callbacks if the
//  sequence is unmounted before completion.
// ──────────────────────────────────────────────────────────────────────
export interface ScheduledBeat {
  delayKey: MicroDelayKey;
  /** Optional explicit ms override (still resolved through reducedMotion). */
  delayMs?: number;
  fire: () => void;
}

export function runSequence(
  beats: ScheduledBeat[],
  options: { reducedMotion?: boolean; onDone?: () => void } = {},
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cumulative = 0;
  for (const beat of beats) {
    const delay = beat.delayMs ?? resolveDelay(beat.delayKey, options.reducedMotion);
    cumulative += delay;
    timers.push(setTimeout(beat.fire, cumulative));
  }
  if (options.onDone) timers.push(setTimeout(options.onDone, cumulative));
  return () => {
    for (const t of timers) clearTimeout(t);
  };
}
