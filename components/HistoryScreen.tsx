"use client";

/**
 * HISTORY · Mission Record
 * ──────────────────────────────────────────────────────────────────────
 * Service record + the last 20 missions (faction filter, result filter).
 * Reads from account.history + the rich progression mission buffer.
 */

import { useGame } from "@/lib/store";
import HubFrame, { HubCard, HUB_TOKENS as C } from "./hub/HubFrame";
import MissionHistoryList from "./progression/MissionHistoryList";

export default function HistoryScreen() {
  const { account } = useGame();
  const winRate = account.totalRuns > 0
    ? Math.round((account.victories / account.totalRuns) * 100)
    : 0;

  return (
    <HubFrame
      title="Mission Record"
      subtitle="Service History · Last 20 Deployments"
      badge={
        <div
          className="px-3 py-1.5 border"
          style={{ borderColor: `${C.yellow}55`, background: `${C.yellow}10`, borderRadius: 1 }}
        >
          <div className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>
            WIN RATE
          </div>
          <div className="text-base font-display font-black tabular-nums" style={{ color: C.yellow }}>
            {winRate}%
          </div>
        </div>
      }
    >
      {/* Service stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Total Runs"  value={account.totalRuns}                         accent={C.text} />
        <Stat label="Victories"   value={account.victories}                         accent={C.green} />
        <Stat label="Defeats"     value={Math.max(0, account.totalRuns - account.victories)} accent={C.red} />
        <Stat label="Stratagems"  value={account.unlockedCards.length}              accent={C.cyan} />
      </div>

      {/* Mission list */}
      <HubCard title="Deployment Log" accent={C.yellow}>
        <MissionHistoryList />
      </HubCard>
    </HubFrame>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="px-4 py-3 border"
      style={{
        background: `linear-gradient(180deg, rgba(14,18,24,0.92), rgba(10,13,18,0.92))`,
        borderColor: C.rule,
        borderRadius: 1,
      }}
    >
      <div className="text-[8px] uppercase tracking-[0.35em]" style={{ color: C.textDim }}>
        {label}
      </div>
      <div className="text-2xl font-display font-black tabular-nums mt-1" style={{ color: accent }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
