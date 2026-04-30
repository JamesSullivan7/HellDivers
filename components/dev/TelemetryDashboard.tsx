"use client";

/**
 * TelemetryDashboard — dev-only panel for inspecting the live event log
 * and viewing the generated balance report.
 *
 * Sections:
 *   - Header (event count, opt-in status, action buttons)
 *   - Tabs: Events feed | Balance report
 *
 * Actions:
 *   Generate / refresh report
 *   Export JSON (downloads a file)
 *   Import JSON (paste-in textarea)
 *   Clear all
 *   Toggle telemetry on/off
 *
 * Mount this anywhere — it's self-contained. Recommended:
 *   - Keep behind a dev guard (process.env.NODE_ENV === "development")
 *   - Or stash on a hidden /dev route
 */

import { useMemo, useState } from "react";
import clsx from "clsx";
import { useTelemetry } from "@/hooks/useTelemetry";
import BalanceReportPanel from "./BalanceReportPanel";
import type { BalanceReport, TelemetryEvent } from "@/systems/telemetry/telemetryTypes";

type Tab = "events" | "report";

export default function TelemetryDashboard({ className }: { className?: string }) {
  const tel = useTelemetry();
  const [tab, setTab] = useState<Tab>("report");
  const [importText, setImportText] = useState("");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const report: BalanceReport = useMemo(() => tel.generateReport(), [tel.snapshot]);

  const exportToFile = () => {
    const json = tel.exportAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `helldivers_telemetry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tryImport = () => {
    if (!importText.trim()) return;
    const n = tel.importFromJSON(importText);
    setImportFeedback(n > 0 ? `Imported ${n} events.` : "Could not parse — expected { events: [...] } or array.");
    if (n > 0) setImportText("");
    setTimeout(() => setImportFeedback(null), 4000);
  };

  return (
    <div
      className={clsx(
        "border bg-bg-primary/95 font-mono text-text-primary",
        "flex flex-col max-h-[80vh]",
        className,
      )}
      style={{ borderColor: "var(--color-border-subtle, #1f2937)", borderRadius: 2 }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b flex items-center gap-3"
        style={{ borderColor: "var(--color-border-subtle, #1f2937)" }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.3em] font-display font-black"
          style={{ color: "var(--color-accent-yellow, #f5c542)" }}
        >
          ◢ TELEMETRY
        </span>
        <span className="text-[10px] tabular-nums">{tel.eventsCount.toLocaleString()} events</span>
        <span
          className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border"
          style={{
            color: tel.isEnabled ? "#10B981" : "var(--color-text-dim, #8a8d92)",
            borderColor: tel.isEnabled ? "#10B981" : "var(--color-text-dim, #8a8d92)",
            borderRadius: 1,
          }}
        >
          {tel.isEnabled ? "RECORDING" : "PAUSED"}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <DashButton onClick={tel.isEnabled ? tel.disable : tel.enable}>
            {tel.isEnabled ? "Disable" : "Enable"}
          </DashButton>
          <DashButton onClick={exportToFile} disabled={tel.eventsCount === 0}>
            Export
          </DashButton>
          <DashButton
            onClick={() => {
              if (confirm("Clear all telemetry events?")) tel.clearAll();
            }}
            disabled={tel.eventsCount === 0}
            danger
          >
            Clear
          </DashButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2 flex items-center gap-2 border-b border-border-subtle/50">
        {(["report", "events"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              "text-[10px] uppercase tracking-widest px-2 py-1 border-b-2",
              tab === t
                ? "border-accent-yellow text-accent-yellow"
                : "border-transparent text-text-dim hover:text-text-primary",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "report" ? (
          <BalanceReportPanel report={report} />
        ) : (
          <EventsFeed events={tel.snapshot} />
        )}
      </div>

      {/* Import — only on report tab */}
      {tab === "report" && (
        <div
          className="px-3 py-2 border-t flex flex-col gap-1.5"
          style={{ borderColor: "var(--color-border-subtle, #1f2937)" }}
        >
          <label className="text-[9px] uppercase tracking-widest text-text-dim">Import JSON</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={2}
            placeholder='{"events":[...]}'
            className="w-full text-[10px] font-mono bg-bg-tertiary border px-2 py-1"
            style={{ borderColor: "var(--color-border-subtle, #1f2937)", borderRadius: 1 }}
          />
          <div className="flex items-center gap-2">
            <DashButton onClick={tryImport} disabled={!importText.trim()}>
              Import
            </DashButton>
            {importFeedback && (
              <span className="text-[9px] uppercase tracking-widest text-accent-yellow">{importFeedback}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Events feed — last N
// ──────────────────────────────────────────────────────────────────────
function EventsFeed({ events }: { events: TelemetryEvent[] }) {
  if (events.length === 0) {
    return (
      <div
        className="text-[10px] uppercase tracking-widest text-text-dim border border-dashed py-4 text-center"
        style={{ borderColor: "var(--color-border-subtle, #1f2937)" }}
      >
        NO EVENTS RECORDED
      </div>
    );
  }
  // Show newest 200 — everything else is in the report
  const last = events.slice(-200).reverse();
  return (
    <div className="flex flex-col gap-0.5 text-[10px] font-mono">
      {last.map((ev) => (
        <div
          key={ev.id}
          className="flex items-center gap-2 px-2 py-1 border-b border-border-subtle/40"
        >
          <span className="text-text-dim text-[8px] uppercase tracking-widest w-14 shrink-0">
            {ev.category}
          </span>
          <span
            className="text-[10px] uppercase tracking-wider font-black w-32 shrink-0"
            style={{ color: "var(--color-accent-yellow, #f5c542)" }}
          >
            {ev.type}
          </span>
          <span className="text-text-dim text-[9px] truncate flex-1">{JSON.stringify(ev.payload)}</span>
          <span className="text-text-dim text-[8px] tabular-nums">
            {new Date(ev.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Action button
// ──────────────────────────────────────────────────────────────────────
function DashButton({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const accent = danger ? "var(--color-accent-red, #ff4d4d)" : "var(--color-accent-yellow, #f5c542)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "text-[10px] uppercase tracking-widest px-2 py-1 border font-black",
        "transition-colors",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-bg-secondary",
      )}
      style={{ color: accent, borderColor: accent, borderRadius: 1 }}
    >
      {children}
    </button>
  );
}
