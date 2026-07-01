.PHONY: start stop restart status logs logs-agent logs-api backtest install build

# ─── Process management (pm2) ─────────────────────────────────────────────────

start:
	npx pm2 start ecosystem.config.js

stop:
	npx pm2 stop ecosystem.config.js

restart:
	npx pm2 restart ecosystem.config.js

status:
	npx pm2 status

logs:
	npx pm2 logs --lines 100

logs-agent:
	npx pm2 logs sharp-agent --lines 200

logs-api:
	npx pm2 logs sharp-api --lines 200

# ─── Backtesting ──────────────────────────────────────────────────────────────

backtest:
	@echo "Running backtester against signals.jsonl..."
	cd packages/agent && npx ts-node -r tsconfig-paths/register src/backtester.ts

# ─── Setup ────────────────────────────────────────────────────────────────────

install:
	npm install

build:
	npm run build
