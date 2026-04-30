"use client";

interface Status {
  kind: "burn" | "stun" | "shield" | "armor";
  amount?: number;
}

interface Props {
  burn?: number;
  shield?: number;
  armor?: number;
}

const ICON: Record<string, string> = {
  burn: "🔥",
  stun: "✦",
  shield: "⛨",
  armor: "▣",
};

const COLOR: Record<string, string> = {
  burn: "text-accent-red",
  stun: "text-accent-yellow",
  shield: "text-accent-cyan",
  armor: "text-accent-cyan",
};

export default function EnemyStatusRow({ burn = 0, shield = 0, armor = 0 }: Props) {
  const items: Status[] = [];
  if (burn > 0) items.push({ kind: "burn", amount: burn });

  return (
    <div
      className="flex items-center justify-end gap-tok-1 px-tok-3"
      style={{ height: "24px" }}
    >
      {items.map((s) => (
        <span
          key={s.kind}
          className={`flex items-center gap-1 ${COLOR[s.kind]} text-[11px] font-mono font-bold`}
          style={{ lineHeight: 1 }}
        >
          <span style={{ fontSize: "14px" }}>{ICON[s.kind]}</span>
          {s.amount !== undefined && <span className="tabular-nums">{s.amount}</span>}
        </span>
      ))}
    </div>
  );
}
