/**
 * Backtester: cross-references GOAL signals with actual score timelines.
 *
 * For each OVERUNDER signal with shiftPct >= 30%, fetches the fixture's full
 * score event log from TxLINE and checks whether the total goal count changed
 * within ±2 minutes of the signal's detectedAt timestamp.
 *
 * This turns 46k stored data points into a verifiable accuracy claim:
 * "X% of high-confidence GOAL signals preceded actual goals within 2 minutes."
 *
 * Writes `correct: true|false` back to signals.jsonl for resolved entries.
 * Safe to run multiple times — already-resolved signals are skipped.
 */

import "dotenv/config";
import { createHttpClient, getScoreUpdates, logger } from "@txodds-wc/core";
import type { OddsShift } from "@txodds-wc/core";
import * as fs from "fs";
import * as path from "path";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Only Over/Under signals are backtested — they are the primary GOAL signal */
const GOAL_MARKET = "OVERUNDER_PARTICIPANT_GOALS";

/** Minimum implied probability shift to classify as a GOAL detection */
const GOAL_SHIFT_THRESHOLD = 30;

/**
 * ±2 minute tolerance window.
 * Bookmakers typically reprice within 30–90 seconds of a goal; 2 minutes
 * accounts for slow feeds and halftime goal corrections.
 */
const GOAL_WINDOW_MS = 2 * 60 * 1_000;

const SIGNALS_FILE = path.join(__dirname, "../../signals.jsonl");

// ─── Score helpers ────────────────────────────────────────────────────────────


/**
 * Walks a sorted score timeline and returns the Unix ms timestamp of each
 * event where the total goal count increased (i.e., a goal was scored).
 */
function extractGoalTimestamps(updates: any[]): number[] {
  // TxLINE real schema: Action="goal" marks each goal event, Ts=unix ms
  return updates
    .filter((u: any) => u.Action === "goal")
    .map((u: any) => u.Ts as number)
    .sort((a: number, b: number) => a - b);
}

/** Returns true if any goal timestamp falls within ±windowMs of signalTime */
function goalWithinWindow(signalMs: number, goalTimesMs: number[], windowMs: number): boolean {
  return goalTimesMs.some((gt) => Math.abs(gt - signalMs) <= windowMs);
}

// ─── Accuracy report ─────────────────────────────────────────────────────────

export interface ConfidenceBand {
  total: number;
  correct: number;
  accuracy: number;
}

export interface BacktestReport {
  totalGoalSignals: number;
  resolved: number;
  correct: number;
  accuracy: number;
  byConfidenceBand: {
    "90-100": ConfidenceBand;
    "70-89": ConfidenceBand;
    "50-69": ConfidenceBand;
    "0-49": ConfidenceBand;
  };
}

export function computeBacktestReport(signals: OddsShift[]): BacktestReport {
  const goalSignals = signals.filter(
    (s) => s.market === GOAL_MARKET && (s.shiftPct ?? 0) >= GOAL_SHIFT_THRESHOLD
  );

  const bands = {
    "90-100": { total: 0, correct: 0, accuracy: 0 },
    "70-89": { total: 0, correct: 0, accuracy: 0 },
    "50-69": { total: 0, correct: 0, accuracy: 0 },
    "0-49": { total: 0, correct: 0, accuracy: 0 },
  };

  let resolved = 0;
  let correct = 0;

  for (const s of goalSignals) {
    if (s.correct === undefined) continue;
    resolved++;
    if (s.correct) correct++;

    const conf = s.confidence ?? 0;
    let band: keyof typeof bands;
    if (conf >= 90) band = "90-100";
    else if (conf >= 70) band = "70-89";
    else if (conf >= 50) band = "50-69";
    else band = "0-49";

    bands[band].total++;
    if (s.correct) bands[band].correct++;
  }

  for (const b of Object.values(bands)) {
    b.accuracy = b.total > 0 ? b.correct / b.total : 0;
  }

  return {
    totalGoalSignals: goalSignals.length,
    resolved,
    correct,
    accuracy: resolved > 0 ? correct / resolved : 0,
    byConfidenceBand: bands,
  };
}

// ─── Main backtest runner ─────────────────────────────────────────────────────

export async function runBacktest(jwt: string, apiToken: string): Promise<BacktestReport> {
  const client = createHttpClient(jwt, apiToken);

  const raw = fs.readFileSync(SIGNALS_FILE, "utf-8").split("\n").filter(Boolean);
  const lines = [...raw]; // mutable copy for in-place updates

  const signals = lines.map((l) => JSON.parse(l) as OddsShift);

  // Only consider GOAL signals not yet resolved
  const pending = signals
    .map((s, i) => ({ s, i }))
    .filter(
      ({ s }) =>
        s.market === GOAL_MARKET &&
        (s.shiftPct ?? 0) >= GOAL_SHIFT_THRESHOLD &&
        s.correct === undefined &&
        s.fixtureId &&
        s.detectedAt
    );

  // Group by fixtureId to minimise API calls (one HTTP call per fixture)
  const byFixture = new Map<number, Array<{ s: OddsShift; i: number }>>();
  for (const entry of pending) {
    const fid = entry.s.fixtureId;
    if (!byFixture.has(fid)) byFixture.set(fid, []);
    byFixture.get(fid)!.push(entry);
  }

  logger.info("Backtest started", {
    pendingGoalSignals: pending.length,
    fixtures: byFixture.size,
  });

  let resolved = 0;
  let correct = 0;

  for (const [fixtureId, entries] of byFixture) {
    try {
      const updates: any[] = await getScoreUpdates(client, fixtureId);
      const goalTimes = extractGoalTimestamps(updates);

      logger.info("Score timeline fetched", {
        fixtureId,
        scoreUpdates: updates.length,
        goalEvents: goalTimes.length,
      });

      for (const { s, i } of entries) {
        const signalMs = new Date(s.detectedAt).getTime();
        const isCorrect = goalWithinWindow(signalMs, goalTimes, GOAL_WINDOW_MS);

        const updated: OddsShift = { ...s, correct: isCorrect };
        lines[i] = JSON.stringify(updated);
        resolved++;
        if (isCorrect) correct++;
      }
    } catch (err) {
      logger.warn("Could not fetch score history for fixture", {
        fixtureId,
        error: String(err),
      });
    }
  }

  if (resolved > 0) {
    fs.writeFileSync(SIGNALS_FILE, lines.join("\n") + "\n", "utf-8");
    logger.info("signals.jsonl updated with backtest results", { resolved, correct });
  }

  const allSignals = lines.map((l) => JSON.parse(l) as OddsShift);
  const report = computeBacktestReport(allSignals);

  logger.info("Backtest complete", {
    totalGoalSignals: report.totalGoalSignals,
    resolved: report.resolved,
    correct: report.correct,
    accuracy: `${(report.accuracy * 100).toFixed(1)}%`,
  });

  return report;
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const jwt = process.env.TXLINE_JWT;
  const apiToken = process.env.TXLINE_API_TOKEN;
  if (!jwt || !apiToken) {
    console.error("Missing TXLINE_JWT or TXLINE_API_TOKEN");
    process.exit(1);
  }
  runBacktest(jwt, apiToken)
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
