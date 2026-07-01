import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { usePolling } from "../usePolling";
import { ClusterCard } from "./ClusterCard";
import type { ClusterDTO } from "../types";

const POLL_INTERVAL_MS = 4_000;
const FEED_LIMIT = 25;

export function LiveFeed() {
  const { data, error, isLoading } = usePolling(
    () => api.clusters({ limit: FEED_LIMIT }),
    POLL_INTERVAL_MS
  );

  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  const clusters: ClusterDTO[] = data?.data ?? [];

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

  if (isLoading && clusters.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-cream-300 bg-white/50">
        <span className="text-sm text-ink-800/40">Loading live feed…</span>
      </div>
    );
  }

  if (error && clusters.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-cream-300 bg-white/50 px-6 text-center">
        <span className="text-sm font-medium text-ink-900">
          Couldn't reach the Sharp Movement Detector API
        </span>
        <span className="text-xs text-ink-800/50">
          Make sure the API is running on the configured VITE_API_URL.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {clusters.length === 0 && (
        <div className="rounded-2xl border border-cream-300 bg-white/50 px-6 py-10 text-center text-sm text-ink-800/40">
          No significant market events yet — the agent is watching.
        </div>
      )}
      {clusters.map((cluster) => (
        <ClusterCard
          key={clusterKey(cluster)}
          cluster={cluster}
          isNew={!seenKeys.has(clusterKey(cluster)) || seenKeys.size === 0}
        />
      ))}
    </div>
  );
}

function clusterKey(c: ClusterDTO): string {
  return `${c.fixtureId}-${c.detectedAt}`;
}
