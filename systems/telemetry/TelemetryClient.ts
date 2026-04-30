/**
 * TELEMETRY & BALANCING SYSTEM · client
 * ──────────────────────────────────────────────────────────────────────
 * Single dispatch surface for all gameplay telemetry. Designed to be:
 *
 *   - Non-blocking. trackEvent() is sync push to an in-memory queue.
 *   - Privacy-respecting. Default is OFF; opt-in toggles it on.
 *   - Resilient. Network failures swallow silently; the queue persists.
 *   - Local-friendly. With no endpoint configured, events accumulate in
 *     memory + localStorage so the dev dashboard can read them without a
 *     server.
 *
 * Public API:
 *   trackEvent(type, payload?)    — queue an event
 *   flushEvents()                 — POST batched events if endpoint set
 *   enableTelemetry()
 *   disableTelemetry()
 *   isEnabled() : boolean
 *   setEndpoint(url?: string)
 *   setConfig(partial: Partial<TelemetryConfig>)
 *   exportAsJSON() : string
 *   importFromJSON(json) : number   — returns count imported
 *   clearAll()
 *
 * Auto behavior (initialized via initTelemetryClient()):
 *   - Periodic flush on flushIntervalMs (when endpoint set)
 *   - beforeunload listener fires sendBeacon flush (when endpoint set)
 *   - When telemetry is disabled, trackEvent is a no-op
 */

import {
  DEFAULT_TELEMETRY_CONFIG,
  EVENT_CATEGORY,
  TelemetryConfig,
  TelemetryEvent,
  TelemetryEventType,
} from "./telemetryTypes";
import {
  getActiveRunId,
  getOrCreateAnonymousPlayerId,
  getOrCreateSessionId,
  isTelemetryEnabled,
  setTelemetryEnabled,
  stripPII,
} from "./session";
import { useTelemetryQueue } from "./telemetryQueue";

// ──────────────────────────────────────────────────────────────────────
//  Module-scope mutable config (intentional — single client per app)
// ──────────────────────────────────────────────────────────────────────
let _config: TelemetryConfig = { ...DEFAULT_TELEMETRY_CONFIG };
let _idCounter = 0;
let _periodicTimer: ReturnType<typeof setInterval> | undefined;
let _initialized = false;

function nextEventId(): string {
  return `te_${Date.now().toString(36)}_${(_idCounter++).toString(36)}`;
}

export function setConfig(partial: Partial<TelemetryConfig>): void {
  _config = { ..._config, ...partial };
}

export function getConfig(): TelemetryConfig {
  return _config;
}

export function setEndpoint(url?: string): void {
  setConfig({ endpoint: url });
  // Re-arm the periodic flush.
  rearmPeriodicFlush();
}

// ──────────────────────────────────────────────────────────────────────
//  Track + flush
// ──────────────────────────────────────────────────────────────────────
export function trackEvent<T extends TelemetryEventType>(
  type: T,
  payload: Record<string, unknown> = {},
): void {
  if (!isTelemetryEnabled()) return;
  try {
    const safe = stripPII(payload, _config.piiKeyDenylist);
    const event: TelemetryEvent = {
      id: nextEventId(),
      type,
      category: EVENT_CATEGORY[type] ?? "ui",
      timestamp: Date.now(),
      sessionId: getOrCreateSessionId(),
      runId: getActiveRunId(),
      playerId: getOrCreateAnonymousPlayerId(),
      payload: safe,
    };
    useTelemetryQueue.getState().push(event);

    // Auto-flush when buffer reaches batchSize (only if endpoint is set)
    const events = useTelemetryQueue.getState().events;
    if (_config.endpoint && events.length >= _config.batchSize) {
      void flushEvents();
    }
  } catch {
    // Telemetry must NEVER throw into gameplay.
  }
}

/**
 * Flushes events to the configured endpoint. Returns the number of events
 * sent. Without an endpoint, this is a no-op (events stay in the queue
 * for the dev dashboard).
 */
