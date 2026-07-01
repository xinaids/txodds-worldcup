import { streamScores, GAME_PHASE, STAT_KEY, logger } from "@txodds-wc/core";
import type { ScoreUpdate } from "@txodds-wc/core";
import { resolveSignal, loadSignals } from "./store";

type MatchResult = "home" | "away" | "draw";

function getResult(update: ScoreUpdate): MatchResult | null {
  const homeGoals = update.stats[STAT_KEY.HOME_GOALS] ?? 0;
  const awayGoals = update.stats[STAT_KEY.AWAY_GOALS] ?? 0;
  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";
  return "draw";
}

const FINISHED_PHASES = new Set<number>([
  GAME_PHASE.F,
  GAME_PHASE.FET,
  GAME_PHASE.FPE,
]);

/**
 * Starts a scores stream and resolves any unresolved signals once
 * the relevant match reaches full time.
 */
export function startOutcomeResolver(jwt: string, apiToken: string) {
  const unresolvedFixtures = new Set(
    loadSignals()
      .filter((s) => s.correct === undefined)
      .map((s) => s.fixtureId)
  );

  if (unresolvedFixtures.size === 0) {
    logger.info("No unresolved signals to watch.");
    return { stop: () => {} };
  }

  logger.info("Watching scores for outcome resolution", {
    fixtures: [...unresolvedFixtures],
  });

  return streamScores(jwt, apiToken, {
    onMessage: ({ data: update }) => {
      if (!unresolvedFixtures.has(update.fixtureId)) return;
      if (!FINISHED_PHASES.has(update.gamePhase)) return;

      const result = getResult(update);
      if (!result) return;

      const signals = loadSignals().filter(
        (s) => s.fixtureId === update.fixtureId && s.correct === undefined
      );

      for (const signal of signals) {
        resolveSignal(update.fixtureId, signal.detectedAt, result);
        logger.info("Signal resolved", {
          fixtureId: update.fixtureId,
          predicted: signal.predictedOutcome,
          actual: result,
          correct: signal.predictedOutcome === result,
        });
      }

      unresolvedFixtures.delete(update.fixtureId);
    },
    onError: (err) => logger.error("Scores stream error", { error: err.message }),
    onReconnect: (n) => logger.warn("Scores stream reconnecting", { attempt: n }),
  });
}
