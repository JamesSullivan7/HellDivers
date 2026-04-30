/**
 * TELEMETRY & BALANCING SYSTEM · report generator
 * ──────────────────────────────────────────────────────────────────────
 * Combines computed metrics with TARGET ranges to produce a human-
 * readable balance report. The report:
 *
 *   - rolls each metric against a target range
 *   - emits BalanceFlags when values violate ranges (and only when sample
 *     size is large enough to mean anything)
 *   - groups flags by category for easy scanning in the dashboard
 *
 * The report is computed locally from the in-memory event log. No
 * network calls. Designers can paste the report into reviews/Slack
 * directly.
 */

import {
  BalanceFlag,
  BalanceReport,
  CardMetric,
  DifficultyCurvePoint,
  EconomyMetrics,
  EncounterMetric,
  EnemyMetric,
  FlagSeverity,
  MIN_SAMPLE_SIZE,
  RunMetrics,
  TARGET_CARD_PICK_RATE,
  TARGET_ENCOUNTER_OPTION,
  TARGET_ENEMY_DEATH_SHARE,
  TARGET_WIN_RATE_BY_DIFFICULTY,
  TelemetryEvent,
} from "./telemetryTypes";
import {
  computeCardMetrics,
  computeDifficultyCurve,
  computeEconomyMetrics,
  computeEncounterMetrics,
  computeEnemyMetrics,
  computeRunMetrics,
} from "./balanceMetrics";

let _flagCounter = 0;
function nextFlagId(): string {
  return `bf_${Date.now().toString(36)}_${(_flagCounter++).toString(36)}`;
}

function flag(
  severity: FlagSeverity,
  category: BalanceFlag["category"],
  headline: string,
  detail: string,
  extras?: Partial<Pick<BalanceFlag, "value" | "expected" | "anchorId">>,
): BalanceFlag {
  return {
    id: nextFlagId(),
    severity,
    category,
    headline,
    detail,
    ...extras,
  };
}

// ──────────────────────────────────────────────────────────────────────
//  Difficulty win-rate flags
// ──────────────────────────────────────────────────────────────────────
function flagsForDifficulty(curve: DifficultyCurvePoint[]): BalanceFlag[] {
  const flags: BalanceFlag[] = [];
  for (const p of curve) {
    const target = TARGET_WIN_RATE_BY_DIFFICULTY[p.difficulty];
    if (!target) continue;
    if (p.runs < MIN_SAMPLE_SIZE.difficulty) continue;
    if (p.winRate < target.min) {
      flags.push(
        flag(
          p.winRate < target.min - 0.15 ? "critical" : "warning",
          "balance",
          `D${p.difficulty} too punishing`,
          `Win rate ${(p.winRate * 100).toFixed(1)}% — below target ${(target.min * 100).toFixed(0)}–${(target.max * 100).toFixed(0)}%.`,
          { value: p.winRate, expected: target, anchorId: `diff_${p.difficulty}` },
        ),
      );
    } else if (p.winRate > target.max) {
      flags.push(
        flag(
          p.winRate > target.max + 0.15 ? "critical" : "warning",
          "balance",
          `D${p.difficulty} too easy`,
          `Win rate ${(p.winRate * 100).toFixed(1)}% — above target ${(target.min * 100).toFixed(0)}–${(target.max * 100).toFixed(0)}%.`,
          { value: p.winRate, expected: target, anchorId: `diff_${p.difficulty}` },
        ),
      );
    }
  }
  return flags;
}

