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
    <div className="border-t border-accent-yellow/30 bg-bg-tertiary/40 backdrop-blur-sm">
      <div className="px-tok-4 py-tok-2 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase font-mono">
        <div className="text-text-dim flex gap-tok-3">
          <span>Hand <span className="text-text-primary font-bold">{combat.hand.length}</span></span>
          <span className="text-border-strong">|</span>
          <span>Deck <span className="text-text-primary font-bold">{combat.deck.length}</span></span>
          <span className="text-border-strong">|</span>
          <span>Discard <span className="text-text-primary font-bold">{combat.discard.length}</span></span>
          {combat.exhausted.length > 0 && (
            <>
              <span className="text-border-strong">|</span>
              <span>Exhausted <span className="text-accent-red font-bold">{combat.exhausted.length}</span></span>
            </>
          )}
        </div>
        {selected !== null && needsTarget && (
          <div className="text-accent-yellow font-display font-bold animate-blink">
            ▶ SELECT TARGET
          </div>
        )}
      </div>
      <div className="hand-strip pb-tok-3 pt-tok-2">
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
                size="compact"
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
