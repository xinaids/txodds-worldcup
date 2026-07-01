import type { ClusterDTO } from "../types";
import { formatClock, formatRelativeTime, getEventStyle } from "../eventStyles";

interface ClusterCardProps {
  cluster: ClusterDTO;
  isNew?: boolean;
}

export function ClusterCard({ cluster, isNew }: ClusterCardProps) {
  const style = getEventStyle(cluster.eventType);

  return (
    <div
      className={`rounded-xl border border-cream-300 bg-white/70 p-4 transition-shadow hover:shadow-md ${
        isNew ? "animate-fade-in" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>
          {cluster.marketsAgreeing > 1 && (
            <span className="rounded-full bg-coral-500/10 px-2 py-0.5 text-[11px] font-medium text-coral-600">
              {cluster.marketsAgreeing} markets agree
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-ink-800/40" title={cluster.detectedAt}>
          {formatRelativeTime(cluster.detectedAt)}
        </span>
      </div>

      <div className="mb-3 text-sm font-semibold text-ink-900">{cluster.fixture}</div>

      <div className="flex items-center gap-5 font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-800/40">shift</span>
          <span className="font-semibold text-ink-900">{cluster.maxShift.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-ink-800/40">confidence</span>
          <ConfidenceBar value={cluster.confidence} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-ink-800/40">signals</span>
          <span className="font-semibold text-ink-900">{cluster.signalCount}</span>
        </div>
        <span className="ml-auto text-ink-800/30">{formatClock(cluster.detectedAt)}</span>
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 90 ? "bg-sage-500" : value >= 70 ? "bg-amber-400" : "bg-ink-800/30";

  return (
    <span className="flex items-center gap-1.5">
      <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-cream-300">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </span>
      <span className="font-semibold text-ink-900">{value}</span>
    </span>
  );
}
