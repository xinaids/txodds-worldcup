// ─── Auth ────────────────────────────────────────────────────────────────────

export interface GuestAuthResponse {
  token: string;
}

export interface ActivationResponse {
  token: string;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

export interface Fixture {
  FixtureId: number;
  CompetitionId: number;
  CompetitionName: string;
  Participant1: string;  // home
  Participant2: string;  // away
  StartTime: string;     // ISO
  Status: string;
}

// ─── Odds ─────────────────────────────────────────────────────────────────────

export interface OddsUpdate {
  messageId: string;
  fixtureId: number;
  timestamp: string;
  market: string;
  marketLine: string;
  participant1Odds: number;
  participant2Odds: number;
  drawOdds?: number;
  bookmaker?: string;
}

export interface OddsSnapshot {
  fixtureId: number;
  market: string;
  marketLine: string;
  participant1Odds: number;
  participant2Odds: number;
  drawOdds?: number;
  timestamp: string;
  messageId: string;
}

// ─── Scores ───────────────────────────────────────────────────────────────────

/**
 * Game phase IDs from the Soccer Feed spec.
 */
export const GAME_PHASE = {
  NS: 1,    // Not started
  H1: 2,    // First half
  HT: 3,    // Half time
  H2: 4,    // Second half
  F: 5,     // Finished
  WET: 6,
  ET1: 7,
  HTET: 8,
  ET2: 9,
  FET: 10,
  WPE: 11,
  PE: 12,
  FPE: 13,
  I: 14,    // Interrupted
  A: 15,    // Abandoned
  C: 16,    // Cancelled
  TXCC: 17,
  TXCS: 18,
  P: 19,    // Postponed
} as const;

export type GamePhaseId = (typeof GAME_PHASE)[keyof typeof GAME_PHASE];

export const GAME_PHASE_LABEL: Record<GamePhaseId, string> = {
  1: "NS", 2: "H1", 3: "HT", 4: "H2", 5: "F",
  6: "WET", 7: "ET1", 8: "HTET", 9: "ET2", 10: "FET",
  11: "WPE", 12: "PE", 13: "FPE", 14: "I", 15: "A",
  16: "C", 17: "TXCC", 18: "TXCS", 19: "P",
};

/** Stat key encoding: (period * 1000) + base_key */
export const STAT_KEY = {
  HOME_GOALS: 1,
  AWAY_GOALS: 2,
  HOME_YELLOW: 3,
  AWAY_YELLOW: 4,
  HOME_RED: 5,
  AWAY_RED: 6,
  HOME_CORNERS: 7,
  AWAY_CORNERS: 8,
} as const;

export interface ScoreUpdate {
  messageId: string;
  fixtureId: number;
  timestamp: string;
  gamePhase: GamePhaseId;
  elapsed?: number;         // minutes elapsed
  stats: Record<number, number>; // stat key → value
}

export interface ScoreSnapshot {
  fixtureId: number;
  gamePhase: GamePhaseId;
  elapsed?: number;
  stats: Record<number, number>;
  timestamp: string;
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export type EventType = "GOAL" | "RED_CARD" | "PENALTY_AWARDED" | "ODDS_DRIFT" | "UNKNOWN";

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
