# Dale! — Sharp Odds Intelligence

> Autonomous odds-shift detection agent for FIFA World Cup 2026, built on TxLINE + Solana.

**Dale!** monitors every live World Cup match via the TxLINE SSE stream, detects significant implied probability shifts across bookmaker consensus, classifies them as `GOAL` / `RED_CARD` / `PENALTY` / `ODDS_DRIFT`, and writes high-confidence detections on-chain via the Solana Memo program — creating a verifiable, tamper-proof record of every detection.

Built for the [TxODDS World Cup Hackathon](https://earn.superteam.fun) · **Track 2: Trading Tools & Agents** · $16,000 prize pool.

🔴 **Live dashboard:** [txodds-worldcup-dashboard.vercel.app](https://txodds-worldcup-dashboard.vercel.app)
📦 **API:** [txodds-worldcup.onrender.com](https://txodds-worldcup.onrender.com)

---

## Key Finding

> **Agent signals precede the TxLINE score feed by 111–120 seconds.**
> Bookmakers reprice on pitch events before official score confirmation arrives.
> Every high-confidence detection is hashed and written to Solana mainnet — independently verifiable by anyone.

### Verified: Norway vs France · June 26, 2026

| Goal Time (UTC) | Signals | Max Confidence | Max Shift | Lead Time |
|----------------|---------|---------------|-----------|-----------|
| 19:07:46 | 238 | 90 | 45.5% | **120s** |
| 19:20:54 | 74 | 95 | 52.9% | **117s** |
| 19:22:12 | 58 | 97 | 55.3% | **111s** |
| 19:33:24 | 29 | 100 | 60.2% | **118s** |

**4/4 goals detected. 100% detection rate.**

### Live: Spain vs Belgium · July 10, 2026

At `16:31 UTC`, Dale! fired a `Pre-goal movement` cluster with **confidence 90** across 2 markets. Spain scored seconds later. The sharp reversal signal followed immediately — detected and logged before the official score feed updated.

---

## Live Stats

| Metric | Value |
|--------|-------|
| Signals collected | **83,000+** |
| Matches covered | **68** |
| Goals detected | **15,628** |
| On-chain attestations | **5** (Solana mainnet) |
| Agent uptime | **16+ days continuous** |
| Largest shift | **83.3%** (Curacao vs Ivory Coast, conf=100) |

---

## Architecture

```
packages/
  core/       Shared: TxLINE auth, SSE stream client, HTTP client, TypeScript types
  agent/      Sharp Movement Detector — autonomous 24/7 agent
  api/        REST API (Express) — 9 endpoints serving signals, clusters, attestations
  dashboard/  Dale! UI — mobile-first PWA (EN/PT/ES)
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
      ├── classifyEvent()  → GOAL / RED_CARD / PENALTY_AWARDED / ODDS_DRIFT
      ├── computeConfidence() → 0-100 score
      │
      ▼
  confidence ≥ 90?
      ├── YES → attestCluster() → Solana Memo program (on-chain hash)
      └── NO  → signals.jsonl only
```

### Why implied probability, not raw odds

Raw odds change is misleading. A move from `10.0 → 9.0` looks large (+1.0) but represents only ~1% implied probability shift. A move from `2.0 → 1.7` looks small (+0.3) but represents ~9% shift — a far more significant market signal. This is the methodology used by sharp money trackers and professional trading desks.

---

## Signal Classification

| Event Type | Trigger | Typical Shift | Example |
|-----------|---------|--------------|---------|
| `GOAL` | Over/Under shift ≥ 30% | 40–83% | Curacao vs Ivory Coast: 83.3% |
| `RED_CARD` | 1X2 shift ≥ 25% with AH corroboration | 25–65% | France vs Sweden: 62.1% |
| `PENALTY_AWARDED` | 1X2 + AH + O/U simultaneous movement | 30–75% | England vs Congo DR: 43.1% |
| `ODDS_DRIFT` | Any shift 5–25% without event signature | 5–25% | Pre-match line movement |

### Confidence Score (0–100)

```
40pts — shift magnitude (normalized to 60% = max)
30pts — market reliability (Over/Under most reliable)
20pts — classification certainty (GOAL/RED_CARD > DRIFT)
10pts — threshold bonus (shift ≥ 40%)
```

---

## On-Chain Attestations

High-confidence clusters (conf ≥ 90) are hashed and written to **Solana mainnet** via the Memo program:

```
Memo format: SMD1|<fixtureId>|<eventType>|<confidence>|<hash12>
Example:     SMD1|17588234|GOAL|95|a3f8c91b2e4d
```

The hash commits to: fixture ID, event type, confidence, max shift, markets agreeing, and detection timestamp. Anyone can recompute the hash from `signals.jsonl` and verify it matches the on-chain record.

**Verified attestations (Solana mainnet):**

| Event | Fixture | Confidence | Solscan |
|-------|---------|------------|---------|
| GOAL | Ivory Coast vs Norway | 93 | [58y1...TRRY](https://solscan.io/tx/58y1avYAsMutTuPJK9UrafpXQgetfaxPZxejTYtAwc5gfMCbQvhwaETydqxZ85bYiyNEB3VM6LHFHnXy6R36TRRY) |
| GOAL | Ivory Coast vs Norway | 92 | [eoby...bWvP](https://solscan.io/tx/eobyDjqpA1fD6FvqZhqZw9gn8TZP7DBr45EFc1uYTuRPF74QZReDUMc7csuvAfjaDBdspKc87ZHt6jD6aqWbWvP) |
| GOAL | Ivory Coast vs Norway | 92 | [5aZc...PBm6](https://solscan.io/tx/5aZcyLGMxQd62wASpLMVPhTeCLgePXGb1XKJFmftY1SGpvxbuQ9RAgftgL5UiiHpwKDYimYSbaV7omD2Ksp6PBm6) |
| PENALTY | Ivory Coast vs Norway | 90 | [5QPd...VfZt](https://solscan.io/tx/5QPd4x2FymvhXX8X7YWsrBgogd4CwuFfvQULTQy2CguW7HUZptk9oZmjnnzBaSbRBxCUo9eMTqGYUdoEaLbPVfZt) |
| PENALTY | Ivory Coast vs Norway | 90 | [5kQN...DezB](https://solscan.io/tx/5kQNjbqr3eiVHKfvq2k7jPaMcUHKZqzni5JBMihanqT2fyurcGKr6fsnHZu3qR4rPDSAciwok7CrSviD2d6wDezB) |

---

## REST API

Base URL (production): `https://txodds-worldcup.onrender.com`

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check + uptime |
| `GET /api/signals` | All signals (filterable by fixture, market, eventType, minConfidence, minShift) |
| `GET /api/signals/latest` | Last 20 signals |
| `GET /api/signals/clusters` | Signals grouped into market events (multi-market corroboration) |
| `GET /api/stats` | Aggregate statistics |
| `GET /api/accuracy` | Verified backtesting report |
| `GET /api/fixtures/live` | Active fixtures with signal counts |
| `GET /api/attestations` | On-chain attestations with Solscan links |
| `GET /api/feed` | SSE real-time signal stream |

### Example requests

```bash
# Stats
curl https://txodds-worldcup.onrender.com/api/stats

# High-confidence GOAL clusters
curl "https://txodds-worldcup.onrender.com/api/signals/clusters?eventType=GOAL&minConfidence=90"

# On-chain proofs
curl https://txodds-worldcup.onrender.com/api/attestations

# Verified accuracy
curl https://txodds-worldcup.onrender.com/api/accuracy
```

---

## Dashboard

Mobile-first PWA with live data, i18n (EN/PT/ES), and offline fallback.

**Tabs:**

| Tab | Description |
|-----|-------------|
| **Signal** | Hero card with strongest live cluster · radar animation · 4 metric panels · mini flow chart |
| **Flow** | Implied probability chart (30 min) · telemetry panel |
| **Events** | Live feed updating every 3s · classified detections |
| **Matches** | All 68 matches ranked by signal count · Verified proof (Norway vs France 4/4) |

---

## 🚀 Quick Start

### Prerequisites

| Software | Version |
|----------|---------|
| Node.js | 20.x or newer |
| npm | 10.x or newer |
| Solana CLI | Latest stable |

### 1. Clone and install

```bash
git clone https://github.com/xinaids/txodds-worldcup.git
cd txodds-worldcup
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

```env
# TxLINE Authentication
TXLINE_JWT=your_jwt_token
TXLINE_API_TOKEN=your_api_token

# Solana
RPC_URL=https://api.mainnet-beta.solana.com
WALLET_KEYPAIR_PATH=/home/user/.config/solana/id.json

# API
PORT=3001
LOG_LEVEL=info
```

### 3. Build

```bash
npm run build
```

### 4. Start all services

```bash
# Terminal 1 — Agent
eval $(cat .env | sed 's/^/export /')
nohup npm run --workspace=packages/agent start >> agent.log 2>&1 &

# Terminal 2 — API
eval $(cat .env | sed 's/^/export /')
nohup npm run --workspace=packages/api start >> api.log 2>&1 &

# Terminal 3 — Dashboard
cd packages/dashboard
echo "VITE_API_URL=http://localhost:3001" > .env.local
npm run dev
# → http://localhost:5173
```

### Production (PM2)

```bash
npx pm2 start ecosystem.config.js
npx pm2 status
npx pm2 logs
```

---

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `TXLINE_JWT` | ✅ | JWT from TxLINE authentication |
| `TXLINE_API_TOKEN` | ✅ | API token for TxLINE stream access |
| `RPC_URL` | ✅ | Solana RPC endpoint |
| `WALLET_KEYPAIR_PATH` | ✅ | Path to Solana wallet keypair |
| `PORT` | ❌ | API port (default: `3001`) |
| `LOG_LEVEL` | ❌ | Log verbosity (default: `info`) |

---

## TxLINE Integration

### Authentication

Both headers required simultaneously — **undocumented**, discovered via Discord support:

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

### Key discoveries

- SSE stream uses `data: ` prefix (not `Message: `)
- `Action: "goal"` includes yellow cards — filter by `Score.Total.Goals` incrementing
- `Prices` values are ×1000 (`2000` = `2.000` decimal odds)
- On-chain subscription requires both `"pricing_matrix"` and `"token_treasury"` PDA seeds (undocumented)

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
| **Core Functionality** | SSE stream, auto-reconnect, typed events, 9 REST endpoints, live dashboard |
| **Autonomous Operation** | Running 24/7 since June 24 — zero manual intervention after startup |
| **Logic & Architecture** | Pure `detectShift()`, `classifyEvent()`, `computeConfidence()` — deterministic and unit-testable |
| **Innovation & Novelty** | Implied probability shift (not raw odds) + multi-market cluster corroboration + on-chain attestation layer |
| **Production Readiness** | Structured JSON logs, exponential backoff, graceful SIGTERM, JSONL persistence, deduplication, PWA |

---

## Troubleshooting

**Agent not connecting**
- Verify `TXLINE_JWT` and `TXLINE_API_TOKEN` are both set
- Both headers must be sent simultaneously (see Authentication above)

**Dashboard shows no data**
- API cold start on Render free tier takes ~30s — wait and refresh
- Check `VITE_API_URL` points to the correct API

**Solana transaction fails**
- Ensure wallet has ≥ 0.01 SOL for transaction fees
- Use a reliable RPC (Helius recommended over public endpoint)

**Port already in use**
- `lsof -i :3001` to find the process, or change `PORT` in `.env`

---

## Supported Platforms

- Ubuntu 22.04+
- Debian 12+
- macOS
- Windows 11 (WSL2)

---

## License

MIT — built by [@0xinaids](https://x.com/0xinaids) for the TxODDS World Cup Hackathon 2026.
