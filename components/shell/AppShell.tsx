"use client";

import { ReactNode } from "react";
import StarField from "../StarField";
import TopBar from "./TopBar";
import LeftNav from "./LeftNav";
import RightContextPanel from "./RightContextPanel";
import BottomTicker from "./BottomTicker";
import { NavKey } from "@/types/shell";

interface Props {
  activeNav: NavKey;
  children: ReactNode;
  rightPanel?: ReactNode;
  rightPanelLabel?: string;
  /** Optional second top bar (e.g., combat-specific). Stacked under global top bar. */
  secondaryTopBar?: ReactNode;
}

export default function AppShell({
  activeNav,
  children,
  rightPanel,
  rightPanelLabel,
  secondaryTopBar,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col text-text-primary">
      <StarField />

      <TopBar />
      {secondaryTopBar && (
        <div className="border-b border-border-subtle bg-bg-tertiary/85 backdrop-blur-md">
          {secondaryTopBar}
        </div>
      )}

      <div className="flex-1 flex relative z-base overflow-hidden">
        <LeftNav active={activeNav} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-tok-5 max-w-[1600px] mx-auto">{children}</div>
        </main>
        {rightPanel && (
          <RightContextPanel label={rightPanelLabel}>{rightPanel}</RightContextPanel>
        )}
      </div>

      <BottomTicker />
    </div>
  );
}
