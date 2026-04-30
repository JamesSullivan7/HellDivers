"use client";

/**
 * CombatView — engine wiring shell.
 * The visual layout lives in CombatScreenAAA. This component handles:
 *   - dispatching card clicks / enemy clicks / end turn through the store
 *   - per-card type SFX cues
 *   - hit-flash + screen-shake feedback when player HP drops
 *   - the stratagem code overlay
 *   - the "card flies to center" overlay state
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { Card } from "@/lib/types";
import StratagemCodeOverlay from "./StratagemCodeOverlay";
import CombatScreenAAA, { PlayedCardSnapshot } from "./combat/CombatScreenAAA";

const PLAYED_CARD_HOLD_MS = 1100;

export default function CombatView() {
  const { combat, player, selectCard, beginPlayCard, endTurn } = useGame();

  const selected =
    combat.selectedCardIndex !== null ? combat.hand[combat.selectedCardIndex] : null;
  const needsTarget = selected?.target === "single";

  // ── Hit-flash + screen shake when player HP drops ──
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

  // ── Played-card center overlay ──
  const [playedCard, setPlayedCard] = useState<PlayedCardSnapshot | null>(null);
  const playKeyRef = useRef(0);
  const triggerPlayedAnimation = (card: Card) => {
    playKeyRef.current += 1;
    setPlayedCard({ card, key: playKeyRef.current });
  };
  useEffect(() => {
    if (!playedCard) return;
    const t = setTimeout(() => setPlayedCard(null), PLAYED_CARD_HOLD_MS);
    return () => clearTimeout(t);
  }, [playedCard]);

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
      // Targeted card — just toggle selection. Animation fires later on enemy click.
      sfx.cardSelect();
      selectCard(combat.selectedCardIndex === idx ? null : idx);
    } else {
      // Non-targeted — play immediately and fly the card to center.
      triggerPlayedAnimation(card);
      sfx.cardPlay();
      playSfxForCard(card.type);
      beginPlayCard(idx);
    }
  };

  const handleEnemyClick = (enemyId: string) => {
    if (combat.selectedCardIndex === null) return;
    const card = combat.hand[combat.selectedCardIndex];
    triggerPlayedAnimation(card);
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
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => setFlash(0)}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ background: "rgba(255,77,77,1)" }}
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
      <CombatScreenAAA
        needsTarget={!!needsTarget}
        onCardClick={handleCardClick}
        onEnemyClick={handleEnemyClick}
        onEndTurn={endTurn}
        overlays={overlays}
        playedCard={playedCard}
      />
    </motion.div>
  );
}
