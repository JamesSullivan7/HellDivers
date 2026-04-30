"use client";

import { ReactNode, useEffect } from "react";
import StarField from "../StarField";
import TopBar from "../shell/TopBar";
import BottomTicker from "../shell/BottomTicker";
import CombatTopBar from "./CombatTopBar";
import EventFeed from "./EventFeed";
import RightPanel from "./RightPanel";
import AnimationRunner from "@/systems/animation/AnimationRunner";
import EnrageCinematic from "../effects/EnrageCinematic";
import { sfx } from "@/lib/sfx";
import { useGame } from "@/lib/store";

interface Props {
  /** Center battlefield content (enemies, etc.) */
  battlefield: ReactNode;
  /** Player hand bar at the bottom */
  hand: ReactNode;
  /** Action bar (R counter, End Turn, Draw info) */
  actionBar: ReactNode;
  /** Optional timeline strip below the top bar (Phase 5) */
  timeline?: ReactNode;
  /** Optional overlays (StratagemCodeOverlay, damage flash, etc.) */
  overlays?: ReactNode;
}

/**
 * Full combat HUD per Batch 6:
 *   [ TOP BAR (global) ]
 *   [ MISSION BAR (combat-specific) ]
 *   [ TIMELINE ]
 *   [ COMBAT FIELD                    ]
 *   [ LEFT FEED | center | RIGHT PANEL ]
 *   [ ACTION BAR + HAND ]
 *   [ BOTTOM TICKER ]
 */
export default function CombatLayout({
  battlefield,
  hand,
  actionBar,
  timeline,
  overlays,
}: Props) {
  const enemies = useGame((s) => s.combat.enemies);
  const hasBoss = enemies.some((e) => e.isBoss && e.hp > 0);

  // Ambient combat hum — start on mount, stop on unmount
  useEffect(() => {
    sfx.ambientStart();
    return () => sfx.ambientStop();
  }, []);

  // Boss rumble — runs while a boss is alive on the field
  useEffect(() => {
    if (hasBoss) sfx.bossRumbleStart();
    else sfx.bossRumbleStop();
    return () => sfx.bossRumbleStop();
  }, [hasBoss]);

  return (
    <div className="min-h-screen flex flex-col text-text-primary relative">
      <StarField />
      <AnimationRunner />
      <EnrageCinematic />

      {overlays}

      <TopBar />
      <CombatTopBar />
      {timeline}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] min-h-0 relative z-base">
        {/* Left: Event Feed */}
        <div className="hidden lg:flex flex-col p-tok-3 min-h-0">
          <EventFeed />
        </div>

        {/* Center: Battlefield */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          {battlefield}
        </div>

        {/* Right: Player/Enemy/Global tabs */}
        <div className="hidden lg:flex flex-col p-tok-3 min-h-0">
          <RightPanel />
        </div>
      </div>

      {/* Action bar + Hand */}
      {actionBar}
      {hand}

      <BottomTicker />
    </div>
  );
}
