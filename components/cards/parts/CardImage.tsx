"use client";

import { CardType } from "@/lib/types";
import { StratagemIcon } from "@/lib/icons";

const TYPE_TINT: Record<CardType, string> = {
  eagle: "from-accent-yellow/15 to-bg-tertiary",
  orbital: "from-accent-red/15 to-bg-tertiary",
  sentry: "from-accent-green/15 to-bg-tertiary",
  support: "from-accent-cyan/15 to-bg-tertiary",
  backpack: "from-accent-purple/15 to-bg-tertiary",
  utility: "from-bg-secondary to-bg-tertiary",
};

const TYPE_TEXT: Record<CardType, string> = {
  eagle: "text-accent-yellow",
  orbital: "text-accent-red",
  sentry: "text-accent-green",
  support: "text-accent-cyan",
  backpack: "text-accent-purple",
  utility: "text-text-secondary",
};

interface Props {
  type: CardType;
}

export default function CardImage({ type }: Props) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b ${TYPE_TINT[type]}`}
      style={{ height: "180px" }}
    >
      {/* Type icon top-left */}
      <div
        className={`absolute top-2 left-2 ${TYPE_TEXT[type]} drop-shadow-[0_0_6px_currentColor]`}
        style={{ width: "20px", height: "20px", opacity: 0.9 }}
      >
        <StratagemIcon type={type} className="w-full h-full" />
      </div>

      {/* Center icon (placeholder for image asset) */}
      <div className={`absolute inset-0 flex items-center justify-center ${TYPE_TEXT[type]} opacity-90 drop-shadow-[0_0_18px_currentColor]`}>
        <StratagemIcon type={type} className="w-20 h-20" />
      </div>

      {/* Bottom fade overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.6))",
        }}
      />
    </div>
  );
}
