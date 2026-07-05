import type { LiveFixture } from "../types";
import type { TranslationKey } from "../i18n";
import { formatRelativeTime, getEventStyle } from "../eventStyles";

interface MatchListProps {
  fixtures: LiveFixture[];
  isLoading: boolean;
  t: (key: TranslationKey) => string;
}

export function MatchList({ fixtures, isLoading, t }: MatchListProps) {
  const sorted = [...fixtures].sort((a, b) => b.signalCount - a.signalCount).slice(0, 12);
  const maxSignals = Math.max(1, ...sorted.map((f) => f.signalCount));

  return (
    <div className="rounded-md border border-white/[0.06] bg-term-card p-3">
      <h2 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">
        {t("activePositions")}
      </h2>

      {isLoading && sorted.length === 0 && (
        <div className="py-6 text-center text-xs text-ink-muted">Loading…</div>
      )}

      <ul className="flex flex-col gap-1">
        {sorted.map((f, idx) => {
          const style = getEventStyle(f.latestEvent.eventType);
          const barWidth = Math.min(100, (f.signalCount / maxSignals) * 100);
          return (
            <li
              key={f.fixtureId}
              className="rounded px-2 py-2 transition-colors duration-150 hover:bg-white/[0.04]"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-muted">#{idx + 1}</span>
                  <span className="truncate text-xs font-semibold text-ink">{f.fixture}</span>
                </div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${style.bg} ${style.text}`}
                >
                  {style.label} ●
                </span>
              </div>
              <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-ink-muted">
                <span>
                  {f.signalCount.toLocaleString()} {t("signals")} ·{" "}
                  {formatRelativeTime(f.latestEvent.detectedAt)}
                </span>
                <span className={style.text}>↑{f.latestEvent.shiftPct.toFixed(1)}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-brand-blue transition-[width] duration-[400ms] ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
