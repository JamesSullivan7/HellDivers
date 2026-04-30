"use client";

/**
 * useFeedback — convenience hook bundling the feedback API for components.
 * Components don't HAVE to use it (they can call triggerFeedback directly),
 * but this gives them ergonomic access to the queue + dispatcher in one
 * import.
 */

import { useEffect, useState } from "react";
import { feedback, triggerFeedback, prefersReducedMotion } from "@/systems/feedback/FeedbackManager";
import { useFeedbackQueue } from "@/systems/feedback/feedbackQueue";

export function useFeedback() {
  const feed = useFeedbackQueue((s) => s.feed);
  const shake = useFeedbackQueue((s) => s.shake);
  const flash = useFeedbackQueue((s) => s.flash);
  return { feed, shake, flash, trigger: triggerFeedback, ...feedback };
}

/** Live-reactive `prefers-reduced-motion` matcher. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion());
  useEffect(() => {
    if (typeof window === "undefined") return;
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    setReduced(mq.matches);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}
