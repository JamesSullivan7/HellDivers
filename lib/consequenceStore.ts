/**
 * DECISION CONSEQUENCE SYSTEM · Zustand store
 * ──────────────────────────────────────────────────────────────────────
 * State container for run-scoped consequences. The store does NOT mutate
 * game state directly — it tracks pending deltas and exposes them to the
 * engine, which decides where to apply them. This keeps the systems
 * decoupled and avoids circular imports.
 *
 *   activeRunModifiers   - pills shown in MapView sidebar
 *   pendingConsequences  - queued + delay-counter ticking on node enter
 *   pendingCombatMods    - pulled and consumed at combat init
 *   narrativeFlags       - one-way set of strings persisted for future events
 *   consequenceHistory   - append-only log for player review
 *
 * Public API:
 *   applyConsequence(c)            - immediate effect; engine handler reads return value
 *   queueConsequence(c)            - puts c into pendingConsequences with its trigger
 *   resolvePendingConsequences(t)  - decrements counters; returns ones whose timer hit
 *                                    zero so the engine handler can apply them
 *   addNarrativeFlag(flag)         - one-way set
 *   removeModifier(id)             - takes a run modifier off the active list
 *   consumeCombatModifiers()       - reads + clears pending combat mods
 *   consumeMapModifiers()          - reads + clears pending map mods (for engine to apply)
 *   pushHistory(entry)             - log a resolved decision
 *   clearAll()                     - run end / new run
 */

import { create } from "zustand";
import {
  Consequence,
  ConsequenceHistoryEntry,
  ConsequenceTrigger,
  CombatModifier,
  RunModifier,
} from "./consequenceTypes";

interface PendingConsequence extends Consequence {
  /** Mutable counter — decremented per node-enter when trigger === "after_nodes". */
  countdown?: number;
}

interface ConsequenceState {
  activeRunModifiers: RunModifier[];
  pendingConsequences: PendingConsequence[];
  pendingCombatMods: CombatModifier[];
  /** Map mutations that haven't been applied yet — engine reads + clears. */
  pendingMapMods: Consequence[];
  narrativeFlags: Set<string>;
  consequenceHistory: ConsequenceHistoryEntry[];

  // ── Mutators ──
  addRunModifier: (mod: RunModifier) => void;
  removeModifier: (id: string) => void;
  queueConsequence: (c: Consequence) => void;
  /**
   * Tick + drain consequences whose trigger matches. For "after_nodes",
   * decrements countdown and only returns those that hit zero.
   * Returns the consequences the engine should now apply.
   */
  resolvePendingConsequences: (trigger: ConsequenceTrigger) => Consequence[];
  pushPendingCombatMod: (m: CombatModifier) => void;
  pushPendingMapMod: (c: Consequence) => void;
  consumeCombatModifiers: () => CombatModifier[];
  consumeMapModifiers: () => Consequence[];
  addNarrativeFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  pushHistory: (entry: ConsequenceHistoryEntry) => void;
  appendResolvedToLastHistory: (description: string) => void;
  clearAll: () => void;
}

let counter = 0;
const nextId = () => `csq_${Date.now().toString(36)}_${counter++}`;

export const useConsequence = create<ConsequenceState>((set, get) => ({
  activeRunModifiers: [],
  pendingConsequences: [],
  pendingCombatMods: [],
  pendingMapMods: [],
  narrativeFlags: new Set<string>(),
  consequenceHistory: [],

  addRunModifier: (mod) =>
    set((s) => ({
      // Replace existing modifier with the same id rather than duplicating.
      activeRunModifiers: [
        ...s.activeRunModifiers.filter((m) => m.id !== mod.id),
        mod,
      ],
    })),

  removeModifier: (id) =>
    set((s) => ({
      activeRunModifiers: s.activeRunModifiers.filter((m) => m.id !== id),
    })),

  queueConsequence: (c) =>
    set((s) => {
      const pending: PendingConsequence = {
        ...c,
        countdown:
          c.trigger === "after_nodes" ? Math.max(1, c.delayNodes ?? 1) : undefined,
      };
      return { pendingConsequences: [...s.pendingConsequences, pending] };
    }),

  resolvePendingConsequences: (trigger) => {
    const fired: Consequence[] = [];
    set((s) => {
      const stillPending: PendingConsequence[] = [];
      for (const p of s.pendingConsequences) {
        if (p.trigger === "after_nodes") {
          // Tick down on next_node OR after_nodes
          if (trigger === "next_node" || trigger === "after_nodes") {
            const newCountdown = Math.max(0, (p.countdown ?? 1) - 1);
            if (newCountdown <= 0) {
              fired.push(p);
            } else {
              stillPending.push({ ...p, countdown: newCountdown });
            }
          } else {
            stillPending.push(p);
          }
        } else if (p.trigger === trigger) {
          fired.push(p);
        } else {
          stillPending.push(p);
        }
      }
      return { pendingConsequences: stillPending };
    });
    return fired;
  },

  pushPendingCombatMod: (m) =>
    set((s) => ({ pendingCombatMods: [...s.pendingCombatMods, m] })),

  pushPendingMapMod: (c) =>
    set((s) => ({ pendingMapMods: [...s.pendingMapMods, c] })),

  consumeCombatModifiers: () => {
    const mods = get().pendingCombatMods;
    set({ pendingCombatMods: [] });
    return mods;
  },

  consumeMapModifiers: () => {
    const mods = get().pendingMapMods;
    set({ pendingMapMods: [] });
    return mods;
  },

  addNarrativeFlag: (flag) =>
    set((s) => {
      const next = new Set(s.narrativeFlags);
      next.add(flag);
      return { narrativeFlags: next };
    }),

  hasFlag: (flag) => get().narrativeFlags.has(flag),

  pushHistory: (entry) =>
    set((s) => ({
      consequenceHistory: [
        { ...entry, id: entry.id || nextId() },
        ...s.consequenceHistory,
      ].slice(0, 60),
    })),

  appendResolvedToLastHistory: (description) => {
    set((s) => {
      const newest = s.consequenceHistory[0];
      if (!newest) return {};
      const updated: ConsequenceHistoryEntry = {
        ...newest,
        resolved: [...newest.resolved, { at: Date.now(), description }],
      };
      return { consequenceHistory: [updated, ...s.consequenceHistory.slice(1)] };
    });
  },

  clearAll: () =>
    set({
      activeRunModifiers: [],
      pendingConsequences: [],
      pendingCombatMods: [],
      pendingMapMods: [],
      narrativeFlags: new Set(),
      consequenceHistory: [],
    }),
}));
