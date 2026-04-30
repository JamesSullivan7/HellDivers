"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store";
import HudFrame from "./HudFrame";

export default function IntelLog() {
  const { combat } = useGame();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [combat.log.length]);

  return (
    <HudFrame label="Intel Feed" accent="emerald" className="p-2">
      <div className="font-mono text-[11px] h-40 overflow-y-auto pr-1" ref={ref}>
        {combat.log.map((line, i) => {
          const isHeader = line.startsWith(">");
          const isSentry = line.startsWith("  [");
          return (
            <div
              key={i}
              className={
                isHeader
                  ? "text-helldiver-yellow font-bold tracking-wide"
                  : isSentry
                    ? "text-emerald-400"
                    : "text-gray-400"
              }
            >
              {line}
            </div>
          );
        })}
      </div>
    </HudFrame>
  );
}
