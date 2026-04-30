"use client";

import clsx from "clsx";

interface Props {
  name: string;
  cost: number;
  affordable?: boolean;
}

export default function CardHeader({ name, cost, affordable = true }: Props) {
  return (
    <div
      className="flex items-center justify-between border-b bg-bg-tertiary"
      style={{
        height: "var(--space-7)", // 48px
        paddingLeft: "var(--space-3)",
        paddingRight: "var(--space-2)",
        borderColor: "rgba(255, 211, 77, 0.25)",
      }}
    >
      <div
        className="font-display font-black uppercase text-text-primary truncate"
        style={{ fontSize: "var(--text-md)", letterSpacing: "var(--letter-wide)" }}
      >
        {name}
      </div>
      <div
        className={clsx(
          "shrink-0 flex items-center justify-center font-display font-black tabular-nums border",
          affordable
            ? cost === 0
              ? "border-accent-green text-accent-green"
              : "border-accent-yellow text-accent-yellow"
            : "border-accent-red text-accent-red"
        )}
        style={{
          width: "36px",
          height: "28px",
          fontSize: "var(--text-md)",
        }}
      >
        {cost}R
      </div>
    </div>
  );
}
