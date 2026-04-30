"use client";

/**
 * TelemetryToggle — opt-in/out control for the telemetry system.
 *
 *   - Renders a switch with current state
 *   - Explains what's collected (and isn't)
 *   - Confirms before disabling (because it wipes the buffer)
 *
 * Drop into any settings panel:
 *   <TelemetryToggle />
 *
 * Default state is OFF — opting in is explicit.
 */

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useTelemetry } from "@/hooks/useTelemetry";

interface Props {
  className?: string;
  /** Compact mode hides the explainer copy. */
  compact?: boolean;
}

export default function TelemetryToggle({ className, compact }: Props) {
  const tel = useTelemetry();
  // Mirror to local state so the button rerenders without needing to
  // subscribe to a separate store — useTelemetry already triggers a
  // rerender via eventsCount changes when toggled.
  const [enabled, setEnabled] = useState(tel.isEnabled);
  useEffect(() => setEnabled(tel.isEnabled), [tel.isEnabled]);

  const toggle = () => {
    if (enabled) {
      const ok = window.confirm(
        "Disabling telemetry will clear the local event buffer (used by the dev dashboard). Continue?",
      );
      if (!ok) return;
      tel.disable();
      setEnabled(false);
    } else {
      tel.enable();
      setEnabled(true);
    }
  };

  return (
    <div
      className={clsx(
        "border bg-bg-secondary px-3 py-2 font-mono",
        className,
      )}
      style={{ borderColor: "var(--color-border-subtle, #1f2937)", borderRadius: 2 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.25em] font-black" style={{ color: "var(--color-accent-yellow, #f5c542)" }}>
            ANONYMOUS TELEMETRY
          </span>
          {!compact && (
            <span className="text-[9px] uppercase tracking-widest text-text-dim">
              Records gameplay events to help balance the game
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          className="relative inline-flex items-center"
          aria-pressed={enabled}
          aria-label={enabled ? "Disable telemetry" : "Enable telemetry"}
        >
          <span
            className="relative inline-block"
            style={{
              width: 44,
              height: 22,
              backgroundColor: enabled ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${enabled ? "#10B981" : "rgba(255,255,255,0.18)"}`,
              borderRadius: 12,
              boxShadow: enabled ? "0 0 8px rgba(16,185,129,0.4)" : undefined,
              transition: "background-color 200ms, border-color 200ms",
            }}
          >
            <span
              className="absolute top-[2px]"
              style={{
                left: enabled ? 22 : 2,
                width: 16,
                height: 16,
                backgroundColor: enabled ? "#10B981" : "rgba(255,255,255,0.55)",
                borderRadius: 8,
                transition: "left 200ms ease, background-color 200ms",
              }}
            />
          </span>
          <span
            className="ml-2 text-[10px] uppercase tracking-widest"
            style={{ color: enabled ? "#10B981" : "var(--color-text-dim, #8a8d92)" }}
          >
            {enabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      {!compact && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] leading-snug">
          <div>
            <div className="text-text-dim uppercase tracking-widest mb-1">COLLECTED</div>
            <ul className="space-y-0.5">
              <li>· Card plays + damage</li>
              <li>· Run win/loss + duration</li>
              <li>· Encounter choices</li>
              <li>· Anonymous session ID</li>
            </ul>
          </div>
          <div>
            <div className="text-text-dim uppercase tracking-widest mb-1">NEVER COLLECTED</div>
            <ul className="space-y-0.5">
              <li>· Real names or emails</li>
              <li>· IP addresses</li>
              <li>· Chat or messages</li>
              <li>· Any personal data</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
