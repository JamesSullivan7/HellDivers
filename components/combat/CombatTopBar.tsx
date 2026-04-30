"use client";

import clsx from "clsx";
import { useGame } from "@/lib/store";

const DIFF_LABELS: Record<number, string> = {
  1: "TRIVIAL", 2: "EASY", 3: "MEDIUM", 4: "CHALLENGING", 5: "HARD",
  6: "EXTREME", 7: "SUICIDE MISSION", 8: "IMPOSSIBLE", 9: "HELLDIVE", 10: "SUPER HELLDIVE",
};

interface Props {
  objective?: string;
}

export default function CombatTopBar({ objective = "ELIMINATE HOSTILES" }: Props) {
  const { player, difficulty, modifiers } = useGame();
  const threatLabel = DIFF_LABELS[difficulty] ?? "UNKNOWN";

  const lowReinforcements = player.reinforcements <= 1;
  const highThreat = difficulty >= 7;

  return (
    <div
      className="border-b border-border-subtle bg-bg-tertiary/85 backdrop-blur-md flex items-center px-tok-4 gap-tok-5 text-[10px] uppercase tracking-[0.25em] font-mono"
      style={{ height: "32px" }}
    >
      <div className="flex items-center gap-tok-2">
        <span className="text-text-dim">OBJECTIVE</span>
        <span className="text-accent-yellow font-bold">{objective}</span>
      </div>
      <span className="w-px h-3 bg-border-strong" />
      <div className="flex items-center gap-tok-2">
        <span className="text-text-dim">REINFORCEMENTS</span>
        <span className={clsx(
          "font-display font-black tabular-nums",
          lowReinforcements ? "text-accent-red" : "text-accent-yellow"
        )}>
          {player.reinforcements}
        </span>
      </div>
      <span className="w-px h-3 bg-border-strong" />
      <div className="flex items-center gap-tok-2">
        <span className="text-text-dim">THREAT</span>
        <span className={clsx(
          "font-display font-black",
          highThreat ? "text-accent-red" : difficulty >= 5 ? "text-accent-yellow" : "text-accent-green"
        )}>
          {threatLabel}
        </span>
        <span className="text-text-dim tabular-nums">[{difficulty}/10]</span>
      </div>
      {modifiers.length > 0 && (
        <>
          <span className="w-px h-3 bg-border-strong" />
          <div className="flex items-center gap-tok-2">
            <span className="text-text-dim">MODS</span>
            <span className="text-accent-red font-bold tabular-nums">{modifiers.length}</span>
          </div>
        </>
      )}
    </div>
  );
}
