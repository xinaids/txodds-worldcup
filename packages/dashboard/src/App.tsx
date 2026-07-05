import { api } from "./api";
import { usePolling } from "./usePolling";
import { useLocale } from "./useLocale";
import { useIsMobile } from "./hooks/useIsMobile";
import MobileApp from "./MobileApp";
import { HeroHeader } from "./components/HeroHeader";
import { TickerTape } from "./components/TickerTape";
import { MatchList } from "./components/MatchList";
import { LiveFeed } from "./components/LiveFeed";
import { AccuracyProof } from "./components/AccuracyProof";
import { AttestationPanel } from "./components/AttestationPanel";
import { FooterBar } from "./components/FooterBar";

const CLUSTERS_POLL_MS = 3_000;
const FIXTURES_POLL_MS = 5_000;
const HEALTH_POLL_MS = 5_000;
const STATS_POLL_MS = 15_000;
const ACCURACY_POLL_MS = 60_000;
const ATTESTATIONS_POLL_MS = 10_000;

export default function App() {
  const isMobile = useIsMobile();
  const { locale, setLocale, t } = useLocale();

  const clusters = usePolling(() => api.clusters({ limit: 50 }), CLUSTERS_POLL_MS);
  const fixtures = usePolling(() => api.fixturesLive(), FIXTURES_POLL_MS);
  const health = usePolling(() => api.health(), HEALTH_POLL_MS);
  const stats = usePolling(() => api.stats(), STATS_POLL_MS);
  const accuracy = usePolling(() => api.accuracy(), ACCURACY_POLL_MS);
  const attestations = usePolling(() => api.attestations(), ATTESTATIONS_POLL_MS);

  const isLive = health.error === null && health.data !== null;
  const clusterList = clusters.data?.data ?? [];

  if (isMobile) return <MobileApp />;

  return (
    <div className="min-h-screen bg-term-bg pb-14 text-ink">
      <HeroHeader
        totalSignals={stats.data?.totalSignals ?? 0}
        attestationCount={attestations.data?.total ?? 0}
        isLive={isLive}
        clusters={clusterList}
        locale={locale}
        setLocale={setLocale}
        t={t}
      />

      <TickerTape clusters={clusterList} t={t} />

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[300px_1fr]">
        <MatchList fixtures={fixtures.data?.fixtures ?? []} isLoading={fixtures.isLoading} t={t} />

        <div className="flex flex-col gap-4">
          <LiveFeed
            clusters={clusterList}
            isLoading={clusters.isLoading}
            error={clusters.error}
            t={t}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <AccuracyProof data={accuracy.data} isLoading={accuracy.isLoading} t={t} />
            <AttestationPanel
              data={attestations.data?.data ?? []}
              isLoading={attestations.isLoading}
              t={t}
            />
          </div>
        </div>
      </main>

      <FooterBar
        totalSignals={stats.data?.totalSignals ?? 0}
        matchesCovered={stats.data?.matchesCovered ?? 0}
        goalsDetected={stats.data?.byEventType?.GOAL ?? 0}
        attestationCount={attestations.data?.total ?? 0}
        isLive={isLive}
        t={t}
      />
    </div>
  );
}
