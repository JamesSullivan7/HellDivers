"use client";

import { useEffect } from "react";
import { useAnimationQueue } from "./animationQueue";

/**
 * Mounts once at the combat root. Drives the queue forward by clearing
 * `active` after its `duration` elapses, which allows the next event to start.
 *
 * Pattern C (hybrid): state advances instantly; this runner just sequences
 * the visual layer. Components consume `active` to render in-flight effects.
 */
export default function AnimationRunner() {
  const active = useAnimationQueue((s) => s.active);
  const advance = useAnimationQueue((s) => s.advance);
  const clear = useAnimationQueue((s) => s.clear);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(advance, active.duration);
    return () => clearTimeout(t);
  }, [active?.id, active?.duration, advance]);

  useEffect(() => () => clear(), [clear]);

  return null;
}
