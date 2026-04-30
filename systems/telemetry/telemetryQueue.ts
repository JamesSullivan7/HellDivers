/**
 * TELEMETRY & BALANCING SYSTEM · event queue
 * ──────────────────────────────────────────────────────────────────────
 * Zustand store of buffered telemetry events, with optional localStorage
 * persistence so refreshes/crashes don't drop data the dashboard relies
 * on.
 *
 *   events       — capped circular buffer of TelemetryEvent
 *   push(event)  — append, trimming the oldest if over the cap
 *   drain(n?)    — pop and return up to N events (for batched send)
 *   snapshot()   — read-only copy for metrics computation
 *   clearAll()   — wipe (used by opt-out + dashboard "Clear")
 *
 * The cap defends both memory and localStorage quota. The persistence
 * write is debounced so high-volume events (turn_started, damage_dealt)
 * don't hammer the disk.
 */

import { create } from "zustand";
import type { TelemetryEvent } from "./telemetryTypes";
import { DEFAULT_TELEMETRY_CONFIG } from "./telemetryTypes";

const STORAGE_KEY = "helldivers_telemetry_buffer";
const PERSIST_DEBOUNCE_MS = 1500;

// ──────────────────────────────────────────────────────────────────────
//  Persistence helpers
// ──────────────────────────────────────────────────────────────────────
function readBuffer(): TelemetryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

let _persistTimer: ReturnType<typeof setTimeout> | undefined;
function schedulePersist(events: TelemetryEvent[]): void {
  if (typeof window === "undefined") return;
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // localStorage might be full — drop the oldest 25% and retry once.
      try {
        const trimmed = events.slice(Math.floor(events.length * 0.25));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        /* give up — events stay in memory only */
      }
    }
  }, PERSIST_DEBOUNCE_MS);
}

// ──────────────────────────────────────────────────────────────────────
//  Store
// ──────────────────────────────────────────────────────────────────────
interface TelemetryQueueState {
  events: TelemetryEvent[];
  cap: number;
  push: (event: TelemetryEvent) => void;
  drain: (n?: number) => TelemetryEvent[];
  snapshot: () => TelemetryEvent[];
  clearAll: () => void;
  /** Replace the entire buffer — used for "Import" in the dashboard. */
  replaceAll: (events: TelemetryEvent[]) => void;
}

export const useTelemetryQueue = create<TelemetryQueueState>((set, get) => ({
  events: readBuffer(),
  cap: DEFAULT_TELEMETRY_CONFIG.bufferCap,

  push: (event) =>
    set((s) => {
      const next = s.events.length >= s.cap ? s.events.slice(1) : s.events.slice();
      next.push(event);
      schedulePersist(next);
      return { events: next };
    }),

  drain: (n) => {
    const all = get().events.slice();
    const take = typeof n === "number" ? Math.min(n, all.length) : all.length;
    const removed = all.slice(0, take);
    const remaining = all.slice(take);
    schedulePersist(remaining);
    set({ events: remaining });
    return removed;
  },

  snapshot: () => get().events.slice(),

  clearAll: () => {
    schedulePersist([]);
    set({ events: [] });
  },

  replaceAll: (events) => {
    schedulePersist(events);
    set({ events });
  },
}));
