"use client";

import { CardType } from "@/lib/types";
import { StratagemIcon } from "@/lib/icons";

const TYPE_TEXT: Record<CardType, string> = {
  eagle: "text-accent-yellow",
  orbital: "text-accent-red",
  sentry: "text-accent-green",
  support: "text-accent-cyan",
  backpack: "text-accent-purple",
  utility: "text-text-secondary",
};

const TYPE_PREFIX: Record<CardType, string> = {
  eagle: "EAG",
  orbital: "ORB",
  sentry: "SEN",
  support: "SUP",
  backpack: "BAK",
  utility: "UTL",
};

interface Props {
  type: CardType;
  cardId: string;
  rarity: string;
}

export default function CardFooter({ type, cardId, rarity }: Props) {
  // Deterministic 3-digit code from card id
  let h = 0;
  for (let i = 0; i < cardId.length; i++) h = (h * 31 + cardId.charCodeAt(i)) >>> 0;
  const code = (h % 999).toString().padStart(3, "0");
  return (
    <div
      className="flex items-center justify-between px-tok-3 border-t border-border-subtle"
      style={{ height: "40px" }}
    >
      <div className={`${TYPE_TEXT[type]} opacity-90`}>
        <StratagemIcon type={type} className="w-4 h-4" />
      </div>
      <div
        className="font-mono uppercase tracking-widest text-text-dim"
        style={{ fontSize: "10px", opacity: 0.5 }}
      >
        STRAT-{TYPE_PREFIX[type]}-{code} · {rarity.slice(0, 3)}
      </div>
    </div>
  );
}
