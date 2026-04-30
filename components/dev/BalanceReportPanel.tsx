"use client";

/**
 * BalanceReportPanel — readable rendering of generateBalanceReport().
 * Intended for the dev dashboard. Shows:
 *
 *   - top-line summary (event count, run count, flag count)
 *   - per-section tables (Run / Cards / Enemies / Encounters / Economy)
 *   - flag pills with severity color
 *
 * Pure presentation — pass in a BalanceReport from the dashboard.
 */

import clsx from "clsx";
import type {
  BalanceFlag,
  BalanceReport,
  CardMetric,
  DifficultyCurvePoint,
  EncounterMetric,
  EnemyMetric,
  FlagSeverity,
} from "@/systems/telemetry/telemetryTypes";

const SEVERITY_COLOR: Record<FlagSeverity, string> = {
  info: "var(--color-accent-cyan, #60c4ff)",
  warning: "var(--color-accent-yellow, #f5c542)",
  critical: "var(--color-accent-red, #ff4d4d)",
};

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function num(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

// ──────────────────────────────────────────────────────────────────────
//  Flag pill
// ──────────────────────────────────────────────────────────────────────
function FlagPill({ flag }: { flag: BalanceFlag }) {
  const c = SEVERITY_COLOR[flag.severity];
  return (
    <div
      className="border bg-bg-secondary px-2 py-1.5 font-mono"
      style={{
        borderColor: `${c}99`,
        boxShadow: `0 0 8px ${c}33 inset`,
        borderRadius: 2,
      }}
      title={flag.detail}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span
          className="text-[8px] uppercase tracking-widest font-black"
          style={{ color: c }}
        >
          {flag.severity}
        </span>
        {flag.value !== undefined && (
          <span
            className="text-[9px] font-display font-black tabular-nums"
            style={{ color: c }}
          >
            {flag.value < 1 ? pct(flag.value) : num(flag.value, 1)}
          </span>
        )}
      </div>
      <div className="text-[10px] uppercase tracking-wider font-black truncate">
        {flag.headline}
      </div>
      <div className="text-[9px] text-text-dim mt-0.5 leading-snug">{flag.detail}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Section frame
// ──────────────────────────────────────────────────────────────────────
function Section({
  title,
  summary,
  flags,
  children,
}: {
  title: string;
  summary?: string;
  flags: BalanceFlag[];
  children?: React.ReactNode;
}) {
  return (
    <section
      className="border bg-bg-primary/60 p-3 font-mono"
      style={{ borderColor: "var(--color-border-subtle, #1f2937)", borderRadius: 2 }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-[11px] font-display font-black uppercase tracking-[0.25em]" style={{ color: "var(--color-accent-yellow, #f5c542)" }}>
          {title}
        </h3>
        {summary && (
          <span className="text-[9px] uppercase tracking-widest text-text-dim">{summary}</span>
        )}
      </div>
      {flags.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-2">
          {flags.map((f) => (
            <FlagPill key={f.id} flag={f} />
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Table builders
// ──────────────────────────────────────────────────────────────────────
function RunTable({ rows }: { rows: DifficultyCurvePoint[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <table className="w-full text-[10px] font-mono">
      <thead>
        <tr className="text-text-dim uppercase tracking-widest text-[8px] border-b border-border-subtle">
          <th className="text-left py-1">Difficulty</th>
          <th className="text-right">Runs</th>
          <th className="text-right">Wins</th>
          <th className="text-right">Win Rate</th>
          <th className="text-right">Avg s</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.difficulty} className="border-b border-border-subtle/50">
            <td className="py-1">D{r.difficulty}</td>
            <td className="text-right tabular-nums">{r.runs}</td>
            <td className="text-right tabular-nums">{r.wins}</td>
            <td className="text-right tabular-nums">{pct(r.winRate)}</td>
            <td className="text-right tabular-nums">{Math.round(r.averageDurationSeconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CardTable({ rows }: { rows: CardMetric[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <table className="w-full text-[10px] font-mono">
      <thead>
        <tr className="text-text-dim uppercase tracking-widest text-[8px] border-b border-border-subtle">
          <th className="text-left py-1">Card</th>
          <th className="text-right">Plays</th>
          <th className="text-right">Picks</th>
          <th className="text-right">Pick Rate</th>
          <th className="text-right">Play Rate</th>
          <th className="text-right">Avg DMG</th>
          <th className="text-right">Win % when picked</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 30).map((r) => (
          <tr key={r.cardId} className="border-b border-border-subtle/50">
            <td className="py-1 truncate max-w-[120px]" title={r.cardId}>
              {r.cardId}
            </td>
            <td className="text-right tabular-nums">{r.plays}</td>
            <td className="text-right tabular-nums">{r.picks}</td>
            <td className="text-right tabular-nums">{pct(r.pickRate)}</td>
            <td className="text-right tabular-nums">{pct(r.playRate)}</td>
            <td className="text-right tabular-nums">{num(r.averageDamagePerPlay)}</td>
            <td className="text-right tabular-nums">{pct(r.winRateWhenPicked)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EnemyTable({ rows }: { rows: EnemyMetric[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <table className="w-full text-[10px] font-mono">
      <thead>
        <tr className="text-text-dim uppercase tracking-widest text-[8px] border-b border-border-subtle">
          <th className="text-left py-1">Enemy</th>
          <th className="text-right">Encountered</th>
          <th className="text-right">Kills</th>
          <th className="text-right">Deaths Caused</th>
          <th className="text-right">Avg DMG</th>
          <th className="text-right">Kill Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 30).map((r) => (
          <tr key={r.templateId} className="border-b border-border-subtle/50">
            <td className="py-1 truncate max-w-[140px]" title={r.templateId}>
              {r.templateId}
            </td>
            <td className="text-right tabular-nums">{r.encountered}</td>
            <td className="text-right tabular-nums">{r.kills}</td>
            <td className="text-right tabular-nums">{r.deathsCaused}</td>
            <td className="text-right tabular-nums">{num(r.averageDamageDealt)}</td>
            <td className="text-right tabular-nums">{pct(r.killRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EncounterTable({ rows }: { rows: EncounterMetric[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="space-y-2">
      {rows.slice(0, 20).map((enc) => (
        <div key={enc.encounterId} className="border border-border-subtle p-2" style={{ borderRadius: 1 }}>
          <div className="flex items-center justify-between text-[9px] uppercase tracking-widest mb-1">
            <span className="font-black">{enc.encounterId}</span>
            <span className="text-text-dim">{enc.totalDecisions} picks · top {pct(enc.maxShare)}</span>
          </div>
          <div className="flex flex-col gap-1">
            {enc.options.map((opt) => (
              <div key={opt.optionId} className="flex items-center gap-2 text-[9px]">
                <span className="w-24 truncate">{opt.optionId}</span>
                <div className="flex-1 h-2 bg-bg-tertiary border border-border-subtle relative" style={{ borderRadius: 1 }}>
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${opt.shareWithinEncounter * 100}%`,
                      backgroundColor: "var(--color-accent-yellow, #f5c542)",
                    }}
                  />
                </div>
                <span className="text-right w-12 tabular-nums text-text-dim">{pct(opt.shareWithinEncounter)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EconomyTable({ rows }: { rows: { key: string; value: number }[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <table className="w-full text-[10px] font-mono">
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-b border-border-subtle/50">
            <td className="py-1 text-text-dim uppercase tracking-wider">{r.key}</td>
            <td className="text-right tabular-nums">
              {r.value < 1 && r.value !== 0 ? num(r.value, 2) : r.value.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty() {
  return (
    <div
      className="text-[10px] uppercase tracking-widest text-text-dim border border-dashed py-4 text-center"
      style={{ borderColor: "var(--color-border-subtle, #1f2937)" }}
    >
      NO DATA
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Top-level
// ──────────────────────────────────────────────────────────────────────
export default function BalanceReportPanel({
  report,
  className,
}: {
  report: BalanceReport;
  className?: string;
}) {
  const flagsBy = (sev: FlagSeverity) => report.flags.filter((f) => f.severity === sev).length;
  return (
    <div className={clsx("flex flex-col gap-3 font-mono", className)}>
      {/* Top-line summary */}
      <div
        className="border bg-bg-secondary/80 px-3 py-2 flex items-center gap-3"
        style={{ borderColor: "var(--color-border-subtle, #1f2937)", borderRadius: 2 }}
      >
        <span className="text-[10px] uppercase tracking-widest text-text-dim">REPORT</span>
        <span className="text-[10px] tabular-nums">{report.totalEvents.toLocaleString()} events</span>
        <span className="text-[10px] tabular-nums">{report.totalRuns} runs</span>
        <div className="ml-auto flex items-center gap-2 text-[10px] tabular-nums">
          <span style={{ color: SEVERITY_COLOR.critical }}>{flagsBy("critical")} crit</span>
          <span style={{ color: SEVERITY_COLOR.warning }}>{flagsBy("warning")} warn</span>
          <span style={{ color: SEVERITY_COLOR.info }}>{flagsBy("info")} info</span>
        </div>
      </div>

      <Section title={report.sections.run.title} summary={report.sections.run.summary} flags={report.sections.run.flags}>
        <RunTable rows={report.sections.run.rows} />
      </Section>

      <Section title={report.sections.cards.title} summary={report.sections.cards.summary} flags={report.sections.cards.flags}>
        <CardTable rows={report.sections.cards.rows} />
      </Section>

      <Section title={report.sections.enemies.title} summary={report.sections.enemies.summary} flags={report.sections.enemies.flags}>
        <EnemyTable rows={report.sections.enemies.rows} />
      </Section>

      <Section title={report.sections.encounters.title} summary={report.sections.encounters.summary} flags={report.sections.encounters.flags}>
        <EncounterTable rows={report.sections.encounters.rows} />
      </Section>

      <Section title={report.sections.economy.title} flags={report.sections.economy.flags}>
        <EconomyTable rows={report.sections.economy.rows} />
      </Section>
    </div>
  );
}

