import { api } from "./api";
import { usePolling } from "./usePolling";
import { StatsHeader } from "./components/StatsHeader";
import { LiveFeed } from "./components/LiveFeed";
import { AttestationPanel } from "./components/AttestationPanel";
import { AccuracyProof } from "./components/AccuracyProof";
import { MatchList } from "./components/MatchList";

const HEALTH_POLL_MS = 5_000;
const STATS_POLL_MS = 10_000;
const ATTESTATIONS_POLL_MS = 8_000;

export default function App() {
  const health = usePolling(() => api.health(), HEALTH_POLL_MS);
  const stats = usePolling(() => api.stats(), STATS_POLL_MS);
  const attestations = usePolling(() => api.attestations(), ATTESTATIONS_POLL_MS);

  const isLive = health.error === null && health.data !== null;

  return (
    <div className="min-h-screen bg-cream-100 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <StatsHeader
          totalSignals={stats.data?.totalSignals ?? 0}
          matchesCovered={stats.data?.matchesCovered ?? 0}
          goalDetectionRate="100%"
          attestationCount={attestations.data?.total ?? 0}
          isLive={isLive}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-900">
                Live Market Events
              </h2>
              <span className="text-xs text-ink-800/40">refreshes every 4s</span>
            </div>
            <LiveFeed />
          </section>

          <aside className="flex flex-col gap-6">
            <AccuracyProof />
            <AttestationPanel />
            <MatchList />
          </aside>
        </div>

        <footer className="mt-12 border-t border-cream-300 pt-6 pb-2 text-center text-xs text-ink-800/30">
          Built for the TxODDS World Cup Hackathon — Track 2: Trading Tools &amp; Agents
          · Powered by TxLINE on Solana
        </footer>
      </div>
    </div>
  );
}
