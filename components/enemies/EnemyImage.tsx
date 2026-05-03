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
  /** Enemy display name — overlaid on the portrait. */
  name?: string;
  /**
   * "cover" (default) crops to fill the box top-aligned — historical
   * combat-card behavior.
   * "contain" shows the entire image with letterboxing — used by the
   * redesigned combat EnemyCard so the full creature is visible.
   */
  fit?: "cover" | "contain";
}

export default function EnemyImage({ faction, templateId, name, fit = "cover" }: Props) {
  const art = templateId ? getEnemyArt(templateId) : null;
  const objectFitClass =
    fit === "contain" ? "object-contain" : "object-cover object-top";

  return (
    <div
      className={`relative h-full bg-gradient-to-br ${FACTION_BG[faction]} overflow-hidden`}
    >
      {art ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art}
            alt={name ?? ""}
            className={`absolute inset-0 w-full h-full ${objectFitClass}`}
            draggable={false}
            loading="lazy"
          />
          {/* Bottom darken so the name strip stays legible */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85), transparent 40%)",
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
                "linear-gradient(to top, rgba(0,0,0,0.85), transparent 40%)",
            }}
          />
        </>
      )}

      {/* Name overlay (bottom strip) */}
      {name && (
        <div className="absolute inset-x-0 bottom-0 px-2 pb-1 pt-2 pointer-events-none">
          <div
            className="font-display font-black uppercase text-text-primary truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
            style={{
              fontSize: "11px",
              letterSpacing: "0.08em",
              textShadow: "0 0 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.95)",
            }}
          >
            {name}
          </div>
        </div>
      )}
    </div>
  );
}
