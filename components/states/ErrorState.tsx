"use client";

/**
 * ErrorState — themed error fallback with retry / dismiss action.
 *
 *   <ErrorState
 *     headline="LIVE WAR FEED OFFLINE"
 *     detail="Could not contact Super Earth Command. Local data only."
 *     onRetry={() => syncWar()}
 *     onDismiss={() => setHidden(true)}
 *   />
 *
 * Severities drive the accent color:
 *   "info"     — cyan (informational)
 *   "warning"  — orange (degraded but functional)
 *   "error"    — red (failure)
 */

import clsx from "clsx";
import { POLISH_COLOR } from "@/systems/polish/polishTokens";

type ErrorSeverity = "info" | "warning" | "error";

const ACCENT: Record<ErrorSeverity, string> = {
  info: POLISH_COLOR.cyan,
  warning: POLISH_COLOR.orange,
  error: POLISH_COLOR.red,
};

interface Props {
  severity?: ErrorSeverity;
  headline: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorState({
  severity = "error",
  headline,
  detail,
  onRetry,
  retryLabel = "Retry",
  onDismiss,
  className,
}: Props) {
  const accent = ACCENT[severity];
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={clsx("border bg-bg-secondary px-3 py-2 font-mono text-text-primary flex items-start gap-3", className)}
      style={{
        borderColor: `${accent}88`,
        boxShadow: `0 0 12px ${accent}33 inset`,
        borderRadius: 2,
      }}
    >
      {/* Severity rail */}
      <span
        aria-hidden
        className="self-stretch w-[3px]"
        style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className="text-[10px] uppercase tracking-[0.25em] font-black"
            style={{ color: accent }}
          >
            ◢ {severity.toUpperCase()}
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="text-[10px] uppercase tracking-widest text-text-dim hover:text-text-primary"
            >
              ✕
            </button>
          )}
        </div>
        <div className="text-[11px] uppercase tracking-widest font-black">{headline}</div>
        {detail && <p className="text-[10px] leading-snug mt-1 text-text-dim">{detail}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-[10px] uppercase tracking-widest font-black px-2 py-1 border hover:bg-bg-tertiary"
            style={{ color: accent, borderColor: accent, borderRadius: 1 }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
