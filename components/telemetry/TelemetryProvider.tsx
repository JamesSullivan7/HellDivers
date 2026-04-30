"use client";

/**
 * TelemetryProvider — root-mounted system component.
 *
 * Responsibilities:
 *   1. Init the TelemetryClient (periodic flush + beforeunload listener)
 *   2. Bridge the existing feedback queue into telemetry events. This
 *      gives free coverage for card_played / damage_taken / shield_break /
 *      reward_gain / victory / defeat without instrumenting every
 *      gameplay site.
 *   3. Watch the engine combat phase to emit run_started / run_completed /
 *      run_failed / run_abandoned at the right transitions.
 *
 * Renders nothing.
 *
 * The provider is opt-in safe: when telemetry is disabled, every track
 * call below is a no-op (the client checks isEnabled inside trackEvent).
 */

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store";
import { useFeedbackQueue } from "@/systems/feedback/feedbackQueue";
import { initTelemetryClient, trackEvent } from "@/systems/telemetry/TelemetryClient";
import { endRun, startRun } from "@/systems/telemetry/session";

export default function TelemetryProvider() {
  const phase = useGame((s) => s.phase);
  const player = useGame((s) => s.player);
  const combat = useGame((s) => s.combat);
  const account = useGame((s) => s.account);
  const feed = useFeedbackQueue((s) => s.feed);

  // Init periodic flush + beforeunload — idempotent.
  useEffect(() => {
    initTelemetryClient();
  }, []);

  // ── Run lifecycle ────────────────────────────────────────────────────
  const lastPhaseRef = useRef(phase);
  useEffect(() => {
    const prev = lastPhaseRef.current;
    if (prev !== phase) {
      // Entering combat / map for the first time after menu = run start
      if ((prev === "menu" || prev === "loadout") && (phase === "map" || phase === "combat")) {
        startRun();
        trackEvent("run_started", {
          // We don't know faction/difficulty without store specifics — let
          // callers add them via subsequent events. Track minimal context.
          phase,
        });
      }
      // Run end signals
      if (prev !== "victory" && phase === "victory") {
        trackEvent("run_completed", {
          durationSeconds: 0,
          nodesCleared: combat?.enemies?.length ?? 0,
        });
        endRun();
      }
      if (prev !== "gameover" && phase === "gameover") {
        trackEvent("run_failed", {
          reason: "hp_zero",
        });
        endRun();
      }
      // Returning to menu mid-run = abandon
      if ((prev === "map" || prev === "combat" || prev === "reward") && phase === "menu") {
        trackEvent("run_abandoned", {});
        endRun();
      }
    }
    lastPhaseRef.current = phase;
  }, [phase, combat?.enemies?.length]);

  // ── Combat lifecycle ─────────────────────────────────────────────────
  const lastCombatTurnRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== "combat") {
      lastCombatTurnRef.current = null;
      return;
    }
    if (combat.turn !== lastCombatTurnRef.current) {
      if (lastCombatTurnRef.current === null) {
        trackEvent("combat_started", {
          enemyTemplateIds: combat.enemies.map((e) => e.templateId),
        });
      } else {
        trackEvent("turn_started", { turn: combat.turn });
      }
      lastCombatTurnRef.current = combat.turn;
    }
  }, [phase, combat.turn, combat.enemies]);

  // ── Feedback bridge ──────────────────────────────────────────────────
  // We track only the *latest* feedback event since the last render. The
  // feed is bounded and ordered newest-first by the feedback queue, so we
  // diff against a "last seen id" ref to avoid re-emitting on re-render.
  const lastSeenFbIdRef = useRef<string | null>(null);
  useEffect(() => {
    const newest = feed[0];
    if (!newest || newest.id === lastSeenFbIdRef.current) return;

    // Pick up everything that's new (the feed is small — at most MAX_FEED).
    const newOnes = [];
    for (const ev of feed) {
      if (ev.id === lastSeenFbIdRef.current) break;
      newOnes.push(ev);
    }
    lastSeenFbIdRef.current = newest.id;

    // Translate each feedback event into a telemetry event.
    for (const ev of newOnes.reverse()) {
      switch (ev.type) {
        case "card_play":
          trackEvent("card_played", {
            cardId: String(ev.payload?.cardId ?? ""),
            cardType: String(ev.payload?.cardType ?? ""),
            cost: 0, // unknown at this site; downstream handlers may add
            combatTurn: combat.turn,
          });
          break;
        case "damage_hit":
          trackEvent("damage_dealt", {
            targetTemplateId: "",
            amount: Number(ev.payload?.damage ?? 0),
          });
          break;
        case "critical_hit":
          trackEvent("damage_dealt", {
            targetTemplateId: "",
            amount: Number(ev.payload?.damage ?? 0),
            critical: true,
          });
          break;
        case "enemy_attack":
          trackEvent("damage_taken", { amount: Number(ev.payload?.damage ?? 0) });
          break;
        case "blocked_hit":
          trackEvent("damage_taken", { amount: 0, blocked: Number(ev.payload?.damage ?? 0) });
          break;
        case "shield_break":
          trackEvent("status_applied", { statusId: "shield_break" });
          break;
        case "boss_enrage":
          trackEvent("status_applied", { statusId: "boss_enrage" });
          break;
        case "reward_gain": {
          // Detect which currency from the payload shape
          const p = ev.payload ?? {};
          if (typeof p.medals === "number") trackEvent("currency_gained", { type: "medals", amount: p.medals });
          else if (typeof p.samples === "number") trackEvent("currency_gained", { type: "samples", amount: p.samples });
          else if (typeof p.requisition === "number") trackEvent("currency_gained", { type: "requisition", amount: p.requisition });
          break;
        }
        case "victory":
          trackEvent("run_completed", { durationSeconds: 0, nodesCleared: 0 });
          break;
        case "defeat":
          trackEvent("run_failed", { reason: "kia" });
          break;
        case "objective_complete":
          // Sometimes wired for level-ups by the progression system
          trackEvent("xp_gained", { amount: 0 });
          break;
        default:
          break;
      }
    }
  }, [feed, combat.turn]);

  // ── Account-derived progression hooks ────────────────────────────────
  const lastLevelRef = useRef(account.level);
  useEffect(() => {
    if (account.level !== lastLevelRef.current && account.level > lastLevelRef.current) {
      trackEvent("level_up", { newLevel: account.level });
    }
    lastLevelRef.current = account.level;
  }, [account.level]);

  const lastModulesRef = useRef(account.unlockedModules.length);
  useEffect(() => {
    if (account.unlockedModules.length !== lastModulesRef.current) {
      const last = account.unlockedModules[account.unlockedModules.length - 1];
      trackEvent("module_unlocked", { moduleId: last ?? "" });
    }
    lastModulesRef.current = account.unlockedModules.length;
  }, [account.unlockedModules.length]);

  // Keep player ref off the event loop — present for future death-tracking
  // (pattern: when player.hp hits 0, fire player_death with context).
  void player;

  return null;
}
