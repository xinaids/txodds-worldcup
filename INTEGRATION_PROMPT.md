# On-Chain Settlement — Integration Task

Add a trustless on-chain attestation layer to the Sharp Movement Detector. When a signal cluster reaches GOAL/RED_CARD/PENALTY_AWARDED with confidence >= 90, write a verifiable hash of the event to Solana mainnet via the Memo program. This proves detections happened at a specific time, independently of our own server, and that we haven't retroactively edited our accuracy claims.

## Why this matters for judging

"Production Readiness" and "Innovation & Novelty" criteria reward genuine Web3-native design, not just a script that happens to read Solana-anchored data. This closes that gap: our own outputs become on-chain verifiable too, using the same trust model TxLINE itself uses (Merkle roots anchored on Solana) — applied to our signal layer.

## Files to add

Two new files already drafted — place them at:
- `packages/agent/src/attestation.ts`
- `packages/agent/src/attestation_store.ts`

(Content provided separately — paste as-is.)

## Wiring required

### 1. `packages/agent/src/index.ts`

Import the new modules:
```typescript
import { attestCluster, ATTESTATION_THRESHOLD } from "./attestation";
import { logAttestation } from "./attestation_store";
import { Connection, Keypair } from "@solana/web3.js";
import * as fs from "fs";
```

Set up a Solana connection + payer keypair near the top of `main()`, reusing the existing `WALLET_KEYPAIR_PATH` and `RPC_URL` env vars (same wallet already used for the TxLINE subscription):

```typescript
const keypairPath = process.env.WALLET_KEYPAIR_PATH!;
const payer = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
);
const connection = new Connection(
  process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com",
  "confirmed"
);
```

Update `onClusterDetected` to attempt an attestation (fire-and-forget, don't block the signal pipeline):

```typescript
function onClusterDetected(cluster: SignalCluster): void {
  if (cluster.eventType === "ODDS_DRIFT" && cluster.confidence < 30) return;
  logger.info("CLUSTER EVENT", { ... }); // existing log, keep as-is

  if (cluster.confidence >= ATTESTATION_THRESHOLD) {
    attestCluster(connection, payer, cluster)
      .then((attestation) => {
        if (attestation) logAttestation(attestation);
      })
      .catch(() => {}); // already logged inside attestCluster
  }
}
```

Important: `attestCluster` must NOT be awaited in the main signal-processing path — it should run async in the background so a slow/failed Solana tx never blocks odds stream processing. The fire-and-forget `.then()/.catch()` pattern above achieves this.

### 2. `packages/api/src/index.ts`

Add a new endpoint exposing the attestation log:

```typescript
import { loadAttestations } from "../../agent/src/attestation_store";

app.get("/api/attestations", (_req: Request, res: Response) => {
  const attestations = loadAttestations();
  res.json({
    total: attestations.length,
    description: "On-chain attestations of high-confidence signal clusters (Solana Memo program). Each entry is independently verifiable via the Solscan link — the hash commits to the exact signal data at detection time.",
    data: attestations.slice(-50).reverse(),
  });
});
```

Also update the root `GET /` endpoint list to include this new route.

### 3. Cost/safety guardrails already built into attestation.ts — verify these are intact:

- `ATTESTATION_THRESHOLD = 90` — only the highest-confidence clusters get attested (keeps fees low, keeps signal-to-noise high)
- `ATTESTATION_COOLDOWN_MS = 60_000` — max 1 attestation per fixture per minute, prevents fee drain during rapid market churn
- Memo program requires zero rent, zero account creation — each attestation costs only the standard ~0.000005 SOL transaction fee
- Failures are caught and logged, never thrown — a Solana RPC hiccup must never crash the agent

## Verification after wiring

1. `npx tsc --noEmit --project packages/agent/tsconfig.json` — must pass clean
2. `npx tsc --noEmit --project packages/api/tsconfig.json` — must pass clean
3. Restart the agent and watch for `"ON-CHAIN ATTESTATION"` log lines during a live match with high-confidence GOAL clusters
4. Hit `GET /api/attestations` and confirm `explorerUrl` links resolve on Solscan with the memo data visible in the transaction
5. Update `README.md` with a new section "On-Chain Attestation" explaining the trust model (use the docstring at the top of attestation.ts as source material)

## What this enables for the demo video

Judges can click a Solscan link from a live API response and see, on Solana mainnet, in plaintext, the memo: `SMD1|17588234|GOAL|95|a3f8c91b2e4d5678` — fixture ID, event type, confidence, and a truncated hash of our detection, timestamped by Solana's own clock. That's the moment in the demo that proves this isn't just a script — it's a system that puts its own claims on a public, immutable ledger.
