"use client";

/**
 * RewardRevealSequence — choreographed reveal of post-combat rewards.
 *
 * Sequence (timed via MICRO_DELAYS):
 *   1. Screen dim fades in
 *   2. Reward panel slides in from below
 *   3. Reward cards stagger in one by one
 *   4. Currency counters tally upward
 *   5. Rare reward gets an extra bloom glow
 *   6. Continue button fades in last
 *
 * Reduced-motion: timing compresses, dim overlay weakens, count-up
 * animation collapses to a direct number set.
 *
 * The component is presentational — pass in the data via props. Wire
 * the parent's `onContinue` to consume the reward and route forward.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EASING,
  GLOW,
  OPACITY,
  POLISH_COLOR,
  STAGGER,
} from "@/systems/polish/polishTokens";
import { MICRO_DELAYS, resolveDelay } from "@/systems/polish/microDelays";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export interface RewardCardEntry {
  id: string;
  label: string;
  detail?: string;
  rarity?: "common" | "uncommon" | "rare" | "legendary";
  icon?: React.ReactNode;
}

export interface CurrencyEntry {
  type: string;
  label: string;
  amount: number;
  accent: string;
  glyph?: string;
}

interface Props {
  open: boolean;
  cards?: RewardCardEntry[];
  currencies?: CurrencyEntry[];
  /** Optional title above the panel. */
  title?: string;
  onContinue: () => void;
  className?: string;
}

const RARITY_ACCENT = {
  common: POLISH_COLOR.textDim,
  uncommon: POLISH_COLOR.cyan,
  rare: POLISH_COLOR.orange,
  legendary: POLISH_COLOR.yellow,
} as const;

export default function RewardRevealSequence({
  open,
  cards = [],
  currencies = [],
  title = "MISSION REWARDS",
  onContinue,
  className,
}: Props) {
  const reduced = useReducedMotionSafe();
  const [showContinue, setShowContinue] = useState(false);

  // Reveal Continue last in the sequence
  useEffect(() => {
    if (!open) {
      setShowContinue(false);
      return;
    }
    const total =
      resolveDelay("rewardPanelIntro", reduced) +
      cards.length * resolveDelay("rewardCardStagger", reduced) +
      resolveDelay("currencyTallyDelay", reduced) +
      resolveDelay("continueButtonReveal", reduced);
    const t = setTimeout(() => setShowContinue(true), total);
    return () => clearTimeout(t);
  }, [open, cards.length, reduced]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-overlay flex items-center justify-center font-mono ${className ?? ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASING.standard }}
          style={{ background: `rgba(0,0,0,${reduced ? 0.4 : OPACITY.dim})` }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{
              duration: reduced ? 0.18 : 0.42,
              ease: EASING.anticipate,
              delay: resolveDelay("rewardPanelIntro", reduced) / 1000,
            }}
            className="bg-bg-secondary/95 border-2 px-6 py-5 max-w-[640px] w-[90vw] flex flex-col gap-4"
            style={{
              borderColor: POLISH_COLOR.yellow,
              boxShadow: `0 0 ${GLOW.cinematic}px ${POLISH_COLOR.yellow}55, inset 0 0 ${GLOW.medium}px ${POLISH_COLOR.yellow}22`,
              borderRadius: 2,
            }}
          >
            {/* Header */}
            <div className="text-center">
              <div
                className="text-[10px] uppercase tracking-[0.4em] font-display font-black"
                style={{ color: POLISH_COLOR.yellow, textShadow: `0 0 8px ${POLISH_COLOR.yellow}88` }}
              >
                ◢ {title} ◣
              </div>
            </div>

            {/* Cards row */}
            {cards.length > 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: reduced ? STAGGER.fast : STAGGER.cinematic,
                      delayChildren:
                        resolveDelay("rewardPanelIntro", reduced) / 1000 + 0.18,
                    },
                  },
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {cards.map((c) => (
                  <RewardCardTile key={c.id} card={c} reduced={reduced} />
                ))}
              </motion.div>
            )}

            {/* Currency tally */}
            {currencies.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: resolveDelay("currencyTallyDelay", reduced) / 1000 + 0.18,
                  duration: 0.4,
                }}
                className="flex flex-col gap-1.5"
              >
                {currencies.map((cur) => (
                  <CurrencyTallyRow key={cur.type} currency={cur} reduced={reduced} />
                ))}
              </motion.div>
            )}

            {/* Continue */}
            <AnimatePresence>
              {showContinue && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: EASING.enter }}
                  className="flex justify-center pt-1"
                >
                  <button
                    type="button"
                    onClick={onContinue}
                    autoFocus
                    className="px-6 py-2 border-2 font-display font-black uppercase tracking-[0.3em] text-[11px] hover:bg-accent-yellow/10 transition-colors"
                    style={{
                      color: POLISH_COLOR.yellow,
                      borderColor: POLISH_COLOR.yellow,
                      boxShadow: `0 0 ${GLOW.medium}px ${POLISH_COLOR.yellow}55`,
                      borderRadius: 1,
                    }}
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Reward card tile
// ──────────────────────────────────────────────────────────────────────
function RewardCardTile({ card, reduced }: { card: RewardCardEntry; reduced: boolean }) {
  const accent = RARITY_ACCENT[card.rarity ?? "common"];
  const isRare = card.rarity === "rare" || card.rarity === "legendary";
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ duration: reduced ? 0.18 : 0.45, ease: EASING.anticipate }}
      className="relative bg-bg-primary/60 border p-3 flex flex-col gap-1 items-center text-center"
      style={{
        borderColor: accent,
        boxShadow: isRare ? `0 0 ${GLOW.medium}px ${accent}55` : undefined,
        borderRadius: 2,
      }}
    >
      {card.icon && (
        <div
          className="font-display font-black"
          style={{ fontSize: 28, color: accent, lineHeight: 1, textShadow: `0 0 ${GLOW.soft}px ${accent}88` }}
        >
          {card.icon}
        </div>
      )}
      <div className="text-[10px] uppercase tracking-widest font-black" style={{ color: accent }}>
        {card.label}
      </div>
      {card.detail && <div className="text-[9px] leading-snug text-text-dim">{card.detail}</div>}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Currency tally row — count-up
// ──────────────────────────────────────────────────────────────────────
function CurrencyTallyRow({ currency, reduced }: { currency: CurrencyEntry; reduced: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (reduced) {
      setDisplayed(currency.amount);
      return;
    }
    const start = performance.now();
    const dur = Math.min(900, 300 + currency.amount * 0.6);
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 2);
      setDisplayed(Math.round(currency.amount * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currency.amount, reduced]);

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-1 last:border-b-0">
      <div className="flex items-center gap-2">
        {currency.glyph && (
          <span
            className="font-display font-black"
            style={{ color: currency.accent, fontSize: 14, lineHeight: 1 }}
          >
            {currency.glyph}
          </span>
        )}
        <span className="text-[10px] uppercase tracking-widest text-text-dim">{currency.label}</span>
      </div>
      <span
        className="font-display font-black tabular-nums"
        style={{
          color: currency.accent,
          fontSize: 16,
          lineHeight: 1,
          textShadow: `0 0 ${GLOW.soft}px ${currency.accent}55`,
        }}
      >
        +{displayed.toLocaleString()}
      </span>
    </div>
  );
}
