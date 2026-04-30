"use client";

import { Faction } from "@/lib/types";
import { FactionIcon } from "@/lib/icons";
import { getEnemyArt } from "@/lib/artManifest";

const FACTION_BG: Record<Faction, string> = {
  terminid: "from-faction-terminid/15 via-bg-tertiary to-bg-secondary",
  automaton: "from-faction-automaton/15 via-bg-tertiary to-bg-secondary",
  illuminate: "from-faction-illuminate/15 via-bg-tertiary to-bg-secondary",
};

const FACTION_TEXT: Record<Faction, string> = {
  terminid: "text-faction-terminid",
  automaton: "text-faction-automaton",
  illuminate: "text-faction-illuminate",
};

interface Props {
  faction: Faction;
  /** Enemy template id — used to look up the portrait. */
  templateId?: string;
}

export default function EnemyImage({ faction, templateId }: Props) {
  const art = templateId ? getEnemyArt(templateId) : null;

  return (
    <div
      className={`relative h-full bg-gradient-to-br ${FACTION_BG[faction]} overflow-hidden`}
    >
      {art ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            draggable={false}
            loading="lazy"
          />
          {/* Faction-tinted edge wash to keep portraits cohesive with the card */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, transparent 55%, rgba(0,0,0,0.55))",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55), transparent 40%)",
            }}
          />
        </>
      ) : (
        <>
          {/* Placeholder silhouette for enemies without a portrait yet */}
          <div className={`absolute inset-0 flex items-center justify-center ${FACTION_TEXT[faction]} opacity-80 drop-shadow-[0_0_18px_currentColor]`}>
            <FactionIcon faction={faction} className="w-16 h-16" />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, transparent 60%, rgba(0,0,0,0.7))",
            }}
          />
        </>
      )}
    </div>
  );
}