export async function flushEvents(): Promise<number> {
  if (!_config.endpoint) return 0;
  const queue = useTelemetryQueue.getState();
  const batch = queue.drain(_config.batchSize);
  if (batch.length === 0) return 0;
  try {
    // Use keepalive so an in-flight POST survives unload.
    const ok = await fetch(_config.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok) {
      // Push them back to the front so we retry later.
      queue.replaceAll([...batch, ...queue.snapshot()]);
      return 0;
    }
    return batch.length;
  } catch {
    queue.replaceAll([...batch, ...queue.snapshot()]);
    return 0;
  }
}

/**
 * Best-effort synchronous flush via sendBeacon — used in beforeunload.
 * Does NOT touch the queue if no endpoint is configured.
 */
export function flushBeacon(): void {
  if (typeof navigator === "undefined") return;
  if (!_config.endpoint || !navigator.sendBeacon) return;
  try {
    const queue = useTelemetryQueue.getState();
    const batch = queue.drain();
    if (batch.length === 0) return;
    const blob = new Blob([JSON.stringify({ events: batch })], { type: "application/json" });
    const ok = navigator.sendBeacon(_config.endpoint, blob);
    if (!ok) {
      // Failed to enqueue — restore so we try again on next load.
      queue.replaceAll(batch);
    }
  } catch {
    /* ignore */
  }
}

// ──────────────────────────────────────────────────────────────────────
//  Enable / disable
// ──────────────────────────────────────────────────────────────────────
export function enableTelemetry(): void {
  setTelemetryEnabled(true);
  // Track the toggle itself (the call will enqueue since we just enabled).
  trackEvent("telemetry_enabled", {});
  rearmPeriodicFlush();
}

export function disableTelemetry(): void {
  // Track BEFORE flipping so the disable event itself is captured.
  trackEvent("telemetry_disabled", {});
  setTelemetryEnabled(false);
  // Stop periodic flush — no point if nothing's being tracked.
  if (_periodicTimer) {
    clearInterval(_periodicTimer);
    _periodicTimer = undefined;
  }
  // Wipe the queue so disabled means disabled.
  useTelemetryQueue.getState().clearAll();
}

export function isEnabled(): boolean {
  return isTelemetryEnabled();
}

// ──────────────────────────────────────────────────────────────────────
//  Import / export — for dev dashboard
// ──────────────────────────────────────────────────────────────────────
export function exportAsJSON(): string {
  const events = useTelemetryQueue.getState().snapshot();
  return JSON.stringify({ exportedAt: Date.now(), eventCount: events.length, events }, null, 2);
}

export function importFromJSON(json: string): number {
  try {
    const parsed = JSON.parse(json);
    const events = (Array.isArray(parsed) ? parsed : parsed?.events) as TelemetryEvent[] | undefined;
    if (!events || !Array.isArray(events)) return 0;
    useTelemetryQueue.getState().replaceAll(events);
    return events.length;
  } catch {
    return 0;
  }
}

export function clearAll(): void {
  useTelemetryQueue.getState().clearAll();
}

// ──────────────────────────────────────────────────────────────────────
//  Init — wire the periodic + unload listeners. Idempotent.
// ──────────────────────────────────────────────────────────────────────
function rearmPeriodicFlush(): void {
  if (typeof window === "undefined") return;
  if (_periodicTimer) {
    clearInterval(_periodicTimer);
    _periodicTimer = undefined;
  }
  if (_config.endpoint && isTelemetryEnabled()) {
    _periodicTimer = setInterval(() => {
      void flushEvents();
    }, _config.flushIntervalMs);
  }
}

export function initTelemetryClient(): void {
  if (_initialized || typeof window === "undefined") return;
  _initialized = true;
  rearmPeriodicFlush();
  window.addEventListener("beforeunload", () => {
    flushBeacon();
  });
  // visibilitychange catches tab close on mobile reliably.
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushBeacon();
  });
}
