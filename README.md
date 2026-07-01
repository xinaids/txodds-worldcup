# TxODDS World Cup Hackathon — Monorepo

Three tracks, one shared data layer.

```
packages/
  core/      Shared: TxLINE auth, SSE stream client, HTTP client, types
  agent/     Track 2 — Trading Tools & Agents   (Sharp Movement Detector)
  fan/       Track 3 — Consumer & Fan Experiences (live match dashboard)
  markets/   Track 1 — Prediction Markets & Settlement (Anchor program)
```

## Prerequisites

- Node.js 20+
- Rust + Anchor CLI (for `markets` track only)
- Solana CLI + funded mainnet wallet (≥ 0.01 SOL for subscription tx)

## Setup (do this first)

### 1. Clone & install

```bash
git clone https://github.com/xinaids/txodds-worldcup
cd txodds-worldcup
npm install
```

### 2. Download TxLINE IDL

Get the mainnet IDL from:
https://txline-docs.txodds.com/documentation/programs/mainnet.md

Save it as:
```
packages/core/src/txline_idl.json
```

### 3. Subscribe & activate (one-time)

```bash
WALLET_KEYPAIR_PATH=~/.config/solana/id.json \
  npm run setup
```

This writes `TXLINE_JWT` and `TXLINE_API_TOKEN` to `.env`.

---

## Track 2 — Sharp Movement Detector

Monitors all World Cup matches autonomously. Flags significant odds shifts
(≥ 5% implied probability change). Tracks prediction accuracy over the tournament.

```bash
npm run agent
```

Output is structured JSON logs (one line per event):

```json
{"ts":"2026-06-24T18:00:00Z","level":"info","msg":"SHARP MOVE DETECTED",
 "fixture":"Brazil vs Argentina","market":"1X2","direction":"home",
 "shiftPct":"6.3%","p1":"1.80 → 1.65","p2":"4.20 → 4.60"}
```

All signals are appended to `packages/signals.jsonl` with outcome tracking.

### Judging criteria checklist

| Criterion | How we meet it |
|---|---|
| Core Functionality & Data Ingestion | SSE stream with auto-reconnect, typed OddsUpdate events |
| Autonomous Operation | Zero manual input — runs until SIGTERM |
| Logic & Code Architecture | Pure `detectShift()` function, deterministic, unit-testable |
| Innovation & Novelty | Implied probability shift (not raw odds change) — sharp-money methodology |
| Production Readiness | Structured logs, backoff reconnect, graceful shutdown, JSONL signal store |

---

## Track 3 — Fan Experience (coming next)

`packages/fan` — live match dashboard + group sweepstake app.

## Track 1 — Prediction Markets (coming next)

`packages/markets` — Anchor program with CPI into TxLINE `validate_stat`.

---

## TxLINE Endpoints Used

| Endpoint | Purpose |
|---|---|
| `POST /auth/guest/start` | Guest JWT |
| `POST /api/token/activate` | API token activation |
| `GET /api/fixtures/snapshot` | Fixture list |
| `GET /api/odds/stream` (SSE) | Live odds |
| `GET /api/scores/stream` (SSE) | Live scores (outcome resolution) |
| `GET /api/odds/snapshot/:fixtureId` | Per-fixture odds snapshot |
| `GET /api/scores/updates/:fixtureId` | Per-fixture score history |


 (First 48h)

- **52,000+ signals** collected across **25+ live World Cup matches**
- **100% goal detection rate** on verified matches (4/4 goals detected in Norway vs France)
- **Agent detects goals before score feeds** — signals appear 111–120 seconds before TxLINE scores update
- **Largest shift:** 83.25% on Curacao vs Ivory Coast (conf=100)
- **Average shift on Over/Under:** 40.7% — goal events trigger immediate repricing
- **Matches covered:** Group stage across Groups A–F

### Norway vs France — Verified Accuracy

| Goal Time (UTC) | Signals Near Goal | Max Confidence | Max Shift | First Signal Before Goal |
|----------------|-------------------|----------------|-----------|--------------------------|
| 19:07:46 | 238 | 90 | 45.5% | 120s before |
| 19:20:54 | 74 | 95 | 52.9% | 117s before |
| 19:22:12 | 58 | 97 | 55.3% | 111s before |
| 19:33:24 | 29 | 100 | 60.2% | 118s before |

**4/4 goals detected. Agent signals precede score feed updates by ~2 minutes.**