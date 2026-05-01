"use client";

/**
 * DAILY REWARDS · 7-day login chain
 * ──────────────────────────────────────────────────────────────────────
 * Stub-implementation: shows the next-reward countdown + a 7-day reward
 * chain with day 1-3 already claimed (visual demo). Wires up later when
 * the daily-claim engine is implemented in the store.
 */

import { useEffect, useState } from "react";
import HubFrame, { HubButton, HubCard, HUB_TOKENS as C } from "./hub/HubFrame";

interface DailyTier {
  day: number;
  label: string;
  glyph: string;
  accent: string;
  rewards: { medals?: number; samples?: number; requisition?: number };
  state: "claimed" | "available" | "locked";
}

const DAILY_CHAIN: DailyTier[] = [
  { day: 1, label: "Boot Camp",      glyph: "★", accent: "#10b981", rewards: { medals: 25 },                   state: "claimed" },
  { day: 2, label: "First Patrol",   glyph: "◆", accent: "#10b981", rewards: { samples: 4 },                   state: "claimed" },
  { day: 3, label: "Combat Ready",   glyph: "★", accent: "#10b981", rewards: { medals: 50, requisition: 25 },  state: "claimed" },
  { day: 4, label: "Veteran",        glyph: "◆", accent: "#f5c542", rewards: { medals: 60, samples: 6 },       state: "available" },
  { day: 5, label: "Decorated",      glyph: "★", accent: "#60c4ff", rewards: { medals: 80 },                   state: "locked" },
  { day: 6, label: "Hero of Liberty",glyph: "Ⓡ", accent: "#60c4ff", rewards: { requisition: 80 },              state: "locked" },
  { day: 7, label: "Super Earth",    glyph: "✦", accent: "#ff8a28", rewards: { medals: 200, samples: 10, requisition: 50 }, state: "locked" },
];

export default function DailyRewardsScreen() {
  const [time, setTime] = useState({ h: 10, m: 48 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime(({ h, m }) => {
        const total = h * 60 + m - 1;
        if (total <= 0) return { h: 23, m: 59 };
        return { h: Math.floor(total / 60), m: total % 60 };
      });
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <HubFrame
      title="Daily Rewards"
      subtitle="Login Streak · 7-Day Chain"
      badge={
        <div
          className="px-3 py-1.5 border flex items-center gap-2"
          style={{ borderColor: `${C.orange}66`, background: `${C.orange}10`, borderRadius: 1 }}
        >
          <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>NEXT REWARD</span>
          <span className="font-display font-black tabular-nums" style={{ color: C.orange, fontSize: 14 }}>
            {time.h}H {String(time.m).padStart(2, "0")}M
          </span>
        </div>
      }
    >
      <div className="max-w-[1200px] mx-auto">
        <HubCard title="7-Day Reward Chain" accent={C.orange} className="mb-6">
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
            {DAILY_CHAIN.map((tier) => <DayTile key={tier.day} tier={tier} />)}
          </div>
        </HubCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HubCard title="Today's Reward" accent={C.yellow}>
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-16 h-16 flex items-center justify-center border-2"
                style={{
                  borderColor: C.yellow,
                  background: `linear-gradient(135deg, ${C.yellow}28, ${C.yellow}08)`,
                  boxShadow: `0 0 12px ${C.yellow}55`,
                  borderRadius: 1,
                }}
              >
                <span style={{ color: C.yellow, fontSize: 32, lineHeight: 1, textShadow: `0 0 8px ${C.yellow}` }}>◆</span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.textDim }}>Day 4 · Veteran</div>
                <div className="text-[16px] font-display font-black tracking-wider mt-1" style={{ color: C.yellow }}>
                  +60 Medals · +6 Samples
                </div>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed mb-3" style={{ color: C.textMid }}>
              Continue your service streak to unlock the Day 7 commendation: a major
              cache of medals, samples, and requisition.
            </p>
            <HubButton onClick={() => { /* claim hook reserved */ }}>
              Claim Reward
            </HubButton>
          </HubCard>

          <HubCard title="Streak Bonus" accent={C.green}>
            <div className="flex flex-col gap-2 text-[11px]" style={{ color: C.textMid }}>
              <Row label="Current Streak"  value="3 days"   accent={C.green} />
              <Row label="Best Streak"     value="12 days"  accent={C.yellow} />
              <Row label="Next Milestone"  value="7 days"   accent={C.cyan} />
              <Row label="Total Claimed"   value="42 days"  accent={C.text} />
            </div>
            <p className="text-[10px] leading-relaxed mt-3" style={{ color: C.textDim }}>
              Maintain your daily login to earn the Day 7 reward. Missing a day resets
              the streak.
            </p>
          </HubCard>
        </div>
      </div>
    </HubFrame>
  );
}

function DayTile({ tier }: { tier: DailyTier }) {
  const muted = tier.state === "locked";
  const claimed = tier.state === "claimed";
  return (
    <div
      className="relative p-3 flex flex-col items-center gap-2 border text-center"
      style={{
        borderColor: claimed ? C.green : muted ? C.rule : tier.accent,
        background: claimed ? `${C.green}12` : muted ? "transparent" : `${tier.accent}12`,
        opacity: muted ? 0.5 : 1,
        borderRadius: 1,
      }}
    >
      <div className="text-[7px] uppercase tracking-widest" style={{ color: claimed ? C.green : muted ? C.textDim : tier.accent }}>
        DAY {tier.day}
      </div>
      <div
        className="font-display font-black"
        style={{
          color: claimed ? C.green : muted ? C.textDim : tier.accent,
          fontSize: 22,
          lineHeight: 1,
          textShadow: claimed ? `0 0 8px ${C.green}` : muted ? undefined : `0 0 8px ${tier.accent}88`,
        }}
      >
        {claimed ? "✓" : tier.glyph}
      </div>
      <div className="text-[8px] uppercase tracking-widest leading-tight" style={{ color: muted ? C.textDim : C.textMid }}>
        {tier.label}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-baseline justify-between py-1" style={{ borderBottom: `1px solid ${C.rule}` }}>
      <span className="uppercase tracking-[0.2em] text-[10px]" style={{ color: C.textDim }}>{label}</span>
      <span className="font-display font-black tabular-nums" style={{ color: accent }}>{value}</span>
    </div>
  );
}
