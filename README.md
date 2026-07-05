# Dale — Sharp Odds Intelligence

> Autonomous odds-shift detection agent for FIFA World Cup 2026, built on TxLINE + Solana.

**Dale** monitors every live World Cup match via the TxLINE SSE stream, detects significant implied probability shifts across bookmaker consensus, classifies them as GOAL / RED_CARD / PENALTY / ODDS_DRIFT, and writes high-confidence detections on-chain via the Solana Memo program — creating a verifiable, tamper-proof record of every detection.

Built for the [TxODDS World Cup Hackathon](https://earn.superteam.fun) · **Track 2: Trading Tools & Agents** · $16,000 prize pool.

---

## Key Finding

> **Agent signals precede the TxLINE score feed by 111–120 seconds.**
> Bookmakers reprice on pitch events before official score confirmation.
> Every high-confidence detection is hashed and written to Solana mainnet — verifiable by anyone.

### Verified: Norway vs France · June 26, 2026

| Goal Time (UTC) | Signals Near Goal | Max Confidence | Max Shift | First Signal Before Feed |
|----------------|-------------------|----------------|-----------|--------------------------|
| 19:07:46 | 238 | 90 | 45.5% | **120s** |
| 19:20:54 | 74 | 95 | 52.9% | **117s** |
| 19:22:12 | 58 | 97 | 55.3% | **111s** |
| 19:33:24 | 29 | 100 | 60.2% | **118s** |

**4/4 goals detected. 100% detection rate.**

---

## Live Stats (as of July 5, 2026)

| Metric | Value |
|--------|-------|
| Signals collected | **70,880+** |
| Matches covered | **57** |
| Goals detected | **15,628** |
| On-chain attestations | **5** (Solana mainnet) |
| Agent uptime | **11+ days continuous** |
| Largest shift | **83.3%** (Curacao vs Ivory Coast, conf=100) |

---

## Architecture

```
packages/
  core/       Shared: TxLINE auth, SSE stream client, HTTP client, TypeScript types
  agent/      Track 2: Sharp Movement Detector — autonomous 24/7 agent
  api/        REST API (Express) — 9 endpoints serving signals, clusters, attestations
  dashboard/  Dale UI — Bloomberg-style PWA (desktop + mobile, EN/PT/ES)
```

### How it works

```
TxLINE SSE Stream
      │
      ▼
  OddsUpdate (every bookmaker tick)
      │
      ▼
  detectShift()
  implied_probability = 1 / decimal_odds × 100
  shift = |implied(current) - implied(previous)|
  threshold: ≥ 5%
      │
      ▼
  SignalCluster (groups signals within 10s window)
      │
      ├── classifyEvent() → GOAL / RED_CARD / PENALTY_AWARDED / ODDS_DRIFT
      ├── computeConfidence() → 0-100 score
      │
      ▼
  confidence ≥ 90?
      ├── YES → attestCluster() → Solana Memo program (on-chain hash)
      └── NO  → signals.jsonl only
```

### Why implied probability, not raw odds

Raw odds change is misleading. A move from 10.0 → 9.0 looks large (+1.0) but represents only ~1% implied probability shift. A move from 2.0 → 1.7 looks small (+0.3) but represents ~9% shift — a far more significant market signal. This is the methodology used by sharp money trackers and professional trading desks.

---

## Signal Classification

| Event Type | Trigger | Typical Shift | Example |
|-----------|---------|--------------|---------|
| `GOAL` | Over/Under shift ≥ 30% | 40–83% | Curacao vs Ivory Coast: 83.3% |
| `RED_CARD` | 1X2 shift ≥ 25% with AH corroboration | 25–65% | France vs Sweden: 62.1% |
| `PENALTY_AWARDED` | 1X2 + AH + O/U simultaneous movement | 30–75% | England vs Congo DR: 43.1% |
| `ODDS_DRIFT` | Any shift 5–25% without event signature | 5–25% | Pre-match line movement |

### Confidence Score (0-100)

```
40pts — shift magnitude (normalized to 60% = max)
30pts — market reliability (Over/Under most reliable)
20pts — classification certainty (GOAL/RED_CARD > DRIFT)
10pts — threshold bonus (shift ≥ 40%)
```

---

## On-Chain Attestation

High-confidence clusters (conf ≥ 90) are hashed and written to **Solana mainnet** via the Memo program:

```
Memo format: SMD1|<fixtureId>|<eventType>|<confidence>|<hash12>

Example: SMD1|17588234|GOAL|95|a3f8c91b2e4d
```

The hash commits to: fixture ID, event type, confidence, max shift, markets agreeing, and detection timestamp. Anyone can recompute the hash from `signals.jsonl` and verify it matches the on-chain record.

**Verified attestations:**

| Event | Fixture | Confidence | Solscan |
|-------|---------|------------|---------|
| GOAL | Ivory Coast vs Norway | 93 | [58y1...TRRY](https://solscan.io/tx/58y1avYAsMutTuPJK9UrafpXQgetfaxPZxejTYtAwc5gfMCbQvhwaETydqxZ85bYiyNEB3VM6LHFHnXy6R36TRRY) |
| GOAL | Ivory Coast vs Norway | 92 | [eoby...bWvP](https://solscan.io/tx/eobyDjqpA1fD6FvqZhqZw9gn8TZP7DBr45EFc1uYTuRPF74QZReDUMc7csuvAfjaDBdspKc87ZHt6jD6aqWbWvP) |
| GOAL | Ivory Coast vs Norway | 92 | [5aZc...PBm6](https://solscan.io/tx/5aZcyLGMxQd62wASpLMVPhTeCLgePXGb1XKJFmftY1SGpvxbuQ9RAgftgL5UiiHpwKDYimYSbaV7omD2Ksp6PBm6) |
| PENALTY | Ivory Coast vs Norway | 90 | [5QPd...VfZt](https://solscan.io/tx/5QPd4x2FymvhXX8X7YWsrBgogd4CwuFfvQULTQy2CguW7HUZptk9oZmjnnzBaSbRBxCUo9eMTqGYUdoEaLbPVfZt) |
| PENALTY | Ivory Coast vs Norway | 90 | [5kQN...DezB](https://solscan.io/tx/5kQNjbqr3eiVHKfvq2k7jPaMcUHKZqzni5JBMihanqT2fyurcGKr6fsnHZu3qR4rPDSAciwok7CrSviD2d6wDezB) |

---

## Dale Dashboard

Bloomberg Terminal-style interface with real-time market events.

**Features:**
- Live ticker tape scrolling events (GOAL/RED_CARD/PENALTY/DRIFT)
- Order Book feed with colored borders and intensity bars by event type
- Sort tabs: Recent / Top Shift / High Confidence
- Active matches panel with signal counts
- Verified accuracy proof table (Norway vs France)
- On-chain attestation panel with Solscan links
- i18n: English (primary) · Portuguese · Spanish
- Mobile PWA — installable, works offline, bottom tab navigation
- Footer stats bar (Bloomberg-style)

---

## REST API

Base URL: `http://localhost:3001`

| Endpoint | Description |
|----------|-------------|
| `GET /api/signals` | All signals (filterable by fixture, market, eventType, minConfidence, minShift) |
| `GET /api/signals/latest` | Last 20 signals |
| `GET /api/signals/clusters` | Signals grouped into market events (multi-market corroboration) |
| `GET /api/stats` | Aggregate statistics |
| `GET /api/accuracy` | Verified backtesting report |
| `GET /api/fixtures/live` | Active fixtures with signal counts |
| `GET /api/attestations` | On-chain attestations with Solscan links |
| `GET /api/feed` | SSE real-time signal stream |
| `GET /api/health` | Health check |

### Example responses

```bash
# Stats
curl http://localhost:3001/api/stats
# → { totalSignals: 70880, matchesCovered: 57, avgShiftPct: 23.1, ... }

# High-confidence GOAL clusters
curl "http://localhost:3001/api/signals/clusters?eventType=GOAL&minConfidence=90"

# On-chain proofs
curl http://localhost:3001/api/attestations
# → { total: 5, data: [{ explorerUrl: "https://solscan.io/tx/..." }] }
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Solana CLI + funded mainnet wallet (≥ 0.01 SOL)
- Helius RPC (recommended over public RPC)

### Install

```bash
git clone https://github.com/xinaids/txodds-worldcup
cd txodds-worldcup
npm install
```

### Subscribe & Activate (one-time)

```bash
WALLET_KEYPAIR_PATH=~/.config/solana/id.json \
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY \
npm run setup
```

Writes `TXLINE_JWT` and `TXLINE_API_TOKEN` to `.env`.

### Run the Agent

```bash
eval $(cat .env | sed 's/^/export /')
nohup env TXLINE_JWT=$TXLINE_JWT TXLINE_API_TOKEN=$TXLINE_API_TOKEN \
  npm run agent >> agent.log 2>&1 &
```

### Run the API

```bash
npm run --workspace=packages/api start
```

### Run the Dashboard

```bash
cd packages/dashboard
echo "VITE_API_URL=http://localhost:3001" > .env.local
npm install && npm run dev
# → http://localhost:4000
```

---

## TxLINE Integration

### Authentication
Both headers required simultaneously (undocumented — discovered via Discord support):
```
Authorization: Bearer <jwt>
X-Api-Token: <api_token>
```

### Endpoints used

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/guest/start` | Guest JWT |
| `POST /api/token/activate` | API token activation |
| `GET /api/fixtures/snapshot` | Pre-load fixture labels |
| `GET /api/odds/stream` (SSE) | Live odds — primary data source |
| `GET /api/scores/stream` (SSE) | Live scores — outcome resolution |
| `GET /api/scores/updates/:fixtureId` | Score history for backtesting |

### Key discoveries during development

- SSE stream uses `data: ` prefix (not `Message: ` as suggested in some docs)
- `Action: "goal"` in the scores feed includes yellow cards — filter by `Score.Total.Goals` incrementing for real goals
- `Prices` array values are × 1000 (e.g. `2000` = `2.000` decimal odds)
- `PRICING_MATRIX_PDA`: `HPjtXsXRYAdBppSMzsqGGDTuhUQT7aXtsbn52CjhqRM7` (seed: `"pricing_matrix"`)
- `TOKEN_TREASURY`: `2oerdMyJXg2CHZ9n2NDVhf3JjJNE8QVDsa7PFpABsAmD` (seed: `"token_treasury"`)

---

## Solana Program Addresses

| Account | Address |
|---------|---------|
| TxLINE Program | `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA` |
| TxL Token Mint | `sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx` |
| Pricing Matrix PDA | `HPjtXsXRYAdBppSMzsqGGDTuhUQT7aXtsbn52CjhqRM7` |
| Token Treasury | `2oerdMyJXg2CHZ9n2NDVhf3JjJNE8QVDsa7PFpABsAmD` |
| Memo Program | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` |

---

## Judging Criteria

| Criterion | Implementation |
|-----------|---------------|
| **Core Functionality** | SSE stream, auto-reconnect, typed events, 9 API endpoints |
| **Autonomous Operation** | Runs 24/7 since June 24 — zero manual intervention after start |
| **Logic & Architecture** | Pure `detectShift()`, `classifyEvent()`, `computeConfidence()` — all deterministic and unit-testable |
| **Innovation & Novelty** | Implied probability shift (not raw odds) + multi-market cluster corroboration + on-chain attestation layer |
| **Production Readiness** | Structured JSON logs, exponential backoff, graceful SIGTERM, JSONL persistence, deduplication, PWA |

---

## License

MIT — built by [@0xinaids](https://x.com/0xinaids) for the TxODDS World Cup Hackathon 2026.