// ──────────────────────────────────────────────────────────────────────
//  Card flags
// ──────────────────────────────────────────────────────────────────────
function flagsForCards(cards: CardMetric[]): BalanceFlag[] {
  const flags: BalanceFlag[] = [];
  for (const c of cards) {
    if (c.plays < MIN_SAMPLE_SIZE.card && c.picks < MIN_SAMPLE_SIZE.card) continue;

    if (c.pickRate > TARGET_CARD_PICK_RATE.overpickThreshold) {
      flags.push(
        flag(
          c.pickRate > TARGET_CARD_PICK_RATE.overpickThreshold + 0.1 ? "critical" : "warning",
          "balance",
          `${c.cardId} over-picked`,
          `Pick rate ${(c.pickRate * 100).toFixed(1)}% (>${(TARGET_CARD_PICK_RATE.overpickThreshold * 100).toFixed(0)}%). Consider nerfing or replacing.`,
          { value: c.pickRate, anchorId: c.cardId },
        ),
      );
    }
    if (c.playRate < TARGET_CARD_PICK_RATE.deadCardThreshold && c.plays > 0) {
      flags.push(
        flag(
          "warning",
          "balance",
          `${c.cardId} dead weight`,
          `Play rate ${(c.playRate * 100).toFixed(2)}% (<${(TARGET_CARD_PICK_RATE.deadCardThreshold * 100).toFixed(0)}%). Card is rarely used despite being available.`,
          { value: c.playRate, anchorId: c.cardId },
        ),
      );
    }
    // Win-rate-when-picked outliers — only flag when picked enough
    if (c.picks >= MIN_SAMPLE_SIZE.card) {
      if (c.winRateWhenPicked > 0.85) {
        flags.push(
          flag(
            "warning",
            "balance",
            `${c.cardId} dominant in winning runs`,
            `Win rate when picked ${(c.winRateWhenPicked * 100).toFixed(1)}%. May be a auto-include.`,
            { value: c.winRateWhenPicked, anchorId: c.cardId },
          ),
        );
      } else if (c.winRateWhenPicked < 0.15) {
        flags.push(
          flag(
            "info",
            "balance",
            `${c.cardId} associated with losses`,
            `Win rate when picked ${(c.winRateWhenPicked * 100).toFixed(1)}%. Card may be misleading or weak.`,
            { value: c.winRateWhenPicked, anchorId: c.cardId },
          ),
        );
      }
    }
  }
  return flags;
}

// ──────────────────────────────────────────────────────────────────────
//  Enemy flags
// ──────────────────────────────────────────────────────────────────────
function flagsForEnemies(enemies: EnemyMetric[], totalDeaths: number): BalanceFlag[] {
  const flags: BalanceFlag[] = [];
  if (totalDeaths < MIN_SAMPLE_SIZE.enemy) return flags;
  for (const e of enemies) {
    const share = totalDeaths === 0 ? 0 : e.deathsCaused / totalDeaths;
    if (share > TARGET_ENEMY_DEATH_SHARE.overTunedThreshold) {
      flags.push(
        flag(
          share > TARGET_ENEMY_DEATH_SHARE.overTunedThreshold + 0.1 ? "critical" : "warning",
          "balance",
          `${e.templateId} over-tuned`,
          `Causes ${(share * 100).toFixed(1)}% of all player deaths (>${(TARGET_ENEMY_DEATH_SHARE.overTunedThreshold * 100).toFixed(0)}%). Consider damage / pattern review.`,
          { value: share, anchorId: e.templateId },
        ),
      );
    }
  }
  return flags;
}

// ──────────────────────────────────────────────────────────────────────
//  Encounter flags
// ──────────────────────────────────────────────────────────────────────
function flagsForEncounters(encs: EncounterMetric[]): BalanceFlag[] {
  const flags: BalanceFlag[] = [];
  for (const e of encs) {
    if (e.totalDecisions < MIN_SAMPLE_SIZE.encounter) continue;
    if (e.maxShare >= TARGET_ENCOUNTER_OPTION.problematicMaxShare) {
      flags.push(
        flag(
          "critical",
          "balance",
          `${e.encounterId} option dominant`,
          `Top option chosen ${(e.maxShare * 100).toFixed(1)}% of the time (>${(TARGET_ENCOUNTER_OPTION.problematicMaxShare * 100).toFixed(0)}%). The other branch is dead.`,
          { value: e.maxShare, anchorId: e.encounterId },
        ),
      );
    } else if (e.maxShare > TARGET_ENCOUNTER_OPTION.healthyMaxShare) {
      flags.push(
        flag(
          "warning",
          "balance",
          `${e.encounterId} biased`,
          `Top option chosen ${(e.maxShare * 100).toFixed(1)}% of the time. Minor rebalancing recommended.`,
          { value: e.maxShare, anchorId: e.encounterId },
        ),
      );
    }
  }
  return flags;
}

