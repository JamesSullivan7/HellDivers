/**
 * TELEMETRY & BALANCING SYSTEM · metrics
 * ──────────────────────────────────────────────────────────────────────
 * Pure functions that turn an event log into balance metrics. No store
 * reads, no side effects — feed in `TelemetryEvent[]`, get back
 * structured numbers ready for the dashboard.
 *
 * Each metric function:
 *   - returns NaN-safe values (uses 0 instead of NaN)
 *   - is stable on empty input
 *   - is O(N) over events for one pass per group
 *
 * Sample-size guards:
 *   - The metrics themselves don't censor — they always return what they
 *     compute. The *report generator* applies MIN_SAMPLE_SIZE before
 *     emitting flags, so noisy small samples never produce alerts.
 */

import type {
  CardMetric,
  DifficultyCurvePoint,
  EconomyMetrics,
  EncounterMetric,
  EncounterOptionMetric,
  EnemyMetric,
  RunMetrics,
  TelemetryEvent,
} from "./telemetryTypes";

// ──────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────
function safeDiv(num: number, den: number): number {
  return den === 0 ? 0 : num / den;
}

function eventsByType(events: TelemetryEvent[], type: TelemetryEvent["type"]) {
  return events.filter((e) => e.type === type);
}

function groupBy<T, K extends string | number>(
  arr: T[],
  key: (t: T) => K | undefined,
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    if (k === undefined) continue;
    const ks = String(k);
    (out[ks] ??= []).push(item);
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────
//  Run metrics
// ──────────────────────────────────────────────────────────────────────
export function computeRunMetrics(events: TelemetryEvent[]): RunMetrics {
  const starts = eventsByType(events, "run_started");
  const completes = eventsByType(events, "run_completed");
  const fails = eventsByType(events, "run_failed");
  const abandons = eventsByType(events, "run_abandoned");

  const totalRuns = starts.length;
  const victories = completes.length;
  const defeats = fails.length;
  const abandonsCount = abandons.length;

  // Win rate by difficulty — denominator is decided runs (wins + losses)
  const decidedByDiff: Record<number, { runs: number; wins: number }> = {};
  for (const e of completes) {
    const d = Number(e.payload?.difficulty ?? 0);
    if (!d) continue;
    const slot = (decidedByDiff[d] ??= { runs: 0, wins: 0 });
    slot.runs += 1;
    slot.wins += 1;
  }
  for (const e of fails) {
    const d = Number(e.payload?.difficulty ?? 0);
    if (!d) continue;
    const slot = (decidedByDiff[d] ??= { runs: 0, wins: 0 });
    slot.runs += 1;
  }

  const winRateByDifficulty: RunMetrics["winRateByDifficulty"] = {};
  for (const [k, v] of Object.entries(decidedByDiff)) {
    winRateByDifficulty[Number(k)] = {
      runs: v.runs,
      wins: v.wins,
      rate: safeDiv(v.wins, v.runs),
    };
  }

  // Average run duration — only completes carry durationSeconds
  const durations: number[] = [];
  for (const e of completes) {
    const d = Number(e.payload?.durationSeconds ?? 0);
    if (d > 0) durations.push(d);
  }
  const averageRunSeconds = safeDiv(
    durations.reduce((a, b) => a + b, 0),
    durations.length,
  );

  // Death distribution
  const deaths = eventsByType(events, "player_death");
  const deathsByNodeId: Record<string, number> = {};
  const deathsByEnemyTemplate: Record<string, number> = {};
  for (const e of deaths) {
    const node = String(e.payload?.atNodeId ?? "");
    if (node) deathsByNodeId[node] = (deathsByNodeId[node] ?? 0) + 1;
    const killer = String(e.payload?.killerTemplateId ?? "");
    if (killer) deathsByEnemyTemplate[killer] = (deathsByEnemyTemplate[killer] ?? 0) + 1;
  }

  return {
    totalRuns,
    victories,
    defeats,
    abandons: abandonsCount,
    winRateOverall: safeDiv(victories, victories + defeats),
    winRateByDifficulty,
    averageRunSeconds,
    abandonRate: safeDiv(abandonsCount, totalRuns),
    deathsByNodeId,
    deathsByEnemyTemplate,
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Card metrics
//  - picks: ideally tracked via a "card_picked" event, but we don't have
//    one in the schema. We approximate picks via reward-card unlock events
//    AND fall back to "card was played at least once in a run" as a proxy
//    for "card was in deck" — which is how downstream win-rate joins work.
//  - plays: card_played events
//  - damage: damage_dealt where sourceCardId === card
//  - winRateWhenPicked: of runs where this card was played, fraction that
//    ended in run_completed
// ──────────────────────────────────────────────────────────────────────
export function computeCardMetrics(events: TelemetryEvent[]): CardMetric[] {
  const plays = eventsByType(events, "card_played");
  const damages = eventsByType(events, "damage_dealt");
  const completes = new Set(
    eventsByType(events, "run_completed")
      .map((e) => e.runId)
      .filter((r): r is string => !!r),
  );

  // Group plays by cardId
  const playsByCard = groupBy(plays, (e) => String(e.payload?.cardId ?? ""));
  const damageByCard = groupBy(damages, (e) => String(e.payload?.sourceCardId ?? ""));

  // Build a map of card → run ids that used it
  const runsByCard: Record<string, Set<string>> = {};
  for (const ev of plays) {
    const id = String(ev.payload?.cardId ?? "");
    const rid = ev.runId;
    if (!id || !rid) continue;
    (runsByCard[id] ??= new Set()).add(rid);
  }

  // Total plays for play-rate denominator
  const totalPlays = plays.length;

  const out: CardMetric[] = [];
  const cardIds = new Set<string>([...Object.keys(playsByCard), ...Object.keys(damageByCard)]);
  for (const cardId of cardIds) {
    if (!cardId) continue;
    const cardPlays = playsByCard[cardId] ?? [];
    const cardDamages = damageByCard[cardId] ?? [];
    const damage = cardDamages.reduce(
      (acc, e) => acc + Number(e.payload?.amount ?? 0),
      0,
    );
    const runs = runsByCard[cardId] ?? new Set();
    const wins = [...runs].filter((rid) => completes.has(rid)).length;

    out.push({
      cardId,
      picks: runs.size, // proxy: how many distinct runs played this card at all
      plays: cardPlays.length,
      damage,
      averageDamagePerPlay: safeDiv(damage, cardPlays.length),
      pickRate: 0, // computed below once we know total runs
      playRate: safeDiv(cardPlays.length, totalPlays),
      winRateWhenPicked: safeDiv(wins, runs.size),
    });
  }

  // pickRate denominator = total runs that produced any card_played at all
  const allRunsWithPlays = new Set(plays.map((e) => e.runId).filter((r): r is string => !!r));
  const totalRunsWithCards = allRunsWithPlays.size;
  for (const m of out) {
    m.pickRate = safeDiv(m.picks, totalRunsWithCards);
  }

  // Stable order: plays desc
  out.sort((a, b) => b.plays - a.plays);
  return out;
}

// ──────────────────────────────────────────────────────────────────────
//  Enemy metrics
// ──────────────────────────────────────────────────────────────────────
export function computeEnemyMetrics(events: TelemetryEvent[]): EnemyMetric[] {
  const combats = eventsByType(events, "combat_started");
  const kills = eventsByType(events, "enemy_killed");
  const damages = eventsByType(events, "damage_taken");
  const deaths = eventsByType(events, "player_death");

  const encounteredCounts: Record<string, number> = {};
  for (const e of combats) {
    const ids = (e.payload?.enemyTemplateIds ?? []) as unknown[];
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      const k = String(id);
      if (!k) continue;
      encounteredCounts[k] = (encounteredCounts[k] ?? 0) + 1;
    }
  }

  const killsByTemplate = groupBy(kills, (e) => String(e.payload?.templateId ?? ""));
  const damageByTemplate = groupBy(damages, (e) => String(e.payload?.fromTemplateId ?? ""));
  const deathsByTemplate = groupBy(deaths, (e) => String(e.payload?.killerTemplateId ?? ""));

  const allTemplates = new Set<string>([
    ...Object.keys(encounteredCounts),
    ...Object.keys(killsByTemplate),
    ...Object.keys(damageByTemplate),
    ...Object.keys(deathsByTemplate),
  ]);

  const out: EnemyMetric[] = [];
  for (const t of allTemplates) {
    if (!t) continue;
    const encountered = encounteredCounts[t] ?? 0;
    const k = (killsByTemplate[t] ?? []).length;
    const d = damageByTemplate[t] ?? [];
    const totalDamage = d.reduce((acc, e) => acc + Number(e.payload?.amount ?? 0), 0);
    const dCaused = (deathsByTemplate[t] ?? []).length;
    out.push({
      templateId: t,
      encountered,
      kills: k,
      deathsCaused: dCaused,
      damageDealt: totalDamage,
      averageDamageDealt: safeDiv(totalDamage, d.length),
      killRate: safeDiv(k, encountered),
    });
  }
  out.sort((a, b) => b.deathsCaused - a.deathsCaused);
  return out;
}

// ──────────────────────────────────────────────────────────────────────
//  Encounter metrics
// ──────────────────────────────────────────────────────────────────────
export function computeEncounterMetrics(events: TelemetryEvent[]): EncounterMetric[] {
  const decisions = eventsByType(events, "decision_selected");
  const byEncounter = groupBy(decisions, (e) => String(e.payload?.encounterId ?? ""));
  const out: EncounterMetric[] = [];
  for (const [encounterId, decs] of Object.entries(byEncounter)) {
    if (!encounterId) continue;
    const total = decs.length;
    const optionGroup = groupBy(decs, (e) => String(e.payload?.optionId ?? ""));
    const options: EncounterOptionMetric[] = Object.entries(optionGroup).map(
      ([optionId, list]) => ({
        encounterId,
        optionId,
        selectedCount: list.length,
        shareWithinEncounter: safeDiv(list.length, total),
      }),
    );
    options.sort((a, b) => b.selectedCount - a.selectedCount);
    const maxShare = options[0]?.shareWithinEncounter ?? 0;
    out.push({ encounterId, totalDecisions: total, options, maxShare });
  }
  out.sort((a, b) => b.totalDecisions - a.totalDecisions);
  return out;
}

// ──────────────────────────────────────────────────────────────────────
//  Economy metrics
// ──────────────────────────────────────────────────────────────────────
export function computeEconomyMetrics(events: TelemetryEvent[]): EconomyMetrics {
  const completes = eventsByType(events, "run_completed");
  const totalRuns = completes.length || 1; // avoid div/0; treat empty as 1

  const currency = eventsByType(events, "currency_gained");
  const moduleUnlocks = eventsByType(events, "module_unlocked");
  const cosmeticUnlocks = eventsByType(events, "cosmetic_unlocked");
  const stratagemUnlocks = eventsByType(events, "stratagem_unlocked");

  let medals = 0,
    samples = 0,
    requisition = 0;
  for (const e of currency) {
    const t = String(e.payload?.type ?? "");
    const a = Number(e.payload?.amount ?? 0);
    if (t === "medals") medals += a;
    else if (t === "samples") samples += a;
    else if (t === "requisition") requisition += a;
  }

  const totalUnlocks = moduleUnlocks.length + cosmeticUnlocks.length + stratagemUnlocks.length;
  return {
    averageMedalsPerRun: medals / totalRuns,
    averageSamplesPerRun: samples / totalRuns,
    averageRequisitionPerRun: requisition / totalRuns,
    modulesPurchased: moduleUnlocks.length,
    cosmeticsPurchased: cosmeticUnlocks.length,
    unlocksPerRun: totalUnlocks / totalRuns,
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Difficulty curve
// ──────────────────────────────────────────────────────────────────────
export function computeDifficultyCurve(events: TelemetryEvent[]): DifficultyCurvePoint[] {
  const completes = eventsByType(events, "run_completed");
  const fails = eventsByType(events, "run_failed");
  const allDecided = [...completes, ...fails];

  const groupedByDiff = groupBy(allDecided, (e) => Number(e.payload?.difficulty ?? 0));
  const out: DifficultyCurvePoint[] = [];
  for (const [k, list] of Object.entries(groupedByDiff)) {
    const difficulty = Number(k);
    if (!difficulty) continue;
    const wins = list.filter((e) => e.type === "run_completed").length;
    const durations = list
      .map((e) => Number(e.payload?.durationSeconds ?? 0))
      .filter((d) => d > 0);
    out.push({
      difficulty,
      runs: list.length,
      wins,
      winRate: safeDiv(wins, list.length),
      averageDurationSeconds: safeDiv(durations.reduce((a, b) => a + b, 0), durations.length),
    });
  }
  out.sort((a, b) => a.difficulty - b.difficulty);
  return out;
}
