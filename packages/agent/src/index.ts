/**
 * Sharp Movement Detector — TxODDS World Cup Hackathon
 * Track: Trading Tools and Agents
 *
 * Monitors all live World Cup odds via TxLINE SSE stream.
 * Flags significant odds shifts (>= 5% implied probability change).
 * Groups signals into 10-second clusters per fixture, then reclassifies
 * based on multi-market corroboration — GOAL, RED_CARD, PENALTY_AWARDED.
 *
 * Usage:
 *   TXLINE_JWT=... TXLINE_API_TOKEN=... npx ts-node src/index.ts
 */
import "dotenv/config";
import {
  streamOdds,
  getFixtures,
  createHttpClient,
  logger,
  WORLD_CUP_COMPETITION_ID,
} from "@txodds-wc/core";
import type { OddsUpdate, Fixture } from "@txodds-wc/core";
import { detectShift, SHARP_THRESHOLD_PCT } from "./detector";
import { isDuplicate } from "./dedup";
import { classifyEvent, computeConfidence } from "./classifier";
import { logSignal, loadSignals, computeAccuracy } from "./store";
import { startOutcomeResolver } from "./resolver";
import { LiveClusterer } from "./cluster";
import type { SignalCluster } from "./cluster";
import { attestCluster, ATTESTATION_THRESHOLD } from "./attestation";
import { logAttestation } from "./attestation_store";
import { Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs";

// ─── Config ───────────────────────────────────────────────────────────────────

const JWT = process.env.TXLINE_JWT;
const API_TOKEN = process.env.TXLINE_API_TOKEN;

if (!JWT || !API_TOKEN) {
  logger.error(
    "Missing TXLINE_JWT or TXLINE_API_TOKEN. Run packages/core setup first."
  );
  process.exit(1);
}

// ─── State ────────────────────────────────────────────────────────────────────

/** Last known odds per (fixtureId, market, marketLine) */
const lastOdds = new Map<string, OddsUpdate>();

// Solana connection + payer — initialised in main(), referenced in onClusterDetected
let connection: Connection;
let payer: Keypair;

/** Fixture info cache */
const fixtureMap = new Map<number, Fixture>();

function oddsKey(update: OddsUpdate): string {
  return `${update.fixtureId}:${update.market}:${update.marketLine}`;
}

// ─── Cluster handler ──────────────────────────────────────────────────────────

/**
 * Called when a 10-second market window closes for a fixture.
 * Logs the cluster-level event (multi-market corroboration) separately
 * from individual per-signal detections.
 */
function onClusterDetected(cluster: SignalCluster): void {
  if (cluster.eventType === "ODDS_DRIFT" && cluster.confidence < 30) return;
  logger.info("CLUSTER EVENT", {
    eventType: cluster.eventType,
    confidence: cluster.confidence,
    fixture: cluster.fixture,
    marketsAgreeing: cluster.marketsAgreeing,
    maxShift: cluster.maxShift.toFixed(2) + "%",
    signals: cluster.signals.length,
    detectedAt: cluster.detectedAt,
  });

  if (cluster.confidence >= ATTESTATION_THRESHOLD) {
    attestCluster(connection, payer, cluster)
      .then((attestation) => {
        if (attestation) logAttestation(attestation);
      })
      .catch(() => {}); // already logged inside attestCluster
  }
}

const clusterer = new LiveClusterer(onClusterDetected);

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  logger.info("Sharp Movement Detector starting...", {
    threshold: `${SHARP_THRESHOLD_PCT}%`,
  });

  // Solana connection + payer for on-chain attestations
  const keypairPath = process.env.WALLET_KEYPAIR_PATH!;
  payer = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
  );
  connection = new Connection(
    process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  // Pre-load World Cup fixture labels
  const client = createHttpClient(JWT!, API_TOKEN!);
  try {
    const fixtures = await getFixtures(client, WORLD_CUP_COMPETITION_ID);
    for (const f of fixtures) fixtureMap.set(f.FixtureId, f);
    logger.info("Fixtures loaded", { count: fixtures.length });
  } catch (err) {
    logger.warn("Could not pre-load fixtures — labels will show IDs only", {
      error: String(err),
    });
  }

  // Print existing accuracy stats
  const signals = loadSignals();
  const stats = computeAccuracy(signals);
  logger.info("Loaded previous signals", stats);

  // Start outcome resolver in background
  const resolver = startOutcomeResolver(JWT!, API_TOKEN!);

  // ─── Main odds stream ───────────────────────────────────────────────────────

  let oddsUpdatesReceived = 0;
  let signalsDetected = 0;

  const oddsStream = streamOdds(JWT!, API_TOKEN!, {
    onMessage: ({ data: update }) => {
      oddsUpdatesReceived++;

      const key = oddsKey(update);
      const prev = lastOdds.get(key);

      if (prev) {
        const fixture = fixtureMap.get(update.fixtureId);
        const label = {
          home: fixture?.Participant1 ?? `Team A (${update.fixtureId})`,
          away: fixture?.Participant2 ?? `Team B (${update.fixtureId})`,
        };

        const shift = detectShift(prev, update, label);
        if (
          shift &&
          !isDuplicate(
            update.fixtureId,
            update.market,
            update.marketLine,
            shift.currentP1,
            shift.currentP2
          )
        ) {
          shift.eventType = classifyEvent(shift);
          shift.confidence = computeConfidence(shift);
          signalsDetected++;
          logSignal(shift);

          // Feed into the live clusterer for multi-market corroboration
          clusterer.feed(shift);

          logger.info("SHARP MOVE DETECTED", {
            eventType: shift.eventType,
            confidence: shift.confidence,
            fixture: `${label.home} vs ${label.away}`,
            market: shift.market,
            line: shift.marketLine,
            direction: shift.direction,
            shiftPct: shift.shiftPct.toFixed(2) + "%",
            p1: `${shift.previousP1} → ${shift.currentP1}`,
            p2: `${shift.previousP2} → ${shift.currentP2}`,
          });
        }
      }

      lastOdds.set(key, update);

      // Periodic status log every 1000 updates
      if (oddsUpdatesReceived % 1_000 === 0) {
        const acc = computeAccuracy(loadSignals());
        logger.info("Status", {
          oddsUpdatesReceived,
          signalsDetected,
          accuracy: `${(acc.accuracy * 100).toFixed(1)}% (${acc.correct}/${acc.resolved})`,
        });
      }
    },

    onError: (err) =>
      logger.error("Odds stream error", { error: err.message }),

    onReconnect: (attempt) =>
      logger.warn("Odds stream reconnecting", { attempt }),
  });

  // ─── Graceful shutdown ──────────────────────────────────────────────────────

  const shutdown = () => {
    logger.info("Shutting down...");
    oddsStream.stop();
    resolver.stop();
    clusterer.flush();

    const final = computeAccuracy(loadSignals());
    logger.info("Final accuracy", final);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  logger.info("Agent running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  logger.error("Fatal error", { error: String(err) });
  process.exit(1);
});
