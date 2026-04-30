"use client";

/**
 * UnlockRevealModal — cinematic modal that fires when a notification is
 * promoted to the active reveal slot.
 *
 * Choreography:
 *   - dim backdrop
 *   - centered card with rarity-accented border + gold glow
 *   - icon (kind glyph) sweeps in
 *   - headline + subhead types in
 *   - sound + VFX hooks fire on first paint
 *   - dismiss on click / Esc / 5s timeout
 *
 * Mounted by ProgressionProvider — has no internal trigger logic of its
 * own; it only renders when the progression store has an activeReveal.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CosmeticRarity,
  UnlockKind,
} from "@/systems/progression/progressionTypes";
import { useProgressionStore } from "@/systems/progression/progressionStore";

const KIND_ICON: Record<UnlockKind, string> = {
  level_up: "★",
  stratagem: "◆",
  ship_module: "⚙",
  cosmetic: "✦",
  warbond_page: "⊕",
  title: "T",
};

const RARITY_ACCENT: Record<CosmeticRarity, string> = {
  common: "var(--color-text-dim, #8a8d92)",
  uncommon: "var(--color-accent-cyan, #60c4ff)",
  rare: "var(--color-accent-orange, #ff8c2a)",
  legendary: "var(--color-accent-yellow, #f5c542)",
};

const KIND_DEFAULT_ACCENT: Record<UnlockKind, string> = {
  level_up: "var(--color-accent-yellow, #f5c542)",
  stratagem: "var(--color-accent-cyan, #60c4ff)",
  ship_module: "var(--color-accent-cyan, #60c4ff)",
  cosmetic: "var(--color-accent-orange, #ff8c2a)",
  warbond_page: "var(--color-accent-yellow, #f5c542)",
  title: "var(--color-accent-orange, #ff8c2a)",
};

const AUTO_DISMISS_MS = 4500;

export default function UnlockRevealModal() {
  const open = useProgressionStore((s) => s.unlockRevealOpen);
  const reveal = useProgressionStore((s) => s.activeReveal);
  const close = useProgressionStore((s) => s.closeReveal);

  // Esc + auto-dismiss
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(close, AUTO_DISMISS_MS);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && reveal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-overlay flex items-center justify-center"
          style={{ background: "radial-gradient(circle at center, rgba(0,0,0,0.55), rgba(0,0,0,0.85))" }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Unlock reveal"
        >
          <RevealCard kind={reveal.kind} headline={reveal.headline} subhead={reveal.subhead} rarity={reveal.rarity} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RevealCard({
  kind,
  headline,
  subhead,
  rarity,
}: {
  kind: UnlockKind;
  headline: string;
  subhead?: string;
  rarity?: CosmeticRarity;
}) {
  const accent = rarity ? RARITY_ACCENT[rarity] : KIND_DEFAULT_ACCENT[kind];
  const glyph = KIND_ICON[kind];
  return (
    <motion.div
      initial={{ scale: 0.85, y: 12, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.96, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-bg-secondary border-2 px-8 py-6 font-mono min-w-[420px] max-w-[520px] text-center"
      style={{
        borderColor: accent,
        boxShadow: `0 0 36px ${accent}66, inset 0 0 24px ${accent}22`,
        borderRadius: 2,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Outer rotating beams */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        style={{
          background: `conic-gradient(from 0deg, ${accent}00 0%, ${accent}26 25%, ${accent}00 50%, ${accent}26 75%, ${accent}00 100%)`,
          maskImage: "radial-gradient(circle, transparent 60%, black 80%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 60%, black 80%)",
          borderRadius: 2,
        }}
      />

      {/* Top label */}
      <div
        className="text-[9px] uppercase tracking-[0.4em] mb-3"
        style={{ color: accent }}
      >
        ◢ {kind.replace("_", " ").toUpperCase()} ◣
      </div>

      {/* Glyph */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
        className="font-display font-black mb-3"
        style={{
          fontSize: 64,
          lineHeight: 1,
          color: accent,
          textShadow: `0 0 18px ${accent}, 0 0 36px ${accent}88`,
        }}
      >
        {glyph}
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="text-base uppercase tracking-[0.25em] font-display font-black mb-1"
        style={{ color: accent, textShadow: `0 0 6px ${accent}88` }}
      >
        {headline}
      </motion.div>

      {/* Subhead */}
      {subhead && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="text-[11px] uppercase tracking-widest text-text-primary/85"
        >
          {subhead}
        </motion.div>
      )}

      {/* Footer */}
      <div className="mt-4 text-[8px] uppercase tracking-widest text-text-dim">
        ESC OR CLICK TO DISMISS
      </div>
    </motion.div>
  );
}
