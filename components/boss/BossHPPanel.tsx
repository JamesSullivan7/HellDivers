"use client";

import clsx from "clsx";

const SEGMENTS = 12;

function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const segmentSize = max / SEGMENTS;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-mono">{label}</span>
        <span className="font-display font-black text-accent-yellow tabular-nums">
          <span className="text-text-primary">{value}</span>
          <span className="text-text-dim mx-0.5">/</span>
          <span className="text-text-secondary">{max}</span>
        </span>
      </div>
      <div className="flex gap-0.5 h-3 bg-black border border-border-strong p-0.5">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          // Segment is filled if its threshold is below current value
          const threshold = (i + 1) * segmentSize;
          const filled = value >= threshold - segmentSize * 0.5;
          return (
            <div
              key={i}
              className={clsx(
                "flex-1 transition-colors",
                filled ? color : "bg-bg-tertiary"
              )}
              style={{ transitionDuration: "120ms" }}
            />
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  hp: number;
  maxHp: number;
  shield: number;
  armor: number;
}

export default function BossHPPanel({ hp, maxHp, shield, armor }: Props) {
  return (
    <div className="space-y-tok-3 p-tok-3 border-r border-border-subtle">
      {shield > 0 && (
        <Bar value={shield} max={Math.max(shield, 20)} color="bg-accent-cyan" label="SHIELD" />
      )}
      <Bar value={hp} max={maxHp} color={hp / maxHp <= 0.25 ? "bg-accent-red" : "bg-accent-green"} label="HP" />
      {armor > 0 && (
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest pt-tok-1 border-t border-border-subtle">
          <span className="text-text-dim">ARMOR</span>
          <span className="text-accent-cyan font-display font-black tabular-nums">{armor}</span>
        </div>
      )}
    </div>
  );
}