// ──────────────────────────────────────────────────────────────────────
//  Economy flags
// ──────────────────────────────────────────────────────────────────────
function flagsForEconomy(eco: EconomyMetrics, runs: number): BalanceFlag[] {
  const flags: BalanceFlag[] = [];
  if (runs < MIN_SAMPLE_SIZE.difficulty) return flags;
  if (eco.unlocksPerRun < 0.05) {
    flags.push(
      flag(
        "warning",
        "balance",
        "Unlock pacing too slow",
        `Players average ${eco.unlocksPerRun.toFixed(2)} unlocks per run. Increase rewards or reduce costs.`,
        { value: eco.unlocksPerRun },
      ),
    );
  }
  if (eco.averageMedalsPerRun < 50) {
    flags.push(
      flag(
        "info",
        "balance",
        "Low medal income",
        `Average medals per run: ${eco.averageMedalsPerRun.toFixed(1)}. Warbond unlocks may feel unreachable.`,
        { value: eco.averageMedalsPerRun },
      ),
    );
  }
  return flags;
}

// ──────────────────────────────────────────────────────────────────────
//  Top-level generator
// ──────────────────────────────────────────────────────────────────────
export function generateBalanceReport(events: TelemetryEvent[]): BalanceReport {
  const runs = computeRunMetrics(events);
  const cards = computeCardMetrics(events);
  const enemies = computeEnemyMetrics(events);
  const encounters = computeEncounterMetrics(events);
  const economy = computeEconomyMetrics(events);
  const curve = computeDifficultyCurve(events);

  const totalDeaths = Object.values(runs.deathsByEnemyTemplate).reduce(
    (acc, n) => acc + n,
    0,
  );

  const diffFlags = flagsForDifficulty(curve);
  const cardFlags = flagsForCards(cards);
  const enemyFlags = flagsForEnemies(enemies, totalDeaths);
  const encFlags = flagsForEncounters(encounters);
  const ecoFlags = flagsForEconomy(economy, runs.totalRuns);

  const allFlags = [...diffFlags, ...cardFlags, ...enemyFlags, ...encFlags, ...ecoFlags];

  return {
    generatedAt: Date.now(),
    totalEvents: events.length,
    totalRuns: runs.totalRuns,
    flags: allFlags,
    sections: {
      run: {
        id: "run",
        title: "Run Overview",
        rows: curve,
        flags: diffFlags,
        summary: `${runs.totalRuns} runs · ${(runs.winRateOverall * 100).toFixed(1)}% overall win rate · avg ${Math.round(runs.averageRunSeconds)}s`,
      },
      cards: {
        id: "cards",
        title: "Card Balance",
        rows: cards,
        flags: cardFlags,
        summary: `${cards.length} cards tracked across the event log.`,
      },
      enemies: {
        id: "enemies",
        title: "Enemy Balance",
        rows: enemies,
        flags: enemyFlags,
        summary: `${totalDeaths} player deaths attributed to ${enemies.length} enemy types.`,
      },
      encounters: {
        id: "encounters",
        title: "Encounter Decisions",
        rows: encounters,
        flags: encFlags,
        summary: `${encounters.length} unique encounters logged.`,
      },
      economy: {
        id: "economy",
        title: "Economy",
        rows: [
          { key: "Avg medals / run", value: economy.averageMedalsPerRun },
          { key: "Avg samples / run", value: economy.averageSamplesPerRun },
          { key: "Avg requisition / run", value: economy.averageRequisitionPerRun },
          { key: "Modules purchased", value: economy.modulesPurchased },
          { key: "Cosmetics purchased", value: economy.cosmeticsPurchased },
          { key: "Unlocks / run", value: economy.unlocksPerRun },
        ],
        flags: ecoFlags,
      },
    },
  };
}
