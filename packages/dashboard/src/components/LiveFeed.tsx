import { useEffect, useRef, useState } from "react";
import { ClusterCard } from "./ClusterCard";
import type { ClusterDTO } from "../types";
import type { TranslationKey } from "../i18n";

export type SortMode = "recent" | "high-conf" | "top-shift";

interface LiveFeedProps {
  clusters: ClusterDTO[];
  isLoading: boolean;
  error: Error | null;
  t: (key: TranslationKey) => string;
}

export function LiveFeed({ clusters, isLoading, error, t }: LiveFeedProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (clusters.length === 0) return;
    const keys = clusters.map(clusterKey);
    if (firstLoadRef.current) {
      setSeenKeys(new Set(keys));
      firstLoadRef.current = false;
      return;
    }
    setSeenKeys((prev) => new Set([...prev, ...keys]));
  }, [clusters]);

  const visible = sortClusters(clusters, sortMode);

  const tabs: { id: SortMode; label: string }[] = [
    { id: "recent", label: t("recentTab") },
    { id: "top-shift", label: t("topShiftTab") },
    { id: "high-conf", label: t("highConfTab") },
  ];

  return (
    <div className="rounded-md border border-white/[0.06] bg-term-card">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">
          {t("orderBook")} <span className="text-ink">· {clusters.length}</span>
        </h2>
        <div className="flex gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSortMode(tab.id)}
              className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                sortMode === tab.id
                  ? "border border-green-500/30 bg-green-500/20 text-green-400"
                  : "border border-transparent text-white/40 hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto p-3">
        {isLoading && visible.length === 0 && (
          <div className="flex h-48 items-center justify-center text-sm text-ink-muted">
            Loading order book…
          </div>
        )}

        {error && visible.length === 0 && !isLoading && (
          <div className="flex h-48 flex-col items-center justify-center gap-1 px-6 text-center">
            <span className="text-sm font-medium text-ink">{t("apiOffline")}</span>
            <span className="text-xs text-ink-muted">
              Make sure the API is running at VITE_API_URL.
            </span>
          </div>
        )}

        {!isLoading && !error && visible.length === 0 && (
          <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-ink-muted">
            {t("watching")}
          </div>
        )}

        {visible.map((cluster) => (
          <ClusterCard
            key={clusterKey(cluster)}
            cluster={cluster}
            isNew={!seenKeys.has(clusterKey(cluster))}
            dimmed={sortMode === "recent" && cluster.eventType === "ODDS_DRIFT"}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

export function sortClusters(clusters: ClusterDTO[], mode: SortMode): ClusterDTO[] {
  if (mode === "top-shift") {
    return [...clusters].sort((a, b) => b.maxShift - a.maxShift);
  }
  if (mode === "high-conf") {
    return clusters
      .filter((c) => c.confidence >= 90 && c.eventType !== "ODDS_DRIFT")
      .sort((a, b) => b.confidence - a.confidence);
  }
  return [...clusters].sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );
}

export function clusterKey(c: ClusterDTO): string {
  return `${c.fixtureId}-${c.detectedAt}`;
}
