import type { OddsShift } from "@txodds-wc/core";

// ─── Event types ──────────────────────────────────────────────────────────────

export type EventType = "GOAL" | "RED_CARD" | "PENALTY_AWARDED" | "ODDS_DRIFT" | "UNKNOWN";

// ─── Thresholds (all in implied-probability percentage points) ────────────────
//
// These values are calibrated against bookmaker repricing behaviour:
//   - A goal triggers large O/U moves (goals market is most sensitive)
//   - A red card triggers large 1X2 moves (10v11 changes win probability significantly)
//   - A penalty triggers simultaneous moves across all three markets
//   - General drift rarely exceeds 10-15% — these thresholds cut well above noise

/** O/U shift required to classify as GOAL via a single market signal */
const GOAL_OU_THRESHOLD = 30;

/** Asian Handicap shift that alone can suggest a goal (weaker signal than O/U) */
const GOAL_AH_THRESHOLD = 30;

/** 1X2 shift required to classify as RED_CARD via a single market signal */
const RED_CARD_1X2_THRESHOLD = 25;

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * Classifies the likely real-world event behind an odds shift.
 *
 * Per-signal classification (single market). For higher accuracy, use the
 * cluster classifier in cluster.ts which considers multiple markets together.
 *
 * Rules derived from how bookmakers reprice after match events:
 *   GOAL        — Over/Under spikes sharply (total goals market most reactive)
 *   RED_CARD    — 1X2 shifts heavily toward one team (10v11 changes win probability)
 *   ODDS_DRIFT  — Gradual movement below event thresholds
 */
export function classifyEvent(shift: OddsShift): EventType {
  const { market, shiftPct } = shift;

  if (market === "OVERUNDER_PARTICIPANT_GOALS") {
    return shiftPct >= GOAL_OU_THRESHOLD ? "GOAL" : "ODDS_DRIFT";
  }

  if (market === "1X2_PARTICIPANT_RESULT") {
    return shiftPct >= RED_CARD_1X2_THRESHOLD ? "RED_CARD" : "ODDS_DRIFT";
  }

  if (market === "ASIANHANDICAP_PARTICIPANT_GOALS") {
    return shiftPct >= GOAL_AH_THRESHOLD ? "GOAL" : "ODDS_DRIFT";
  }

  return "UNKNOWN";
}

// ─── Confidence score ─────────────────────────────────────────────────────────

/**
 * Confidence score 0–100 for a single-market signal.
 *
 * Components:
 *   40pts — shift magnitude  (normalised: 60%+ shift = full 40pts)
 *   30pts — market type      (O/U is most reliable indicator of a goal event)
 *   20pts — classification   (GOAL/RED_CARD > ODDS_DRIFT)
 *   10pts — magnitude bonus  (very large moves are almost always real events)
 *
 * For cluster-level confidence (multi-market corroboration), see cluster.ts.
 * Cluster confidence will be higher when 2+ markets agree.
 */
export function computeConfidence(shift: OddsShift): number {
  let score = 0;

  // Magnitude (max 40)
  score += Math.min(40, (shift.shiftPct / 60) * 40);

  // Market reliability (max 30)
  if (shift.market === "OVERUNDER_PARTICIPANT_GOALS")    score += 30;
  else if (shift.market === "ASIANHANDICAP_PARTICIPANT_GOALS") score += 20;
  else if (shift.market === "1X2_PARTICIPANT_RESULT")    score += 15;

  // Classification certainty (max 20)
  const eventType = classifyEvent(shift);
  if (eventType === "GOAL")            score += 20;
  else if (eventType === "RED_CARD")   score += 15;
  else if (eventType === "PENALTY_AWARDED") score += 18;
  else score += 5;

  // Large-move bonus (max 10) — shifts ≥40% are almost never noise
  if (shift.shiftPct >= 40)      score += 10;
  else if (shift.shiftPct >= 25) score += 5;

  return Math.min(100, Math.round(score));
}
