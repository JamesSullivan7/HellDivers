"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import CardView from "../CardView";
import { cardPlayExit } from "@/systems/animation/presets/cardAnimations";

interface Props {
  onCardClick: (idx: number) => void;
}

/**
 * PLAYER HAND — fanned card layout
 *
 *   Cards overlap horizontally and curve into a subtle fan, the way a
 *   physical hand of cards reads at a glance. Hovering or selecting a
 *   card lifts it out of the fan: it straightens to vertical, rises
 *   above the others, and scales up so every line of effect copy is
 *   readable. This keeps the strip narrow enough that a 7-card hand
 *   never pushes the viewport, while preserving full-card legibility
 *   on the one card the player cares about.
 *
 *   Math:
 *     middleIdx = (count - 1) / 2
 *     offset    = idx - middleIdx
 *     rotation  = offset * FAN_ROTATION_DEG  (fan curve)
 *     yOffset   = |offset| * FAN_DEPTH_PX    (parabolic dip)
 *     overlap   = OVERLAP_PX (negative margin)
 *
 *   At hover/select: rotation 0, y -28, scale 1.18, z 100.
 */
const FAN_ROTATION_DEG = 4;   // tilt per card from centre
const FAN_DEPTH_PX     = 6;   // y-dip per card from centre (creates arc)
const OVERLAP_PX       = 64;  // how much each card overlaps the previous

export default function PlayerHand({ onCardClick }: Props) {
  const { combat, player } = useGame();
  const selected = combat.selectedCardIndex;
  const needsTarget =
    selected !== null ? combat.hand[selected]?.target === "single" : false;
  const [hovered, setHovered] = useState<number | null>(null);
  const total = combat.hand.length;
  const middleIdx = (total - 1) / 2;

  return (
    <div className="border-t border-accent-yellow/30 bg-bg-tertiary/40 backdrop-blur-sm shrink-0 relative">
      {/* SELECT TARGET prompt — overlay */}
      {selected !== null && needsTarget && (
        <div className="absolute right-3 top-1 z-10 text-accent-yellow font-display font-bold animate-blink text-[9px] tracking-[0.25em] uppercase">
          ▶ SELECT TARGET
        </div>
      )}

      {/*
        Hand container — flex centred + items-end so cards anchor to the
        bottom of the strip and the fan curls UP. overflow-visible on the
        outer container is critical so a hovered/selected card can rise
        above the strip without being clipped.
      */}
      <div
        className="relative flex items-end justify-center pb-2 pt-3"
        style={{ minHeight: 250, overflow: "visible" }}
      >
        <AnimatePresence>
          {combat.hand.map((card, idx) => {
            const offset = idx - middleIdx;
            const baseRotation = total > 1 ? offset * FAN_ROTATION_DEG : 0;
            const baseY        = total > 1 ? Math.abs(offset) * FAN_DEPTH_PX : 0;
            const isHovered = hovered === idx;
            const isSelected = selected === idx;
            const isFocused = isHovered || isSelected;

            return (
              <motion.div
                key={`${card.id}-${idx}`}
                layout
                variants={cardPlayExit}
                initial="initial"
                animate={
                  isFocused
                    ? { rotate: 0, y: isSelected ? -42 : -28, scale: 1.18 }
                    : { rotate: baseRotation, y: baseY, scale: 1 }
                }
                exit="exit"
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered((cur) => (cur === idx ? null : cur))}
                onFocus={() => setHovered(idx)}
                onBlur={() => setHovered((cur) => (cur === idx ? null : cur))}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                style={{
                  // Overlap: every card after the first pulls left so they
                  // share a much narrower footprint. First card has no
                  // negative margin so the fan is centered correctly.
                  marginLeft: idx === 0 ? 0 : -OVERLAP_PX,
                  // z-index priority: focused card on top, otherwise nearer
                  // the centre of the fan = higher (so the centre arches
                  // forward visually).
                  zIndex: isFocused ? 100 : 10 + (total - Math.abs(offset)),
                  transformOrigin: "center bottom",
                  // Drop shadow lifts on focus so the card reads as floating
                  filter: isFocused
                    ? "drop-shadow(0 12px 24px rgba(0,0,0,0.6))"
                    : "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
                }}
              >
                <CardView
                  card={card}
                  size="tight"
                  selected={isSelected}
                  affordable={player.requisition >= card.cost}
                  onClick={() => onCardClick(idx)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
