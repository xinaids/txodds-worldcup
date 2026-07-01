/**
 * Signal clustering: groups individual odds shifts into market events.
 *
 * A single real-world event (goal, red card, penalty) triggers simultaneous
 * repricing across multiple markets. By collecting all shifts within a 10-second
 * window per fixture, we can classify the underlying event with much higher
 * confidence than any single market shift allows.
 *
 * Corroboration logic:
 *   GOAL        — Over/Under primary (≥30%). AH or 1X2 agreeing raises confidence.
 *   RED_CARD    — 1X2 shifts toward one team (≥20%) + AH moves same way; O/U stays flat.
 *   PENALTY     — All three markets move simultaneously (1X2 + AH + O/U).
 *   ODDS_DRIFT  — Everything else; lower confidence.
 */

import type { OddsShift } from "@txodds-wc/core";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType = "GOAL" | "RED_CARD" | "PENALTY_AWARDED" | "ODDS_DRIFT" | "UNKNOWN";

export interface SignalCluster {
  fixtureId: number;
  fixture: string;
  detectedAt: string;  // ISO — timestamp of first signal in window
  windowEnd: string;   // ISO — timestamp of last signal in window
  eventType: EventType;
  confidence: number;
  marketsAgreeing: number;
  maxShift: number;
  signals: OddsShift[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** How long to buffer signals per fixture before classifying the cluster */
export const CLUSTER_WINDOW_MS = 10_000;

const MARKET_OU  = "OVERUNDER_PARTICIPANT_GOALS";
const MARKET_1X2 = "1X2_PARTICIPANT_RESULT";
const MARKET_AH  = "ASIANHANDICAP_PARTICIPANT_GOALS";

/** Minimum OU shift to classify the cluster as GOAL */
const GOAL_OU_THRESHOLD = 30;

/** Minimum 1X2 shift to flag potential RED_CARD */
const RED_CARD_1X2_THRESHOLD = 20;

/** Minimum shift in each market to call PENALTY (all three must agree) */
const PENALTY_OU_MIN  = 20;
const PENALTY_AH_MIN  = 15;
const PENALTY_1X2_MIN = 15;

// ─── Classification ───────────────────────────────────────────────────────────

function maxShiftFor(signals: OddsShift[], market: string): number {
  const ms = signals.filter((s) => s.market === market);
  return ms.length > 0 ? Math.max(...ms.map((s) => s.shiftPct)) : 0;
}

function classifyCluster(signals: OddsShift[]): {
  eventType: EventType;
  confidence: number;
  marketsAgreeing: number;
} {
  const markets = new Set(signals.map((s) => s.market));
  const ouMax  = maxShiftFor(signals, MARKET_OU);
  const ahMax  = maxShiftFor(signals, MARKET_AH);
  const x2Max  = maxShiftFor(signals, MARKET_1X2);
  const maxAll = Math.max(ouMax, ahMax, x2Max);

  // PENALTY: all three markets move simultaneously
  if (
    markets.has(MARKET_OU) && markets.has(MARKET_AH) && markets.has(MARKET_1X2) &&
    ouMax >= PENALTY_OU_MIN && ahMax >= PENALTY_AH_MIN && x2Max >= PENALTY_1X2_MIN
  ) {
    return {
      eventType: "PENALTY_AWARDED",
      confidence: Math.min(100, Math.round(72 + maxAll / 4)),
      marketsAgreeing: 3,
    };
  }

  // GOAL: Over/Under primary, corroboration boosts confidence
  if (ouMax >= GOAL_OU_THRESHOLD) {
    const corroborating = (markets.has(MARKET_AH) ? 1 : 0) + (markets.has(MARKET_1X2) ? 1 : 0);
    if (corroborating >= 1) {
      return {
        eventType: "GOAL",
        confidence: Math.min(100, Math.round(85 + ouMax / 10)),
        marketsAgreeing: 1 + corroborating,
      };
    }
    return {
      eventType: "GOAL",
      confidence: Math.min(75, Math.round(60 + ouMax / 5)),
      marketsAgreeing: 1,
    };
  }

  // RED_CARD: 1X2 heavy + AH agrees, Over/Under does NOT spike
  if (x2Max >= RED_CARD_1X2_THRESHOLD && markets.has(MARKET_AH) && ouMax < GOAL_OU_THRESHOLD) {
    return {
      eventType: "RED_CARD",
      confidence: Math.min(95, Math.round(65 + x2Max)),
      marketsAgreeing: 2,
    };
  }
  if (x2Max >= RED_CARD_1X2_THRESHOLD + 5) {
    return {
      eventType: "RED_CARD",
      confidence: Math.min(80, Math.round(55 + x2Max / 2)),
      marketsAgreeing: 1,
    };
  }

  return {
    eventType: "ODDS_DRIFT",
    confidence: Math.min(40, Math.round(maxAll)),
    marketsAgreeing: markets.size,
  };
}

// ─── Cluster builder ──────────────────────────────────────────────────────────

/**
 * Groups a flat list of signals into 10-second windows per fixture.
 * Returns clusters sorted newest-first.
 *
 * Works for both historical analysis (pass all signals from signals.jsonl)
 * and for in-memory live buffering in the agent.
 */
export function buildClusters(signals: OddsShift[]): SignalCluster[] {
  // Skip corrupt entries (shiftPct can be null in early bad data)
  const valid = signals.filter(
    (s) => s.fixtureId && s.detectedAt && s.shiftPct != null &&
           s.home && !s.home.includes("undefined")
  );

  const sorted = [...valid].sort(
    (a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
  );

  const clusters: SignalCluster[] = [];
  // fixtureId -> {bucket, windowOpenMs}
  const pending = new Map<number, { bucket: OddsShift[]; windowOpenMs: number }>();

  const flush = (fixtureId: number) => {
    const p = pending.get(fixtureId);
    if (!p || p.bucket.length === 0) return;
    clusters.push(makeCluster(fixtureId, p.bucket));
    pending.delete(fixtureId);
  };

  for (const signal of sorted) {
    const fid = signal.fixtureId;
    const ts  = new Date(signal.detectedAt).getTime();
    const p   = pending.get(fid);

    if (!p) {
      pending.set(fid, { bucket: [signal], windowOpenMs: ts });
    } else if (ts - p.windowOpenMs > CLUSTER_WINDOW_MS) {
      flush(fid);
      pending.set(fid, { bucket: [signal], windowOpenMs: ts });
    } else {
      p.bucket.push(signal);
    }
  }

  for (const fid of pending.keys()) flush(fid);

  return clusters.sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );
}

function makeCluster(fixtureId: number, signals: OddsShift[]): SignalCluster {
  const times = signals.map((s) => new Date(s.detectedAt).getTime());
  const { eventType, confidence, marketsAgreeing } = classifyCluster(signals);
  const first = signals[0];

  return {
    fixtureId,
    fixture: `${first.home} vs ${first.away}`,
    detectedAt: new Date(Math.min(...times)).toISOString(),
    windowEnd:  new Date(Math.max(...times)).toISOString(),
    eventType,
    confidence,
    marketsAgreeing,
    maxShift: Math.max(...signals.map((s) => s.shiftPct)),
    signals,
  };
}

// ─── Live clusterer (used in agent) ──────────────────────────────────────────

/**
 * Stateful clusterer for the live agent stream.
 * Call feed() for each incoming signal. When a fixture's 10-second window
 * closes (detected on next signal from same fixture), onCluster fires.
 */
export class LiveClusterer {
  private pending = new Map<number, { bucket: OddsShift[]; windowOpenMs: number }>();
  private onCluster: (cluster: SignalCluster) => void;

  constructor(onCluster: (cluster: SignalCluster) => void) {
    this.onCluster = onCluster;
  }

  feed(signal: OddsShift): void {
    if (!signal.fixtureId || signal.shiftPct == null) return;

    const fid = signal.fixtureId;
    const ts  = new Date(signal.detectedAt).getTime();
    const p   = this.pending.get(fid);

    if (!p) {
      this.pending.set(fid, { bucket: [signal], windowOpenMs: ts });
    } else if (ts - p.windowOpenMs > CLUSTER_WINDOW_MS) {
      if (p.bucket.length > 0) {
        this.onCluster(makeCluster(fid, p.bucket));
      }
      this.pending.set(fid, { bucket: [signal], windowOpenMs: ts });
    } else {
      p.bucket.push(signal);
    }
  }

  /** Flush all pending windows (call on shutdown) */
  flush(): void {
    for (const [fid, p] of this.pending.entries()) {
      if (p.bucket.length > 0) this.onCluster(makeCluster(fid, p.bucket));
    }
    this.pending.clear();
  }
}
