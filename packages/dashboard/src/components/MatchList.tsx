import { api } from "../api";
import { usePolling } from "../usePolling";
import { formatRelativeTime, getEventStyle } from "../eventStyles";

const POLL_INTERVAL_MS = 6_000;

export function MatchList() {
  const { data, isLoading } = usePolling(() => api.fixturesLive(), POLL_INTERVAL_MS);
  const fixtures = (data?.fixtures ?? []).slice(0, 10);

  return (
    <div className="rounded-2xl border border-cream-300 bg-white/70 p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink-900">Most Active Matches</h2>

      {isLoading && fixtures.length === 0 && (
        <div className="py-6 text-center text-xs text-ink-800/30">Loading…</div>
      )}

      <ul className="flex flex-col gap-1">
        {fixtures.map((f) => {
          const style = getEventStyle(f.latestEvent.eventType);
          return (
            <li
              key={f.fixtureId}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-cream-100"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-ink-900">
                  {f.fixture}
                </div>
                <div className="font-mono text-[10px] text-ink-800/40">
                  {formatRelativeTime(f.latestEvent.detectedAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <span className="font-mono text-xs font-semibold text-ink-900">
                  {f.signalCount.toLocaleString()}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
