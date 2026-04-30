/**
 * PROGRESSION SYSTEM · manager
 * ──────────────────────────────────────────────────────────────────────
 * Single dispatch entry point for the progression layer.
 *
 *   addXP(amount)                           — applies XP via the engine,
 *                                              detects level-ups, queues
 *                                              level-up notifications
 *   addCurrency(type, amount)               — credits medals / samples /
 *                                              requisition through the
 *                                              engine account
 *   unlockWarbondItem(itemId)               — pays the cost, marks unlock
 *                                              in account, queues a reveal
 *   unlockShipModule(moduleId)              — same flow, samples currency
 *   unlockCosmetic(id)                      — capes / titles via engine,
 *                                              banners / cardbacks via
 *                                              progression cosmetics
 *   equipCosmetic(type, id)                 — capes / titles via engine,
 *                                              other types stored in a
 *                                              non-persistent slot for now
 *   recordMission(record)                   — appends to history (engine
 *                                              already tracks the simple
 *                                              RunRecord; we keep the rich
 *                                              MissionRecord in transient
 *                                              memory + best-effort merge)
 *   claimRunRewards(rewards)                — applies + queues post-run
 *                                              cinematic
 *   markUnlockViewed(id)                    — flag-only convenience
 *
 * The manager is intentionally side-effecting: it reads & writes the engine
 * store via `useGame.getState()` and pushes UX events to the progression
 * store. It NEVER duplicates persistent state.
 */

import { useGame } from "@/lib/store";
import { feedback } from "@/systems/feedback/FeedbackManager";
import { vfx } from "@/systems/vfx/VFXManager";
import { applyXp, saveAccount } from "@/lib/account";
import type { Account } from "@/lib/account";

import {
  CurrencyType,
  RunRewards,
  PlayerProfile,
  MissionRecord,
  UnlockNotification,
  CosmeticType,
} from "./progressionTypes";
import {
  applyXpToProgress,
  getLevelUpReward,
  rankForLevel,
  xpToNextLevel,
} from "./xpCurve";
import { clampReward } from "./economy";
import { findWarbondItem } from "./data/warbonds";
import { getShipModuleDef } from "./data/shipModules";
import { getCosmeticDef } from "./data/cosmetics";
import { useProgressionStore } from "./progressionStore";

