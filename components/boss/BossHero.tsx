"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Faction } from "@/lib/types";
import { FactionIcon } from "@/lib/icons";

const FACTION_GLOW: Record<string, string> = {
  bile_titan: "from-faction-terminid/30 via-bg-tertiary to-bg-secondary",
  factory_strider: "from-faction-automaton/35 via-bg-tertiary to-bg-secondary",
  monolith: "from-faction-illuminate/35 via-bg-tertiary to-bg-secondary",
};

const FACTION_TEXT: Record<Faction, string> = {
  terminid: "text-faction-terminid",
  automaton: "text-faction-automaton",
  illuminate: "text-faction-illuminate",
};

interface Props {
  templateId: string;
  faction: Faction;
  enraged: boolean;
}

export default function BossHero({ templateId, faction, enraged }: Props) {
  const bgClass = FACTION_GLOW[templateId] ?? "from-bg-secondary to-bg-tertiary";

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-gradient-to-br",
        bgClass
      )}
      style={{ height: "220px" }}
    >
      {/* Drift parallax silhouette placeholder */}
      <motion.div
        className={clsx(
          "absolute inset-0 flex items-center justify-center",
          FACTION_TEXT[faction],
          "drop-shadow-[0_0_36px_currentColor]"
        )}
        animate={
          enraged
            ? { x: [0, -3, 3, -2, 2, 0], scale: [1, 1.04, 1] }
            : { y: [0, -4, 0, 4, 0] }
        }
        transition={
          enraged
            ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <FactionIcon faction={faction} className="w-40 h-40" />
      </motion.div>

      {/* Tactical scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 4px)",
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Enrage red pulse overlay */}
      {enraged && (
        <motion.div
          className="absolute inset-0 pointer-events-none bg-accent-red/20"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
