/**
 * pm2 ecosystem config — manages the agent and API as supervised processes.
 * Both restart automatically on crash with exponential backoff.
 *
 * Usage:
 *   make start    — start both processes
 *   make stop     — stop both processes
 *   make status   — show process status
 *   make logs     — tail logs for both
 */

module.exports = {
  apps: [
    {
      name: "sharp-agent",
      cwd: "./packages/agent",
      script: "npx",
      args: "ts-node -r tsconfig-paths/register src/index.ts",
      interpreter: "none",
      env_file: "./packages/agent/.env",
      log_file: "./agent.log",
      error_file: "./agent.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 3000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      watch: false,
      // Keep agent memory usage bounded
      max_memory_restart: "512M",
    },
    {
      name: "sharp-api",
      cwd: "./packages/api",
      script: "npx",
      args: "ts-node -r tsconfig-paths/register src/index.ts",
      interpreter: "none",
      env_file: "./packages/agent/.env",
      log_file: "./api.log",
      error_file: "./api.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 2000,
      max_restarts: 20,
      exp_backoff_restart_delay: 100,
      watch: false,
      env: {
        PORT: "3001",
      },
    },
  ],
};