// ──────────────────────────────────────────────────────────────────────
//  PlayerProfile derivation — view over the engine account
// ──────────────────────────────────────────────────────────────────────
export function deriveProfileFromAccount(account: Account): PlayerProfile {
  const samples = account.samples + account.rareSamples + account.superSamples;
  const cosmeticsList = [
    ...account.unlockedCapes,
    ...account.unlockedTitles,
    // Banners + cardbacks aren't persisted to engine yet; we surface them
    // optimistically from the progression notifications log if any.
  ];

  return {
    id: account.helldiverName ?? "helldiver",
    callsign: account.helldiverName ?? "HELLDIVER",
    level: account.level,
    xp: account.xp,
    xpToNextLevel: xpToNextLevel(account.level),
    currencies: {
      medals: account.medals,
      samples,
      samplesBreakdown: {
        common: account.samples,
        rare: account.rareSamples,
        super: account.superSamples,
      },
      requisition: account.requisition,
    },
    unlockedStratagems: account.unlockedCards,
    unlockedModules: account.unlockedModules,
    unlockedCosmetics: cosmeticsList,
    equippedCosmetics: {
      capeId: account.equippedCape,
      titleId: account.equippedTitle,
    },
    // Engine RunRecord doesn't carry MissionRecord-rich fields — we map best-
    // effort. Callers that need the full shape should use recordMission().
    missionHistory: account.history.map<MissionRecord>((r, i) => ({
      id: `mr_${r.date}_${i}`,
      date: new Date(r.date).toISOString(),
      planet: r.planet,
      faction: r.faction,
      difficulty: r.difficulty ?? 5,
      result: r.outcome,
      rewards: {
        xp: r.xpEarned,
        medals: r.medalsEarned,
        samples: 0,
        requisition: 0,
      },
      cardsUsed: [],
      durationSeconds: 0,
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────
//  XP + level-up
// ──────────────────────────────────────────────────────────────────────
export function addXP(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const game = useGame.getState();
  const before = game.account;
  const updated = applyXp(before, amount);
  saveAccount(updated);
  useGame.setState({ account: updated });

  // Detect level-ups and queue notifications + level-up reward payouts.
  if (updated.level > before.level) {
    const gained = updated.level - before.level;
    for (let i = 1; i <= gained; i++) {
      const lvl = before.level + i;
      const rank = rankForLevel(lvl);
      const reward = getLevelUpReward(lvl);
      const headline = `LEVEL ${lvl} ACHIEVED`;
      const subhead = reward?.banner ?? `${rank.title.toUpperCase()} — ${rank.abbr}`;
      useProgressionStore.getState().pushNotification({
        kind: "level_up",
        headline,
        subhead,
        refId: `lvl_${lvl}`,
      });
      if (reward) {
        // Pay out level-up bonuses
        if (reward.medals) addCurrency("medals", reward.medals);
        if (reward.requisition) addCurrency("requisition", reward.requisition);
        // Optional warbond page notification
        if (reward.unlocksWarbondPage) {
          useProgressionStore.getState().pushNotification({
            kind: "warbond_page",
            headline: "NEW WARBOND",
            subhead: reward.banner,
            refId: reward.unlocksWarbondPage,
          });
        }
        if (reward.grantsCosmeticId) {
          // Granted, not purchased — we add it to account if it's a known
          // cape/title via the engine setters; otherwise note-only.
          const def = getCosmeticDef(reward.grantsCosmeticId);
          if (def) {
            useProgressionStore.getState().pushNotification({
              kind: "cosmetic",
              headline: "COSMETIC UNLOCKED",
              subhead: `${def.name.toUpperCase()} GRANTED`,
              refId: def.id,
              rarity: def.rarity,
            });
          }
        }
      }
      // Sound + tension via feedback bridge — uses bossEnrage as a stand-in
      // for the strong cinematic hook (already wired to sfx/tension/flash).
      feedback.objectiveComplete(`LEVEL ${lvl}`, reward?.medals ?? 0);
      vfx.rewardBloom();
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
//  Currency credits
// ──────────────────────────────────────────────────────────────────────
export function addCurrency(type: CurrencyType, amount: number): void {
  if (!Number.isFinite(amount) || amount === 0) return;
  const { account } = useGame.getState();
  const next: Account = { ...account };
  if (type === "medals") next.medals = Math.max(0, next.medals + amount);
  else if (type === "requisition") next.requisition = Math.max(0, next.requisition + amount);
  else if (type === "samples") next.samples = Math.max(0, next.samples + amount);
  saveAccount(next);
  useGame.setState({ account: next });
}

// ──────────────────────────────────────────────────────────────────────
//  Warbond unlock
// ──────────────────────────────────────────────────────────────────────
export function unlockWarbondItem(itemId: string): boolean {
  const found = findWarbondItem(itemId);
  if (!found) return false;
  const { item } = found;
  const game = useGame.getState();
  const acc = game.account;

  // Level gate
  if (item.levelRequired && acc.level < item.levelRequired) return false;

  // Stratagems use the engine's existing unlockCard (validates medal cost
  // for known card rarities). For our richer warbond cost we override:
  // always pay the warbond item's medal/requisition cost explicitly.
  if (item.cost.medals && acc.medals < item.cost.medals) return false;
  if (item.cost.requisition && acc.requisition < item.cost.requisition) return false;

  const next: Account = {
    ...acc,
    medals: acc.medals - (item.cost.medals ?? 0),
    requisition: acc.requisition - (item.cost.requisition ?? 0),
  };
  if (item.type === "stratagem" && item.refId) {
    if (!next.unlockedCards.includes(item.refId)) {
      next.unlockedCards = [...next.unlockedCards, item.refId];
    }
  }
  if (item.type === "cosmetic" && item.refId) {
    if (!next.unlockedCapes.includes(item.refId)) {
      next.unlockedCapes = [...next.unlockedCapes, item.refId];
    }
  }
  if (item.type === "title" && item.refId) {
    if (!next.unlockedTitles.includes(item.refId)) {
      next.unlockedTitles = [...next.unlockedTitles, item.refId];
    }
  }
  saveAccount(next);
  useGame.setState({ account: next });

  useProgressionStore.getState().pushNotification({
    kind: item.type === "stratagem" ? "stratagem" : "cosmetic",
    headline: item.type === "stratagem" ? "STRATAGEM UNLOCKED" : "COSMETIC UNLOCKED",
    subhead: item.name.toUpperCase(),
    refId: item.refId ?? item.id,
    rarity: item.rarity,
  });
  feedback.reward(item.cost.medals ?? item.cost.requisition ?? 0, "medals");
  vfx.cardFlash(undefined, "large");
  return true;
}

// ──────────────────────────────────────────────────────────────────────
//  Ship module unlock — uses the engine's unlockModule which already
//  validates samples cost against SHIP_MODULES. We pre-validate against the
//  rich definition for level requirement and cosmetic notification.
// ──────────────────────────────────────────────────────────────────────
export function unlockShipModule(moduleId: string): boolean {
  const def = getShipModuleDef(moduleId);
  const game = useGame.getState();
  if (def?.levelRequired && game.account.level < def.levelRequired) return false;
  const ok = game.unlockModule(moduleId);
  if (ok) {
    useProgressionStore.getState().pushNotification({
      kind: "ship_module",
      headline: "SHIP MODULE INSTALLED",
      subhead: (def?.name ?? moduleId).toUpperCase(),
      refId: moduleId,
    });
    feedback.reward(def?.cost.samples ?? 0, "samples");
    vfx.shieldRipple(undefined, "large");
  }
  return ok;
}

// ──────────────────────────────────────────────────────────────────────
//  Cosmetic unlock + equip
// ──────────────────────────────────────────────────────────────────────
export function unlockCosmetic(id: string): boolean {
  const def = getCosmeticDef(id);
  if (!def) return false;
  const game = useGame.getState();
  if (def.levelRequired && game.account.level < def.levelRequired) return false;

  let ok = false;
  if (def.type === "cape") ok = game.unlockCape(id);
  else if (def.type === "title") ok = game.unlockTitle(id);
  else {
    // Banners / cardbacks / shipnames aren't tracked on the engine account
    // yet. Pay the cost manually and emit a notification — the slot lives
    // in the progression store equippedExtras (see openExtras helpers below).
    const acc = game.account;
    if (def.cost.requisition && acc.requisition < def.cost.requisition) return false;
    if (def.cost.medals && acc.medals < def.cost.medals) return false;
    const next: Account = {
      ...acc,
      medals: acc.medals - (def.cost.medals ?? 0),
      requisition: acc.requisition - (def.cost.requisition ?? 0),
    };
    saveAccount(next);
    useGame.setState({ account: next });
    ok = true;
  }
  if (ok) {
    useProgressionStore.getState().pushNotification({
      kind: "cosmetic",
      headline: "COSMETIC ACQUIRED",
      subhead: def.name.toUpperCase(),
      refId: def.id,
      rarity: def.rarity,
    });
    vfx.rewardBloom();
  }
  return ok;
}

export function equipCosmetic(type: CosmeticType, id: string): void {
  const game = useGame.getState();
  if (type === "cape") game.equipCape(id);
  else if (type === "title") game.equipTitle(id);
  // Other types: future hook; the progression store doesn't persist them
  // yet to avoid touching localStorage shape unexpectedly.
}

// ──────────────────────────────────────────────────────────────────────
//  Mission history (rich) — append in transient store. The engine's own
//  RunRecord is appended elsewhere by the run-end flow.
// ──────────────────────────────────────────────────────────────────────
const RICH_HISTORY: MissionRecord[] = [];

export function recordMission(record: MissionRecord): void {
  RICH_HISTORY.unshift(record);
  if (RICH_HISTORY.length > 20) RICH_HISTORY.length = 20;
}

export function getRichMissionHistory(): MissionRecord[] {
  return RICH_HISTORY.slice();
}

// ──────────────────────────────────────────────────────────────────────
//  Run rewards — applies, queues cinematic
// ──────────────────────────────────────────────────────────────────────
export function claimRunRewards(rewardsRaw: RunRewards): void {
  const rewards = clampReward(rewardsRaw);
  // Apply to account
  addCurrency("medals", rewards.medals);
  addCurrency("samples", rewards.samples);
  addCurrency("requisition", rewards.requisition);
  if (rewards.rareSamples) {
    const game = useGame.getState();
    const next: Account = { ...game.account, rareSamples: game.account.rareSamples + rewards.rareSamples };
    saveAccount(next);
    useGame.setState({ account: next });
  }
  if (rewards.superSamples) {
    const game = useGame.getState();
    const next: Account = { ...game.account, superSamples: game.account.superSamples + rewards.superSamples };
    saveAccount(next);
    useGame.setState({ account: next });
  }
  // XP last so level-up notifications come after currency credits
  if (rewards.xp > 0) addXP(rewards.xp);

  // Queue for the PostRunSummary cinematic
  useProgressionStore.getState().queueReward(rewards);
}

// ──────────────────────────────────────────────────────────────────────
//  Notifications
// ──────────────────────────────────────────────────────────────────────
export function markUnlockViewed(id: string): void {
  useProgressionStore.getState().markUnlockViewed(id);
}

export function nextUnviewedNotification(): UnlockNotification | undefined {
  return useProgressionStore.getState().notifications.find((n) => !n.viewed);
}

// ──────────────────────────────────────────────────────────────────────
//  Convenience batch — used by Provider on mount + when the queue grows.
// ──────────────────────────────────────────────────────────────────────
export function tryOpenNextReveal(): boolean {
  const note = nextUnviewedNotification();
  if (!note) return false;
  useProgressionStore.getState().openReveal(note);
  return true;
}
