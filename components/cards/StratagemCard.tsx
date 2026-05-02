"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Card, CardType } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import CardHeader from "./parts/CardHeader";
import CardImage from "./parts/CardImage";
import CardTags from "./parts/CardTags";
import CardDescription from "./parts/CardDescription";
import CardFooter from "./parts/CardFooter";

const TYPE_BORDER: Record<CardType, string> = {
  eagle: "border-accent-yellow",
  orbital: "border-accent-red",
  sentry: "border-accent-green",
  support: "border-accent-cyan",
  backpack: "border-accent-purple",
  utility: "border-border-strong",
};

const TYPE_GLOW: Record<CardType, string> = {
  eagle: "shadow-glow-yellow",
  orbital: "shadow-glow-red",
  sentry: "shadow-glow-green",
  support: "shadow-glow-cyan",
  backpack: "shadow-glow-purple",
  utility: "shadow-tok-soft",
};

interface Props {
  card: Card;
  selected?: boolean;
  affordable?: boolean;
  onClick?: () => void;
  /** "compact" scales the same layout down (does not redesign). For grids. */
  size?: "normal" | "compact";
  /** Backward compat alias for size="compact" */
  small?: boolean;
}

export default function StratagemCard({
  card,
  selected,
  affordable = true,
  onClick,
  size = "normal",
  small,
}: Props) {
  const isCompact = small || size === "compact";

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => affordable && sfx.hover()}
      whileHover={affordable ? { y: -6, scale: 1.03 } : {}}
      whileTap={affordable ? { scale: 0.97 } : {}}
      animate={selected ? { y: -12, scale: 1.04 } : { y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className={clsx(
        "relative bg-bg-secondary text-left overflow-hidden border-2 flex flex-col",
        "transition-shadow duration-200",
        TYPE_BORDER[card.type],
        affordable && TYPE_GLOW[card.type],
        selected && "ring-2 ring-accent-yellow shadow-glow-yellow",
        !affordable && "grayscale brightness-75"
      )}
      style={{
        width: isCompact ? "196px" : "280px",
        height: isCompact ? "287px" : "410px",
        borderRadius: "var(--radius-md)",
        // scale-down via transform for compact: keep layout, smaller footprint
        transform: isCompact ? "scale(1)" : undefined,
      }}
    >
      {/* corner brackets */}
      <span className={clsx("absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 z-base", TYPE_BORDER[card.type])} />
      <span className={clsx("absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 z-base", TYPE_BORDER[card.type])} />
      <span className={clsx("absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 z-base", TYPE_BORDER[card.type])} />
      <span className={clsx("absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 z-base", TYPE_BORDER[card.type])} />

      {/* Inner top highlight */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {isCompact ? (
        <CompactLayout card={card} affordable={affordable} />
      ) : (
        <>
          <CardHeader name={card.name} cost={card.cost} affordable={affordable} />
          <CardImage type={card.type} cardId={card.id} name={card.name} />
          <CardTags card={card} />
          <CardDescription text={card.description} />
          <div className="flex-1" />
          <CardFooter type={card.type} cardId={card.id} rarity={card.rarity} />
        </>
      )}
    </motion.button>
  );
}

/** Compact layout — same data, denser stack. Used in grids/loadout. */
function CompactLayout({ card, affordable }: { card: Card; affordable: boolean }) {
  return (
    <div className="flex flex-col h-full">
      <CardHeader name={card.name} cost={card.cost} affordable={affordable} />
      <CardImage type={card.type} cardId={card.id} name={card.name} small />
      <CardTags card={card} />
      <div
        className="px-tok-3 text-text-secondary text-[11px] leading-snug overflow-hidden flex-1"
        style={{ paddingTop: "var(--space-2)" }}
      >
        {card.description}
      </div>
      <CardFooter type={card.type} cardId={card.id} rarity={card.rarity} />
    </div>
  );
}
