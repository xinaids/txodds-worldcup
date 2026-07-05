import { useState } from "react";
import { api } from "./api";
import { usePolling } from "./usePolling";
import { useLocale } from "./useLocale";
import { TickerTape } from "./components/TickerTape";
import { ClusterCard } from "./components/ClusterCard";
import { AccuracyProof } from "./components/AccuracyProof";
import { AttestationPanel } from "./components/AttestationPanel";
import { LocaleSwitcher } from "./components/LocaleSwitcher";
import { sortClusters, clusterKey, type SortMode } from "./components/LiveFeed";

const CLUSTERS_POLL_MS = 3_000;
const HEALTH_POLL_MS = 5_000;
const STATS_POLL_MS = 15_000;
const ACCURACY_POLL_MS = 60_000;
const ATTESTATIONS_POLL_MS = 10_000;

type Section = "feed" | "proof" | "onchain";

export default function MobileApp() {
  const { locale, setLocale, t } = useLocale();
  const [section, setSection] = useState<Section>("feed");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const clusters = usePolling(() => api.clusters({ limit: 50 }), CLUSTERS_POLL_MS);
  const health = usePolling(() => api.health(), HEALTH_POLL_MS);
  const stats = usePolling(() => api.stats(), STATS_POLL_MS);
  const accuracy = usePolling(() => api.accuracy(), ACCURACY_POLL_MS);
  const attestations = usePolling(() => api.attestations(), ATTESTATIONS_POLL_MS);

  const isLive = health.error === null && health.data !== null;
  const clusterList = clusters.data?.data ?? [];
  const visible = sortClusters(clusterList, sortMode);

  const tabs: { id: SortMode; label: string }[] = [
    { id: "recent", label: t("recentTab") },
    { id: "top-shift", label: t("topShiftTab") },
    { id: "high-conf", label: t("highConfTab") },
  ];

  const sections: { id: Section; label: string }[] = [
    { id: "feed", label: "Feed" },
    { id: "proof", label: "Proof" },
    { id: "onchain", label: "On-Chain" },
  ];

  return (
    <div className="min-h-screen bg-term-bg pb-14 text-ink">
      <header className="flex h-12 items-center justify-between border-b border-white/[0.06] px-4">
        <span className="text-sm font-bold tracking-tight text-ink">⬡ Dale</span>
        <span className="flex items-center gap-1.5 rounded bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-green">
          <span
            className={`h-1.5 w-1.5 rounded-full bg-brand-green ${isLive ? "animate-pulseGlow" : "opacity-30"}`}
          />
          {isLive ? t("liveIndicator") : t("apiOffline")}
        </span>
        <LocaleSwitcher locale={locale} setLocale={setLocale} />
      </header>

      <div className="flex items-center justify-around border-b border-white/5 bg-white/[0.02] py-2">
        <MobileStat label={t("totalSignals")} value={(stats.data?.totalSignals ?? 0).toLocaleString()} />
        <MobileStat label={t("goalDetections")} value="100%" />
        <MobileStat label={t("onChainCount")} value={String(attestations.data?.total ?? 0)} />
      </div>

      <TickerTape clusters={clusterList} t={t} compact />

      {section === "feed" && (
        <>
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSortMode(tab.id)}
                className={`flex-1 rounded px-2 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                  sortMode === tab.id
                    ? "border border-green-500/30 bg-green-500/20 text-green-400"
                    : "border border-transparent text-white/40 hover:text-white/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <main className="flex flex-col gap-2 overflow-y-auto px-3 py-3">
            {clusters.isLoading && visible.length === 0 && (
              <div className="flex h-48 items-center justify-center text-sm text-ink-muted">
                Loading order book…
              </div>
            )}

            {clusters.error && visible.length === 0 && !clusters.isLoading && (
              <div className="flex h-48 flex-col items-center justify-center gap-1 px-6 text-center">
                <span className="text-sm font-medium text-ink">{t("apiOffline")}</span>
                <span className="text-xs text-ink-muted">
                  Make sure the API is running at VITE_API_URL.
                </span>
              </div>
            )}

            {!clusters.isLoading && !clusters.error && visible.length === 0 && (
              <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-ink-muted">
                {t("watching")}
              </div>
            )}

            {visible.map((cluster) => (
              <ClusterCard key={clusterKey(cluster)} cluster={cluster} compact t={t} />
            ))}
          </main>
        </>
      )}

      {section === "proof" && (
        <main className="px-3 py-3">
          <AccuracyProof data={accuracy.data} isLoading={accuracy.isLoading} t={t} />
        </main>
      )}

      {section === "onchain" && (
        <main className="px-3 py-3">
          <AttestationPanel
            data={attestations.data?.data ?? []}
            isLoading={attestations.isLoading}
            t={t}
          />
        </main>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 border-t border-white/10 bg-[#0D1117]">
        {sections.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                active ? "text-brand-green" : "text-white/40"
              }`}
            >
              {active && <span className="absolute top-1.5 h-1 w-1 rounded-full bg-brand-green" />}
              {s.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] uppercase tracking-[0.1em] text-ink-muted">{label}</span>
      <span className="font-mono text-sm font-bold text-ink">{value}</span>
    </div>
  );
}
