"use client";

import { EnemyIntent as Intent } from "@/lib/types";
import clsx from "clsx";

const KIND_ICON: Record<string, string> = {
  attack: "⚡",
  attack_all: "⚡",
  buff: "↑",
  armor: "⛨",
  wait: "⏳",
};

const KIND_TEXT: Record<string, string> = {
  attack: "text-accent-red",
  attack_all: "text-accent-red",
  buff: "text-accent-cyan",
  armor: "text-accent-cyan",
  wait: "text-accent-yellow",
};

interface Props {
  intent: Intent;
  fogged?: boolean;
}

export default function EnemyIntent({ intent, fogged }: Props) {
  const icon = KIND_ICON[intent.kind] ?? "?";
  const colorClass = fogged ? "text-text-dim" : KIND_TEXT[intent.kind] ?? "text-text-primary";
  return (
    <div
      className="border-t border-border-subtle px-tok-3 flex items-start gap-tok-2"
      style={{ height: "64px", paddingTop: "var(--space-2)", paddingBottom: "var(--space-2)" }}
    >
      <span
        className={clsx("font-display font-black shrink-0 leading-none", colorClass)}
        style={{ fontSize: "20px" }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] uppercase tracking-widest text-text-dim leading-tight">
          NEXT MOVE
        </div>
        <div
          className={clsx("font-mono leading-snug", fogged ? "text-text-dim" : "text-text-primary")}
          style={{ fontSize: "12px" }}
        >
          {fogged ? "??? — Heavy Fog" : (
            <>
              {intent.text.replace(/\d+/g, (n) => n).split(/(\d+)/).map((seg, i) =>
                /^\d+$/.test(seg) ? (
                  <span key={i} className="text-accent-yellow font-bold">{seg}</span>
                ) : (
                  <span key={i}>{seg}</span>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
