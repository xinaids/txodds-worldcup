import type { OddsUpdate, OddsShift } from "@txodds-wc/core";

/**
 * Minimum % change in implied probability to be flagged as a "sharp move".
 * 5% is considered significant in consensus bookmaker feeds.
 */
export const SHARP_THRESHOLD_PCT = 5;

/** Convert decimal odds → implied probability (%) */
function toImplied(decimalOdds: number): number {
  if (decimalOdds <= 0) return 0;
  return (1 / decimalOdds) * 100;
}

/** Absolute % change in implied probability between two odds values */
function impliedShiftPct(prevOdds: number, currOdds: number): number {
  const prevImpl = toImplied(prevOdds);
  const currImpl = toImplied(currOdds);
  return Math.abs(currImpl - prevImpl);
}

/**
 * Compare a new odds update against the last known value for the same
 * fixture+market+line. Returns an OddsShift if the move exceeds the threshold.
 */
export function detectShift(
  prev: OddsUpdate,
  curr: OddsUpdate,
  fixtureLabel: { home: string; away: string }
): OddsShift | null {
  const p1Shift = impliedShiftPct(prev.participant1Odds, curr.participant1Odds);
  const p2Shift = impliedShiftPct(prev.participant2Odds, curr.participant2Odds);
  const drawShift =
    prev.drawOdds && curr.drawOdds
      ? impliedShiftPct(prev.drawOdds, curr.drawOdds)
      : 0;

  const maxShift = Math.max(p1Shift, p2Shift, drawShift);
  if (maxShift < SHARP_THRESHOLD_PCT) return null;

  let direction: OddsShift["direction"] = "home";
  if (p2Shift >= p1Shift && p2Shift >= drawShift) direction = "away";
  else if (drawShift > p1Shift && drawShift > p2Shift) direction = "draw";

  return {
    fixtureId: curr.fixtureId,
    home: fixtureLabel.home,
    away: fixtureLabel.away,
    market: curr.market,
    marketLine: curr.marketLine,
    previousP1: prev.participant1Odds,
    currentP1: curr.participant1Odds,
    previousP2: prev.participant2Odds,
    currentP2: curr.participant2Odds,
    shiftPct: maxShift,
    direction,
    detectedAt: curr.timestamp,
    predictedOutcome: direction,
  };
}
