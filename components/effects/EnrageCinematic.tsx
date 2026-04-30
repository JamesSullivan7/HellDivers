"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";

/**
 * Enrage Cinematic — full-screen overlay that plays once when any boss
 * transitions from non-enraged to enraged. Pulse + low-freq shake +
 * audio cue + heavy red vignette.
 *
 * Mounted once at the combat root. Listens for boss enraged-state changes
 * and self-dismisses after the sequence completes.
 */
export default function EnrageCinematic() {
  const enemies = useGame((s) => s.combat.enemies);
  const enragedSeenRef = useRef<Set<string>>(new Set());
  const [active, setActive] = useState<{ id: string; name: string; message?: string } | null>(null);

  useEffect(() => {
    for (const e of enemies) {
      if (e.enraged && !enragedSeenRef.current.has(e.id)) {
        enragedSeenRef.current.add(e.id);
        setActive({ id: e.id, name: e.name, message: e.enragedMessage });
        sfx.bossEnrage();
        sfx.voice(`Threat escalation. ${e.name} enraged.`);
        const t = setTimeout(() => setActive(null), 2000);
        return () => clearTimeout(t);
      }
      // Reset tracking if enemy un-enrages or dies (so future enrages re-trigger)
      if (!e.enraged && enragedSeenRef.current.has(e.id) && e.hp <= 0) {
        enragedSeenRef.current.delete(e.id);
      }
    }
  }, [enemies]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-critical pointer-events-none flex items-center justify-center"
        >
          {/* Dark vignette pulse */}
          <motion.div
            className="absolute inset-0 bg-black"
            animate={{ opacity: [0.0, 0.55, 0.0] }}
            transition={{ duration: 2.0, ease: "easeInOut" }}
          />
          {/* Red flash */}
          <motion.div
            className="absolute inset-0 bg-accent-red/40"
            animate={{ opacity: [0, 0.6, 0.2, 0.4, 0] }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
          {/* Edge vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, transparent 30%, rgba(255, 77, 77, 0.6) 100%)",
            }}
          />

          {/* Message banner */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{
              scale: [0.7, 1.08, 1],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.0,
              times: [0, 0.2, 0.7, 1],
              ease: [0.2, 0.8, 0.2, 1],
            }}
            className="relative z-critical text-center"
          >
            <div className="text-[12px] uppercase tracking-[0.5em] text-accent-yellow mb-tok-2 font-mono">
              ⚠ Threat Escalation Detected ⚠
            </div>
            <div className="text-7xl font-display font-black tracking-tight text-accent-red drop-shadow-[0_0_24px_rgba(255,77,77,0.8)]">
              ENRAGED
            </div>
            <div className="text-base uppercase tracking-[0.3em] text-text-primary mt-tok-2 font-mono">
              {active.message ?? `${active.name.toUpperCase()} ENRAGED`}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
