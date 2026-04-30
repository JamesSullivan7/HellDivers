/**
 * TELEMETRY & BALANCING SYSTEM · session + identity + opt-in
 * ──────────────────────────────────────────────────────────────────────
 * Central place for the *identity* concerns — kept separate from the
 * client + queue so opt-in/out, session tokens, and run ids are easy to
 * audit.
 *
 * Privacy guarantees:
 *   - No real-identity fields live here. sessionId / playerId are random
 *     UUID-style tokens generated on first use.
 *   - Opt-in state is stored in localStorage as a single boolean. Default
 *     is OFF (telemetry must be enabled explicitly).
 *   - Disabling clears the buffer + sessionId + playerId.
 */

const STORAGE = {
  optIn: "helldivers_telemetry_optin",
  sessionId: "helldivers_telemetry_session",
  playerId: "helldivers_telemetry_player",
};

// ──────────────────────────────────────────────────────────────────────
//  Random id generation — small, dependency-free, opaque
// ──────────────────────────────────────────────────────────────────────
function randomToken(prefix: string): string {
  // 12 bytes of randomness is plenty for an in-app analytics id.
  // Using crypto.getRandomValues when available; fallback to Math.random
  // for SSR / non-secure contexts.
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(bytes);
    let out = prefix + "_";
    for (const b of bytes) out += b.toString(16).padStart(2, "0");
    return out;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

export function generateSessionId(): string {
  return randomToken("ses");
}

export function generateRunId(): string {
  return randomToken("run");
}

export function generateAnonymousPlayerId(): string {
  return randomToken("p");
}

// ──────────────────────────────────────────────────────────────────────
//  Opt-in
// ──────────────────────────────────────────────────────────────────────
export function isTelemetryEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE.optIn) === "1";
  } catch {
    return false;
  }
}

export function setTelemetryEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE.optIn, value ? "1" : "0");
    if (!value) {
      // Clean wipe of identity tokens when disabling.
      window.localStorage.removeItem(STORAGE.sessionId);
      window.localStorage.removeItem(STORAGE.playerId);
    }
  } catch {
    /* best-effort */
  }
}

// ──────────────────────────────────────────────────────────────────────
//  Session + player ids — created lazily on first read
// ──────────────────────────────────────────────────────────────────────
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateSessionId();
  try {
    const existing = window.localStorage.getItem(STORAGE.sessionId);
    if (existing) return existing;
    const fresh = generateSessionId();
    window.localStorage.setItem(STORAGE.sessionId, fresh);
    return fresh;
  } catch {
    return generateSessionId();
  }
}

export function rotateSessionId(): string {
  const fresh = generateSessionId();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE.sessionId, fresh);
    } catch {
      /* ignore */
    }
  }
  return fresh;
}

export function getOrCreateAnonymousPlayerId(): string {
  if (typeof window === "undefined") return generateAnonymousPlayerId();
  try {
    const existing = window.localStorage.getItem(STORAGE.playerId);
    if (existing) return existing;
    const fresh = generateAnonymousPlayerId();
    window.localStorage.setItem(STORAGE.playerId, fresh);
    return fresh;
  } catch {
    return generateAnonymousPlayerId();
  }
}

// ──────────────────────────────────────────────────────────────────────
//  PII stripping — the safety net for trackEvent payloads
// ──────────────────────────────────────────────────────────────────────
export function stripPII<T extends Record<string, unknown>>(
  payload: T,
  denylist: readonly string[],
): T {
  const out: Record<string, unknown> = {};
  const lowerDeny = denylist.map((k) => k.toLowerCase());
  for (const [k, v] of Object.entries(payload)) {
    if (lowerDeny.some((d) => k.toLowerCase().includes(d))) continue;
    out[k] = v;
  }
  return out as T;
}

// ──────────────────────────────────────────────────────────────────────
//  Run id — held in module scope for the active run (reset on run start).
// ──────────────────────────────────────────────────────────────────────
let _activeRunId: string | undefined;

export function startRun(): string {
  _activeRunId = generateRunId();
  return _activeRunId;
}

export function endRun(): void {
  _activeRunId = undefined;
}

export function getActiveRunId(): string | undefined {
  return _activeRunId;
}
