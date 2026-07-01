export type EventType =
  | "GOAL"
  | "RED_CARD"
  | "PENALTY_AWARDED"
  | "ODDS_DRIFT"
  | "UNKNOWN";

export interface OddsShift {
  fixtureId: number;
  home: string;
  away: string;
  market: string;
  marketLine: string;
  previousP1: number;
  currentP1: number;
  previousP2: number;
  currentP2: number;
  shiftPct: number;
  direction: "home" | "away" | "draw";
  detectedAt: string;
  eventType?: EventType;
  confidence?: number;
  predictedOutcome?: string;
  actualOutcome?: string;
  correct?: boolean;
}

export interface ClusterDTO {
  fixtureId: number;
  fixture: string;
  detectedAt: string;
  windowEnd: string;
  eventType: EventType;
  confidence: number;
  marketsAgreeing: number;
  maxShift: number;
  signalCount: number;
  signals: OddsShift[];
}

export interface ClustersResponse {
  total: number;
  limit: number;
  data: ClusterDTO[];
}

export interface StatsResponse {
  totalSignals: number;
  matchesCovered: number;
  avgShiftPct: number;
  maxShiftPct: number;
  maxShiftSignal: OddsShift | null;
  byFixture: [string, number][];
  byEventType: Record<string, number>;
  byMarket: Record<string, number>;
}

export interface AccuracyGoalResult {
  goalTime: string;
  signalsNear: number;
  maxConfidence: number;
  maxShift: string;
  firstSignalBeforeGoal: string;
}

export interface AccuracyResponse {
  methodology: string;
  verifiedMatch: {
    fixture: string;
    date: string;
    totalGoals: number;
    goalsDetected: number;
    detectionRate: string;
    results: AccuracyGoalResult[];
  };
  keyFinding: string;
  totalSignalsCollected: number;
  matchesCovered: number;
}

export interface Attestation {
  fixtureId: number;
  fixture: string;
  eventType: string;
  confidence: number;
  maxShift: number;
  detectedAt: string;
  hash: string;
  txSig?: string;
  explorerUrl?: string;
}

export interface AttestationsResponse {
  total: number;
  description: string;
  data: Attestation[];
}

export interface LiveFixture {
  fixtureId: number;
  fixture: string;
  signalCount: number;
  latestEvent: {
    eventType?: EventType;
    confidence?: number;
    detectedAt: string;
    shiftPct: number;
  };
}

export interface FixturesLiveResponse {
  total: number;
  fixtures: LiveFixture[];
}

export interface HealthResponse {
  status: string;
  ts: string;
  signals: number;
}
