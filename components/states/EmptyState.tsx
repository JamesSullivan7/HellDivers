"use client";

/**
 * EmptyState — themed placeholder for empty lists.
 *
 *   <EmptyState
 *     glyph="◇"
 *     headline="NO MISSIONS RECORDED"
 *     detail="Complete a deployment to populate your service record."
 *     action={<button>Deploy</button>}
 *   />
 */

import clsx from "clsx";
import { POLISH_COLOR } from "@/systems/polish/polishTokens";

interface Props {
  glyph?: React.ReactNode;
  headline: string;
  detail?: string;
  action?: React.ReactNode;
  /** When true, renders compact (single-row) — useful inside small panels. */
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  glyph = "◇",
  headline,
  detail,
  action,
  compact,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "flex font-mono text-text-primary",
        compact ? "items-center gap-3 px-3 py-2" : "flex-col items-center text-center gap-2 px-4 py-6",
        "border border-dashed",
        className,
      )}
      style={{
        borderColor: POLISH_COLOR.borderSubtle,
        borderRadius: 2,
        backgroundColor: "transparent",
      }}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={clsx(
          "font-display font-black",
          compact ? "text-base" : "text-3xl",
          "leading-none",
        )}
        style={{ color: POLISH_COLOR.textDim, opacity: 0.65 }}
      >
        {glyph}
      </span>
      <div className={compact ? "flex-1 min-w-0" : ""}>
        <div
          className={clsx(
            "font-display font-black uppercase tracking-[0.25em]",
            compact ? "text-[10px]" : "text-[11px]",
          )}
          style={{ color: POLISH_COLOR.textDim }}
        >
          {headline}
        </div>
        {detail && (
          <p
            className={clsx(
              "leading-snug mt-1",
              compact ? "text-[10px]" : "text-[11px]",
            )}
            style={{ color: POLISH_COLOR.textDim }}
          >
            {detail}
          </p>
        )}
      </div>
      {action && <div className={compact ? "" : "mt-2"}>{action}</div>}
    </div>
  );
}
