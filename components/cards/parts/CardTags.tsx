"use client";

import { Card, CardType } from "@/lib/types";

const TYPE_LABEL: Record<CardType, string> = {
  eagle: "EAGLE",
  orbital: "ORBITAL",
  sentry: "SENTRY",
  support: "SUPPORT",
  backpack: "BACKPACK",
  utility: "UTILITY",
};

function deriveTags(card: Card): string[] {
  const tags: string[] = [TYPE_LABEL[card.type]];
  const eff = card.effect;
  if (card.target === "all") tags.push("AOE");
  else if (card.target === "highest_hp") tags.push("AUTO");
  else if (card.target === "random" && (eff.damageHits ?? 1) > 1) tags.push("MULTI");
  if (eff.burn) tags.push("FIRE");
  if (eff.heal) tags.push("HEAL");
  if (eff.block) tags.push("SHIELD");
  if (eff.chain) tags.push("CHAIN");
  if (eff.stripShield) tags.push("EM");
  if (eff.exhaust) tags.push("EXHAUST");
  if (eff.recurringDamage) tags.push("PERSIST");
  if (eff.ignoreArmor) tags.push("PIERCE");
  return tags.slice(0, 3);
}

interface Props {
  card: Card;
}

export default function CardTags({ card }: Props) {
  const tags = deriveTags(card);
  return (
    <div
      className="flex items-center gap-tok-2 px-tok-3"
      style={{ height: "28px" }}
    >
      {tags.map((t) => (
        <span
          key={t}
          className="border border-border-strong text-text-dim font-mono uppercase tracking-widest"
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            lineHeight: 1,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
