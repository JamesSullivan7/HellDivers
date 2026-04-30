"use client";

/**
 * useEnemyIntent — bundled hook for any component that needs the rich
 * intent layer for an enemy. Subscribes to the engine's combat state +
 * the intent queue, and recomputes derived intents reactively.
 *
 * Returns:
 *   current         — RichEnemyIntent for this turn
 *   next            — one step ahead (undefined if pattern length 1)
 *   afterNext       — two steps ahead (undefined if pattern length ≤ 2)
 *   pattern         — full pattern for boss preview (always present, may be 1 long)
 *   resolution      — projected outcome (damage after block, will-cripple flag)
 *   priorityHints   — designer-authored "WILL DO X IF Y" data for tooltip
 *   interruptedReason — set if a tool / event has flagged the intent interrupted
 *   isProfiled      — true if the enemy has an authored behavior profile
 *
 * Usage:
 *   const intent = useEnemyIntent(enemy);
 *   <EnemyIntentPanel data={intent} />
 */

import { useMemo } from "react";
import type { Enemy } from "@/lib/types";
import { useGame } from "@/lib/store";
import { useIntentQueue } from "@/systems/intent/intentQueue";
import {
  deriveRichIntent,
  deriveNextRichIntent,
  deriveAfterNextRichIntent,
  derivePatternPreview,
  resolveEnemyIntent,
  getPriorityHints,
  isProfiled,
} from "@/systems/intent/IntentManager";
import type {
  IntentInterruptReason,
  RichEnemyIntent,
} from "@/systems/intent/intentTypes";

export interface EnemyIntentView {
  current: RichEnemyIntent;
  next?: RichEnemyIntent;
  afterNext?: RichEnemyIntent;
  pattern: RichEnemyIntent[];
  resolution: ReturnType<typeof resolveEnemyIntent>;
  priorityHints: ReturnType<typeof getPriorityHints>;
  interruptedReason?: IntentInterruptReason;
  isProfiled: boolean;
}

export function useEnemyIntent(enemy: Enemy): EnemyIntentView {
  const player = useGame((s) => s.player);
  const combat = useGame((s) => s.combat);
  const interruptedReason = useIntentQueue(
    (s) => s.telegraphs[enemy.id]?.interruptedReason,
  );

  return useMemo<EnemyIntentView>(() => {
    const current = deriveRichIntent(enemy, player, combat);
    const next = deriveNextRichIntent(enemy, player, combat);
    const afterNext = deriveAfterNextRichIntent(enemy, player, combat);
    const pattern = derivePatternPreview(enemy, player, combat);
    const resolution = resolveEnemyIntent(enemy, player, combat);
    const priorityHints = getPriorityHints(enemy, player, combat);
    return {
      current,
      next,
      afterNext,
      pattern,
      resolution,
      priorityHints,
      interruptedReason,
      isProfiled: isProfiled(enemy.templateId),
    };
    // We intentionally derive on every relevant state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enemy.id,
    enemy.intentIndex,
    enemy.hp,
    enemy.shield,
    enemy.armor,
    enemy.enraged,
    enemy.intents,
    player.hp,
    player.block,
    combat.turn,
    combat.enemies.length,
    interruptedReason,
  ]);
}
