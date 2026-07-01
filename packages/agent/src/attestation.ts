/**
 * On-chain attestation for high-confidence signal clusters.
 *
 * When a signal cluster reaches GOAL/RED_CARD/PENALTY_AWARDED classification
 * with confidence >= ATTESTATION_THRESHOLD, the agent writes a compact,
 * verifiable hash of the event to Solana mainnet via the Memo program.
 *
 * Why this matters for "trustless settlement":
 *   - The attestation timestamp is the Solana block time, not our server clock.
 *     Anyone can verify WHEN the detection happened independent of our backend.
 *   - The hash commits to the exact signal data (fixture, market, shift, confidence)
 *     at detection time — if we tried to retroactively edit signals.jsonl to inflate
 *     our accuracy claims, the on-chain hash would not match.
 *   - This is the same trust model TxLINE itself uses for its odds/score data
 *     (Merkle roots anchored on Solana) — we're applying it to our own signal layer.
 *
 * This does NOT require deploying a custom program. The Memo program
 * (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr) is a standard Solana
 * program that simply stores arbitrary UTF-8 data in a transaction log.
 */

import { createHash } from "crypto";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import type { SignalCluster } from "./cluster";
import { logger } from "@txodds-wc/core";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

/** Minimum cluster confidence required to trigger an on-chain attestation */
export const ATTESTATION_THRESHOLD = 90;

/** Minimum seconds between attestations for the same fixture (avoid spam/fees) */
const ATTESTATION_COOLDOWN_MS = 60_000;

const lastAttestedAt = new Map<number, number>();

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

/**
 * Builds a deterministic SHA-256 hash committing to the cluster's key data.
 * Same input always produces same hash — this is what makes the attestation
 * independently verifiable: anyone can recompute the hash from signals.jsonl
 * and confirm it matches what's on-chain.
 */
export function buildAttestationHash(cluster: SignalCluster): string {
  const payload = JSON.stringify({
    fixtureId: cluster.fixtureId,
    eventType: cluster.eventType,
    confidence: cluster.confidence,
    maxShift: +cluster.maxShift.toFixed(2),
    marketsAgreeing: cluster.marketsAgreeing,
    detectedAt: cluster.detectedAt,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Builds the compact memo string written on-chain.
 * Kept short to minimize transaction size / fees.
 * Format: SMD1|<fixtureId>|<eventType>|<confidence>|<hash12>
 */
function buildMemoString(cluster: SignalCluster, hash: string): string {
  return [
    "SMD1", // schema tag: Sharp Movement Detector v1
    cluster.fixtureId,
    cluster.eventType,
    cluster.confidence,
    hash.slice(0, 16), // truncated hash — full hash recoverable from signals.jsonl
  ].join("|");
}

/**
 * Submits an on-chain attestation for a high-confidence cluster.
 * Returns null if the cluster doesn't meet the threshold or is in cooldown.
 */
export async function attestCluster(
  connection: Connection,
  payer: Keypair,
  cluster: SignalCluster
): Promise<Attestation | null> {
  if (cluster.confidence < ATTESTATION_THRESHOLD) return null;
  if (cluster.eventType === "ODDS_DRIFT" || cluster.eventType === "UNKNOWN") return null;

  const now = Date.now();
  const last = lastAttestedAt.get(cluster.fixtureId) ?? 0;
  if (now - last < ATTESTATION_COOLDOWN_MS) return null;

  const hash = buildAttestationHash(cluster);
  const memo = buildMemoString(cluster, hash);

  const ix = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: Buffer.from(memo, "utf-8"),
  });

  try {
    const tx = new Transaction().add(ix);
    const txSig = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
      skipPreflight: true,
    });

    lastAttestedAt.set(cluster.fixtureId, now);

    const attestation: Attestation = {
      fixtureId: cluster.fixtureId,
      fixture: cluster.fixture,
      eventType: cluster.eventType,
      confidence: cluster.confidence,
      maxShift: +cluster.maxShift.toFixed(2),
      detectedAt: cluster.detectedAt,
      hash,
      txSig,
      explorerUrl: `https://solscan.io/tx/${txSig}`,
    };

    logger.info("ON-CHAIN ATTESTATION", {
      fixture: cluster.fixture,
      eventType: cluster.eventType,
      confidence: cluster.confidence,
      txSig,
      explorerUrl: attestation.explorerUrl,
    });

    return attestation;
  } catch (err: any) {
    logger.warn("Attestation failed", {
      fixture: cluster.fixture,
      error: String(err).slice(0, 200),
    });
    return null;
  }
}
