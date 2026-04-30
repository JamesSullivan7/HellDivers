"use client";

/**
 * useTelemetry — bundled hook for components that emit or display
 * telemetry. Exposes the client API + a live event count + the current
 * opt-in state.
 *
 *   trackEvent(type, payload?)
 *   flushEvents()
 *   enable() / disable()
 *   isEnabled
 *   eventsCount
 *   exportAsJSON / importFromJSON / clearAll
 *   generateReport()              — convenience that snapshots the queue
 */

import { useMemo } from "react";
import { useTelemetryQueue } from "@/systems/telemetry/telemetryQueue";
import {
  clearAll,
  disableTelemetry,
  enableTelemetry,
  exportAsJSON,
  flushEvents,
  importFromJSON,
  isEnabled,
  setEndpoint,
  trackEvent,
} from "@/systems/telemetry/TelemetryClient";
import { generateBalanceReport } from "@/systems/telemetry/balanceReport";

export function useTelemetry() {
  const events = useTelemetryQueue((s) => s.events);
  const eventsCount = events.length;
  // We re-read the flag every render — cheap. The toggle component will
  // also call enable/disable, which triggers a queue mutation.
  const enabled = isEnabled();

  const generateReport = useMemo(
    () => () => generateBalanceReport(events),
    [events],
  );

  return {
    eventsCount,
    isEnabled: enabled,

    trackEvent,
    flushEvents,
    enable: enableTelemetry,
    disable: disableTelemetry,
    setEndpoint,
    exportAsJSON,
    importFromJSON,
    clearAll,

    generateReport,
    snapshot: events,
  };
}
