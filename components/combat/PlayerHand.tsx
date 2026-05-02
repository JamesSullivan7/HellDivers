"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import CardView from "../CardView";
import { cardPlayExit } from "@/systems/animation/presets/cardAnimations";

interface Props {
  onCardClick: (idx: number) => void;
}

export default function PlayerHand({ onCardClick }: Props) {
  const { combat, player } = useGame();
  const selected = combat.selectedCardIndex;
  const needsTarget =
    selected !== null ? combat.hand[selected]?.target === "single" : false;

  return (
    <div className="border-t border-accent-yellow/30 bg-bg-tertiary/40 backdrop-blur-sm shrink-0 relative">
      {/* SELECT TARGET prompt — overlay, no extra strip */}
      {selected !== null && needsTarget && (
        <div className="absolute right-3 top-1 z-10 text-accent-yellow font-display font-bold animate-blink text-[9px] tracking-[0.25em] uppercase">
          ▶ SELECT TARGET
        </div>
      )}
      {/* Hand strip — uses size="tight" (196x230) so cards fit alongside the
          rest of the combat UI in one viewport without page-scroll. The
          deck/discard counters were removed — they live in ResourceBar above. */}
      <div className="hand-strip pb-1 pt-1">
        <AnimatePresence>
          {combat.hand.map((card, idx) => (
            <motion.div
              key={`${card.id}-${idx}`}
              layout
              variants={cardPlayExit}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <CardView
                card={card}
                size="tight"
                selected={selected === idx}
                affordable={player.requisition >= card.cost}
                onClick={() => onCardClick(idx)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
