"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import StratagemCodeOverlay from "./StratagemCodeOverlay";
import CombatLayout from "./combat/CombatLayout";
import Battlefield from "./combat/Battlefield";
import PlayerHand from "./combat/PlayerHand";
import ActionBar from "./combat/ActionBar";
import Timeline from "./combat/Timeline";

export default function CombatView() {
  const { combat, player, selectCard, beginPlayCard, endTurn } = useGame();

  const selected =
    combat.selectedCardIndex !== null ? combat.hand[combat.selectedCardIndex] : null;
  const needsTarget = selected?.target === "single";

  const lastHpRef = useRef(player.hp);
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (player.hp < lastHpRef.current) {
      setShake((n) => n + 1);
      setFlash((n) => n + 1);
    }
    lastHpRef.current = player.hp;
  }, [player.hp]);

  useEffect(() => {
    sfx.unlock();
    sfx.combatStart();
    sfx.voice("Engaging hostile contacts. For Super Earth.");
  }, []);

  const playSfxForCard = (type: string) => {
    setTimeout(() => {
      if (type === "eagle") sfx.bigExplosion();
      else if (type === "orbital") sfx.explosion();
      else if (type === "support") sfx.laser();
      else if (type === "sentry") sfx.sentryDeploy();
      else if (type === "backpack") sfx.shield();
      else sfx.heal();
    }, 80);
  };

  const handleCardClick = (idx: number) => {
    sfx.unlock();
    const card = combat.hand[idx];
    if (player.requisition < card.cost) {
      sfx.alert();
      return;
    }
    if (card.target === "single") {
      sfx.cardSelect();
      selectCard(combat.selectedCardIndex === idx ? null : idx);
    } else {
      sfx.cardPlay();
      playSfxForCard(card.type);
      beginPlayCard(idx);
    }
  };

  const handleEnemyClick = (enemyId: string) => {
    if (combat.selectedCardIndex === null) return;
    const card = combat.hand[combat.selectedCardIndex];
    sfx.cardPlay();
    playSfxForCard(card.type);
    beginPlayCard(combat.selectedCardIndex, enemyId);
  };

  const overlays = (
    <>
      <StratagemCodeOverlay />
      <AnimatePresence>
        {flash > 0 && (
          <motion.div
            key={flash}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => setFlash(0)}
            className="fixed inset-0 bg-accent-red pointer-events-none z-overlay"
          />
        )}
      </AnimatePresence>
    </>
  );

  return (
    <motion.div
      animate={shake > 0 ? { x: [0, -10, 10, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="contents"
    >
      <CombatLayout
        timeline={<Timeline />}
        battlefield={
          <Battlefield needsTarget={!!needsTarget} onEnemyClick={handleEnemyClick} />
        }
        hand={<PlayerHand onCardClick={handleCardClick} />}
        actionBar={<ActionBar onEndTurn={endTurn} />}
        overlays={overlays}
      />
    </motion.div>
  );
}
