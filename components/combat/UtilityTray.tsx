"use client";

/**
 * UTILITY TRAY · combat-side ability widget
 *
 * Three persistent helldiver utilities with limited charges:
 *   • REINFORCE — heals 12 HP. 1 charge per RUN. Never refills.
 *   • STIM      — heals 5 HP. 2 charges per COMBAT. Refills on combat start.
 *   • RESUPPLY  — draws 2 cards + 1 R. 2 charges per RUN. Never refills.
 *
 * These used to be cards in the deck; the user requested they live as
 * a slim ability strip outside the hand so the hand always carries 4
 * actual stratagem cards.
 *
 * Visual: thin horizontal strip, three small square buttons. Each
 * shows a glyph + dot strip for remaining charges (e.g. ●● = 2 of 2).
 * Disabled state when charges are 0.
 */

import clsx from "clsx";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";

interface UtilityDef {
  kind: "reinforce" | "stim" | "resupply";
  label: string;
  glyph: string;
  /** Total charges this utility can ever hold (caps the dot strip). */
  total: number;
  /** "RUN" or "COMBAT" — shown as a tiny scope hint under the label. */
  scope: "RUN" | "COMBAT";
  /** Tint for the button border + glyph. */
  tint: string;
  /** One-line tooltip describing the effect. */
  tooltip: string;
}

const UTILITIES: UtilityDef[] = [
  {
    kind: "reinforce",
    label: "REINFORCE",
    glyph: "✚",
    total: 1,
    scope: "RUN",
    tint: "#10b981",
    tooltip: "Reinforce · Heal 12 HP. 1 use per run.",
  },
  {
    kind: "stim",
    label: "STIM",
    glyph: "▲",
    total: 2,
    scope: "COMBAT",
    tint: "#60c4ff",
    tooltip: "Stim · Heal 5 HP. 2 uses per combat (refills each fight).",
  },
  {
    kind: "resupply",
    label: "RESUPPLY",
    glyph: "◆",
    total: 2,
    scope: "RUN",
    tint: "#FFC72C",
    tooltip: "Resupply · Draw 2 cards, +1 R. 2 uses per run.",
  },
];

export default function UtilityTray() {
  const stimCharges = useGame((s) => s.combat.stimCharges);
  const runUtility = useGame((s) => s.runUtility);
  const useUtility = useGame((s) => s.useUtility);

  const chargeFor = (kind: UtilityDef["kind"]) => {
    if (kind === "stim") return stimCharges;
    if (kind === "resupply") return runUtility.resupply;
    return runUtility.reinforce;
  };

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1.5 pointer-events-auto"
      style={{
        background: "rgba(7,11,16,0.85)",
        border: "1px solid rgba(255,199,44,0.18)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <span className="text-[8px] uppercase tracking-[0.32em] text-helldiver-yellow font-display font-black mr-1">
        Utility
      </span>
      {UTILITIES.map((u) => {
        const charges = chargeFor(u.kind);
        const disabled = charges <= 0;
        return (
          <motion.button
            key={u.kind}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                sfx.alert();
                return;
              }
              sfx.unlock();
              useUtility(u.kind);
            }}
            whileHover={disabled ? undefined : { scale: 1.05 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            title={u.tooltip}
            className={clsx(
              "relative flex flex-col items-center justify-center px-2 py-1 transition-all",
              disabled && "opacity-40 cursor-not-allowed",
            )}
            style={{
              minWidth: 64,
              border: `1px solid ${disabled ? "rgba(255,255,255,0.15)" : u.tint}`,
              background: disabled ? "rgba(0,0,0,0.4)" : `${u.tint}10`,
              color: disabled ? "rgba(255,255,255,0.45)" : u.tint,
              boxShadow: disabled ? "none" : `0 0 6px ${u.tint}33`,
            }}
          >
            {/* Glyph + label */}
            <div className="flex items-center gap-1 leading-none">
              <span className="font-display font-black text-sm">{u.glyph}</span>
              <span className="text-[9px] uppercase tracking-[0.22em] font-display font-black">
                {u.label}
              </span>
            </div>
            {/* Dot strip — full = filled, used = hollow */}
            <div className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: u.total }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5"
                  style={{
                    background: i < charges ? u.tint : "transparent",
                    border: `1px solid ${i < charges ? u.tint : "rgba(255,255,255,0.25)"}`,
                  }}
                />
              ))}
              <span className="text-[7px] uppercase tracking-[0.2em] ml-1 opacity-60">
                {u.scope}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
