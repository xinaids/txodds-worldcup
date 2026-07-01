/**
 * Persists on-chain attestations to a separate JSONL file, kept apart from
 * signals.jsonl so the high-frequency signal stream doesn't bloat the
 * (much smaller, much more valuable) on-chain attestation log.
 */

import * as fs from "fs";
import * as path from "path";
import type { Attestation } from "./attestation";

const ATTESTATIONS_FILE = path.join(__dirname, "../../attestations.jsonl");

export function logAttestation(a: Attestation): void {
  fs.appendFileSync(ATTESTATIONS_FILE, JSON.stringify(a) + "\n", "utf-8");
}

export function loadAttestations(): Attestation[] {
  if (!fs.existsSync(ATTESTATIONS_FILE)) return [];
  return fs
    .readFileSync(ATTESTATIONS_FILE, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Attestation);
}
