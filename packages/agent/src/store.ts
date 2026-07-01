import * as fs from "fs";
import * as path from "path";
import type { OddsShift } from "@txodds-wc/core";
import { GAME_PHASE } from "@txodds-wc/core";

const SIGNALS_FILE = path.join(__dirname, "../../signals.jsonl");

/** Append a detected shift to the JSONL log file */
export function logSignal(shift: OddsShift): void {
  const line = JSON.stringify(shift) + "\n";
  fs.appendFileSync(SIGNALS_FILE, line, "utf-8");
}

/** Read all logged signals */
export function loadSignals(): OddsShift[] {
  if (!fs.existsSync(SIGNALS_FILE)) return [];
  return fs
    .readFileSync(SIGNALS_FILE, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as OddsShift);
}

/** Accuracy report across all resolved signals */
export function computeAccuracy(signals: OddsShift[]): {
  total: number;
  resolved: number;
  correct: number;
  accuracy: number;
} {
  const resolved = signals.filter((s) => s.correct !== undefined);
  const correct = resolved.filter((s) => s.correct).length;
  return {
    total: signals.length,
    resolved: resolved.length,
    correct,
    accuracy: resolved.length > 0 ? correct / resolved.length : 0,
  };
}

/**
 * Update a signal's outcome once the match ends.
 * In production, call this after score stream emits phase = F (5).
 */
export function resolveSignal(
  fixtureId: number,
  detectedAt: string,
  actualOutcome: "home" | "away" | "draw"
): void {
  if (!fs.existsSync(SIGNALS_FILE)) return;

  const lines = fs.readFileSync(SIGNALS_FILE, "utf-8").split("\n").filter(Boolean);
  const updated = lines.map((line) => {
    const s = JSON.parse(line) as OddsShift;
    if (s.fixtureId === fixtureId && s.detectedAt === detectedAt) {
      s.actualOutcome = actualOutcome;
      s.correct = s.predictedOutcome === actualOutcome;
    }
    return JSON.stringify(s);
  });

  fs.writeFileSync(SIGNALS_FILE, updated.join("\n") + "\n", "utf-8");
}
