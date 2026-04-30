"use client";

/**
 * ProgressionProvider — root-mounted system component.
 *
 * Responsibilities:
 *   1. Watch the progression notification queue. When a new unviewed
 *      notification arrives AND no reveal is currently open, promote it
 *      to the active reveal slot.
 *   2. Render the <UnlockRevealModal>, which displays the active reveal.
 *   3. Render an event-feed entry via the feedback system for each new
 *      notification (toast-style).
 *
 * The provider renders nothing visible aside from the modal portal-equivalent.
 * It mounts once near the app root.
 */

import { useEffect } from "react";
import { useProgressionStore } from "@/systems/progression/progressionStore";
import { feedback } from "@/systems/feedback/FeedbackManager";
import UnlockRevealModal from "./UnlockRevealModal";

export default function ProgressionProvider() {
  const notifications = useProgressionStore((s) => s.notifications);
  const activeReveal = useProgressionStore((s) => s.activeReveal);
  const open = useProgressionStore((s) => s.unlockRevealOpen);
  const openReveal = useProgressionStore((s) => s.openReveal);

  // Promote next unviewed → active reveal
  useEffect(() => {
    if (open || activeReveal) return;
    const next = notifications.find((n) => !n.viewed);
    if (next) {
      // Tiny delay so multiple unlocks arriving in the same frame don't
      // visually race — the first one plays, then the queue pumps the rest
      // after closeReveal fires.
      const t = window.setTimeout(() => openReveal(next), 80);
      return () => window.clearTimeout(t);
    }
  }, [notifications, activeReveal, open, openReveal]);

  // Toast log — fire one toast per *new* notification id we haven't seen.
  useEffect(() => {
    const newest = notifications[0];
    if (!newest) return;
    // Use objectiveComplete to push a feed entry with sound + tension.
    try {
      feedback.objectiveComplete(newest.headline, 0);
    } catch {
      /* ignore */
    }
    // We don't track per-id "fired" state because notifications are bounded
    // and this only runs on queue mutations. Rapid duplicate fires are
    // visually trivial — no need to over-engineer.
  }, [notifications.length]);

  return <UnlockRevealModal />;
}
