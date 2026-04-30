"use client";

/**
 * EventFeedHud — top-right toast feed driven by the feedback queue.
 * Distinct from the existing combat-log EventFeed (left sidebar) — this
 * one is the tactical "kill log" overlay that pops up on every meaningful
 * action: card plays, damage, criticals, boss enrage, rewards, etc.
 *
 * Each toast slides in, holds for its preset expiry, then fades out as
 * the manager removes it from the queue.
 */

import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { FEED_COLORS } from "@/systems/feedback/feedbackPresets";
import type { FeedbackEvent } from "@/systems/feedback/feedbackTypes";
import { useFeedbackQueue } from "@/systems/feedback/feedbackQueue";

const ICON: Partial<Record<FeedbackEvent["type"], string>> = {
  card_play: "▸",
  damage_hit: "✚",
  critical_hit: "★",
  blocked_hit: "◇",
  enemy_attack: "⚠",
  shield_break: "◈",
  boss_enrage: "⚡",
  reward_gain: "◆",
  status_apply: "☣",
  end_turn: "›",
  choice_select: "▸",
  objective_complete: "✓",
  victory: "★",
  defeat: "✕",
};

function fallbackText(e: FeedbackEvent): string {
  if (e.payload?.text) return String(e.payload.text);
  return e.type.toUpperCase().replace(/_/g, " ");
}

export default function EventFeedHud() {
  const feed = useFeedbackQueue((s) => s.feed);

  if (feed.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] pointer-events-none flex flex-col gap-1.5 items-end font-mono">
      <AnimatePresence initial={false}>
        {feed.slice(0, 6).map((e, i) => (
          <ToastEntry key={e.id} event={e} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastEntry({ event, index }: { event: FeedbackEvent; index: number }) {
  const color = FEED_COLORS[event.type] ?? "#e8eef5";
  const isCritical = event.type === "critical_hit" || event.type === "boss_enrage" || event.type === "defeat";
  const isVictory = event.type === "victory" || event.type === "objective_complete" || event.type === "reward_gain";

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1 - index * 0.10, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={clsx(
        "border-2 backdrop-blur-md px-3 py-1.5 max-w-[300px]",
        isCritical && "shadow-[0_0_22px_rgba(255,77,77,0.5)]",
        isVictory && "shadow-[0_0_18px_rgba(52,211,153,0.4)]"
      )}
      style={{
        borderColor: color,
        background: "rgba(11,15,20,0.92)",
      }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="font-display font-black text-[13px] leading-none"
          style={{ color }}
        >
          {ICON[event.type] ?? "·"}
        </span>
        <span
          className="text-[11px] tracking-wider uppercase font-display font-bold leading-tight"
          style={{ color }}
        >
          {fallbackText(event)}
        </span>
      </div>
    </motion.div>
  );
}
