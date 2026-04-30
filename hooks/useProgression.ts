"use client";

/**
 * useProgression — bundled hook for components that consume the
 * progression layer.
 *
 * Returns:
 *   profile           — derived PlayerProfile view
 *   pendingRewards    — RunRewards queued for the post-run cinematic
 *   notifications     — UnlockNotification[] (unviewed first)
 *   activeReveal      — the currently-displayed reveal (or null)
 *   addXP / addCurrency / unlockWarbondItem / unlockShipModule /
 *   unlockCosmetic / equipCosmetic / claimRunRewards / markUnlockViewed /
 *   recordMission / openReveal / closeReveal
 */

import { useMemo } from "react";
import { useGame } from "@/lib/store";
import { useProgressionStore } from "@/systems/progression/progressionStore";
import {
  addCurrency,
  addXP,
  claimRunRewards,
  deriveProfileFromAccount,
  equipCosmetic,
  getRichMissionHistory,
  markUnlockViewed,
  recordMission,
  tryOpenNextReveal,
  unlockCosmetic,
  unlockShipModule,
  unlockWarbondItem,
} from "@/systems/progression/ProgressionManager";

export function useProgression() {
  const account = useGame((s) => s.account);
  const pendingRewards = useProgressionStore((s) => s.pendingRewards);
  const notifications = useProgressionStore((s) => s.notifications);
  const activeReveal = useProgressionStore((s) => s.activeReveal);
  const unlockRevealOpen = useProgressionStore((s) => s.unlockRevealOpen);
  const consumeReward = useProgressionStore((s) => s.consumeReward);
  const closeReveal = useProgressionStore((s) => s.closeReveal);
  const openReveal = useProgressionStore((s) => s.openReveal);

  const profile = useMemo(() => deriveProfileFromAccount(account), [account]);
  const richMissionHistory = useMemo(() => getRichMissionHistory(), [account.history.length]);

  return {
    profile,
    richMissionHistory,
    pendingRewards,
    notifications,
    activeReveal,
    unlockRevealOpen,

    // Mutators
    addXP,
    addCurrency,
    unlockWarbondItem,
    unlockShipModule,
    unlockCosmetic,
    equipCosmetic,
    claimRunRewards,
    recordMission,
    markUnlockViewed,

    // Reveal flow
    openReveal,
    closeReveal,
    consumeReward,
    tryOpenNextReveal,
  };
}
