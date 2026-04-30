"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { ArrowKey } from "@/lib/types";

const ARROW_GLYPH: Record<ArrowKey, string> = {
  U: "↑",
  D: "↓",
  L: "←",
  R: "→",
};

const KEY_TO_ARROW: Record<string, ArrowKey> = {
  ArrowUp: "U",
  ArrowDown: "D",
  ArrowLeft: "L",
  ArrowRight: "R",
  w: "U",
  s: "D",
  a: "L",
  d: "R",
  W: "U",
  S: "D",
  A: "L",
  D: "R",
};

const TIMER_MS = 3500;

export default function StratagemCodeOverlay() {
  const { pendingPlay, resolvePendingPlay, cancelPendingPlay } = useGame();
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_MS);
  const startedRef = useRef<number>(0);

  const code = pendingPlay?.card.code ?? [];

  useEffect(() => {
    if (!pendingPlay) return;
    setProgress(0);
    setFailed(false);
    setCompleted(false);
    setTimeLeft(TIMER_MS);
    startedRef.current = performance.now();
  }, [pendingPlay?.card.id]);

  useEffect(() => {
    if (!pendingPlay || completed) return;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startedRef.current;
      const left = Math.max(0, TIMER_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        sfx.alert();
        resolvePendingPlay(1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pendingPlay?.card.id, completed, resolvePendingPlay]);

  useEffect(() => {
    if (!pendingPlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sfx.click();
        cancelPendingPlay();
        return;
      }
      const arrow = KEY_TO_ARROW[e.key];
      if (!arrow) return;
      e.preventDefault();
      if (completed) return;
      if (arrow === code[progress]) {
        sfx.draw();
        const next = progress + 1;
        if (next >= code.length) {
          setCompleted(true);
          sfx.beacon();
          setTimeout(() => resolvePendingPlay(1.3), 250);
        } else {
          setProgress(next);
        }
      } else {
        sfx.alert();
        setFailed(true);
        setTimeout(() => {
          setFailed(false);
          setProgress(0);
        }, 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingPlay, progress, code, completed, resolvePendingPlay, cancelPendingPlay]);

  const timePct = (timeLeft / TIMER_MS) * 100;

  return (
    <AnimatePresence>
      {pendingPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={cancelPendingPlay}
        >
          <motion.div
            initial={{ y: 30, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "relative bg-helldiver-panel border-2 px-10 py-8 min-w-[420px]",
              completed ? "border-helldiver-yellow" : failed ? "border-helldiver-red animate-shake" : "border-helldiver-yellow"
            )}
          >
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-helldiver-yellow" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-helldiver-yellow" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-helldiver-yellow" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-helldiver-yellow" />

            <div className="text-[10px] uppercase tracking-[0.4em] text-helldiver-yellow font-mono mb-2 text-center">
              ◢ Stratagem Input ◣
            </div>
            <div className="text-2xl font-display font-black text-center mb-1 text-white tracking-wider">
              {pendingPlay.card.name.toUpperCase()}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-helldiver-dim text-center mb-5">
              Input Sequence — WASD or Arrows
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              {code.map((arrow, i) => {
                const done = i < progress;
                const current = i === progress && !completed;
                return (
                  <motion.div
                    key={i}
                    animate={done ? { scale: 1.1 } : { scale: 1 }}
                    className={clsx(
                      "w-14 h-14 flex items-center justify-center text-3xl font-black border-2 font-display transition-colors",
                      done && "bg-helldiver-yellow text-black border-helldiver-yellow shadow-[0_0_18px_rgba(255, 211, 77,0.7)]",
                      current && "border-helldiver-yellow text-helldiver-yellow animate-pulse-yellow",
                      !done && !current && "border-helldiver-steel text-helldiver-dim"
                    )}
                  >
                    {ARROW_GLYPH[arrow]}
                  </motion.div>
                );
              })}
            </div>

            <div className="h-1.5 bg-black border border-helldiver-steel relative overflow-hidden mb-3">
              <motion.div
                animate={{ width: `${timePct}%` }}
                transition={{ duration: 0.05, ease: "linear" }}
                className={clsx(
                  "h-full",
                  timePct > 50
                    ? "bg-helldiver-yellow"
                    : timePct > 25
                      ? "bg-helldiver-orange"
                      : "bg-helldiver-red"
                )}
              />
            </div>

            <div className="text-center text-[10px] uppercase tracking-[0.3em] text-helldiver-dim font-mono">
              {completed
                ? <span className="text-helldiver-yellow font-bold">▶ STRATAGEM CONFIRMED · CRIT BONUS</span>
                : "Esc to abort · Timeout = Standard Effect"}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
